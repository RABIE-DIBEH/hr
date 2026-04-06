package com.hrms.api.dto;

/**
 * Response DTO for employee soft-deletion (termination) operations.
 */
public record EmployeeDeletionResponse(
        Long employeeId,
        String fullName,
        String email,
        String previousStatus,
        String newStatus,
        Long deletedBy,
        String deletedByName
) {}
