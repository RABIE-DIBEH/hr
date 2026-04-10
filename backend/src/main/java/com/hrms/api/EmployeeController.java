package com.hrms.api;

import com.hrms.api.dto.ArchiveEmployeeRequest;
import com.hrms.api.dto.EmployeeAdminUpdate;
import com.hrms.api.dto.EmployeeDeletionResponse;
import com.hrms.api.dto.EmployeeProfileResponse;
import com.hrms.api.dto.EmployeeProfileUpdate;
import com.hrms.api.dto.EmployeeSummaryResponse;
import com.hrms.api.dto.ApiResponse;
import com.hrms.api.dto.PaginatedResponse;
import com.hrms.api.dto.PasswordResetResponse;
import com.hrms.api.exception.BusinessException;
import com.hrms.api.exception.ErrorCode;
import com.hrms.core.models.Employee;
import com.hrms.core.repositories.EmployeeRepository;
import com.hrms.security.EmployeeUserDetails;
import com.hrms.services.EmployeeDirectoryService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/employees")
public class EmployeeController {

    private final EmployeeDirectoryService employeeDirectoryService;
    private final EmployeeRepository employeeRepository;

    public EmployeeController(EmployeeDirectoryService employeeDirectoryService,
                              EmployeeRepository employeeRepository) {
        this.employeeDirectoryService = employeeDirectoryService;
        this.employeeRepository = employeeRepository;
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<EmployeeProfileResponse>> currentEmployee(@AuthenticationPrincipal EmployeeUserDetails principal) {
        return ResponseEntity.ok(ApiResponse.success(
                employeeDirectoryService.getProfile(principal.getEmployeeId()),
                "Your profile retrieved successfully"
        ));
    }

    @PutMapping("/me")
    public ResponseEntity<ApiResponse<EmployeeProfileResponse>> updateProfile(
            @AuthenticationPrincipal EmployeeUserDetails principal,
            @Valid @RequestBody EmployeeProfileUpdate update) {
        EmployeeProfileResponse updated = employeeDirectoryService.updateProfile(principal.getEmployeeId(), update);
        return ResponseEntity.ok(ApiResponse.success(
                updated,
                "تم تحديث الملف الشخصي بنجاح"
        ));
    }

    /**
     * PUT /api/employees/{employeeId}
     * Update another employee's profile (HR/ADMIN/SUPER_ADMIN only).
     * Allows modification of basic fields plus role, department, salary, and status.
     */
    @PutMapping("/{employeeId}")
    public ResponseEntity<ApiResponse<EmployeeProfileResponse>> updateEmployee(
            @AuthenticationPrincipal EmployeeUserDetails principal,
            @PathVariable Long employeeId,
            @Valid @RequestBody EmployeeAdminUpdate update) {
        if (!hasAnyRole(principal, "ROLE_HR", "ROLE_ADMIN", "ROLE_SUPER_ADMIN")) {
            throw new BusinessException(ErrorCode.FORBIDDEN_OPERATION, "Only HR/Admin can update other employees");
        }


        EmployeeProfileResponse updated = employeeDirectoryService.updateEmployeeByAdmin(employeeId, update, principal.getEmployeeId());
        return ResponseEntity.ok(ApiResponse.success(
                updated,
                "تم تحديث بيانات الموظف بنجاح"
        ));
    }

    @GetMapping("/team")
    public ResponseEntity<ApiResponse<PaginatedResponse<EmployeeSummaryResponse>>> myTeam(
            @AuthenticationPrincipal EmployeeUserDetails principal,
            @PageableDefault(size = 20) Pageable pageable) {
        if (!hasAnyRole(principal, "ROLE_MANAGER", "ROLE_SUPER_ADMIN")) {
            throw new BusinessException(ErrorCode.FORBIDDEN_OPERATION, "Only managers can view their team list");
        }
        Page<EmployeeSummaryResponse> page = employeeDirectoryService.listDirectReports(principal.getEmployeeId(), pageable, principal);
        return ResponseEntity.ok(ApiResponse.success(
                PaginatedResponse.of(page.getContent(), page.getTotalElements(), page.getNumber(), page.getSize()),
                "Team members retrieved successfully"
        ));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PaginatedResponse<EmployeeSummaryResponse>>> listEmployees(
            @AuthenticationPrincipal EmployeeUserDetails principal,
            @PageableDefault(size = 20) Pageable pageable) {
        // Payroll needs employee list for monthly calculations and advance processing.
        if (!hasAnyRole(principal, "ROLE_HR", "ROLE_ADMIN", "ROLE_SUPER_ADMIN", "ROLE_PAYROLL")) {
            throw new BusinessException(ErrorCode.FORBIDDEN_OPERATION, "Insufficient permissions");
        }
        Page<EmployeeSummaryResponse> page = employeeDirectoryService.listAllSummaries(pageable, principal);
        return ResponseEntity.ok(ApiResponse.success(
                PaginatedResponse.of(page.getContent(), page.getTotalElements(), page.getNumber(), page.getSize()),
                "All employees retrieved successfully"
        ));
    }

    /**
     * GET /api/employees/search?q=...
     * Search employees by name or email (any authenticated user)
     */
    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<EmployeeSearchResult>>> searchEmployees(
            @RequestParam String q,
            @AuthenticationPrincipal EmployeeUserDetails principal) {

        if (q == null || q.trim().length() < 2) {
            return ResponseEntity.ok(ApiResponse.success(List.of(), "Query too short"));
        }

        List<Employee> results = employeeRepository.searchByQuery(q.trim());
        List<EmployeeSearchResult> response = results.stream()
                .map(e -> new EmployeeSearchResult(
                        e.getEmployeeId(),
                        e.getFullName(),
                        e.getEmail(),
                        e.getStatus()
                ))
                .toList();

        return ResponseEntity.ok(ApiResponse.success(response, "Search completed"));
    }

    /**
     * Simple DTO for employee search results
     */
    public record EmployeeSearchResult(
            Long employeeId,
            String fullName,
            String email,
            String status
    ) {}

    /**
     * POST /api/employees/{employeeId}/archive
     * Archive (soft-delete) an employee with a reason (HR/ADMIN/SUPER_ADMIN only).
     */
    @PostMapping("/{employeeId}/archive")
    public ResponseEntity<ApiResponse<EmployeeDeletionResponse>> archiveEmployee(
            @PathVariable Long employeeId,
            @AuthenticationPrincipal EmployeeUserDetails principal,
            @Valid @RequestBody ArchiveEmployeeRequest request) {

        if (!hasAnyRole(principal, "ROLE_HR", "ROLE_ADMIN", "ROLE_SUPER_ADMIN")) {
            throw new BusinessException(ErrorCode.FORBIDDEN_OPERATION, "Only HR/Admin can archive employees");
        }

        if (principal.getEmployeeId().equals(employeeId)) {
            throw new BusinessException(ErrorCode.FORBIDDEN_OPERATION, "Cannot archive your own account");
        }

        EmployeeDeletionResponse result = employeeDirectoryService.archiveEmployee(
                employeeId, principal.getEmployeeId(), request.reason());
        return ResponseEntity.ok(ApiResponse.success(result, "Employee '" + result.fullName() + "' has been archived successfully"));
    }

    /**
     * POST /api/employees/{employeeId}/reset-password
     * Reset an employee's password to a new secure random password.
     * Allowed by: dev@hrms.com, HR, ADMIN, SUPER_ADMIN, MANAGER
     */
    @PostMapping("/{employeeId}/reset-password")
    public ResponseEntity<ApiResponse<PasswordResetResponse>> resetPassword(
            @PathVariable Long employeeId,
            @AuthenticationPrincipal EmployeeUserDetails principal) {

        boolean isDev = "dev@hrms.com".equals(principal.getUsername());
        boolean isAuthorized = hasAnyRole(principal, "ROLE_HR", "ROLE_ADMIN", "ROLE_SUPER_ADMIN", "ROLE_MANAGER");

        if (!isDev && !isAuthorized) {
            throw new BusinessException(ErrorCode.FORBIDDEN_OPERATION, "Only dev@hrms.com or HR/Admin/Manager can reset passwords");
        }

        PasswordResetResponse result = employeeDirectoryService.resetEmployeePassword(employeeId, principal.getEmployeeId());
        return ResponseEntity.ok(ApiResponse.success(result, "Password reset for '" + result.fullName() + "' — share the new password with the employee"));
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
