package com.hrms.api.dto;

import java.math.BigDecimal;

/**
 * Raw payroll data extracted from a single row of the input Excel file.
 * Each field maps directly to a specific column (A-V) in the spreadsheet.
 */
public record EmployeePayrollData(
        // Col A
        String employeeCode,
        // Col B
        String employeeName,
        // Col C (also used as employee_department when non-empty)
        String jobTitle,
        // Col D
        BigDecimal basicSalary,
        // Col E (unused)
        // Col F (unused)
        // Col G
        int totalVacation,
        // Col H
        int usedVacation,
        // Col I
        int remainingVacation,
        // Col J
        BigDecimal deductionHour,
        // Col K
        BigDecimal deductionDay,
        // Col L
        BigDecimal absenceDeduction,
        // Col M
        BigDecimal adminDeduction,
        // Col N
        BigDecimal advanceDeduction,
        // Col O (pre-calculated in input, not used for our own calculations)
        BigDecimal totalDeductionsInput,
        // Col P
        BigDecimal additionalHours,
        // Col Q
        BigDecimal additionalDays,
        // Col R
        BigDecimal bonuses,
        // Col S
        BigDecimal transportation,
        // Col T
        BigDecimal punctualityBonus,
        // Col U (pre-calculated in input, not used for our own calculations)
        BigDecimal totalAdditionsInput,
        // Col V (pre-calculated in input, not used for our own calculations)
        BigDecimal netSalaryInput
) {}
