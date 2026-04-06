package com.hrms.api.dto;

import jakarta.validation.constraints.NotBlank;

public record LeaveDecisionRequest(
        @NotBlank(message = "Status is required")
        String status,

        String note
) {}
