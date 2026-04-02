package com.hrms.api;

import com.hrms.core.models.Employee;
import com.hrms.core.models.LeaveRequest;
import com.hrms.core.repositories.EmployeeRepository;
import com.hrms.security.EmployeeUserDetails;
import com.hrms.services.LeaveService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

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
    public ResponseEntity<LeaveRequest> requestLeave(
            @RequestBody LeaveRequest request,
            @AuthenticationPrincipal EmployeeUserDetails principal) {

        request.setEmployee(null);
        request.setRequestId(null);
        request.setStatus(null);
        request.setManagerNote(null);
        request.setProcessedAt(null);

        Employee employee = employeeRepository.findById(principal.getEmployeeId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Employee not found"));
        return ResponseEntity.ok(leaveService.submitRequest(employee, request));
    }

    @GetMapping("/my-requests")
    public ResponseEntity<List<LeaveRequest>> getMyRequests(
            @RequestParam(required = false) Long employeeId,
            @AuthenticationPrincipal EmployeeUserDetails principal) {

        Long targetEmployeeId = employeeId != null ? employeeId : principal.getEmployeeId();
        if (employeeId != null
                && !employeeId.equals(principal.getEmployeeId())
                && !hasAnyRole(principal, "ROLE_HR", "ROLE_ADMIN")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cannot view another employee's requests");
        }
        return ResponseEntity.ok(leaveService.getEmployeeRequests(targetEmployeeId));
    }

    @GetMapping("/manager/pending")
    public ResponseEntity<List<LeaveRequest>> getPendingForManager(
            @RequestParam Long managerId,
            @AuthenticationPrincipal EmployeeUserDetails principal) {

        if (!principal.getEmployeeId().equals(managerId)
                && !hasAnyRole(principal, "ROLE_HR", "ROLE_ADMIN")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cannot view pending requests for another manager");
        }
        return ResponseEntity.ok(leaveService.getPendingRequestsForManager(managerId));
    }

    @PutMapping("/process/{requestId}")
    public ResponseEntity<LeaveRequest> processRequest(
            @PathVariable Long requestId,
            @RequestBody Map<String, String> decision,
            @AuthenticationPrincipal EmployeeUserDetails principal) {

        String status = decision.get("status");
        String note = decision.get("note");

        return leaveService.processRequest(requestId, status, note, principal)
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
