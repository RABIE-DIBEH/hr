package com.hrms.api;

import com.hrms.api.dto.ApiResponse;
import com.hrms.api.dto.PaginatedResponse;
import com.hrms.api.dto.PayrollBulkResult;
import com.hrms.api.dto.PayrollMonthlySummaryResponse;
import com.hrms.api.dto.PayrollResponse;
import com.hrms.core.models.Department;
import com.hrms.core.models.Employee;
import com.hrms.core.models.Payroll;
import com.hrms.core.models.UsersRole;
import com.hrms.core.repositories.DepartmentRepository;
import com.hrms.core.repositories.EmployeeRepository;
import com.hrms.core.repositories.RoleRepository;
import com.hrms.security.EmployeeUserDetails;
import com.hrms.services.PayrollExcelExportService;
import com.hrms.services.PayrollPdfService;
import com.hrms.services.PayrollService;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.format.TextStyle;
import java.util.Locale;

@RestController
@RequestMapping("/api/payroll")
public class PayrollController {

    private final PayrollService payrollService;
    private final EmployeeRepository employeeRepository;
    private final DepartmentRepository departmentRepository;
    private final RoleRepository roleRepository;
    private final PayrollExcelExportService payrollExcelExportService;
    private final PayrollPdfService payrollPdfService;

    public PayrollController(PayrollService payrollService, 
                            EmployeeRepository employeeRepository,
                            DepartmentRepository departmentRepository,
                            RoleRepository roleRepository,
                            PayrollExcelExportService payrollExcelExportService,
                            PayrollPdfService payrollPdfService) {
        this.payrollService = payrollService;
        this.employeeRepository = employeeRepository;
        this.departmentRepository = departmentRepository;
        this.roleRepository = roleRepository;
        this.payrollExcelExportService = payrollExcelExportService;
        this.payrollPdfService = payrollPdfService;
    }

    @PostMapping("/calculate")
    public ResponseEntity<ApiResponse<PayrollResponse>> calculatePayroll(
            @RequestParam(required = false) Long employeeId,
            @RequestParam int month,
            @RequestParam int year,
            @AuthenticationPrincipal EmployeeUserDetails principal) {

        // Payroll owns salary calculation (SUPER_ADMIN override).
        boolean privileged = hasAnyRole(principal, "ROLE_SUPER_ADMIN", "ROLE_PAYROLL");
        if (!privileged) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only PAYROLL can calculate payroll");
        }
        Long targetId;
        if (employeeId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "employeeId is required");
        }
        targetId = employeeId;

        Employee employee = employeeRepository.findById(targetId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Employee not found"));

        Payroll payroll = payrollService.calculateMonthlyPayroll(employee, month, year);
        return ResponseEntity.ok(ApiResponse.success(
                toPayrollResponse(payroll),
                "Payroll calculated successfully"
        ));
    }

    /**
     * POST /api/payroll/calculate-all
     * Calculate payroll for ALL active employees for the given month/year.
     * PAYROLL/SUPER_ADMIN only.
     */
    @PostMapping("/calculate-all")
    public ResponseEntity<ApiResponse<PayrollBulkResult>> calculateAllPayroll(
            @RequestParam int month,
            @RequestParam int year,
            @AuthenticationPrincipal EmployeeUserDetails principal) {

        if (!hasAnyRole(principal, "ROLE_PAYROLL", "ROLE_SUPER_ADMIN")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only PAYROLL can calculate payroll for all employees");
        }

        PayrollBulkResult result = payrollService.calculateAllMonthlyPayroll(month, year, principal.getUsername());
        return ResponseEntity.ok(ApiResponse.success(result, "تم احتساب رواتب " + result.successCount() + " موظف بنجاح"));
    }

    /**
     * GET /api/payroll/my-slips
     * Get payroll history for the current employee
     */
    @GetMapping("/my-slips")
    public ResponseEntity<ApiResponse<PaginatedResponse<PayrollResponse>>> getMyPayrollSlips(
            @AuthenticationPrincipal EmployeeUserDetails principal,
            @PageableDefault(size = 20) Pageable pageable) {

        Page<Payroll> page = payrollService.getEmployeePayrollHistory(principal.getEmployeeId(), pageable);
        var slips = page.getContent().stream()
                .map(this::toPayrollResponse)
                .toList();

        return ResponseEntity.ok(ApiResponse.success(
                PaginatedResponse.of(slips, page.getTotalElements(), page.getNumber(), page.getSize()),
                "Your payroll history retrieved successfully"
        ));
    }

    private PayrollResponse toPayrollResponse(Payroll payroll) {
        return new PayrollResponse(
                payroll.getPayrollId(),
                payroll.getEmployee().getEmployeeId(),
                payroll.getEmployee().getFullName(),
                payroll.getMonth(),
                payroll.getYear(),
                payroll.getTotalWorkHours(),
                payroll.getOvertimeHours(),
                payroll.getDeductions(),
                payroll.getNetSalary(),
                payroll.getGeneratedAt() != null ? payroll.getGeneratedAt().toString() : null,
                payroll.isPaid(),
                payroll.getPaidAt() != null ? payroll.getPaidAt().toString() : null
        );
    }

    /**
     * GET /api/payroll/history
     * Get all payroll records across all employees (HR/Admin only)
     */
    @GetMapping("/history")
    public ResponseEntity<ApiResponse<PaginatedResponse<PayrollResponse>>> getAllPayrollHistory(
            @AuthenticationPrincipal EmployeeUserDetails principal,
            @PageableDefault(size = 20) Pageable pageable) {

        if (!hasAnyRole(principal, "ROLE_HR", "ROLE_ADMIN", "ROLE_SUPER_ADMIN", "ROLE_PAYROLL")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }

        Page<Payroll> page = payrollService.getAllPayrollHistory(pageable);
        var slips = page.getContent().stream()
                .map(this::toPayrollResponse)
                .toList();

        return ResponseEntity.ok(ApiResponse.success(
                PaginatedResponse.of(slips, page.getTotalElements(), page.getNumber(), page.getSize()),
                "All payroll history retrieved successfully"
        ));
    }

    /**
     * GET /api/payroll/monthly?month=&year=
     * Payroll monthly slips for delivery workflows.
     */
    @GetMapping("/monthly")
    public ResponseEntity<ApiResponse<PaginatedResponse<PayrollResponse>>> getMonthlyPayroll(
            @RequestParam int month,
            @RequestParam int year,
            @AuthenticationPrincipal EmployeeUserDetails principal,
            @PageableDefault(size = 50) Pageable pageable) {

        if (!hasAnyRole(principal, "ROLE_PAYROLL", "ROLE_SUPER_ADMIN")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }

        Page<Payroll> page = payrollService.getMonthlyPayroll(month, year, pageable);
        var slips = page.getContent().stream().map(this::toPayrollResponse).toList();

        return ResponseEntity.ok(ApiResponse.success(
                PaginatedResponse.of(slips, page.getTotalElements(), page.getNumber(), page.getSize()),
                "Monthly payroll retrieved successfully"
        ));
    }

    /**
     * GET /api/payroll/summary?month=&year=
     */
    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<PayrollMonthlySummaryResponse>> getMonthlySummary(
            @RequestParam int month,
            @RequestParam int year,
            @AuthenticationPrincipal EmployeeUserDetails principal) {

        if (!hasAnyRole(principal, "ROLE_PAYROLL", "ROLE_SUPER_ADMIN")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }

        BigDecimal total = payrollService.getTotalNetSalaryForMonth(month, year);
        long totalSlips = payrollService.getPayrollCountForMonth(month, year);
        long paidSlips = payrollService.getPaidPayrollCountForMonth(month, year);
        PayrollMonthlySummaryResponse res = new PayrollMonthlySummaryResponse(
                month,
                year,
                totalSlips,
                paidSlips,
                total,
                payrollService.isPayrollLocked()
        );
        return ResponseEntity.ok(ApiResponse.success(res, "Payroll summary retrieved successfully"));
    }

    /**
     * PUT /api/payroll/pay?employeeId=&month=&year=
     */
    @PutMapping("/pay")
    public ResponseEntity<ApiResponse<PayrollResponse>> markPaid(
            @RequestParam Long employeeId,
            @RequestParam int month,
            @RequestParam int year,
            @AuthenticationPrincipal EmployeeUserDetails principal) {

        if (!hasAnyRole(principal, "ROLE_PAYROLL", "ROLE_SUPER_ADMIN")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }

        Payroll payroll = payrollService.markPayrollAsPaid(employeeId, month, year);
        return ResponseEntity.ok(ApiResponse.success(toPayrollResponse(payroll), "Payroll marked as paid"));
    }

    /**
     * PUT /api/payroll/pay-all?month=&year=
     */
    @PutMapping("/pay-all")
    public ResponseEntity<ApiResponse<PayrollBulkResult>> markPaidAll(
            @RequestParam int month,
            @RequestParam int year,
            @AuthenticationPrincipal EmployeeUserDetails principal) {

        if (!hasAnyRole(principal, "ROLE_PAYROLL", "ROLE_SUPER_ADMIN")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }

        int updated = payrollService.markAllPayrollAsPaid(month, year);
        PayrollBulkResult result = new PayrollBulkResult(month, year, updated, updated, 0, principal.getUsername());
        return ResponseEntity.ok(ApiResponse.success(result, "Payroll marked as paid for " + updated + " employees"));
    }

    /**
     * POST /api/payroll/export
     * Export payroll for the given month/year as Excel or PDF.
     * PAYROLL/SUPER_ADMIN only.
     */
    @PostMapping("/export")
    public ResponseEntity<byte[]> exportPayroll(
            @RequestParam int month,
            @RequestParam int year,
            @RequestParam(required = false) Long departmentId,
            @RequestParam(required = false, defaultValue = "excel") String format,
            @AuthenticationPrincipal EmployeeUserDetails principal) {

        if (!"excel".equalsIgnoreCase(format) && !"pdf".equalsIgnoreCase(format)) {
            throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.BAD_REQUEST, "Invalid format. Use 'excel' or 'pdf'");
        }

        if (!hasAnyRole(principal, "ROLE_PAYROLL", "ROLE_SUPER_ADMIN")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only PAYROLL can export payroll");
        }

        // Get payroll data, filtered by department if specified
        org.springframework.data.domain.Page<com.hrms.core.models.Payroll> page;
        if (departmentId != null) {
            page = payrollService.getMonthlyPayrollByDepartment(departmentId, month, year, org.springframework.data.domain.Pageable.unpaged());
        } else {
            page = payrollService.getMonthlyPayroll(month, year, org.springframework.data.domain.Pageable.unpaged());
        }

        // Get department name for the export (use specified department or default)
        String departmentName = "قسم الحسابات"; // Default
        if (departmentId != null) {
            departmentName = departmentRepository.findById(departmentId)
                    .map(Department::getDepartmentName)
                    .orElse("قسم الحسابات");
        }

        // Convert payroll data to export format with real department and role names
        java.util.List<com.hrms.api.dto.PayrollExportData> exportDataList = page.getContent().stream().map(payroll -> {
            com.hrms.core.models.Employee emp = payroll.getEmployee();
            
            // Get real department name
            String deptName = "General";
            if (emp.getDepartmentId() != null) {
                deptName = departmentRepository.findById(emp.getDepartmentId())
                        .map(Department::getDepartmentName)
                        .orElse("General");
            }
            
            // Get real role/job title
            String jobTitle = "Employee";
            if (emp.getRoleId() != null) {
                jobTitle = roleRepository.findById(emp.getRoleId())
                        .map(UsersRole::getRoleName)
                        .orElse("Employee");
            }
            
            com.hrms.services.PayrollFormulaEngine.PayrollResult engineResult = toExportResult(payroll, emp);
            
            return com.hrms.api.dto.PayrollExportData.of(
                String.valueOf(emp.getEmployeeId()), 
                emp.getFullName(), 
                jobTitle, 
                deptName, 
                engineResult
            );
        }).toList();

        // Convert month number to Arabic month name
        String monthName = getArabicMonthName(month);
        
        if ("excel".equalsIgnoreCase(format)) {
            try {
                org.apache.poi.xssf.usermodel.XSSFWorkbook workbook = payrollExcelExportService.generatePayrollWorkbook(
                    exportDataList, 
                    "الإدارة العامة", 
                    departmentName, 
                    "", 
                    monthName, 
                    String.valueOf(year)
                );
                java.io.ByteArrayOutputStream baos = new java.io.ByteArrayOutputStream();
                workbook.write(baos);
                workbook.close();
                org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
                headers.setContentType(org.springframework.http.MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
                headers.setContentDisposition(org.springframework.http.ContentDisposition.attachment().filename("payroll_" + month + "_" + year + ".xlsx").build());
                return new org.springframework.http.ResponseEntity<>(baos.toByteArray(), headers, org.springframework.http.HttpStatus.OK);
            } catch (Exception e) {
                throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR, "Failed to generate Excel: " + e.getMessage());
            }
        } else if ("pdf".equalsIgnoreCase(format)) {
            try {
                byte[] pdfBytes = payrollPdfService.generatePayrollPdf(
                    exportDataList, 
                    "الإدارة العامة", 
                    "", 
                    monthName, 
                    String.valueOf(year)
                );
                org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
                headers.setContentType(org.springframework.http.MediaType.APPLICATION_PDF);
                headers.setContentDisposition(org.springframework.http.ContentDisposition.attachment().filename("payroll_" + month + "_" + year + ".pdf").build());
                return new org.springframework.http.ResponseEntity<>(pdfBytes, headers, org.springframework.http.HttpStatus.OK);
            } catch (Exception e) {
                throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR, "Failed to generate PDF: " + e.getMessage());
            }
        }
        throw new IllegalStateException("Unreachable export format branch");
    }

    private static boolean hasAnyRole(EmployeeUserDetails principal, String... roles) {
        for (String role : roles) {
            if (principal.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals(role))) {
                return true;
            }
        }
        return false;
    }

    private String getArabicMonthName(int month) {
        switch (month) {
            case 1: return "يناير";
            case 2: return "فبراير";
            case 3: return "مارس";
            case 4: return "أبريل";
            case 5: return "مايو";
            case 6: return "يونيو";
            case 7: return "يوليو";
            case 8: return "أغسطس";
            case 9: return "سبتمبر";
            case 10: return "أكتوبر";
            case 11: return "نوفمبر";
            case 12: return "ديسمبر";
            default: return String.valueOf(month);
        }
    }

    private com.hrms.services.PayrollFormulaEngine.PayrollResult toExportResult(Payroll payroll, Employee employee) {
        BigDecimal baseSalary = defaultDecimal(employee.getBaseSalary());
        BigDecimal workedHours = defaultDecimal(payroll.getTotalWorkHours());
        BigDecimal overtimeHours = defaultDecimal(payroll.getOvertimeHours());
        BigDecimal totalDeductions = defaultDecimal(payroll.getDeductions());
        BigDecimal advanceDeductions = defaultDecimal(payroll.getAdvanceDeductions());
        BigDecimal netSalary = defaultDecimal(payroll.getNetSalary());

        BigDecimal dailyWage = baseSalary.compareTo(BigDecimal.ZERO) > 0
                ? baseSalary.divide(new BigDecimal("26"), 10, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;
        BigDecimal hourlyWage = dailyWage.compareTo(BigDecimal.ZERO) > 0
                ? dailyWage.divide(new BigDecimal("8"), 10, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        BigDecimal absenceDeduction = totalDeductions.subtract(advanceDeductions).max(BigDecimal.ZERO);
        BigDecimal absenceDays = dailyWage.compareTo(BigDecimal.ZERO) > 0
                ? absenceDeduction.divide(dailyWage, 10, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;
        BigDecimal totalAdditions = netSalary.subtract(baseSalary).add(totalDeductions).max(BigDecimal.ZERO);

        return new com.hrms.services.PayrollFormulaEngine.PayrollResult(
                baseSalary,
                workedHours,
                overtimeHours,
                absenceDays,
                dailyWage,
                hourlyWage,
                totalDeductions,
                totalAdditions,
                advanceDeductions,
                netSalary
        );
    }

    private BigDecimal defaultDecimal(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
    }
}
