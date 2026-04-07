package com.hrms.api.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * Typed DTO for updating NFC device status.
 */
public record DeviceStatusUpdateRequest(
        @NotBlank(message = "Status is required")
        String status
) {}