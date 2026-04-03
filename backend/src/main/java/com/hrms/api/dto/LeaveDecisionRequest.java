package com.hrms.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record LeaveDecisionRequest(
        @NotBlank(message = "Status is required")
        @Pattern(regexp = "Approved|Rejected", message = "Status must be 'Approved' or 'Rejected'")
        String status,

        String note
) {}
