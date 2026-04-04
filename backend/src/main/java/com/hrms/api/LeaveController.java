package com.hrms.api;

import com.hrms.api.dto.LeaveDecisionRequest;
import com.hrms.api.dto.LeaveRequestDto;
import com.hrms.api.dto.ApiResponse;
import com.hrms.core.models.Employee;
import com.hrms.core.models.LeaveRequest;
import com.hrms.core.repositories.EmployeeRepository;
import com.hrms.security.EmployeeUserDetails;
import com.hrms.services.LeaveService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

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
    public ResponseEntity<ApiResponse<List<LeaveRequest>>> getMyRequests(
            @RequestParam(required = false) Long employeeId,
            @AuthenticationPrincipal EmployeeUserDetails principal) {

        Long targetEmployeeId = employeeId != null ? employeeId : principal.getEmployeeId();
        if (employeeId != null
                && !employeeId.equals(principal.getEmployeeId())
                && !hasAnyRole(principal, "ROLE_HR", "ROLE_ADMIN")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cannot view another employee's requests");
        }
        return ResponseEntity.ok(ApiResponse.success(
                leaveService.getEmployeeRequests(targetEmployeeId),
                "Leave requests retrieved successfully"
        ));
    }

    @GetMapping("/manager/pending")
    public ResponseEntity<ApiResponse<List<LeaveRequest>>> getPendingForManager(
            @RequestParam Long managerId,
            @AuthenticationPrincipal EmployeeUserDetails principal) {

        if (!principal.getEmployeeId().equals(managerId)
                && !hasAnyRole(principal, "ROLE_HR", "ROLE_ADMIN")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cannot view pending requests for another manager");
        }
        return ResponseEntity.ok(ApiResponse.success(
                leaveService.getPendingRequestsForManager(managerId),
                "Pending leave requests retrieved successfully"
        ));
    }

    @GetMapping("/hr/pending")
    public ResponseEntity<List<LeaveRequest>> getPendingForHr(
            @AuthenticationPrincipal EmployeeUserDetails principal) {

        if (!hasAnyRole(principal, "ROLE_HR", "ROLE_ADMIN", "ROLE_SUPER_ADMIN")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }
        return ResponseEntity.ok(leaveService.getPendingRequestsForHr());
    }

    @PutMapping("/process/{requestId}")
    public ResponseEntity<LeaveRequest> processRequest(
            @PathVariable Long requestId,
            @Valid @RequestBody LeaveDecisionRequest decision,
            @AuthenticationPrincipal EmployeeUserDetails principal) {

        return leaveService.processRequest(requestId, decision.status(), decision.note(), principal)
                .map(ResponseEntity::ok)
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
