package com.hrms.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Request DTO for registering a new NFC device.
 */
public record CreateNfcDeviceRequest(
        @NotBlank(message = "deviceId is required")
        @Size(max = 100, message = "deviceId must be at most 100 characters")
        String deviceId,

        @NotBlank(message = "name is required")
        @Size(max = 255, message = "name must be at most 255 characters")
        String name,

        @Size(max = 50, message = "status must be at most 50 characters")
        String status,

        @Size(max = 50, message = "systemLoad must be at most 50 characters")
        String systemLoad
) {
}
