package com.hrms.api.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * DTO for creating/sending inbox messages (Admin/System only)
 */
public record SendInboxMessageDto(
        @NotBlank(message = "Title is required")
        String title,
        
        @NotBlank(message = "Message is required")
        String message,
        
        String targetRole, // Optional if targetEmployeeId is set
        
        Long targetEmployeeId, // Optional if targetRole is set
        
        @NotBlank(message = "Sender name is required")
        String senderName,
        
        String priority // LOW, MEDIUM, HIGH (default: MEDIUM)
) {}
