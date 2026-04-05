package com.hrms.api.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.NotBlank;

import java.time.LocalDateTime;

public record ManualAttendanceCorrectionRequest(
        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
        LocalDateTime checkIn,

        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
        LocalDateTime checkOut,

        @NotBlank(message = "reason is required")
        String reason,

        Boolean approveForPayroll
) {}
