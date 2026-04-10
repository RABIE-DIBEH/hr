package com.hrms.api;

import com.hrms.api.dto.ApiResponse;
import com.hrms.api.dto.PaginatedResponse;
import com.hrms.core.models.SystemLog;
import com.hrms.core.repositories.SystemLogRepository;
import com.hrms.security.EmployeeUserDetails;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/system/logs")
public class SystemLogController {

    private final SystemLogRepository systemLogRepository;

    public SystemLogController(SystemLogRepository systemLogRepository) {
        this.systemLogRepository = systemLogRepository;
    }

    /**
     * GET /api/system/logs
     * Retrieve system audit logs (Admin/SuperAdmin only).
     */
    @GetMapping
    public ResponseEntity<ApiResponse<PaginatedResponse<SystemLog>>> getSystemLogs(
            @AuthenticationPrincipal EmployeeUserDetails principal,
            @PageableDefault(size = 50) Pageable pageable) {

        if (!hasAnyRole(principal, "ROLE_ADMIN", "ROLE_SUPER_ADMIN")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }

        Page<SystemLog> page = systemLogRepository.findAllByOrderByTimestampDesc(pageable);
        return ResponseEntity.ok(ApiResponse.success(
                PaginatedResponse.of(page.getContent(), page.getTotalElements(), page.getNumber(), page.getSize()),
                "System logs retrieved successfully"
        ));
    }

    /**
     * GET /api/system/logs/recent
     * Get the 50 most recent system logs (Admin/SuperAdmin only).
     */
    @GetMapping("/recent")
    public ResponseEntity<ApiResponse<List<SystemLog>>> getRecentLogs(
            @AuthenticationPrincipal EmployeeUserDetails principal) {

        if (!hasAnyRole(principal, "ROLE_ADMIN", "ROLE_SUPER_ADMIN")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }

        List<SystemLog> logs = systemLogRepository.findTop50ByOrderByTimestampDesc();
        return ResponseEntity.ok(ApiResponse.success(logs, "Recent system logs retrieved successfully"));
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
