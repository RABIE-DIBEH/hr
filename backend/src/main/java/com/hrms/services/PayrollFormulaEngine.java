package com.hrms.services;

import java.math.BigDecimal;
import java.math.RoundingMode;

public class PayrollFormulaEngine {

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
        BigDecimal advanceDeductions
    ) {
        if (baseSalary == null) baseSalary = BigDecimal.ZERO;
        if (workedHours == null) workedHours = BigDecimal.ZERO;
        if (advanceDeductions == null) advanceDeductions = BigDecimal.ZERO;

        // 1. dailyWage = baseSalary / 26
        BigDecimal dailyWage = baseSalary.divide(new BigDecimal("26"), 2, RoundingMode.HALF_UP);
        // 2. hourlyWage = dailyWage / 8
        BigDecimal hourlyWage = dailyWage.divide(new BigDecimal("8"), 2, RoundingMode.HALF_UP);

        // 3. overtimeHours = max(0, workedHours - 160)
        BigDecimal standardHours = new BigDecimal("160");
        BigDecimal overtimeHours = workedHours.subtract(standardHours).max(BigDecimal.ZERO);

        // 4. workedDays = workedHours / 8
        BigDecimal workedDays = workedHours.divide(new BigDecimal("8"), 2, RoundingMode.HALF_UP);
        
        // 5. absenceDays = max(0, 26 - workedDays)
        BigDecimal standardDays = new BigDecimal("26");
        BigDecimal absenceDays = standardDays.subtract(workedDays).max(BigDecimal.ZERO);

        // 6. deductions = (absenceDays * dailyWage) + advanceDeductions
        BigDecimal absenceDeductionTotal = absenceDays.multiply(dailyWage).setScale(2, RoundingMode.HALF_UP);
        BigDecimal totalDeductions = absenceDeductionTotal.add(advanceDeductions);

        // 7. additions = overtimeHours * hourlyWage
        BigDecimal totalAdditions = overtimeHours.multiply(hourlyWage).setScale(2, RoundingMode.HALF_UP);

        // 8. net = baseSalary + additions - deductions
        BigDecimal netSalary = baseSalary.add(totalAdditions).subtract(totalDeductions);

        // Floored at 0 just in case deductions > base salary? Let's just output what it is. Wait, test says "Zero hours yields a flat 0 for net calculation if everything zeros out or negative. Wait, if hours=0, absence is 26, deductions > base salary? Will floor at 0."
        // Yes, python float -> int keeps negatives unless we clamp it. Let's clamp netSalary to 0.
        netSalary = netSalary.max(BigDecimal.ZERO);

        // Return truncated to 0 decimal places down
        return new PayrollResult(
            baseSalary.setScale(0, RoundingMode.DOWN),
            workedHours.setScale(0, RoundingMode.DOWN),
            overtimeHours.setScale(0, RoundingMode.DOWN),
            absenceDays.setScale(0, RoundingMode.DOWN),
            dailyWage.setScale(0, RoundingMode.DOWN),
            hourlyWage.setScale(0, RoundingMode.DOWN),
            totalDeductions.setScale(0, RoundingMode.DOWN),
            totalAdditions.setScale(0, RoundingMode.DOWN),
            advanceDeductions.setScale(0, RoundingMode.DOWN),
            netSalary.setScale(0, RoundingMode.DOWN)
        );
    }
}
