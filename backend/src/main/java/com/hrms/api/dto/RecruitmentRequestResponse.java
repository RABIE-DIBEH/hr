package com.hrms.api.dto;

import java.math.BigDecimal;

public record RecruitmentRequestResponse(
        Long requestId,
        String fullName,
        String email,
        String nationalId,
        String address,
        String jobDescription,
        String department,
        Integer age,
        String insuranceNumber,
        String healthNumber,
        String militaryServiceStatus,
        String maritalStatus,
        Integer numberOfChildren,
        String mobileNumber,
        BigDecimal expectedSalary,
        Long requestedBy,
        String requestedByName,
        String status,
        String managerNote,
        String requestedAt,
        String processedAt,
        Long approvedBy
) {}
