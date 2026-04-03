package com.hrms.api.dto;

import jakarta.validation.constraints.NotBlank;

public record NfcClockRequest(
        @NotBlank(message = "Card UID is required")
        String cardUid
) {}
