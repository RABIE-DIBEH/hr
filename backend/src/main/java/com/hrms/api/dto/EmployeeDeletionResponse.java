package com.hrms.api.dto;

import java.time.LocalDateTime;

/**
 * Response DTO for employee archive (soft-delete) operations.
 */
public record EmployeeDeletionResponse(
        Long employeeId,
        String fullName,
        String email,
        String previousStatus,
        String newStatus,
        Long archivedBy,
        String archivedByName,
        String reason,
        LocalDateTime archivedAt
) {}
