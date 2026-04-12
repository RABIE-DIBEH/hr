package com.hrms.services;

import com.hrms.api.dto.EmployeePayrollData;
import com.hrms.api.dto.PayrollResult;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class PayrollCalculationServiceTest {

    private PayrollCalculationService service;

    @BeforeEach
    void setUp() {
        service = new PayrollCalculationService();
    }

    /**
     * Standard employee: basic salary only, no additions or deductions.
     *
     * Python equivalent:
     *   daily_wage  = 5200 / 26 = 200
     *   hourly_wage = 200 / 8   = 25
     *   total_deductions = 0
     *   total_additions  = 0
     *   net_salary     = 5200
     */
    @Test
    void calculate_basicSalaryOnly_noAdditionsOrDeductions() {
        EmployeePayrollData data = new EmployeePayrollData(
                "EMP001", "Alice Smith", "Accountant",
                new BigDecimal("5200"),    // basic_salary
                30, 5, 25,                  // vacation
                BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, // deduction_hour, deduction_day, absence
                BigDecimal.ZERO, BigDecimal.ZERO,  // admin_deduction, advance_deduction
                BigDecimal.ZERO,            // total_deductions_input
                BigDecimal.ZERO, BigDecimal.ZERO, // additional_hours, additional_days
                BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, // bonuses, transport, punctuality
                BigDecimal.ZERO,            // total_additions_input
                BigDecimal.ZERO             // net_salary_input
        );

        PayrollResult result = service.calculate(data);

        assertEquals(0, new BigDecimal("200").compareTo(result.dailyWage()));
        assertEquals(0, new BigDecimal("25").compareTo(result.hourlyWage()));
        assertEquals(0, BigDecimal.ZERO.compareTo(result.totalDeductions()));
        assertEquals(0, BigDecimal.ZERO.compareTo(result.totalAdditions()));
        assertEquals(0, new BigDecimal("5200").compareTo(result.netSalary()));
    }

    /**
     * Employee with overtime hours, overtime days, bonuses, transportation,
     * and punctuality bonus. No deductions.
     *
     * Python equivalent:
     *   daily_wage  = 6500 / 26 = 250
     *   hourly_wage = 250 / 8   = 31.25
     *   hour_addition  = 10 * 31.25 = 312.50
     *   day_addition   = 2  * 250   = 500
     *   total_additions = 312.50 + 500 + 500 + 200 + 100 = 1612.50
     *   total_deductions = 0
     *   net_salary     = 6500 + 1612.50 = 8112.50
     */
    @Test
    void calculate_withOvertimeAndBonuses_noDeductions() {
        EmployeePayrollData data = new EmployeePayrollData(
                "EMP002", "Bob Jones", "Engineer",
                new BigDecimal("6500"),    // basic_salary
                30, 10, 20,                 // vacation
                BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, // no deductions (hour, day, absence)
                BigDecimal.ZERO, BigDecimal.ZERO,  // admin_deduction, advance_deduction
                BigDecimal.ZERO,            // total_deductions_input
                new BigDecimal("10"), new BigDecimal("2"), // additional_hours, additional_days
                new BigDecimal("500"),      // bonuses
                new BigDecimal("200"),      // transportation
                new BigDecimal("100"),      // punctuality_bonus
                BigDecimal.ZERO,            // total_additions_input
                BigDecimal.ZERO             // net_salary_input
        );

        PayrollResult result = service.calculate(data);

        assertEquals(0, new BigDecimal("250").compareTo(result.dailyWage()));
        assertEquals(0, new BigDecimal("31.25").compareTo(result.hourlyWage()));

        // Verify individual addition components via total
        BigDecimal expectedAdditions = new BigDecimal("312.50")   // 10 * 31.25
                .add(new BigDecimal("500"))                        // 2 * 250
                .add(new BigDecimal("500"))                        // bonuses
                .add(new BigDecimal("200"))                        // transportation
                .add(new BigDecimal("100"));                       // punctuality
        assertEquals(0, expectedAdditions.compareTo(result.totalAdditions()));

        assertEquals(0, BigDecimal.ZERO.compareTo(result.totalDeductions()));

        BigDecimal expectedNet = new BigDecimal("6500").add(expectedAdditions);
        assertEquals(0, expectedNet.compareTo(result.netSalary()));
    }

    /**
     * Employee with multiple deduction types and some overtime.
     *
     * Python equivalent:
     *   daily_wage  = 4800 / 26 = 184.6153846154
     *   hourly_wage = 184.6153846154 / 8 = 23.0769230769
     *   hour_deduction  = 3 * 23.0769230769 = 69.2307692308
     *   day_deduction   = 1 * 184.6153846154 = 184.6153846154
     *   absence_deduction = 2 * 184.6153846154 = 369.2307692308
     *   total_deductions = 69.23 + 184.62 + 369.23 + 150 + 300
     *                    = 1073.0769230769
     *   hour_addition = 5 * 23.0769230769 = 115.3846153846
     *   total_additions = 115.38 + 200 = 315.3846153846
     *   net_salary = 4800 + 315.38 - 1073.08 = 4042.3076923077
     */
    @Test
    void calculate_withDeductionsAndSomeOvertime() {
        EmployeePayrollData data = new EmployeePayrollData(
                "EMP003", "Charlie Brown", "Clerk",
                new BigDecimal("4800"),    // basic_salary
                30, 7, 23,                  // vacation
                new BigDecimal("3"), new BigDecimal("1"), new BigDecimal("2"),
                new BigDecimal("150"),      // admin_deduction
                new BigDecimal("300"),      // advance_deduction
                BigDecimal.ZERO,            // total_deductions_input
                new BigDecimal("5"), BigDecimal.ZERO,
                new BigDecimal("200"),      // bonuses
                BigDecimal.ZERO,            // transportation
                BigDecimal.ZERO,            // punctuality_bonus
                BigDecimal.ZERO,            // total_additions_input
                BigDecimal.ZERO             // net_salary_input
        );

        PayrollResult result = service.calculate(data);

        // Verify daily/hourly wage (use compareTo with tolerance for rounding)
        BigDecimal expectedDailyWage = new BigDecimal("4800")
                .divide(BigDecimal.valueOf(26), 10, java.math.RoundingMode.HALF_UP);
        BigDecimal expectedHourlyWage = expectedDailyWage
                .divide(BigDecimal.valueOf(8), 10, java.math.RoundingMode.HALF_UP);

        assertEquals(0, expectedDailyWage.compareTo(result.dailyWage()));
        assertEquals(0, expectedHourlyWage.compareTo(result.hourlyWage()));

        // Verify deductions
        BigDecimal expectedHourDeduction = BigDecimal.valueOf(3).multiply(expectedHourlyWage);
        BigDecimal expectedDayDeduction = BigDecimal.ONE.multiply(expectedDailyWage);
        BigDecimal expectedAbsenceDeduction = BigDecimal.valueOf(2).multiply(expectedDailyWage);
        BigDecimal expectedDeductions = expectedHourDeduction
                .add(expectedDayDeduction)
                .add(expectedAbsenceDeduction)
                .add(new BigDecimal("150"))
                .add(new BigDecimal("300"));
        assertEquals(0, expectedDeductions.compareTo(result.totalDeductions()));

        // Verify additions
        BigDecimal expectedHourAddition = BigDecimal.valueOf(5).multiply(expectedHourlyWage);
        BigDecimal expectedAdditions = expectedHourAddition
                .add(new BigDecimal("200")); // bonuses
        assertEquals(0, expectedAdditions.compareTo(result.totalAdditions()));

        // Verify net salary
        BigDecimal expectedNet = new BigDecimal("4800")
                .add(expectedAdditions)
                .subtract(expectedDeductions);
        assertEquals(0, expectedNet.compareTo(result.netSalary()));
    }

    /**
     * Employee with zero basic salary should produce all-zero results.
     */
    @Test
    void calculate_zeroBasicSalary_allZeros() {
        EmployeePayrollData data = new EmployeePayrollData(
                "EMP004", "Diana Prince", "Intern",
                BigDecimal.ZERO,
                0, 0, 0,
                BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO,
                BigDecimal.ZERO, BigDecimal.ZERO,
                BigDecimal.ZERO,
                BigDecimal.ZERO, BigDecimal.ZERO,
                BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO,
                BigDecimal.ZERO,
                BigDecimal.ZERO
        );

        PayrollResult result = service.calculate(data);

        assertEquals(0, BigDecimal.ZERO.compareTo(result.dailyWage()));
        assertEquals(0, BigDecimal.ZERO.compareTo(result.hourlyWage()));
        assertEquals(0, BigDecimal.ZERO.compareTo(result.totalDeductions()));
        assertEquals(0, BigDecimal.ZERO.compareTo(result.totalAdditions()));
        assertEquals(0, BigDecimal.ZERO.compareTo(result.netSalary()));
    }

    /**
     * Verify that calculateAll processes multiple employees correctly.
     */
    @Test
    void calculateAll_processesAllEmployees() {
        EmployeePayrollData data1 = new EmployeePayrollData(
                "E1", "Alice", "Manager",
                new BigDecimal("5200"),
                30, 5, 25, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO,
                BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO,
                BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO,
                BigDecimal.ZERO, BigDecimal.ZERO
        );
        EmployeePayrollData data2 = new EmployeePayrollData(
                "E2", "Bob", "Clerk",
                new BigDecimal("3900"),
                30, 0, 30, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO,
                BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO,
                BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO,
                BigDecimal.ZERO, BigDecimal.ZERO
        );

        List<PayrollResult> results = service.calculateAll(List.of(data1, data2));

        assertEquals(2, results.size());
        assertEquals("E1", results.get(0).employeeCode());
        assertEquals("E2", results.get(1).employeeCode());

        // 3900 / 26 = 150 daily wage
        assertEquals(0, new BigDecimal("150").compareTo(results.get(1).dailyWage()));
        assertEquals(0, new BigDecimal("18.75").compareTo(results.get(1).hourlyWage()));
    }
}
