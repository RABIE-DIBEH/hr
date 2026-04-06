package com.hrms.api.dto;

import java.math.BigDecimal;

public record PayrollMonthlySummaryResponse(
        int month,
        int year,
        long totalSlips,
        long paidSlips,
        BigDecimal totalNetSalary
) {}

