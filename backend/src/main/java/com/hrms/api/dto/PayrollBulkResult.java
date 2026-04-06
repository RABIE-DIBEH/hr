package com.hrms.api.dto;

/**
 * Response DTO for bulk payroll calculation results.
 */
public record PayrollBulkResult(
        int month,
        int year,
        int totalProcessed,
        int successCount,
        int errorCount,
        String requester
) {}
