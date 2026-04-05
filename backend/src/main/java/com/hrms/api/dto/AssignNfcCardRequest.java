package com.hrms.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AssignNfcCardRequest(
        @NotBlank(message = "uid is required")
        @Size(max = 50, message = "uid must not exceed 50 characters")
        String uid
) {}
