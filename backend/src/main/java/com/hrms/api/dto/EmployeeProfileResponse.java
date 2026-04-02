package com.hrms.api.dto;

import java.math.BigDecimal;

public record EmployeeProfileResponse(
        Long employeeId,
        String fullName,
        String email,
        Long teamId,
        String teamName,
        Long roleId,
        String roleName,
        Long managerId,
        BigDecimal baseSalary,
        String status
) {}
