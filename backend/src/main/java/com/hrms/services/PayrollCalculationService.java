package com.hrms.services;

import com.hrms.api.dto.EmployeePayrollData;
import com.hrms.api.dto.PayrollResult;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.MathContext;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;

/**
 * Calculates payroll results from raw employee data.
 *
 * Replicates the exact formulas from the Python processor:
 * <pre>
 *   daily_wage     = basic_salary / 26
 *   hourly_wage    = daily_wage / 8
 *
 *   calculated_hour_deduction  = deduction_hour  * hourly_wage
 *   calculated_day_deduction   = deduction_day   * daily_wage
 *   calculated_absence_deduction = absence_deduction * daily_wage
 *   total_deductions = sum of the above + admin_deduction + advance_deduction
 *
 *   calculated_hour_addition = additional_hours * hourly_wage
 *   calculated_day_addition  = additional_days  * daily_wage
 *   total_additions = sum of the above + bonuses + transportation + punctuality_bonus
 *
 *   net_salary = basic_salary + total_additions - total_deductions
 * </pre>
 *
 * All monetary values use {@link BigDecimal} to avoid floating-point drift.
 * Division uses {@link RoundingMode#HALF_UP} with sufficient precision.
 */
@Service
public class PayrollCalculationService {

    /** 26 working days per month, as used in the Python program. */
    private static final BigDecimal DAYS_PER_MONTH = BigDecimal.valueOf(26);

    /** 8 working hours per day, as used in the Python program. */
    private static final BigDecimal HOURS_PER_DAY = BigDecimal.valueOf(8);

    /** Precision for division operations. */
    private static final int SCALE = 10;

    /**
     * Calculates the payroll result for a single employee.
     *
     * @param data the raw payroll data extracted from the Excel file
     * @return the calculated payroll result
     */
    public PayrollResult calculate(EmployeePayrollData data) {
        BigDecimal basicSalary = data.basicSalary();

        // Daily and hourly wages
        BigDecimal dailyWage = basicSalary.divide(DAYS_PER_MONTH, SCALE, RoundingMode.HALF_UP);
        BigDecimal hourlyWage = dailyWage.divide(HOURS_PER_DAY, SCALE, RoundingMode.HALF_UP);

        // Deduction VALUES (calculated, not the raw counts)
        BigDecimal calculatedHourDeduction = BigDecimal.valueOf(data.deductionHour())
                .multiply(hourlyWage);
        BigDecimal calculatedDayDeduction = BigDecimal.valueOf(data.deductionDay())
                .multiply(dailyWage);
        BigDecimal calculatedAbsenceDeduction = BigDecimal.valueOf(data.absenceDeduction())
                .multiply(dailyWage);

        BigDecimal totalDeductions = calculatedHourDeduction
                .add(calculatedDayDeduction)
                .add(calculatedAbsenceDeduction)
                .add(data.adminDeduction())
                .add(data.advanceDeduction());

        // Addition VALUES
        BigDecimal calculatedHourAddition = BigDecimal.valueOf(data.additionalHours())
                .multiply(hourlyWage);
        BigDecimal calculatedDayAddition = BigDecimal.valueOf(data.additionalDays())
                .multiply(dailyWage);

        BigDecimal totalAdditions = calculatedHourAddition
                .add(calculatedDayAddition)
                .add(data.bonuses())
                .add(data.transportation())
                .add(data.punctualityBonus());

        // Net salary
        BigDecimal netSalary = basicSalary
                .add(totalAdditions)
                .subtract(totalDeductions);

        return new PayrollResult(
                data.employeeCode(),
                data.employeeName(),
                data.jobTitle(),
                basicSalary,
                data.totalVacation(),
                data.usedVacation(),
                data.remainingVacation(),
                data.deductionHour(),
                data.deductionDay(),
                data.absenceDeduction(),
                data.adminDeduction(),
                data.advanceDeduction(),
                totalDeductions,
                data.additionalHours(),
                data.additionalDays(),
                data.bonuses(),
                data.transportation(),
                data.punctualityBonus(),
                totalAdditions,
                netSalary,
                dailyWage,
                hourlyWage
        );
    }

    /**
     * Calculates payroll results for a list of employees.
     *
     * @param dataList the raw payroll data for all employees
     * @return list of calculated payroll results
     */
    public List<PayrollResult> calculateAll(List<EmployeePayrollData> dataList) {
        List<PayrollResult> results = new ArrayList<>(dataList.size());
        for (EmployeePayrollData data : dataList) {
            results.add(calculate(data));
        }
        return results;
    }
}
