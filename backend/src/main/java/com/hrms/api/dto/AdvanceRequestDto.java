package com.hrms.api.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

/**
 * DTO for submitting a new advance request.
 * All required fields are validated via Bean Validation annotations.
 * Pattern exemplar: LoginRequest.java
 */
public record AdvanceRequestDto(
        @NotNull(message = "Amount is required")
        @DecimalMin(value = "0.01", message = "Amount must be greater than zero")
        BigDecimal amount,

        String reason
) {}
