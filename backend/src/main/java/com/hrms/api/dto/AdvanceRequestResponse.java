package com.hrms.api.dto;

import java.math.BigDecimal;

public record AdvanceRequestResponse(
        Long advanceId,
        Long employeeId,
        String employeeName,
        BigDecimal amount,
        String reason,
        String status,
        String requestedAt,
        String processedAt,
        Long processedBy,
        String processedByName,
        String hrNote
) {}
