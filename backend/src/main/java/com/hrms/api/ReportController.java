package com.hrms.api;

import com.hrms.services.ReportService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @GetMapping("/attendance/pdf")
    @PreAuthorize("hasAnyRole('HR', 'ADMIN', 'SUPER_ADMIN', 'MANAGER')")
    public ResponseEntity<byte[]> downloadAttendancePdf(
            @RequestParam int month,
            @RequestParam int year) {
        byte[] pdf = reportService.generateAttendancePdfReport(month, year);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=attendance_report_" + month + "_" + year + ".pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }

    @GetMapping("/attendance/excel")
    @PreAuthorize("hasAnyRole('HR', 'ADMIN', 'SUPER_ADMIN', 'MANAGER')")
    public ResponseEntity<byte[]> downloadAttendanceExcel(
            @RequestParam int month,
            @RequestParam int year) {
        byte[] excel = reportService.generateAttendanceExcelReport(month, year);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=attendance_report_" + month + "_" + year + ".xlsx")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(excel);
    }

    @GetMapping("/payroll/pdf")
    @PreAuthorize("hasAnyRole('HR', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<byte[]> downloadPayrollPdf(
            @RequestParam int month,
            @RequestParam int year) {
        byte[] pdf = reportService.generatePayrollPdfReport(month, year);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=payroll_report_" + month + "_" + year + ".pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }

    @GetMapping("/payroll/excel")
    @PreAuthorize("hasAnyRole('HR', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<byte[]> downloadPayrollExcel(
            @RequestParam int month,
            @RequestParam int year) {
        byte[] excel = reportService.generatePayrollExcelReport(month, year);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=payroll_report_" + month + "_" + year + ".xlsx")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(excel);
    }
}
