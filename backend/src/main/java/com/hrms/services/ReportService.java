package com.hrms.services;

import com.hrms.core.models.AttendanceRecord;
import com.hrms.core.models.LeaveRequest;
import com.hrms.core.models.Payroll;
import com.hrms.core.models.RecruitmentRequest;
import com.hrms.core.repositories.AttendanceRecordRepository;
import com.hrms.core.repositories.LeaveRequestRepository;
import com.hrms.core.repositories.PayrollRepository;
import com.hrms.core.repositories.RecruitmentRequestRepository;
import com.lowagie.text.*;
import com.lowagie.text.Font;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.security.core.Authentication;
import com.hrms.security.EmployeeUserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class ReportService {

    private final AttendanceRecordRepository attendanceRepository;
    private final PayrollRepository payrollRepository;
    private final LeaveRequestRepository leaveRequestRepository;
    private final RecruitmentRequestRepository recruitmentRequestRepository;
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    public ReportService(AttendanceRecordRepository attendanceRepository,
                         PayrollRepository payrollRepository,
                         LeaveRequestRepository leaveRequestRepository,
                         RecruitmentRequestRepository recruitmentRequestRepository) {
        this.attendanceRepository = attendanceRepository;
        this.payrollRepository = payrollRepository;
        this.leaveRequestRepository = leaveRequestRepository;
        this.recruitmentRequestRepository = recruitmentRequestRepository;
    }

    @Transactional(readOnly = true)
    public byte[] generateAttendancePdfReport(int month, int year) {
        List<AttendanceRecord> records = attendanceRepository.findAllMonthlyRecordsForReport(month, year);
        
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
                if (record.getEmployee() == null) continue; // Skip orphaned records
                table.addCell(record.getEmployee().getEmployeeId().toString());
                table.addCell(record.getEmployee().getFullName() != null ? record.getEmployee().getFullName() : "Unknown");
                table.addCell(record.getCheckIn() != null ? record.getCheckIn().format(DATE_FORMATTER) : "N/A");
                table.addCell(record.getCheckOut() != null ? record.getCheckOut().format(DATE_FORMATTER) : "N/A");
                table.addCell(record.getWorkHours() != null ? record.getWorkHours().setScale(2, java.math.RoundingMode.HALF_UP).toString() : "0.00");
                table.addCell(record.getStatus() != null ? record.getStatus() : "Unknown");
                table.addCell(record.getIsVerifiedByManager() != null && record.getIsVerifiedByManager() ? "Yes" : "No");
            }

            document.add(table);
            document.close();
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Error generating PDF report", e);
        }
    }

    @Transactional(readOnly = true)
    public byte[] generateAttendanceExcelReport(int month, int year) {
        List<AttendanceRecord> records = attendanceRepository.findAllMonthlyRecordsForReport(month, year);

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
                if (record.getEmployee() == null) continue;
                org.apache.poi.ss.usermodel.Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(record.getEmployee().getEmployeeId());
                row.createCell(1).setCellValue(record.getEmployee().getFullName() != null ? record.getEmployee().getFullName() : "Unknown");
                row.createCell(2).setCellValue(record.getCheckIn() != null ? record.getCheckIn().format(DATE_FORMATTER) : "N/A");
                row.createCell(3).setCellValue(record.getCheckOut() != null ? record.getCheckOut().format(DATE_FORMATTER) : "N/A");
                row.createCell(4).setCellValue(record.getWorkHours() != null ? record.getWorkHours().doubleValue() : 0.0);
                row.createCell(5).setCellValue(record.getStatus() != null ? record.getStatus() : "Unknown");
                row.createCell(6).setCellValue(record.getIsVerifiedByManager() != null && record.getIsVerifiedByManager() ? "Yes" : "No");
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

    @Transactional(readOnly = true)
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
                if (p.getEmployee() == null) continue;
                table.addCell(p.getEmployee().getEmployeeId().toString());
                table.addCell(p.getEmployee().getFullName() != null ? p.getEmployee().getFullName() : "Unknown");
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

    @Transactional(readOnly = true)
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
                if (p.getEmployee() == null) continue;
                org.apache.poi.ss.usermodel.Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(p.getEmployee().getEmployeeId());
                row.createCell(1).setCellValue(p.getEmployee().getFullName() != null ? p.getEmployee().getFullName() : "Unknown");
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

    // ==================== LEAVE REPORTS ====================

    @Transactional(readOnly = true)
    public byte[] generateLeavePdfReport(int month, int year, Authentication authentication) {
        List<LeaveRequest> records = leaveRequestRepository.findAllByMonthAndYear(month, year);
        
        // Filter for regular employees
        boolean isHighRole = authentication.getAuthorities().stream()
                .anyMatch(a -> List.of("ROLE_HR", "ROLE_ADMIN", "ROLE_SUPER_ADMIN", "ROLE_MANAGER", "ROLE_CEO").contains(a.getAuthority()));
        
        if (!isHighRole && authentication.getPrincipal() instanceof EmployeeUserDetails) {
            Long myId = ((EmployeeUserDetails) authentication.getPrincipal()).getEmployeeId();
            records = records.stream()
                    .filter(r -> r.getEmployee() != null && r.getEmployee().getEmployeeId().equals(myId))
                    .collect(Collectors.toList());
        }

        List<Object[]> typeCounts = leaveRequestRepository.countByLeaveTypeAndMonthYear(month, year);

        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4.rotate());
            PdfWriter.getInstance(document, out);
            document.open();

            Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18);
            Paragraph header = new Paragraph("Leave Management Report - " + month + "/" + year, headerFont);
            header.setAlignment(Element.ALIGN_CENTER);
            header.setSpacingAfter(10);
            document.add(header);

            // Summary section
            Font summaryFont = FontFactory.getFont(FontFactory.HELVETICA, 12);
            Map<String, Long> typeMap = typeCounts.stream()
                    .collect(Collectors.toMap(r -> r[0] != null ? r[0].toString() : "Unknown", r -> (Long) r[1]));
            Paragraph summary = new Paragraph("Total Leave Requests: " + records.size(), summaryFont);
            summary.setSpacingAfter(5);
            document.add(summary);
            for (Map.Entry<String, Long> entry : typeMap.entrySet()) {
                document.add(new Paragraph(entry.getKey() + ": " + entry.getValue() + " (Approved)", summaryFont));
            }
            summary.setSpacingAfter(20);

            PdfPTable table = new PdfPTable(7);
            table.setWidthPercentage(100);
            table.setSpacingBefore(10f);
            table.setSpacingAfter(10f);

            String[] columns = {"Employee ID", "Name", "Leave Type", "Start Date", "End Date", "Duration (Days)", "Status"};
            for (String column : columns) {
                PdfPCell cell = new PdfPCell(new Phrase(column, FontFactory.getFont(FontFactory.HELVETICA_BOLD)));
                cell.setHorizontalAlignment(Element.ALIGN_CENTER);
                cell.setBackgroundColor(java.awt.Color.LIGHT_GRAY);
                table.addCell(cell);
            }

            for (LeaveRequest lr : records) {
                if (lr.getEmployee() == null) continue;
                table.addCell(lr.getEmployee().getEmployeeId().toString());
                table.addCell(lr.getEmployee().getFullName() != null ? lr.getEmployee().getFullName() : "Unknown");
                table.addCell(lr.getLeaveType() != null ? lr.getLeaveType() : "N/A");
                table.addCell(lr.getStartDate() != null ? lr.getStartDate().toString() : "N/A");
                table.addCell(lr.getEndDate() != null ? lr.getEndDate().toString() : "N/A");
                table.addCell(lr.getDuration() != null ? lr.getDuration().toString() : "0");
                table.addCell(lr.getStatus() != null ? lr.getStatus() : "Unknown");
            }

            document.add(table);
            document.close();
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Error generating leave PDF report", e);
        }
    }

    @Transactional(readOnly = true)
    public byte[] generateLeaveExcelReport(int month, int year, Authentication authentication) {
        List<LeaveRequest> records = leaveRequestRepository.findAllByMonthAndYear(month, year);

        // Filter for regular employees
        boolean isHighRole = authentication.getAuthorities().stream()
                .anyMatch(a -> List.of("ROLE_HR", "ROLE_ADMIN", "ROLE_SUPER_ADMIN", "ROLE_MANAGER", "ROLE_CEO").contains(a.getAuthority()));

        if (!isHighRole && authentication.getPrincipal() instanceof EmployeeUserDetails) {
            Long myId = ((EmployeeUserDetails) authentication.getPrincipal()).getEmployeeId();
            records = records.stream()
                    .filter(r -> r.getEmployee() != null && r.getEmployee().getEmployeeId().equals(myId))
                    .collect(Collectors.toList());
        }

        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Leave_Report_" + month + "_" + year);

            org.apache.poi.ss.usermodel.Row headerRow = sheet.createRow(0);
            String[] columns = {"Employee ID", "Name", "Leave Type", "Start Date", "End Date", "Duration (Days)", "Status", "Reason", "Manager Note"};
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
            for (LeaveRequest lr : records) {
                if (lr.getEmployee() == null) continue;
                org.apache.poi.ss.usermodel.Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(lr.getEmployee().getEmployeeId());
                row.createCell(1).setCellValue(lr.getEmployee().getFullName() != null ? lr.getEmployee().getFullName() : "Unknown");
                row.createCell(2).setCellValue(lr.getLeaveType() != null ? lr.getLeaveType() : "N/A");
                row.createCell(3).setCellValue(lr.getStartDate() != null ? lr.getStartDate().toString() : "N/A");
                row.createCell(4).setCellValue(lr.getEndDate() != null ? lr.getEndDate().toString() : "N/A");
                row.createCell(5).setCellValue(lr.getDuration() != null ? lr.getDuration() : 0);
                row.createCell(6).setCellValue(lr.getStatus() != null ? lr.getStatus() : "Unknown");
                row.createCell(7).setCellValue(lr.getReason() != null ? lr.getReason() : "");
                row.createCell(8).setCellValue(lr.getManagerNote() != null ? lr.getManagerNote() : "");
            }

            for (int i = 0; i < columns.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(out);
            return out.toByteArray();
        } catch (IOException e) {
            throw new RuntimeException("Error generating leave Excel report", e);
        }
    }

    // ==================== RECRUITMENT REPORTS ====================

    @Transactional(readOnly = true)
    public byte[] generateRecruitmentPdfReport(int month, int year) {
        List<RecruitmentRequest> records = recruitmentRequestRepository.findApprovedByMonthYear(month, year);
        List<Object[]> deptCounts = recruitmentRequestRepository.countApprovedByDepartment(month, year);
        List<Object[]> statusCounts = recruitmentRequestRepository.countByStatusAndMonthYear(month, year);

        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4.rotate());
            PdfWriter.getInstance(document, out);
            document.open();

            Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18);
            Paragraph header = new Paragraph("Recruitment Report - " + month + "/" + year, headerFont);
            header.setAlignment(Element.ALIGN_CENTER);
            header.setSpacingAfter(10);
            document.add(header);

            // Summary section
            Font summaryFont = FontFactory.getFont(FontFactory.HELVETICA, 12);
            Paragraph summary = new Paragraph("Total Approved Hires: " + records.size(), summaryFont);
            summary.setSpacingAfter(5);
            document.add(summary);

            document.add(new Paragraph("By Department:", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12)));
            for (Object[] row : deptCounts) {
                document.add(new Paragraph("  " + row[0] + ": " + row[1], summaryFont));
            }

            document.add(new Paragraph("By Status:", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12)));
            for (Object[] row : statusCounts) {
                document.add(new Paragraph("  " + row[0] + ": " + row[1], summaryFont));
            }
            summary.setSpacingAfter(20);

            PdfPTable table = new PdfPTable(8);
            table.setWidthPercentage(100);
            table.setSpacingBefore(10f);
            table.setSpacingAfter(10f);

            String[] cols = {"Name", "Email", "Department", "Position", "Salary", "National ID", "Mobile", "Requested At"};
            for (String column : cols) {
                PdfPCell cell = new PdfPCell(new Phrase(column, FontFactory.getFont(FontFactory.HELVETICA_BOLD)));
                cell.setHorizontalAlignment(Element.ALIGN_CENTER);
                cell.setBackgroundColor(java.awt.Color.LIGHT_GRAY);
                table.addCell(cell);
            }

            for (RecruitmentRequest rr : records) {
                table.addCell(rr.getFullName());
                table.addCell(rr.getEmail());
                table.addCell(rr.getDepartment());
                table.addCell(rr.getJobDescription());
                table.addCell(rr.getExpectedSalary().toString());
                table.addCell(rr.getNationalId());
                table.addCell(rr.getMobileNumber());
                table.addCell(rr.getRequestedAt() != null ? rr.getRequestedAt().format(DATE_FORMATTER) : "N/A");
            }

            document.add(table);
            document.close();
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Error generating recruitment PDF report", e);
        }
    }

    @Transactional(readOnly = true)
    public byte[] generateRecruitmentExcelReport(int month, int year) {
        List<RecruitmentRequest> records = recruitmentRequestRepository.findApprovedByMonthYear(month, year);

        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Recruitment_" + month + "_" + year);

            org.apache.poi.ss.usermodel.Row headerRow = sheet.createRow(0);
            String[] columns = {"Name", "Email", "National ID", "Department", "Position", "Age", "Mobile",
                    "Expected Salary", "Status", "Manager Note", "Requested At", "Processed At"};
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
            for (RecruitmentRequest rr : records) {
                org.apache.poi.ss.usermodel.Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(rr.getFullName());
                row.createCell(1).setCellValue(rr.getEmail());
                row.createCell(2).setCellValue(rr.getNationalId());
                row.createCell(3).setCellValue(rr.getDepartment());
                row.createCell(4).setCellValue(rr.getJobDescription());
                row.createCell(5).setCellValue(rr.getAge() != null ? rr.getAge() : 0);
                row.createCell(6).setCellValue(rr.getMobileNumber());
                row.createCell(7).setCellValue(rr.getExpectedSalary() != null ? rr.getExpectedSalary().doubleValue() : 0.0);
                row.createCell(8).setCellValue(rr.getStatus());
                row.createCell(9).setCellValue(rr.getManagerNote() != null ? rr.getManagerNote() : "");
                row.createCell(10).setCellValue(rr.getRequestedAt() != null ? rr.getRequestedAt().toString() : "");
                row.createCell(11).setCellValue(rr.getProcessedAt() != null ? rr.getProcessedAt().toString() : "");
            }

            for (int i = 0; i < columns.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(out);
            return out.toByteArray();
        } catch (IOException e) {
            throw new RuntimeException("Error generating recruitment Excel report", e);
        }
    }
}
