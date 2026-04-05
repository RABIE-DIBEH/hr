package com.hrms.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * DTO for replying to an existing inbox message.
 */
public record ReplyMessageDto(
        @NotNull(message = "Parent message ID is required")
        Long replyTo,

        @NotBlank(message = "Reply message is required")
        String message
) {}
