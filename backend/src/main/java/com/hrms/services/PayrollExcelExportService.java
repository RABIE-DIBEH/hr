package com.hrms.services;

import com.hrms.api.dto.PayrollExportData;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFFont;
import org.apache.poi.xssf.usermodel.XSSFSheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

/**
 * Generates a styled payroll workbook with 2 sheets per employee.
 * <p>
 * Sheet 1 (Emp_{code}_Page1): Payroll details with earnings and deductions.
 * Sheet 2 (Emp_{code}_Page2): Signature page with employee info.
 * <p>
 * The layout exactly mirrors the Python {@code create_payroll_sheet()}
 * and {@code create_second_page()} functions from
 * {@code multi_sheet_payroll_processor.py}.
 */
@Service
public class PayrollExcelExportService {

    // --- Color constants ---
    private static final String COLOR_HEADER_RED = "990000";
    private static final String COLOR_BLACK = "000000";

    // --- Fill colors ---
    private static final String FILL_HEADER = "E6E6FA";     // light purple
    private static final String FILL_EARNINGS = "F0F8FF";    // alice blue
    private static final String FILL_DEDUCTIONS = "FFF0F5";  // lavender blush
    private static final String FILL_LABEL = "DDEBF7";       // light blue
    private static final String FILL_NET = "C6E0B4";         // light green
    private static final String FILL_ZEBRA_1 = "FFFFFF";     // white
    private static final String FILL_ZEBRA_2 = "F8F8F8";     // light gray
    private static final String FILL_NOTES = "FFF2CC";       // yellow

    // --- Column indices (POI 0-based: B=1, C=2, D=3, E=4) ---
    private static final short COL_B = 1;
    private static final short COL_C = 2;
    private static final short COL_D = 3;
    private static final short COL_E = 4;

    private org.apache.poi.xssf.usermodel.XSSFColor getColor(String hex) {
        return new org.apache.poi.xssf.usermodel.XSSFColor(java.awt.Color.decode("#" + hex), null);
    }

    /**
     * Generates a styled payroll workbook with 2 sheets per employee.
     *
     * @param payrollResults list of calculated payroll data
     * @param companyName    company name (default "الإدارة العامة")
     * @param department     department name (default "قسم الحسابات")
     * @param notes          notes text (default "لا يوجد")
     * @param month          Arabic month name (default "أكتوبر")
     * @param year           year string (default "2025")
     * @return XSSFWorkbook ready to be written to file
     */
    public XSSFWorkbook generatePayrollWorkbook(
            List<PayrollExportData> payrollResults,
            String companyName,
            String department,
            String notes,
            String month,
            String year) {

        XSSFWorkbook workbook = new XSSFWorkbook();

        for (PayrollExportData result : payrollResults) {
            String sheetPrefix = buildSheetPrefix(result.employeeCode());
            createPayrollSheet(workbook, sheetPrefix + "Page1", result,
                    companyName, department, notes, month, year);
            createSecondPage(workbook, sheetPrefix + "Page2", result,
                    department, month, year);
        }

        return workbook;
    }

    // -------------------------------------------------------------------------
    // Sheet 1: Payroll details
    // -------------------------------------------------------------------------

    private void createPayrollSheet(
            XSSFWorkbook workbook,
            String sheetName,
            PayrollExportData result,
            String companyName,
            String department,
            String notes,
            String month,
            String year) {

        XSSFSheet ws = workbook.createSheet(sanitizeSheetName(sheetName));
        ws.setRightToLeft(true);

        // -- Fonts --
        XSSFFont headerFontRed = workbook.createFont();
        headerFontRed.setBold(true);
        headerFontRed.setFontHeightInPoints((short) 14);
        headerFontRed.setColor(getColor(COLOR_HEADER_RED));

        XSSFFont boldFont = workbook.createFont();
        boldFont.setBold(true);
        boldFont.setFontHeightInPoints((short) 12);
        boldFont.setColor(getColor(COLOR_BLACK));

        XSSFFont normalFont = workbook.createFont();
        normalFont.setFontHeightInPoints((short) 11);

        XSSFFont notesFont = workbook.createFont();
        notesFont.setBold(true);
        notesFont.setFontHeightInPoints((short) 11);

        XSSFFont netSalaryFont = workbook.createFont();
        netSalaryFont.setBold(true);
        netSalaryFont.setFontHeightInPoints((short) 14);
        netSalaryFont.setColor(getColor(COLOR_BLACK));

        // -- Alignments --
        CellStyle centerAlign = workbook.createCellStyle();
        centerAlign.setAlignment(HorizontalAlignment.CENTER);
        centerAlign.setVerticalAlignment(VerticalAlignment.CENTER);
        centerAlign.setWrapText(true);

        CellStyle rightAlign = workbook.createCellStyle();
        rightAlign.setAlignment(HorizontalAlignment.RIGHT);
        rightAlign.setVerticalAlignment(VerticalAlignment.CENTER);

        // -- Fills --
        org.apache.poi.xssf.usermodel.XSSFCellStyle headerFill = (org.apache.poi.xssf.usermodel.XSSFCellStyle) workbook.createCellStyle();
        headerFill.setFillForegroundColor(getColor(FILL_HEADER));
        headerFill.setFillPattern(FillPatternType.SOLID_FOREGROUND);

        org.apache.poi.xssf.usermodel.XSSFCellStyle earningsFillStyle = (org.apache.poi.xssf.usermodel.XSSFCellStyle) workbook.createCellStyle();
        earningsFillStyle.setFillForegroundColor(getColor(FILL_EARNINGS));
        earningsFillStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

        org.apache.poi.xssf.usermodel.XSSFCellStyle deductionsFillStyle = (org.apache.poi.xssf.usermodel.XSSFCellStyle) workbook.createCellStyle();
        deductionsFillStyle.setFillForegroundColor(getColor(FILL_DEDUCTIONS));
        deductionsFillStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

        org.apache.poi.xssf.usermodel.XSSFCellStyle labelFillStyle = (org.apache.poi.xssf.usermodel.XSSFCellStyle) workbook.createCellStyle();
        labelFillStyle.setFillForegroundColor(getColor(FILL_LABEL));
        labelFillStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

        org.apache.poi.xssf.usermodel.XSSFCellStyle netFillStyle = (org.apache.poi.xssf.usermodel.XSSFCellStyle) workbook.createCellStyle();
        netFillStyle.setFillForegroundColor(getColor(FILL_NET));
        netFillStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

        org.apache.poi.xssf.usermodel.XSSFCellStyle zebraFill1 = (org.apache.poi.xssf.usermodel.XSSFCellStyle) workbook.createCellStyle();
        zebraFill1.setFillForegroundColor(getColor(FILL_ZEBRA_1));
        zebraFill1.setFillPattern(FillPatternType.SOLID_FOREGROUND);

        org.apache.poi.xssf.usermodel.XSSFCellStyle zebraFill2 = (org.apache.poi.xssf.usermodel.XSSFCellStyle) workbook.createCellStyle();
        zebraFill2.setFillForegroundColor(getColor(FILL_ZEBRA_2));
        zebraFill2.setFillPattern(FillPatternType.SOLID_FOREGROUND);

        org.apache.poi.xssf.usermodel.XSSFCellStyle notesFillStyle = (org.apache.poi.xssf.usermodel.XSSFCellStyle) workbook.createCellStyle();
        notesFillStyle.setFillForegroundColor(getColor(FILL_NOTES));
        notesFillStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

        // -- Thin border --
        CellStyle thinBorder = workbook.createCellStyle();
        thinBorder.setBorderLeft(BorderStyle.THIN);
        thinBorder.setBorderRight(BorderStyle.THIN);
        thinBorder.setBorderTop(BorderStyle.THIN);
        thinBorder.setBorderBottom(BorderStyle.THIN);

        // -- Column widths --
        ws.setColumnWidth(COL_B, 15 * 256);
        ws.setColumnWidth(COL_C, 15 * 256);
        ws.setColumnWidth(COL_D, 15 * 256);
        ws.setColumnWidth(COL_E, 30 * 256);

        // -- Row heights --
        for (int row = 1; row <= 18; row++) {
            org.apache.poi.ss.usermodel.Row r = ws.createRow(row);
            r.setHeightInPoints(row <= 16 ? 18 : 20);
        }

        // ===== Row 1-3: Headers =====
        mergeAndStyle(ws, 1, COL_B, 1, COL_E, companyName, headerFontRed, centerAlign, headerFill);
        mergeAndStyle(ws, 2, COL_B, 2, COL_E, department, headerFontRed, centerAlign, headerFill);
        mergeAndStyle(ws, 3, COL_B, 3, COL_E, "\u0645\u064f\u0641\u0631\u062f\u0627\u062a \u0627\u0644\u0631\u0627\u062a\u0628 \u0627\u0644\u0634\u0647\u0631\u064a",
                headerFontRed, centerAlign, headerFill);

        // Row index 4 (Excel Row 5): empty spacer
        ws.addMergedRegion(new org.apache.poi.ss.util.CellRangeAddress(4, 4, COL_B, COL_E));

        // ===== Row 5-6: Employee info =====
        // B5="كود الموظف:"  C5=employeeCode
        setCellStyle(ws, 5, COL_B, "كود الموظف:", boldFont, labelFillStyle, thinBorder, rightAlign);
        setCellStyle(ws, 5, COL_C, result.employeeCode(), normalFont, null, thinBorder, rightAlign);

        // D5="اسم الموظف:"  E5=employeeName
        setCellStyle(ws, 5, COL_D, "اسم الموظف:", boldFont, labelFillStyle, thinBorder, rightAlign);
        setCellStyle(ws, 5, COL_E, result.employeeName(), normalFont, null, thinBorder, rightAlign);

        // B6="القسم:"  C6=jobTitle
        setCellStyle(ws, 6, COL_B, "القسم:", boldFont, labelFillStyle, thinBorder, rightAlign);
        setCellStyle(ws, 6, COL_C, result.jobTitle(), normalFont, null, thinBorder, rightAlign);

        // D6:E6 merged -> month text
        String monthText = "\u0639\u0646 \u0634\u0647\u0631 " + month + " \u0644\u0639\u0627\u0645 " + year;
        mergeAndStyle(ws, 6, COL_D, 6, COL_E, monthText, boldFont, centerAlign, headerFill);

        // ===== Row 7: Notes =====
        String notesText = "\u0645\u0644\u0627\u062d\u0638\u0627\u062a: " + (notes != null ? notes : "\u0644\u0627 \u064a\u0648\u062c\u062f");
        mergeAndStyle(ws, 7, COL_B, 7, COL_E, notesText, notesFont, centerAlign, notesFillStyle);

        // ===== Row 8: Column headers =====
        mergeAndStyle(ws, 8, COL_B, 8, COL_C, "\u0627\u0644\u0627\u0633\u062a\u062d\u0642\u0627\u0642\u0627\u062a",
                boldFont, centerAlign, earningsFillStyle, thinBorder);
        mergeAndStyle(ws, 8, COL_D, 8, COL_E, "\u0627\u0644\u0627\u0633\u062a\u0642\u0637\u0627\u0639\u0627\u062a",
                boldFont, centerAlign, deductionsFillStyle, thinBorder);

        // ===== Rows 9-15: Earnings and Deductions =====
        Object[][] earningsData = {
                {"\u0627\u0644\u0631\u0627\u062a\u0628 \u0627\u0644\u0623\u0633\u0627\u0633\u064a", result.basicSalary()},
                {"\u0627\u0644\u0625\u0636\u0627\u0641\u064a \u0627\u0644\u0633\u0627\u0639\u0627\u062a", result.overtimeHours()},
                {"\u0627\u0644\u0625\u0636\u0627\u0641\u064a \u0627\u0644\u0623\u064a\u0627\u0645", BigDecimal.ZERO},
                {"\u0627\u0644\u0645\u0643\u0627\u0641\u0622\u062a", BigDecimal.ZERO},
                {"\u0628\u062f\u0644 \u0645\u0648\u0627\u0635\u0644\u0627\u062a", BigDecimal.ZERO},
                {"\u062d\u0627\u0641\u0632 \u0627\u0646\u062a\u0638\u0627\u0645", BigDecimal.ZERO},
                {"\u0625\u062c\u0645\u0627\u0644\u064a \u0627\u0644\u0625\u0636\u0627\u0641\u0627\u062a", result.totalAdditions()},
        };

        for (int i = 0; i < earningsData.length; i++) {
            int row = 9 + i;
            CellStyle zebraFill = (row % 2 == 1) ? zebraFill1 : zebraFill2;
            setCellStyle(ws, row, COL_B, (String) earningsData[i][0],
                    boldFont, labelFillStyle, thinBorder, rightAlign);
            setCellStyle(ws, row, COL_C, earningsData[i][1],
                    normalFont, zebraFill, thinBorder, rightAlign);
        }

        Object[][] deductionsData = {
                {"\u062e\u0635\u0645 \u0628\u0627\u0644\u0633\u0627\u0639\u0629", BigDecimal.ZERO},
                {"\u062e\u0635\u0645 \u0628\u0627\u0644\u064a\u0648\u0645", BigDecimal.ZERO},
                {"\u062e\u0635\u0645 \u063a\u064a\u0627\u0628", result.dailyWage().multiply(result.absenceDays())},
                {"\u062e\u0635\u0645 \u0625\u062f\u0627\u0631\u064a", BigDecimal.ZERO},
                {"\u0627\u0644\u0633\u0644\u0641", result.advanceDeductions()},
                {"\u0625\u062c\u0645\u0627\u0644\u064a \u0627\u0644\u062e\u0635\u0648\u0645\u0627\u062a", result.totalDeductions()},
                {"", ""}, // empty row
        };

        for (int i = 0; i < deductionsData.length; i++) {
            int row = 9 + i;
            String label = (String) deductionsData[i][0];
            if (label.isEmpty()) {
                continue; // skip empty rows
            }
            CellStyle zebraFill = (row % 2 == 1) ? zebraFill1 : zebraFill2;
            setCellStyle(ws, row, COL_D, label,
                    boldFont, labelFillStyle, thinBorder, rightAlign);
            setCellStyle(ws, row, COL_E, deductionsData[i][1],
                    normalFont, zebraFill, thinBorder, rightAlign);
        }

        // ===== Row 16: Net salary =====
        int netValue = result.netSalary().setScale(0, RoundingMode.DOWN).intValue();
        String netText = "\u0635\u0627\u0641\u064a \u0627\u0644\u0631\u0627\u062a\u0628 \u0627\u0644\u0645\u0633\u062a\u062d\u0642: " + netValue + " \u062c\u0646\u064a\u0647";
        mergeAndStyle(ws, 16, COL_B, 16, COL_E, netText, netSalaryFont, centerAlign, netFillStyle, thinBorder);

        // ===== Row 17-18: Signatures =====
        String[] signatureLabels = {
                "\u062a\u0648\u0642\u064a\u0639 \u0627\u0644\u0645\u0648\u0638\u0641",  // B
                "\u0627\u0644\u0645\u064f\u0639\u062f",                   // C
                "\u0627\u0644\u0635\u0646\u062f\u0648\u0642",           // D
                "\u0627\u0644\u0625\u062f\u0627\u0631\u0629 \u0627\u0644\u0645\u0627\u0644\u064a\u0629"  // E
        };
        short[] sigCols = {COL_B, COL_C, COL_D, COL_E};
        for (int i = 0; i < sigCols.length; i++) {
            short col = sigCols[i];
            ws.addMergedRegion(new org.apache.poi.ss.util.CellRangeAddress(17, 18, col, col));
            setCellStyle(ws, 17, col, signatureLabels[i],
                    boldFont, labelFillStyle, thinBorder, centerAlign);
            setCellStyle(ws, 18, col, null, boldFont, null, thinBorder, centerAlign);
        }

        // ===== Bold outer border on B1:E18 =====
        applyBoldOuterBorder(ws, 1, 18, COL_B, COL_E);
    }

    // -------------------------------------------------------------------------
    // Sheet 2: Signature page
    // -------------------------------------------------------------------------

    private void createSecondPage(
            XSSFWorkbook workbook,
            String sheetName,
            PayrollExportData result,
            String department,
            String month,
            String year) {

        XSSFSheet ws = workbook.createSheet(sanitizeSheetName(sheetName));
        ws.setRightToLeft(true);

        XSSFFont boldFont = workbook.createFont();
        boldFont.setBold(true);
        boldFont.setFontHeightInPoints((short) 12);
        boldFont.setColor(getColor(COLOR_BLACK));

        XSSFFont normalFont = workbook.createFont();
        normalFont.setFontHeightInPoints((short) 11);
        normalFont.setColor(getColor(COLOR_BLACK));

        XSSFFont largeRedFont = workbook.createFont();
        largeRedFont.setBold(true);
        largeRedFont.setFontHeightInPoints((short) 16);
        largeRedFont.setColor(getColor(COLOR_HEADER_RED));

        CellStyle rightAlign = workbook.createCellStyle();
        rightAlign.setAlignment(HorizontalAlignment.RIGHT);
        rightAlign.setVerticalAlignment(VerticalAlignment.CENTER);

        CellStyle centerAlign = workbook.createCellStyle();
        centerAlign.setAlignment(HorizontalAlignment.CENTER);
        centerAlign.setVerticalAlignment(VerticalAlignment.CENTER);

        // Employee info at bottom
        ws.createRow(34); // row 35 (0-indexed 34)
        ws.createRow(35); // row 36
        ws.createRow(36); // row 37
        ws.createRow(37); // row 38

        setCellValueAndStyle(ws, 35, COL_B, "\u0627\u0633\u0645 \u0627\u0644\u0645\u0648\u0638\u0641: " + result.employeeName(), normalFont, rightAlign);
        setCellValueAndStyle(ws, 36, COL_B, "\u0643\u0648\u062f \u0627\u0644\u0645\u0648\u0638\u0641: " + result.employeeCode(), normalFont, rightAlign);
        setCellValueAndStyle(ws, 37, COL_B, "\u0627\u0644\u0642\u0633\u0645: " + department, normalFont, rightAlign);
        setCellValueAndStyle(ws, 38, COL_B, "\u0627\u0644\u062a\u0627\u0631\u064a\u062e: " + month + " " + year, normalFont, rightAlign);

        // BY: RABIE at D40:E40
        ws.addMergedRegion(new org.apache.poi.ss.util.CellRangeAddress(39, 39, COL_D, COL_E));
        setCellValueAndStyle(ws, 40, COL_D, "BY: RABIE", largeRedFont, centerAlign);
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private String buildSheetPrefix(String employeeCode) {
        return "Emp_" + employeeCode + "_";
    }

    /**
     * Excel sheet names are limited to 31 characters.
     */
    private String sanitizeSheetName(String name) {
        if (name.length() > 31) {
            String suffix = name.substring(name.length() - 6);
            name = name.substring(0, 25) + suffix;
        }
        // Sheet names cannot contain: \ / ? * [ ]
        return name.replace("\\", "")
                .replace("/", "")
                .replace("?", "")
                .replace("*", "")
                .replace("[", "")
                .replace("]", "");
    }

    private void mergeAndStyle(XSSFSheet ws, int row1, int col1, int row2, int col2,
                               String value, Font font, CellStyle alignStyle) {
        mergeAndStyle(ws, row1, col1, row2, col2, value, font, alignStyle, null, null);
    }

    private void mergeAndStyle(XSSFSheet ws, int row1, int col1, int row2, int col2,
                               String value, Font font, CellStyle alignStyle, CellStyle borderStyle) {
        mergeAndStyle(ws, row1, col1, row2, col2, value, font, alignStyle, null, borderStyle);
    }

    private void mergeAndStyle(XSSFSheet ws, int row1, int col1, int row2, int col2,
                               String value, Font font, CellStyle alignStyle,
                               CellStyle fillStyle, CellStyle borderStyle) {
        Row row = ws.getRow(row1);
        if (row == null) {
            row = ws.createRow(row1);
        }

        Cell cell = row.createCell(col1);
        cell.setCellValue(value);
        // Merge the cloned styles: alignment + fill + border
        CellStyle combinedStyle = ws.getWorkbook().createCellStyle();
        if (font != null) combinedStyle.setFont(font);
        if (alignStyle != null) {
            combinedStyle.cloneStyleFrom(alignStyle);
        }
        if (fillStyle != null) {
            combinedStyle.setFillForegroundColor(fillStyle.getFillForegroundColor());
            combinedStyle.setFillPattern(fillStyle.getFillPattern());
        }
        if (borderStyle != null) {
            combinedStyle.setBorderLeft(borderStyle.getBorderLeft());
            combinedStyle.setBorderRight(borderStyle.getBorderRight());
            combinedStyle.setBorderTop(borderStyle.getBorderTop());
            combinedStyle.setBorderBottom(borderStyle.getBorderBottom());
        }
        cell.setCellStyle(combinedStyle);

        ws.addMergedRegion(new org.apache.poi.ss.util.CellRangeAddress(row1, row2, col1, col2));
    }

    private void setCellStyle(XSSFSheet ws, int row, short col, String value,
                              Font font, CellStyle fillStyle,
                              CellStyle borderStyle, CellStyle alignStyle) {
        Row r = ws.getRow(row);
        if (r == null) {
            r = ws.createRow(row);
        }
        Cell cell = r.createCell(col);
        if (value != null) {
            cell.setCellValue(value);
        }
        CellStyle combined = ws.getWorkbook().createCellStyle();
        if (font != null) combined.setFont(font);
        if (alignStyle != null) {
            combined.cloneStyleFrom(alignStyle);
        }
        if (fillStyle != null) {
            combined.setFillForegroundColor(fillStyle.getFillForegroundColor());
            combined.setFillPattern(fillStyle.getFillPattern());
        }
        if (borderStyle != null) {
            combined.setBorderLeft(borderStyle.getBorderLeft());
            combined.setBorderRight(borderStyle.getBorderRight());
            combined.setBorderTop(borderStyle.getBorderTop());
            combined.setBorderBottom(borderStyle.getBorderBottom());
        }
        cell.setCellStyle(combined);
    }

    private void setCellStyle(XSSFSheet ws, int row, short col, Object value,
                              Font font, CellStyle fillStyle,
                              CellStyle borderStyle, CellStyle alignStyle) {
        Row r = ws.getRow(row);
        if (r == null) {
            r = ws.createRow(row);
        }
        Cell cell = r.createCell(col);
        if (value instanceof String s) {
            cell.setCellValue(s);
        } else if (value instanceof Number n) {
            cell.setCellValue(n.doubleValue());
        } else if (value instanceof BigDecimal bd) {
            cell.setCellValue(bd.doubleValue());
        }
        CellStyle combined = ws.getWorkbook().createCellStyle();
        if (font != null) combined.setFont(font);
        if (alignStyle != null) {
            combined.cloneStyleFrom(alignStyle);
        }
        if (fillStyle != null) {
            combined.setFillForegroundColor(fillStyle.getFillForegroundColor());
            combined.setFillPattern(fillStyle.getFillPattern());
        }
        if (borderStyle != null) {
            combined.setBorderLeft(borderStyle.getBorderLeft());
            combined.setBorderRight(borderStyle.getBorderRight());
            combined.setBorderTop(borderStyle.getBorderTop());
            combined.setBorderBottom(borderStyle.getBorderBottom());
        }
        cell.setCellStyle(combined);
    }

    private void setCellValueAndStyle(XSSFSheet ws, int row, short col,
                                      String value, Font font, CellStyle alignStyle) {
        Row r = ws.getRow(row);
        if (r == null) {
            r = ws.createRow(row);
        }
        Cell cell = r.createCell(col);
        if (value != null) {
            cell.setCellValue(value);
        }
        if (alignStyle != null || font != null) {
            CellStyle combined = ws.getWorkbook().createCellStyle();
            if (alignStyle != null) combined.cloneStyleFrom(alignStyle);
            if (font != null) combined.setFont(font);
            cell.setCellStyle(combined);
        }
    }

    /**
     * Applies medium (bold) borders on the outer edge of the rectangular region
     * and thin borders on inner cells.
     */
    private void applyBoldOuterBorder(XSSFSheet ws, int firstRow, int lastRow,
                                      short firstCol, short lastCol) {
        Workbook wb = ws.getWorkbook();

        for (int r = firstRow; r <= lastRow; r++) {
            for (short c = firstCol; c <= lastCol; c++) {
                Row row = ws.getRow(r);
                if (row == null) continue;
                Cell cell = row.getCell(c);
                if (cell == null) continue;

                CellStyle newStyle = wb.createCellStyle();
                newStyle.cloneStyleFrom(cell.getCellStyle());

                boolean isLeftEdge = (c == firstCol);
                boolean isRightEdge = (c == lastCol);
                boolean isTopEdge = (r == firstRow);
                boolean isBottomEdge = (r == lastRow);

                newStyle.setBorderLeft(isLeftEdge ? BorderStyle.MEDIUM : BorderStyle.THIN);
                newStyle.setBorderRight(isRightEdge ? BorderStyle.MEDIUM : BorderStyle.THIN);
                newStyle.setBorderTop(isTopEdge ? BorderStyle.MEDIUM : BorderStyle.THIN);
                newStyle.setBorderBottom(isBottomEdge ? BorderStyle.MEDIUM : BorderStyle.THIN);

                cell.setCellStyle(newStyle);
            }
        }
    }
}
