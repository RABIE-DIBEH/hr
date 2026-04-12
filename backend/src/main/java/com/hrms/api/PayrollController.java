package com.hrms.api;

import com.hrms.api.dto.ApiResponse;
import com.hrms.api.dto.PaginatedResponse;
import com.hrms.api.dto.PayrollBulkResult;
import com.hrms.api.dto.PayrollMonthlySummaryResponse;
import com.hrms.api.dto.PayrollResponse;
import com.hrms.core.models.Employee;
import com.hrms.core.models.Payroll;
import com.hrms.core.repositories.EmployeeRepository;
import com.hrms.security.EmployeeUserDetails;
import com.hrms.services.PayrollService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;

@RestController
@RequestMapping("/api/payroll")
public class PayrollController {

    private final PayrollService payrollService;
    private final EmployeeRepository employeeRepository;

    public PayrollController(PayrollService payrollService, EmployeeRepository employeeRepository) {
        this.payrollService = payrollService;
        this.employeeRepository = employeeRepository;
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

    private static boolean hasAnyRole(EmployeeUserDetails principal, String... roles) {
        for (String role : roles) {
            if (principal.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals(role))) {
                return true;
            }
        }
        return false;
    }
}
