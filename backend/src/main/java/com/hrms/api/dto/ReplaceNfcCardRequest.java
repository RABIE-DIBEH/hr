package com.hrms.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ReplaceNfcCardRequest(
        @NotBlank(message = "newUid is required")
        @Size(max = 50, message = "newUid must not exceed 50 characters")
        String newUid
) {}
