package com.hrms.api;

import com.hrms.api.dto.EmployeeProfileResponse;
import com.hrms.api.dto.EmployeeProfileUpdate;
import com.hrms.api.dto.EmployeeSummaryResponse;
import com.hrms.api.dto.ApiResponse;
import com.hrms.api.dto.PaginatedResponse;
import com.hrms.security.EmployeeUserDetails;
import com.hrms.services.EmployeeDirectoryService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/employees")
public class EmployeeController {

    private final EmployeeDirectoryService employeeDirectoryService;

    public EmployeeController(EmployeeDirectoryService employeeDirectoryService) {
        this.employeeDirectoryService = employeeDirectoryService;
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

    @GetMapping("/team")
    public ResponseEntity<ApiResponse<PaginatedResponse<EmployeeSummaryResponse>>> myTeam(
            @AuthenticationPrincipal EmployeeUserDetails principal,
            @PageableDefault(size = 20) Pageable pageable) {
        if (!hasAnyRole(principal, "ROLE_MANAGER", "ROLE_SUPER_ADMIN")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only managers can view their team list");
        }
        Page<EmployeeSummaryResponse> page = employeeDirectoryService.listDirectReports(principal.getEmployeeId(), pageable);
        return ResponseEntity.ok(ApiResponse.success(
                PaginatedResponse.of(page.getContent(), page.getTotalElements(), page.getNumber(), page.getSize()),
                "Team members retrieved successfully"
        ));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PaginatedResponse<EmployeeSummaryResponse>>> listEmployees(
            @AuthenticationPrincipal EmployeeUserDetails principal,
            @PageableDefault(size = 20) Pageable pageable) {
        if (!hasAnyRole(principal, "ROLE_HR", "ROLE_ADMIN", "ROLE_SUPER_ADMIN")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Insufficient permissions");
        }
        Page<EmployeeSummaryResponse> page = employeeDirectoryService.listAllSummaries(pageable);
        return ResponseEntity.ok(ApiResponse.success(
                PaginatedResponse.of(page.getContent(), page.getTotalElements(), page.getNumber(), page.getSize()),
                "All employees retrieved successfully"
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
