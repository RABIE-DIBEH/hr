package com.hrms.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import java.math.BigDecimal;

/**
 * DTO for processing a recruitment request (approve/reject).
 */
public record ProcessRecruitmentRequestDto(
        @NotBlank(message = "Status is required")
        @Pattern(regexp = "^(Approved|Rejected)$", message = "Status must be 'Approved' or 'Rejected'")
        String status,

        String note,

        BigDecimal salary
) {}
