package com.hrms.api;

import com.hrms.api.dto.LeaveDecisionRequest;
import com.hrms.api.dto.LeaveRequestDto;
import com.hrms.api.dto.LeaveRequestResponse;
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

import java.time.LocalDate;
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
    public ResponseEntity<ApiResponse<LeaveRequestResponse>> requestLeave(
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

        LeaveRequest saved = leaveService.submitRequest(employee, request);

        return ResponseEntity.ok(ApiResponse.success(
                LeaveRequestResponse.from(saved),
                "Leave request submitted successfully"
        ));
    }

    @GetMapping("/my-requests")
    public ResponseEntity<ApiResponse<PaginatedResponse<LeaveRequestResponse>>> getMyRequests(
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
        List<LeaveRequestResponse> responses = page.getContent().stream()
                .map(LeaveRequestResponse::from)
                .toList();

        return ResponseEntity.ok(ApiResponse.success(
                PaginatedResponse.of(responses, page.getTotalElements(), page.getNumber(), page.getSize()),
                "Leave requests retrieved successfully"
        ));
    }

    @GetMapping("/manager/pending")
    public ResponseEntity<ApiResponse<PaginatedResponse<LeaveRequestResponse>>> getPendingForManager(
            @RequestParam Long managerId,
            @AuthenticationPrincipal EmployeeUserDetails principal,
            @PageableDefault(size = 20) Pageable pageable) {

        if (!principal.getEmployeeId().equals(managerId)
                && !hasAnyRole(principal, "ROLE_HR", "ROLE_ADMIN", "ROLE_SUPER_ADMIN")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cannot view pending requests for another manager");
        }

        Page<LeaveRequest> page = leaveService.getPendingRequestsForManager(managerId, pageable);
        List<LeaveRequestResponse> responses = page.getContent().stream()
                .map(LeaveRequestResponse::from)
                .toList();

        return ResponseEntity.ok(ApiResponse.success(
                PaginatedResponse.of(responses, page.getTotalElements(), page.getNumber(), page.getSize()),
                "Pending leave requests retrieved successfully"
        ));
    }

    @GetMapping("/hr/pending")
    public ResponseEntity<ApiResponse<PaginatedResponse<LeaveRequestResponse>>> getPendingForHr(
            @AuthenticationPrincipal EmployeeUserDetails principal,
            @PageableDefault(size = 20) Pageable pageable) {

        if (!hasAnyRole(principal, "ROLE_HR", "ROLE_ADMIN", "ROLE_SUPER_ADMIN")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }

        Page<LeaveRequest> page = leaveService.getPendingRequestsForHr(pageable);
        List<LeaveRequestResponse> responses = page.getContent().stream()
                .map(LeaveRequestResponse::from)
                .toList();

        return ResponseEntity.ok(ApiResponse.success(
                PaginatedResponse.of(responses, page.getTotalElements(), page.getNumber(), page.getSize()),
                "Pending leave requests for HR retrieved successfully"
        ));
    }

    @PutMapping("/process/{requestId}")
    public ResponseEntity<ApiResponse<LeaveRequestResponse>> processRequest(
            @PathVariable Long requestId,
            @Valid @RequestBody LeaveDecisionRequest decision,
            @AuthenticationPrincipal EmployeeUserDetails principal) {

        return leaveService.processRequest(requestId, decision.status(), decision.note(), principal)
                .map(request -> ResponseEntity.ok(ApiResponse.success(
                        LeaveRequestResponse.from(request),
                        "Leave request processed successfully")))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/calendar")
    public ResponseEntity<ApiResponse<List<LeaveRequestResponse>>> getCalendarLeaves(
            @RequestParam LocalDate start,
            @RequestParam LocalDate end,
            @AuthenticationPrincipal EmployeeUserDetails principal) {

        if (!hasAnyRole(principal, "ROLE_HR", "ROLE_ADMIN", "ROLE_SUPER_ADMIN", "ROLE_MANAGER", "ROLE_EMPLOYEE")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }

        boolean isHighRole = hasAnyRole(principal, "ROLE_HR", "ROLE_ADMIN", "ROLE_SUPER_ADMIN", "ROLE_MANAGER");
        Long filterEmployeeId = isHighRole ? null : principal.getEmployeeId();

        List<LeaveRequest> leaves = leaveService.getAllLeavesInRange(start, end, filterEmployeeId);
        List<LeaveRequestResponse> responses = leaves.stream()
                .map(LeaveRequestResponse::from)
                .toList();

        return ResponseEntity.ok(ApiResponse.success(responses, "Calendar leaves retrieved successfully"));
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
