package com.hrms.services;

import com.hrms.api.dto.PayrollExportData;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Tests for PayrollExcelExportService.
 */
@ExtendWith(MockitoExtension.class)
class PayrollExcelExportServiceTest {

    private final PayrollExcelExportService service = new PayrollExcelExportService();

    @Test
    void generatePayrollWorkbook_CreatesWorkbookWithCorrectSheets() {
        // Given
        PayrollExportData result = new PayrollExportData(
                "EMP001",
                "John Doe",
                "Software Engineer",
                "IT",
                new com.hrms.services.PayrollFormulaEngine.PayrollResult(
                        new BigDecimal("5000.00"), // basicSalary
                        new BigDecimal("180.00"),  // workedHours
                        new BigDecimal("20.00"),   // overtimeHours
                        new BigDecimal("0.00"),    // absenceDays
                        new BigDecimal("192.31"),  // dailyWage
                        new BigDecimal("24.04"),   // hourlyWage
                        new BigDecimal("300.00"),  // totalDeductions
                        new BigDecimal("480.00"),  // totalAdditions
                        new BigDecimal("300.00"),  // advanceDeductions
                        new BigDecimal("5180.00")  // netSalary
                )
        );

        // When
        XSSFWorkbook workbook = service.generatePayrollWorkbook(
                List.of(result),
                "Test Company",
                "Test Department",
                "Test Notes",
                "October",
                "2025"
        );

        // Then
        assertNotNull(workbook);
        assertEquals(2, workbook.getNumberOfSheets());
        
        // Check sheet names
        String sheet1Name = workbook.getSheetAt(0).getSheetName();
        String sheet2Name = workbook.getSheetAt(1).getSheetName();
        
        assertTrue(sheet1Name.startsWith("Emp_EMP001_"));
        assertTrue(sheet1Name.endsWith("Page1"));
        assertTrue(sheet2Name.startsWith("Emp_EMP001_"));
        assertTrue(sheet2Name.endsWith("Page2"));
        
        // Check sheet name length doesn't exceed Excel limit
        assertTrue(sheet1Name.length() <= 31);
        assertTrue(sheet2Name.length() <= 31);
    }

    @Test
    void generatePayrollWorkbook_MultipleEmployees_CreatesMultipleSheets() {
        // Given
        PayrollExportData result1 = new PayrollExportData(
                "EMP001",
                "John Doe",
                "Software Engineer",
                "HR",
                new com.hrms.services.PayrollFormulaEngine.PayrollResult(
                        new BigDecimal("5000.00"), // basicSalary
                        new BigDecimal("180.00"),  // workedHours
                        new BigDecimal("20.00"),   // overtimeHours
                        new BigDecimal("0.00"),    // absenceDays
                        new BigDecimal("192.31"),  // dailyWage
                        new BigDecimal("24.04"),   // hourlyWage
                        new BigDecimal("300.00"),  // totalDeductions
                        new BigDecimal("480.00"),  // totalAdditions
                        new BigDecimal("300.00"),  // advanceDeductions
                        new BigDecimal("5180.00")  // netSalary
                )
        );

        PayrollExportData result2 = new PayrollExportData(
                "EMP002",
                "Jane Smith",
                "Product Manager",
                "IT",
                new com.hrms.services.PayrollFormulaEngine.PayrollResult(
                        new BigDecimal("6000.00"), // basicSalary
                        new BigDecimal("160.00"),  // workedHours
                        new BigDecimal("0.00"),    // overtimeHours
                        new BigDecimal("2.00"),    // absenceDays
                        new BigDecimal("230.77"),  // dailyWage
                        new BigDecimal("28.85"),   // hourlyWage
                        new BigDecimal("461.54"),  // totalDeductions
                        new BigDecimal("0.00"),    // totalAdditions
                        new BigDecimal("0.00"),    // advanceDeductions
                        new BigDecimal("5538.46")  // netSalary
                )
        );

        // When
        XSSFWorkbook workbook = service.generatePayrollWorkbook(
                List.of(result1, result2),
                "Test Company",
                "Test Department",
                "Test Notes",
                "October",
                "2025"
        );

        // Then
        assertNotNull(workbook);
        assertEquals(4, workbook.getNumberOfSheets()); // 2 sheets per employee
        
        // Check all sheet names are valid
        for (int i = 0; i < workbook.getNumberOfSheets(); i++) {
            String sheetName = workbook.getSheetAt(i).getSheetName();
            assertTrue(sheetName.length() <= 31);
            assertTrue(sheetName.contains("Emp_"));
        }
    }

    @Test
    void generatePayrollWorkbook_SheetNamesDontExceedLimit() {
        // Given - employee code that would make long sheet name
        PayrollExportData result = new PayrollExportData(
                "EMP0012345678901234567890", // Long employee code
                "John Doe",
                "Software Engineer",
                "IT",
                new com.hrms.services.PayrollFormulaEngine.PayrollResult(
                        new BigDecimal("5000.00"), // basicSalary
                        new BigDecimal("180.00"),  // workedHours
                        new BigDecimal("20.00"),   // overtimeHours
                        new BigDecimal("0.00"),    // absenceDays
                        new BigDecimal("192.31"),  // dailyWage
                        new BigDecimal("24.04"),   // hourlyWage
                        new BigDecimal("300.00"),  // totalDeductions
                        new BigDecimal("480.00"),  // totalAdditions
                        new BigDecimal("300.00"),  // advanceDeductions
                        new BigDecimal("5180.00")  // netSalary
                )
        );

        // When
        XSSFWorkbook workbook = service.generatePayrollWorkbook(
                List.of(result),
                "Test Company",
                "Test Department",
                "Test Notes",
                "October",
                "2025"
        );

        // Then - sheet names should not exceed 31 characters
        String sheet1Name = workbook.getSheetAt(0).getSheetName();
        String sheet2Name = workbook.getSheetAt(1).getSheetName();
        
        assertTrue(sheet1Name.length() <= 31, "Sheet 1 name exceeds 31 chars: " + sheet1Name);
        assertTrue(sheet2Name.length() <= 31, "Sheet 2 name exceeds 31 chars: " + sheet2Name);
    }
}