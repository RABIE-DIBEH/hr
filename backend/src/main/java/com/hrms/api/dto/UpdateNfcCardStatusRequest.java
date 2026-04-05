package com.hrms.api.dto;

import jakarta.validation.constraints.NotBlank;

public record UpdateNfcCardStatusRequest(
        @NotBlank(message = "status is required")
        String status
) {}
