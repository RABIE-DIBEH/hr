package com.hrms.api.dto;

import java.util.List;

/**
 * Result of a payroll export operation.
 * Contains the exported file bytes and metadata.
 */
public record PayrollExportResult(
    byte[] excelBytes,
    byte[] pdfBytes,
    int employeeCount,
    List<String> errors
) {
    /**
     * Creates a successful export result.
     */
    public static PayrollExportResult success(byte[] excelBytes, byte[] pdfBytes, int employeeCount) {
        return new PayrollExportResult(excelBytes, pdfBytes, employeeCount, List.of());
    }

    /**
     * Creates an export result with errors.
     */
    public static PayrollExportResult withErrors(byte[] excelBytes, byte[] pdfBytes, int employeeCount, List<String> errors) {
        return new PayrollExportResult(excelBytes, pdfBytes, employeeCount, errors);
    }

    /**
     * Creates an export result with only Excel data.
     */
    public static PayrollExportResult excelOnly(byte[] excelBytes, int employeeCount) {
        return new PayrollExportResult(excelBytes, null, employeeCount, List.of());
    }

    /**
     * Creates an export result with only PDF data.
     */
    public static PayrollExportResult pdfOnly(byte[] pdfBytes, int employeeCount) {
        return new PayrollExportResult(null, pdfBytes, employeeCount, List.of());
    }
}