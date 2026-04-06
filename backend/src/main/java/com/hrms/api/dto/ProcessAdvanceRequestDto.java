package com.hrms.api.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import java.math.BigDecimal;

/**
 * DTO for processing an advance request (approve/reject).
 * Pattern exemplar: LoginRequest.java
 */
public record ProcessAdvanceRequestDto(
        @NotBlank(message = "Status is required")
        @Pattern(regexp = "^(Approved|Rejected)$", message = "Status must be 'Approved' or 'Rejected'")
        String status,

        String note,

        // Manager can optionally adjust these before sending to payroll.
        @DecimalMin(value = "0.01", message = "Amount must be greater than zero")
        BigDecimal amount,

        String reason
) {}
