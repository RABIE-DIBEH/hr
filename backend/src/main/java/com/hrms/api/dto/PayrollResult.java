package com.hrms.api.dto;

import java.math.BigDecimal;

/**
 * Complete payroll calculation result for one employee.
 * Contains both the raw input fields and all derived values (daily wage,
 * hourly wage, calculated deductions/additions, net salary).
 */
public record PayrollResult(
        String employeeCode,
        String employeeName,
        String jobTitle,
        BigDecimal basicSalary,
        int totalVacation,
        int usedVacation,
        int remainingVacation,
        int deductionHour,
        int deductionDay,
        int absenceDeduction,
        BigDecimal adminDeduction,
        BigDecimal advanceDeduction,
        BigDecimal totalDeductions,
        int additionalHours,
        int additionalDays,
        BigDecimal bonuses,
        BigDecimal transportation,
        BigDecimal punctualityBonus,
        BigDecimal totalAdditions,
        BigDecimal netSalary,
        BigDecimal dailyWage,
        BigDecimal hourlyWage
) {}
