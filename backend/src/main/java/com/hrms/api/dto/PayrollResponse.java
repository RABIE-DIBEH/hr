package com.hrms.api.dto;

import java.math.BigDecimal;

/**
 * Flattened response DTO for payroll records.
 * Avoids serializing the full Employee entity and matches frontend expectations.
 */
public record PayrollResponse(
        Long payrollId,
        Long employeeId,
        String employeeName,
        int month,
        int year,
        BigDecimal totalWorkHours,
        BigDecimal overtimeHours,
        BigDecimal deductions,
        BigDecimal netSalary,
        String generatedAt
) {}
