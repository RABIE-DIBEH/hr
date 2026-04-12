package com.hrms.api.dto;

import org.apache.poi.xssf.usermodel.XSSFWorkbook;

import java.util.ArrayList;
import java.util.List;

/**
 * Aggregated result of a full payroll batch processing run.
 * Contains the generated styled Excel workbook, the PDF bytes,
 * the number of employees processed, and any errors encountered.
 */
public class PayrollBatchResult {

    private final XSSFWorkbook outputWorkbook;
    private final byte[] pdfContent;
    private final int employeeCount;
    private final List<String> errors;

    public PayrollBatchResult(XSSFWorkbook outputWorkbook, byte[] pdfContent,
                              int employeeCount, List<String> errors) {
        this.outputWorkbook = outputWorkbook;
        this.pdfContent = pdfContent;
        this.employeeCount = employeeCount;
        this.errors = errors != null ? new ArrayList<>(errors) : new ArrayList<>();
    }

    public XSSFWorkbook getOutputWorkbook() {
        return outputWorkbook;
    }

    public byte[] getPdfContent() {
        return pdfContent;
    }

    public int getEmployeeCount() {
        return employeeCount;
    }

    public List<String> getErrors() {
        return errors;
    }

    public boolean hasErrors() {
        return !errors.isEmpty();
    }
}
