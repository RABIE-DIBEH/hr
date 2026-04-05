package com.hrms.api;

import com.hrms.api.dto.LeaveDecisionRequest;
import com.hrms.api.dto.LeaveRequestDto;
import com.hrms.api.dto.ApiResponse;
import com.hrms.api.dto.PaginatedResponse;
import com.hrms.core.models.Employee;
import com.hrms.core.models.LeaveRequest;
import com.hrms.core.repositories.EmployeeRepository;
import com.hrms.security.EmployeeUserDetails;
import com.hrms.services.LeaveService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/leaves")
public class LeaveController {

    private final LeaveService leaveService;
    private final EmployeeRepository employeeRepository;

    public LeaveController(LeaveService leaveService, EmployeeRepository employeeRepository) {
        this.leaveService = leaveService;
        this.employeeRepository = employeeRepository;
    }

    @PostMapping("/request")
    public ResponseEntity<ApiResponse<LeaveRequest>> requestLeave(
            @Valid @RequestBody LeaveRequestDto dto,
            @AuthenticationPrincipal EmployeeUserDetails principal) {

        Employee employee = employeeRepository.findById(principal.getEmployeeId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Employee not found"));

        // Map DTO → entity
        LeaveRequest request = new LeaveRequest();
        request.setLeaveType(dto.leaveType());
        request.setStartDate(dto.startDate());
        request.setEndDate(dto.endDate());
        request.setDuration(dto.duration());
        request.setReason(dto.reason());

        return ResponseEntity.ok(ApiResponse.success(
                leaveService.submitRequest(employee, request),
                "Leave request submitted successfully"
        ));
    }

    @GetMapping("/my-requests")
    public ResponseEntity<ApiResponse<PaginatedResponse<LeaveRequest>>> getMyRequests(
            @RequestParam(required = false) Long employeeId,
            @AuthenticationPrincipal EmployeeUserDetails principal,
            @PageableDefault(size = 20) Pageable pageable) {

        Long targetEmployeeId = employeeId != null ? employeeId : principal.getEmployeeId();
        if (employeeId != null
                && !employeeId.equals(principal.getEmployeeId())
                && !hasAnyRole(principal, "ROLE_HR", "ROLE_ADMIN", "ROLE_SUPER_ADMIN")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cannot view another employee's requests");
        }
        
        Page<LeaveRequest> page = leaveService.getEmployeeRequests(targetEmployeeId, pageable);
        return ResponseEntity.ok(ApiResponse.success(
                PaginatedResponse.of(page.getContent(), page.getTotalElements(), page.getNumber(), page.getSize()),
                "Leave requests retrieved successfully"
        ));
    }

    @GetMapping("/manager/pending")
    public ResponseEntity<ApiResponse<PaginatedResponse<LeaveRequest>>> getPendingForManager(
            @RequestParam Long managerId,
            @AuthenticationPrincipal EmployeeUserDetails principal,
            @PageableDefault(size = 20) Pageable pageable) {

        if (!principal.getEmployeeId().equals(managerId)
                && !hasAnyRole(principal, "ROLE_HR", "ROLE_ADMIN", "ROLE_SUPER_ADMIN")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cannot view pending requests for another manager");
        }
        
        Page<LeaveRequest> page = leaveService.getPendingRequestsForManager(managerId, pageable);
        return ResponseEntity.ok(ApiResponse.success(
                PaginatedResponse.of(page.getContent(), page.getTotalElements(), page.getNumber(), page.getSize()),
                "Pending leave requests retrieved successfully"
        ));
    }

    @GetMapping("/hr/pending")
    public ResponseEntity<ApiResponse<PaginatedResponse<LeaveRequest>>> getPendingForHr(
            @AuthenticationPrincipal EmployeeUserDetails principal,
            @PageableDefault(size = 20) Pageable pageable) {

        if (!hasAnyRole(principal, "ROLE_HR", "ROLE_ADMIN", "ROLE_SUPER_ADMIN")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }
        
        Page<LeaveRequest> page = leaveService.getPendingRequestsForHr(pageable);
        return ResponseEntity.ok(ApiResponse.success(
                PaginatedResponse.of(page.getContent(), page.getTotalElements(), page.getNumber(), page.getSize()),
                "Pending leave requests for HR retrieved successfully"
        ));
    }

    @PutMapping("/process/{requestId}")
    public ResponseEntity<ApiResponse<LeaveRequest>> processRequest(
            @PathVariable Long requestId,
            @Valid @RequestBody LeaveDecisionRequest decision,
            @AuthenticationPrincipal EmployeeUserDetails principal) {

        return leaveService.processRequest(requestId, decision.status(), decision.note(), principal)
                .map(request -> ResponseEntity.ok(ApiResponse.success(request, "Leave request processed successfully")))
                .orElse(ResponseEntity.notFound().build());
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
