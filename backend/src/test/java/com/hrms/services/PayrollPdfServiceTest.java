package com.hrms.services;

import com.hrms.api.dto.PayrollExportData;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Tests for PayrollPdfService.
 */
@ExtendWith(MockitoExtension.class)
class PayrollPdfServiceTest {

    private final PayrollPdfService service = new PayrollPdfService();

    @Test
    void generatePayrollPdf_CreatesPdfForSingleEmployee() {
        // Given
        com.hrms.api.dto.PayrollExportData result = new com.hrms.api.dto.PayrollExportData(
                "EMP001",
                "John Doe",
                "Software Engineer",
                "IT",
                new com.hrms.services.PayrollFormulaEngine.PayrollResult(
                        new java.math.BigDecimal("5000.00"), // basicSalary
                        new java.math.BigDecimal("180.00"),  // workedHours
                        new java.math.BigDecimal("20.00"),   // overtimeHours
                        new java.math.BigDecimal("0.00"),    // absenceDays
                        new java.math.BigDecimal("192.31"),  // dailyWage
                        new java.math.BigDecimal("24.04"),   // hourlyWage
                        new java.math.BigDecimal("300.00"),  // totalDeductions
                        new java.math.BigDecimal("480.00"),  // totalAdditions
                        new java.math.BigDecimal("300.00"),  // advanceDeductions
                        new java.math.BigDecimal("5180.00")  // netSalary
                )
        );

        // When
        byte[] pdfBytes = service.generatePayrollPdf(
                List.of(result),
                "Test Company",
                "Test Notes",
                "October",
                "2025"
        );

        // Then
        assertNotNull(pdfBytes);
        assertTrue(pdfBytes.length > 0, "PDF should not be empty");
    }

    @Test
    void generatePayrollPdf_CreatesPdfForMultipleEmployees() {
        // Given
        com.hrms.api.dto.PayrollExportData result1 = new com.hrms.api.dto.PayrollExportData(
                "EMP001",
                "John Doe",
                "Software Engineer",
                "HR",
                new com.hrms.services.PayrollFormulaEngine.PayrollResult(
                        new java.math.BigDecimal("5000.00"), // basicSalary
                        new java.math.BigDecimal("180.00"),  // workedHours
                        new java.math.BigDecimal("20.00"),   // overtimeHours
                        new java.math.BigDecimal("0.00"),    // absenceDays
                        new java.math.BigDecimal("192.31"),  // dailyWage
                        new java.math.BigDecimal("24.04"),   // hourlyWage
                        new java.math.BigDecimal("300.00"),  // totalDeductions
                        new java.math.BigDecimal("480.00"),  // totalAdditions
                        new java.math.BigDecimal("300.00"),  // advanceDeductions
                        new java.math.BigDecimal("5180.00")  // netSalary
                )
        );

        com.hrms.api.dto.PayrollExportData result2 = new com.hrms.api.dto.PayrollExportData(
                "EMP002",
                "Jane Smith",
                "Product Manager",
                "IT",
                new com.hrms.services.PayrollFormulaEngine.PayrollResult(
                        new java.math.BigDecimal("6000.00"), // basicSalary
                        new java.math.BigDecimal("160.00"),  // workedHours
                        new java.math.BigDecimal("0.00"),    // overtimeHours
                        new java.math.BigDecimal("2.00"),    // absenceDays
                        new java.math.BigDecimal("230.77"),  // dailyWage
                        new java.math.BigDecimal("28.85"),   // hourlyWage
                        new java.math.BigDecimal("461.54"),  // totalDeductions
                        new java.math.BigDecimal("0.00"),    // totalAdditions
                        new java.math.BigDecimal("0.00"),    // advanceDeductions
                        new java.math.BigDecimal("5538.46")  // netSalary
                )
        );

        // When
        byte[] pdfBytes = service.generatePayrollPdf(
                List.of(result1, result2),
                "Test Company",
                "Test Notes",
                "October",
                "2025"
        );

        // Then
        assertNotNull(pdfBytes);
        assertTrue(pdfBytes.length > 0, "PDF should not be empty");
    }

    @Test
    void generatePayrollPdf_HandlesEmptyNotes() {
        // Given
        com.hrms.api.dto.PayrollExportData result = new com.hrms.api.dto.PayrollExportData(
                "EMP001",
                "John Doe",
                "Software Engineer",
                "IT",
                new com.hrms.services.PayrollFormulaEngine.PayrollResult(
                        new java.math.BigDecimal("5000.00"), // basicSalary
                        new java.math.BigDecimal("180.00"),  // workedHours
                        new java.math.BigDecimal("20.00"),   // overtimeHours
                        new java.math.BigDecimal("0.00"),    // absenceDays
                        new java.math.BigDecimal("192.31"),  // dailyWage
                        new java.math.BigDecimal("24.04"),   // hourlyWage
                        new java.math.BigDecimal("300.00"),  // totalDeductions
                        new java.math.BigDecimal("480.00"),  // totalAdditions
                        new java.math.BigDecimal("300.00"),  // advanceDeductions
                        new java.math.BigDecimal("5180.00")  // netSalary
                )
        );

        // When - notes is null
        byte[] pdfBytes = service.generatePayrollPdf(
                List.of(result),
                "Test Company",
                null,
                "October",
                "2025"
        );

        // Then
        assertNotNull(pdfBytes);
        assertTrue(pdfBytes.length > 0, "PDF should not be empty");
    }
}