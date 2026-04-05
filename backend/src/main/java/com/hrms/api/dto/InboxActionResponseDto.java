package com.hrms.api.dto;

/**
 * Standard DTO for inbox actions (archive, delete).
 */
public record InboxActionResponseDto(
        String status,
        Long messageId
) {
}
