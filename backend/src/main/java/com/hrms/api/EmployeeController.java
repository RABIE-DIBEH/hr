package com.hrms.api;

import com.hrms.api.dto.EmployeeProfileResponse;
import com.hrms.api.dto.EmployeeSummaryResponse;
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
    public ResponseEntity<EmployeeProfileResponse> currentEmployee(@AuthenticationPrincipal EmployeeUserDetails principal) {
        return ResponseEntity.ok(employeeDirectoryService.getProfile(principal.getEmployeeId()));
    }

    @GetMapping("/team")
    public ResponseEntity<List<EmployeeSummaryResponse>> myTeam(@AuthenticationPrincipal EmployeeUserDetails principal) {
        if (!hasAnyRole(principal, "ROLE_MANAGER")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only managers can view their team list");
        }
        return ResponseEntity.ok(employeeDirectoryService.listDirectReports(principal.getEmployeeId()));
    }

    @GetMapping
    public ResponseEntity<List<EmployeeSummaryResponse>> listEmployees(@AuthenticationPrincipal EmployeeUserDetails principal) {
        if (!hasAnyRole(principal, "ROLE_HR", "ROLE_ADMIN")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Insufficient permissions");
        }
        return ResponseEntity.ok(employeeDirectoryService.listAllSummaries());
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
