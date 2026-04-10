package com.hrms.api.dto;

/**
 * Response DTO for the Leave Quota Report showing each employee's remaining paid leave days.
 */
public record LeaveBalanceReportResponse(
        Long employeeId,
        String fullName,
        String email,
        String departmentName,
        String status,
        Double leaveBalanceDays,
        Double overtimeBalanceHours
) {}
