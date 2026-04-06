package com.hrms.api.dto;

import java.math.BigDecimal;
import java.util.List;

/**
 * Report for payroll to export approved (but not yet delivered) advances for a given month.
 */
public record AdvanceApprovalReportResponse(
        int month,
        int year,
        int totalCount,
        BigDecimal totalAmount,
        List<AdvanceRequestResponse> items
) {}

