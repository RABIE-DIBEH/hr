package com.hrms.services;

import java.math.BigDecimal;
import java.math.RoundingMode;

import org.springframework.stereotype.Component;

@Component
public class PayrollFormulaEngine {

    private static final BigDecimal STANDARD_DAYS = new BigDecimal("26");
    private static final BigDecimal STANDARD_HOURS = new BigDecimal("160");
    private static final BigDecimal HOURS_PER_DAY = new BigDecimal("8");
    private static final int CALCULATION_SCALE = 10;

    /**
     * All values in this result are integers (truncated toward zero).
     * Matches Python: int(float(x)) → BigDecimal.ROUND_DOWN
     */
    public record PayrollResult(
        BigDecimal basicSalary,
        BigDecimal workedHours,
        BigDecimal overtimeHours,
        BigDecimal absenceDays,
        BigDecimal dailyWage,
        BigDecimal hourlyWage,
        BigDecimal totalDeductions,
        BigDecimal totalAdditions,
        BigDecimal advanceDeductions,
        BigDecimal netSalary
    ) {}

    public PayrollResult calculate(
        BigDecimal baseSalary,
        BigDecimal workedHours,
        BigDecimal workedDays,
        BigDecimal advanceDeductions
    ) {
        if (baseSalary == null) baseSalary = BigDecimal.ZERO;
        if (workedHours == null) workedHours = BigDecimal.ZERO;
        if (workedDays == null) workedDays = BigDecimal.ZERO;
        if (advanceDeductions == null) advanceDeductions = BigDecimal.ZERO;

        BigDecimal dailyWage = baseSalary.divide(STANDARD_DAYS, CALCULATION_SCALE, RoundingMode.HALF_UP);
        BigDecimal hourlyWage = dailyWage.divide(HOURS_PER_DAY, CALCULATION_SCALE, RoundingMode.HALF_UP);
        BigDecimal overtimeHours = workedHours.subtract(STANDARD_HOURS).max(BigDecimal.ZERO);
        BigDecimal absenceDays = STANDARD_DAYS.subtract(workedDays).max(BigDecimal.ZERO);
        BigDecimal totalDeductions = absenceDays.multiply(dailyWage).add(advanceDeductions);
        BigDecimal totalAdditions = overtimeHours.multiply(hourlyWage);
        BigDecimal netSalary = baseSalary.add(totalAdditions).subtract(totalDeductions);

        return new PayrollResult(
            truncate(baseSalary),
            truncate(workedHours),
            truncate(overtimeHours),
            truncate(absenceDays),
            truncate(dailyWage),
            truncate(hourlyWage),
            truncate(totalDeductions),
            truncate(totalAdditions),
            truncate(advanceDeductions),
            truncate(netSalary)
        );
    }

    public PayrollResult reconstruct(
        BigDecimal baseSalary,
        BigDecimal workedHours,
        BigDecimal overtimeHours,
        BigDecimal totalDeductions,
        BigDecimal advanceDeductions,
        BigDecimal netSalary
    ) {
        if (baseSalary == null) baseSalary = BigDecimal.ZERO;
        if (workedHours == null) workedHours = BigDecimal.ZERO;
        if (overtimeHours == null) overtimeHours = BigDecimal.ZERO;
        if (totalDeductions == null) totalDeductions = BigDecimal.ZERO;
        if (advanceDeductions == null) advanceDeductions = BigDecimal.ZERO;
        if (netSalary == null) netSalary = BigDecimal.ZERO;

        BigDecimal dailyWage = baseSalary.divide(STANDARD_DAYS, CALCULATION_SCALE, RoundingMode.HALF_UP);
        BigDecimal hourlyWage = dailyWage.divide(HOURS_PER_DAY, CALCULATION_SCALE, RoundingMode.HALF_UP);

        BigDecimal absenceDeduction = totalDeductions.subtract(advanceDeductions).max(BigDecimal.ZERO);
        BigDecimal absenceDays = dailyWage.compareTo(BigDecimal.ZERO) > 0
            ? absenceDeduction.divide(dailyWage, CALCULATION_SCALE, RoundingMode.HALF_UP)
            : BigDecimal.ZERO;

        BigDecimal totalAdditions = netSalary.subtract(baseSalary).add(totalDeductions).max(BigDecimal.ZERO);

        return new PayrollResult(
            truncate(baseSalary),
            truncate(workedHours),
            truncate(overtimeHours),
            truncate(absenceDays),
            truncate(dailyWage),
            truncate(hourlyWage),
            truncate(totalDeductions),
            truncate(totalAdditions),
            truncate(advanceDeductions),
            truncate(netSalary)
        );
    }

    private BigDecimal truncate(BigDecimal value) {
        return value.setScale(0, RoundingMode.DOWN);
    }
}
