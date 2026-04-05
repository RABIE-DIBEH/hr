package com.hrms.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * DTO for sending a message from one employee to another.
 */
public record SendToEmployeeDto(
        @NotNull(message = "Recipient employee ID is required")
        Long targetEmployeeId,

        @NotBlank(message = "Title is required")
        String title,

        @NotBlank(message = "Message is required")
        String message,

        String priority
) {}
