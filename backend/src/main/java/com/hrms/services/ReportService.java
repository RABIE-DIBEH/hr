package com.hrms.services;

import com.hrms.core.models.AttendanceRecord;
import com.hrms.core.models.Payroll;
import com.hrms.core.repositories.AttendanceRecordRepository;
import com.hrms.core.repositories.PayrollRepository;
import com.lowagie.text.*;
import com.lowagie.text.Font;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class ReportService {

    private final AttendanceRecordRepository attendanceRepository;
    private final PayrollRepository payrollRepository;
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    public ReportService(AttendanceRecordRepository attendanceRepository, PayrollRepository payrollRepository) {
        this.attendanceRepository = attendanceRepository;
        this.payrollRepository = payrollRepository;
    }

    public byte[] generateAttendancePdfReport(int month, int year) {
        List<AttendanceRecord> records = attendanceRepository.findAllMonthlyRecords(month, year);
        
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4.rotate());
            PdfWriter.getInstance(document, out);
            document.open();

            Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18);
            Paragraph header = new Paragraph("Attendance Report - " + month + "/" + year, headerFont);
            header.setAlignment(Element.ALIGN_CENTER);
            header.setSpacingAfter(20);
            document.add(header);

            PdfPTable table = new PdfPTable(7);
            table.setWidthPercentage(100);
            table.setSpacingBefore(10f);
            table.setSpacingAfter(10f);

            String[] columns = {"Employee ID", "Name", "Check-In", "Check-Out", "Work Hours", "Status", "Verified"};
            for (String column : columns) {
                PdfPCell cell = new PdfPCell(new Phrase(column, FontFactory.getFont(FontFactory.HELVETICA_BOLD)));
                cell.setHorizontalAlignment(Element.ALIGN_CENTER);
                cell.setBackgroundColor(java.awt.Color.LIGHT_GRAY);
                table.addCell(cell);
            }

            for (AttendanceRecord record : records) {
                table.addCell(record.getEmployee().getEmployeeId().toString());
                table.addCell(record.getEmployee().getFullName());
                table.addCell(record.getCheckIn() != null ? record.getCheckIn().format(DATE_FORMATTER) : "N/A");
                table.addCell(record.getCheckOut() != null ? record.getCheckOut().format(DATE_FORMATTER) : "N/A");
                table.addCell(record.getWorkHours() != null ? record.getWorkHours().setScale(2, java.math.RoundingMode.HALF_UP).toString() : "0.00");
                table.addCell(record.getStatus());
                table.addCell(record.getIsVerifiedByManager() ? "Yes" : "No");
            }

            document.add(table);
            document.close();
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Error generating PDF report", e);
        }
    }

    public byte[] generateAttendanceExcelReport(int month, int year) {
        List<AttendanceRecord> records = attendanceRepository.findAllMonthlyRecords(month, year);

        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Attendance_" + month + "_" + year);

            org.apache.poi.ss.usermodel.Row headerRow = sheet.createRow(0);
            String[] columns = {"Employee ID", "Name", "Check-In", "Check-Out", "Work Hours", "Status", "Verified", "Manager Notes"};
            CellStyle headerCellStyle = workbook.createCellStyle();
            org.apache.poi.ss.usermodel.Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerCellStyle.setFont(headerFont);

            for (int i = 0; i < columns.length; i++) {
                org.apache.poi.ss.usermodel.Cell cell = headerRow.createCell(i);
                cell.setCellValue(columns[i]);
                cell.setCellStyle(headerCellStyle);
            }

            int rowIdx = 1;
            for (AttendanceRecord record : records) {
                org.apache.poi.ss.usermodel.Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(record.getEmployee().getEmployeeId());
                row.createCell(1).setCellValue(record.getEmployee().getFullName());
                row.createCell(2).setCellValue(record.getCheckIn() != null ? record.getCheckIn().format(DATE_FORMATTER) : "N/A");
                row.createCell(3).setCellValue(record.getCheckOut() != null ? record.getCheckOut().format(DATE_FORMATTER) : "N/A");
                row.createCell(4).setCellValue(record.getWorkHours() != null ? record.getWorkHours().doubleValue() : 0.0);
                row.createCell(5).setCellValue(record.getStatus());
                row.createCell(6).setCellValue(record.getIsVerifiedByManager() ? "Yes" : "No");
                row.createCell(7).setCellValue(record.getManagerNotes() != null ? record.getManagerNotes() : "");
            }

            for (int i = 0; i < columns.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(out);
            return out.toByteArray();
        } catch (IOException e) {
            throw new RuntimeException("Error generating Excel report", e);
        }
    }

    public byte[] generatePayrollPdfReport(int month, int year) {
        List<Payroll> payrolls = payrollRepository.findAllMonthlyPayroll(month, year);

        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4.rotate());
            PdfWriter.getInstance(document, out);
            document.open();

            Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18);
            Paragraph header = new Paragraph("Payroll Summary Report - " + month + "/" + year, headerFont);
            header.setAlignment(Element.ALIGN_CENTER);
            header.setSpacingAfter(20);
            document.add(header);

            PdfPTable table = new PdfPTable(7);
            table.setWidthPercentage(100);

            String[] columns = {"Employee ID", "Name", "Work Hours", "Overtime", "Deductions", "Advance Ded.", "Net Salary"};
            for (String column : columns) {
                PdfPCell cell = new PdfPCell(new Phrase(column, FontFactory.getFont(FontFactory.HELVETICA_BOLD)));
                cell.setHorizontalAlignment(Element.ALIGN_CENTER);
                cell.setBackgroundColor(java.awt.Color.LIGHT_GRAY);
                table.addCell(cell);
            }

            for (Payroll p : payrolls) {
                table.addCell(p.getEmployee().getEmployeeId().toString());
                table.addCell(p.getEmployee().getFullName());
                table.addCell(p.getTotalWorkHours() != null ? p.getTotalWorkHours().setScale(2, java.math.RoundingMode.HALF_UP).toString() : "0.00");
                table.addCell(p.getOvertimeHours() != null ? p.getOvertimeHours().setScale(2, java.math.RoundingMode.HALF_UP).toString() : "0.00");
                table.addCell(p.getDeductions() != null ? p.getDeductions().toString() : "0.00");
                table.addCell(p.getAdvanceDeductions() != null ? p.getAdvanceDeductions().toString() : "0.00");
                table.addCell(p.getNetSalary() != null ? p.getNetSalary().toString() : "0.00");
            }

            document.add(table);
            document.close();
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Error generating PDF report", e);
        }
    }

    public byte[] generatePayrollExcelReport(int month, int year) {
        List<Payroll> payrolls = payrollRepository.findAllMonthlyPayroll(month, year);

        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Payroll_" + month + "_" + year);

            org.apache.poi.ss.usermodel.Row headerRow = sheet.createRow(0);
            String[] columns = {"Employee ID", "Name", "Base Salary", "Work Hours", "Overtime", "Deductions", "Advance Ded.", "Net Salary"};
            CellStyle headerCellStyle = workbook.createCellStyle();
            org.apache.poi.ss.usermodel.Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerCellStyle.setFont(headerFont);

            for (int i = 0; i < columns.length; i++) {
                org.apache.poi.ss.usermodel.Cell cell = headerRow.createCell(i);
                cell.setCellValue(columns[i]);
                cell.setCellStyle(headerCellStyle);
            }

            int rowIdx = 1;
            for (Payroll p : payrolls) {
                org.apache.poi.ss.usermodel.Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(p.getEmployee().getEmployeeId());
                row.createCell(1).setCellValue(p.getEmployee().getFullName());
                row.createCell(2).setCellValue(p.getEmployee().getBaseSalary() != null ? p.getEmployee().getBaseSalary().doubleValue() : 0.0);
                row.createCell(3).setCellValue(p.getTotalWorkHours() != null ? p.getTotalWorkHours().doubleValue() : 0.0);
                row.createCell(4).setCellValue(p.getOvertimeHours() != null ? p.getOvertimeHours().doubleValue() : 0.0);
                row.createCell(5).setCellValue(p.getDeductions() != null ? p.getDeductions().doubleValue() : 0.0);
                row.createCell(6).setCellValue(p.getAdvanceDeductions() != null ? p.getAdvanceDeductions().doubleValue() : 0.0);
                row.createCell(7).setCellValue(p.getNetSalary() != null ? p.getNetSalary().doubleValue() : 0.0);
            }

            for (int i = 0; i < columns.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(out);
            return out.toByteArray();
        } catch (IOException e) {
            throw new RuntimeException("Error generating Excel report", e);
        }
    }
}
