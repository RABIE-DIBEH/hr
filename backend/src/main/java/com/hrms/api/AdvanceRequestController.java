package com.hrms.api;

import com.hrms.api.dto.AdvanceRequestResponse;
import com.hrms.core.models.AdvanceRequest;
import com.hrms.core.models.Employee;
import com.hrms.core.repositories.EmployeeRepository;
import com.hrms.security.EmployeeUserDetails;
import com.hrms.services.AdvanceRequestService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/advances")
public class AdvanceRequestController {

    private final AdvanceRequestService advanceRequestService;
    private final EmployeeRepository employeeRepository;

    public AdvanceRequestController(AdvanceRequestService advanceRequestService,
                                    EmployeeRepository employeeRepository) {
        this.advanceRequestService = advanceRequestService;
        this.employeeRepository = employeeRepository;
    }

    /**
     * POST /api/advances/request
     * Submit a new advance request (any authenticated employee)
     */
    @PostMapping("/request")
    public ResponseEntity<?> createRequest(@RequestBody Map<String, Object> requestData,
                                           @AuthenticationPrincipal EmployeeUserDetails principal) {
        // Validate amount
        BigDecimal amount = getRequiredBigDecimal(requestData, "amount", "Amount is required");
        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Amount must be greater than zero");
        }

        String reason = (String) requestData.get("reason");

        AdvanceRequest request = new AdvanceRequest.AdvanceRequestBuilder()
                .employeeId(principal.getEmployeeId())
                .amount(amount)
                .reason(reason)
                .build();

        try {
            AdvanceRequest saved = advanceRequestService.submitRequest(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                    "message", "Advance request submitted successfully",
                    "advanceId", saved.getAdvanceId()
            ));
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }

    /**
     * GET /api/advances/pending
     * Get all pending advance requests (HR/ADMIN only)
     */
    @GetMapping("/pending")
    public ResponseEntity<List<AdvanceRequestResponse>> getPendingRequests(
            @AuthenticationPrincipal EmployeeUserDetails principal) {
        
        if (!hasAnyRole(principal, "HR", "ADMIN")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }

        List<AdvanceRequest> requests = advanceRequestService.getPendingRequests();
        return ResponseEntity.ok(requests.stream()
                .map(this::toResponse)
                .toList());
    }

    /**
     * GET /api/advances/my-requests
     * Get all advance requests for current employee
     */
    @GetMapping("/my-requests")
    public ResponseEntity<List<AdvanceRequestResponse>> getMyRequests(
            @AuthenticationPrincipal EmployeeUserDetails principal) {
        
        List<AdvanceRequest> requests = advanceRequestService.getEmployeeRequests(principal.getEmployeeId());
        return ResponseEntity.ok(requests.stream()
                .map(this::toResponse)
                .toList());
    }

    /**
     * GET /api/advances/all
     * Get all advance requests (HR/ADMIN only)
     */
    @GetMapping("/all")
    public ResponseEntity<List<AdvanceRequestResponse>> getAllRequests(
            @RequestParam(required = false) String status,
            @AuthenticationPrincipal EmployeeUserDetails principal) {
        
        if (!hasAnyRole(principal, "HR", "ADMIN")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }

        List<AdvanceRequest> requests;
        if (status != null && !status.trim().isEmpty()) {
            requests = advanceRequestService.getRequestsByStatus(status);
        } else {
            requests = advanceRequestService.getPendingRequests();
        }

        return ResponseEntity.ok(requests.stream()
                .map(this::toResponse)
                .toList());
    }

    /**
     * PUT /api/advances/process/{advanceId}
     * Process an advance request (approve/reject) - HR/ADMIN only
     */
    @PutMapping("/process/{advanceId}")
    public ResponseEntity<?> processRequest(@PathVariable Long advanceId,
                                            @RequestBody Map<String, String> processData,
                                            @AuthenticationPrincipal EmployeeUserDetails principal) {
        if (!hasAnyRole(principal, "HR", "ADMIN")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }

        String status = processData.get("status");
        String note = processData.get("note");

        if (status == null || (!"Approved".equals(status) && !"Rejected".equals(status))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Status must be 'Approved' or 'Rejected'");
        }

        try {
            AdvanceRequest processed = advanceRequestService.processRequest(
                    advanceId, status, note, principal.getEmployeeId());
            return ResponseEntity.ok(Map.of(
                    "message", "Advance request processed successfully",
                    "status", processed.getStatus()
            ));
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage());
        } catch (IllegalStateException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }

    /**
     * GET /api/advances/{advanceId}
     * Get a specific advance request
     */
    @GetMapping("/{advanceId}")
    public ResponseEntity<AdvanceRequestResponse> getRequest(
            @PathVariable Long advanceId,
            @AuthenticationPrincipal EmployeeUserDetails principal) {
        
        Optional<AdvanceRequest> optional = advanceRequestService.getRequestById(advanceId);
        if (optional.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Advance request not found");
        }

        AdvanceRequest request = optional.get();

        // Check access: requester can view, or HR/ADMIN can view all
        if (!request.getEmployeeId().equals(principal.getEmployeeId()) 
                && !hasAnyRole(principal, "HR", "ADMIN")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }

        return ResponseEntity.ok(toResponse(request));
    }

    // Helper methods

    private AdvanceRequestResponse toResponse(AdvanceRequest request) {
        String employeeName = getEmployeeName(request.getEmployeeId());
        String processedByName = request.getProcessedBy() != null ? getEmployeeName(request.getProcessedBy()) : null;
        String processedAt = request.getProcessedAt() != null ? request.getProcessedAt().toString() : null;
        
        return new AdvanceRequestResponse(
                request.getAdvanceId(),
                request.getEmployeeId(),
                employeeName,
                request.getAmount(),
                request.getReason(),
                request.getStatus(),
                request.getRequestedAt() != null ? request.getRequestedAt().toString() : null,
                processedAt,
                request.getProcessedBy(),
                processedByName,
                request.getHrNote()
        );
    }

    private String getEmployeeName(Long employeeId) {
        if (employeeId == null) return null;
        Optional<Employee> emp = employeeRepository.findById(employeeId);
        return emp.map(Employee::getFullName).orElse("Unknown");
    }

    private BigDecimal getRequiredBigDecimal(Map<String, Object> data, String key, String errorMessage) {
        Object value = data.get(key);
        if (value == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, errorMessage);
        }
        try {
            return new BigDecimal(value.toString());
        } catch (NumberFormatException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, errorMessage);
        }
    }

    private static boolean hasAnyRole(EmployeeUserDetails principal, String... roles) {
        for (String role : roles) {
            if (principal.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("ROLE_" + role))) {
                return true;
            }
        }
        return false;
    }
}
