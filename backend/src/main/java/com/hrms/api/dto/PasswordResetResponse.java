package com.hrms.api.dto;

/**
 * Response DTO for password reset operations.
 * Includes the generated plain-text password so the admin can share it.
 */
public record PasswordResetResponse(
        Long employeeId,
        String fullName,
        String email,
        String newPassword,
        Long resetBy,
        String resetByName
) {}
