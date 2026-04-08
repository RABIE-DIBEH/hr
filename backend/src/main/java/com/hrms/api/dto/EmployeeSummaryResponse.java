package com.hrms.api.dto;

import java.math.BigDecimal;

public record EmployeeSummaryResponse(
        Long employeeId,
        String fullName,
        String email,
        Long teamId,
        String teamName,
        Long departmentId,
        String departmentName,
        String cardUid,
        boolean nfcLinked,
        String nfcStatus,
        BigDecimal baseSalary,
        String employmentStatus,
        Long roleId,
        String roleName,
        String mobileNumber,
        String address,
        String nationalId
) {}
