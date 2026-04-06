package com.hrms.api;

import com.hrms.api.dto.ApiResponse;
import com.hrms.api.dto.PaginatedResponse;
import com.hrms.api.dto.PayrollBulkResult;
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
    public ResponseEntity<ApiResponse<Payroll>> calculatePayroll(
            @RequestParam(required = false) Long employeeId,
            @RequestParam int month,
            @RequestParam int year,
            @AuthenticationPrincipal EmployeeUserDetails principal) {

        boolean privileged = hasAnyRole(principal, "ROLE_HR", "ROLE_ADMIN", "ROLE_SUPER_ADMIN", "ROLE_PAYROLL");
        Long targetId;
        if (privileged) {
            if (employeeId == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "employeeId is required");
            }
            targetId = employeeId;
        } else {
            if (employeeId != null && !employeeId.equals(principal.getEmployeeId())) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cannot calculate payroll for another employee");
            }
            targetId = principal.getEmployeeId();
        }

        Employee employee = employeeRepository.findById(targetId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Employee not found"));

        return ResponseEntity.ok(ApiResponse.success(
                payrollService.calculateMonthlyPayroll(employee, month, year),
                "Payroll calculated successfully"
        ));
    }

    /**
     * POST /api/payroll/calculate-all
     * Calculate payroll for ALL active employees for the given month/year.
     * HR/ADMIN/SUPER_ADMIN only.
     */
    @PostMapping("/calculate-all")
    public ResponseEntity<ApiResponse<PayrollBulkResult>> calculateAllPayroll(
            @RequestParam int month,
            @RequestParam int year,
            @AuthenticationPrincipal EmployeeUserDetails principal) {

        if (!hasAnyRole(principal, "ROLE_HR", "ROLE_ADMIN", "ROLE_SUPER_ADMIN")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only HR/Admin can calculate payroll for all employees");
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
                payroll.getGeneratedAt() != null ? payroll.getGeneratedAt().toString() : null
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

        if (!hasAnyRole(principal, "ROLE_HR", "ROLE_ADMIN", "ROLE_SUPER_ADMIN")) {
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

    private static boolean hasAnyRole(EmployeeUserDetails principal, String... roles) {
        for (String role : roles) {
            if (principal.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals(role))) {
                return true;
            }
        }
        return false;
    }
}
