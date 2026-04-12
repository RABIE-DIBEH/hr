package com.hrms.services;

import com.hrms.api.dto.PayrollExportData;
import com.lowagie.text.Document;
import com.lowagie.text.DocumentException;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

/**
 * Generates PDF payroll slips for employees using the new DB-driven calculation.
 * Each employee gets 2 pages:
 *   Page 1: Payroll details with earnings and deductions
 *   Page 2: Signature page
 * 
 * Note: Arabic text support requires embedding an Arabic font.
 * For v1, we use English labels only.
 */
@Service
public class PayrollPdfService {

    // Font constants
    private static final Font TITLE_FONT = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 16);
    private static final Font HEADER_FONT = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12);
    private static final Font NORMAL_FONT = FontFactory.getFont(FontFactory.HELVETICA, 10);
    private static final Font BOLD_FONT = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10);
    private static final Font NET_SALARY_FONT = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14);
    
    // Colors (RGB)
    private static final java.awt.Color HEADER_BG_COLOR = new java.awt.Color(230, 230, 250); // Light purple
    private static final java.awt.Color EARNINGS_BG_COLOR = new java.awt.Color(240, 248, 255); // Alice blue
    private static final java.awt.Color DEDUCTIONS_BG_COLOR = new java.awt.Color(255, 240, 245); // Lavender blush
    private static final java.awt.Color NET_SALARY_BG_COLOR = new java.awt.Color(198, 224, 180); // Light green
    private static final java.awt.Color NOTES_BG_COLOR = new java.awt.Color(255, 242, 204); // Yellow
    private static final java.awt.Color LABEL_BG_COLOR = new java.awt.Color(221, 235, 247); // Light blue

    /**
     * Generates a PDF document with payroll slips for all employees.
     * Each employee gets 2 pages.
     *
     * @param payrollData list of payroll export data (employee info + calculation results)
     * @param companyName company name
     * @param notes notes text
     * @param month month name
     * @param year year
     * @return PDF bytes
     */
    public byte[] generatePayrollPdf(
            List<PayrollExportData> payrollData,
            String companyName,
            String notes,
            String month,
            String year) {
        
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4);
            PdfWriter.getInstance(document, baos);
            document.open();
            
            for (PayrollExportData result : payrollData) {
                // Page 1: Payroll details
                addPayrollDetailsPage(document, result, companyName, result.department(), notes, month, year);
                document.newPage();
                
                // Page 2: Signature page
                addSignaturePage(document, result, result.department(), month, year);
                
                // Add a new page for next employee (unless it's the last one)
                if (payrollData.indexOf(result) < payrollData.size() - 1) {
                    document.newPage();
                }
            }
            
            document.close();
            return baos.toByteArray();
        } catch (DocumentException | IOException e) {
            throw new RuntimeException("Failed to generate PDF", e);
        }
    }

    /**
     * Creates page 1: Payroll details with earnings and deductions.
     */
    private void addPayrollDetailsPage(
            Document document,
            PayrollExportData result,
            String companyName,
            String department,
            String notes,
            String month,
            String year) throws DocumentException {
        
        // Company header
        Paragraph companyPara = new Paragraph(companyName, TITLE_FONT);
        companyPara.setAlignment(Element.ALIGN_CENTER);
        document.add(companyPara);
        
        Paragraph deptPara = new Paragraph(department, TITLE_FONT);
        deptPara.setAlignment(Element.ALIGN_CENTER);
        document.add(deptPara);
        
        Paragraph titlePara = new Paragraph("Monthly Payroll Details", TITLE_FONT);
        titlePara.setAlignment(Element.ALIGN_CENTER);
        document.add(titlePara);
        
        document.add(new Paragraph(" ")); // Spacer
        
        // Employee info table (2 columns)
        PdfPTable infoTable = new PdfPTable(4);
        infoTable.setWidthPercentage(100);
        infoTable.setWidths(new float[]{2, 3, 2, 3});
        
        addTableCell(infoTable, "Employee Code:", BOLD_FONT, LABEL_BG_COLOR);
        addTableCell(infoTable, result.employeeCode(), NORMAL_FONT, null);
        addTableCell(infoTable, "Employee Name:", BOLD_FONT, LABEL_BG_COLOR);
        addTableCell(infoTable, result.employeeName(), NORMAL_FONT, null);
        
        addTableCell(infoTable, "Department:", BOLD_FONT, LABEL_BG_COLOR);
        addTableCell(infoTable, result.jobTitle(), NORMAL_FONT, null);
        addTableCell(infoTable, "Period:", BOLD_FONT, LABEL_BG_COLOR);
        addTableCell(infoTable, month + " " + year, NORMAL_FONT, null);
        
        document.add(infoTable);
        document.add(new Paragraph(" ")); // Spacer
        
        // Notes section
        if (notes != null && !notes.trim().isEmpty()) {
            Paragraph notesPara = new Paragraph("Notes: " + notes, NORMAL_FONT);
            //notesPara.setBackgroundColor(NOTES_BG_COLOR);
            notesPara.setAlignment(Element.ALIGN_CENTER);
            document.add(notesPara);
            document.add(new Paragraph(" ")); // Spacer
        }
        
        // Earnings and Deductions table
        PdfPTable mainTable = new PdfPTable(4);
        mainTable.setWidthPercentage(100);
        mainTable.setWidths(new float[]{3, 2, 3, 2});
        
        // Table headers
        PdfPCell earningsHeader = new PdfPCell(new Phrase("EARNINGS", HEADER_FONT));
        earningsHeader.setColspan(2);
        earningsHeader.setHorizontalAlignment(Element.ALIGN_CENTER);
        earningsHeader.setBackgroundColor(EARNINGS_BG_COLOR);
        mainTable.addCell(earningsHeader);
        
        PdfPCell deductionsHeader = new PdfPCell(new Phrase("DEDUCTIONS", HEADER_FONT));
        deductionsHeader.setColspan(2);
        deductionsHeader.setHorizontalAlignment(Element.ALIGN_CENTER);
        deductionsHeader.setBackgroundColor(DEDUCTIONS_BG_COLOR);
        mainTable.addCell(deductionsHeader);
        
        // Earnings rows
        addTableRow(mainTable, "Basic Salary", formatCurrency(result.basicSalary()), 
                    "Hour Deduction", formatCurrency(BigDecimal.ZERO));
        
        addTableRow(mainTable, "Overtime Hours", result.overtimeHours() + " hrs", 
                    "Day Deduction", "0 days");
        
        addTableRow(mainTable, "Additional Days", "0 days", 
                    "Absence Deduction", result.dailyWage().multiply(result.absenceDays()) + " EGP");
        
        addTableRow(mainTable, "Bonuses", formatCurrency(BigDecimal.ZERO), 
                    "Admin Deduction", formatCurrency(BigDecimal.ZERO));
        
        addTableRow(mainTable, "Transportation", formatCurrency(BigDecimal.ZERO), 
                    "Advances", formatCurrency(result.advanceDeductions()));
        
        addTableRow(mainTable, "Punctuality Bonus", formatCurrency(BigDecimal.ZERO), 
                    "Total Deductions", formatCurrency(result.totalDeductions()));
        
        addTableRow(mainTable, "Total Additions", formatCurrency(result.totalAdditions()), 
                    "", "");
        
        document.add(mainTable);
        document.add(new Paragraph(" ")); // Spacer
        
        // Net salary
        int netValue = result.netSalary().setScale(0, RoundingMode.DOWN).intValue();
        Paragraph netPara = new Paragraph("Net Salary Payable: " + netValue + " EGP", NET_SALARY_FONT);
        netPara.setAlignment(Element.ALIGN_CENTER);
        //netPara.setBackgroundColor(NET_SALARY_BG_COLOR);
        document.add(netPara);
        
        document.add(new Paragraph(" ")); // Spacer
        
        // Signatures table
        PdfPTable signatureTable = new PdfPTable(4);
        signatureTable.setWidthPercentage(100);
        
        addTableCell(signatureTable, "Employee Signature", BOLD_FONT, LABEL_BG_COLOR);
        addTableCell(signatureTable, "Prepared By", BOLD_FONT, LABEL_BG_COLOR);
        addTableCell(signatureTable, "Treasury", BOLD_FONT, LABEL_BG_COLOR);
        addTableCell(signatureTable, "Finance Department", BOLD_FONT, LABEL_BG_COLOR);
        
        // Empty rows for signatures
        addTableCell(signatureTable, "", NORMAL_FONT, null);
        addTableCell(signatureTable, "", NORMAL_FONT, null);
        addTableCell(signatureTable, "", NORMAL_FONT, null);
        addTableCell(signatureTable, "", NORMAL_FONT, null);
        
        document.add(signatureTable);
    }

    /**
     * Creates page 2: Signature page.
     */
    private void addSignaturePage(
            Document document,
            PayrollExportData result,
            String department,
            String month,
            String year) throws DocumentException {
        
        // Add some space at the top
        for (int i = 0; i < 20; i++) {
            document.add(new Paragraph(" "));
        }
        
        // Employee info at bottom
        Paragraph empName = new Paragraph("Employee Name: " + result.employeeName(), NORMAL_FONT);
        document.add(empName);
        
        Paragraph empCode = new Paragraph("Employee Code: " + result.employeeCode(), NORMAL_FONT);
        document.add(empCode);
        
        Paragraph empDept = new Paragraph("Department: " + department, NORMAL_FONT);
        document.add(empDept);
        
        Paragraph date = new Paragraph("Date: " + month + " " + year, NORMAL_FONT);
        document.add(date);
        
        // Add space
        for (int i = 0; i < 10; i++) {
            document.add(new Paragraph(" "));
        }
        
        // "BY: RABIE" text
        Paragraph byRabie = new Paragraph("BY: RABIE", TITLE_FONT);
        byRabie.setAlignment(Element.ALIGN_RIGHT);
        document.add(byRabie);
    }

    /**
     * Helper to add a table cell with optional background color.
     */
    private void addTableCell(PdfPTable table, String text, Font font, java.awt.Color bgColor) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setHorizontalAlignment(Element.ALIGN_CENTER);
        cell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        cell.setPadding(5);
        if (bgColor != null) {
            cell.setBackgroundColor(bgColor);
        }
        table.addCell(cell);
    }

    /**
     * Helper to add a row with 4 cells (2 earnings, 2 deductions).
     */
    private void addTableRow(PdfPTable table, String earningsLabel, String earningsValue,
                            String deductionsLabel, String deductionsValue) {
        // Earnings cells
        PdfPCell earningsLabelCell = new PdfPCell(new Phrase(earningsLabel, BOLD_FONT));
        earningsLabelCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        earningsLabelCell.setPadding(5);
        table.addCell(earningsLabelCell);
        
        PdfPCell earningsValueCell = new PdfPCell(new Phrase(earningsValue, NORMAL_FONT));
        earningsValueCell.setHorizontalAlignment(Element.ALIGN_CENTER);
        earningsValueCell.setPadding(5);
        table.addCell(earningsValueCell);
        
        // Deductions cells
        PdfPCell deductionsLabelCell = new PdfPCell(new Phrase(deductionsLabel, BOLD_FONT));
        deductionsLabelCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        deductionsLabelCell.setPadding(5);
        table.addCell(deductionsLabelCell);
        
        PdfPCell deductionsValueCell = new PdfPCell(new Phrase(deductionsValue, NORMAL_FONT));
        deductionsValueCell.setHorizontalAlignment(Element.ALIGN_CENTER);
        deductionsValueCell.setPadding(5);
        table.addCell(deductionsValueCell);
    }

    /**
     * Formats a BigDecimal as currency string.
     */
    private String formatCurrency(BigDecimal amount) {
        if (amount == null) {
            return "0";
        }
        return amount.setScale(2, RoundingMode.HALF_UP).toString();
    }


}