package com.hrms.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

/**
 * DTO for processing an advance request (approve/reject).
 * Pattern exemplar: LoginRequest.java
 */
public record ProcessAdvanceRequestDto(
        @NotBlank(message = "Status is required")
        @Pattern(regexp = "^(Approved|Rejected)$", message = "Status must be 'Approved' or 'Rejected'")
        String status,

        String note
) {}
