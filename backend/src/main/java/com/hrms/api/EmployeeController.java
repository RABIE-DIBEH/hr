package com.hrms.api;

import com.hrms.api.dto.EmployeeProfileResponse;
import com.hrms.api.dto.EmployeeSummaryResponse;
import com.hrms.api.dto.ApiResponse;
import com.hrms.security.EmployeeUserDetails;
import com.hrms.services.EmployeeDirectoryService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

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

    @GetMapping("/team")
    public ResponseEntity<ApiResponse<List<EmployeeSummaryResponse>>> myTeam(@AuthenticationPrincipal EmployeeUserDetails principal) {
        if (!hasAnyRole(principal, "ROLE_MANAGER", "ROLE_SUPER_ADMIN")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only managers can view their team list");
        }
        return ResponseEntity.ok(ApiResponse.success(
                employeeDirectoryService.listDirectReports(principal.getEmployeeId()),
                "Team members retrieved successfully"
        ));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<EmployeeSummaryResponse>>> listEmployees(@AuthenticationPrincipal EmployeeUserDetails principal) {
        if (!hasAnyRole(principal, "ROLE_HR", "ROLE_ADMIN", "ROLE_SUPER_ADMIN")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Insufficient permissions");
        }
        return ResponseEntity.ok(ApiResponse.success(
                employeeDirectoryService.listAllSummaries(),
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
