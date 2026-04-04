package com.hrms.api;

import com.hrms.api.dto.AdvanceRequestDto;
import com.hrms.api.dto.ProcessAdvanceRequestDto;
import com.hrms.api.dto.AdvanceRequestResponse;
import com.hrms.api.dto.ApiResponse;
import com.hrms.core.models.AdvanceRequest;
import com.hrms.core.models.Employee;
import com.hrms.core.repositories.EmployeeRepository;
import com.hrms.security.EmployeeUserDetails;
import com.hrms.services.AdvanceRequestService;
import jakarta.validation.Valid;
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
     * Uses @Valid to validate AdvanceRequestDto fields via Bean Validation annotations
     */
    @PostMapping("/request")
    public ResponseEntity<?> createRequest(@Valid @RequestBody AdvanceRequestDto dto,
                                           @AuthenticationPrincipal EmployeeUserDetails principal) {
        // Build advance request from DTO
        AdvanceRequest request = new AdvanceRequest.AdvanceRequestBuilder()
                .employeeId(principal.getEmployeeId())
                .amount(dto.amount())
                .reason(dto.reason())
                .build();

        try {
            AdvanceRequest saved = advanceRequestService.submitRequest(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(
                    ApiResponse.success(
                            Map.of("advanceId", saved.getAdvanceId()),
                            "Advance request submitted successfully"
                    )
            );
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }

    /**
     * GET /api/advances/pending
     * Get all pending advance requests (HR/ADMIN only)
     */
    @GetMapping("/pending")
    public ResponseEntity<ApiResponse<List<AdvanceRequestResponse>>> getPendingRequests(
            @AuthenticationPrincipal EmployeeUserDetails principal) {
        
        if (!hasAnyRole(principal, "HR", "ADMIN")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }

        List<AdvanceRequest> requests = advanceRequestService.getPendingRequests();
        List<AdvanceRequestResponse> responses = requests.stream()
                .map(this::toResponse)
                .toList();
        return ResponseEntity.ok(ApiResponse.success(responses, "Pending advance requests retrieved successfully"));
    }

    /**
     * GET /api/advances/my-requests
     * Get all advance requests for current employee
     */
    @GetMapping("/my-requests")
    public ResponseEntity<ApiResponse<List<AdvanceRequestResponse>>> getMyRequests(
            @AuthenticationPrincipal EmployeeUserDetails principal) {
        
        List<AdvanceRequest> requests = advanceRequestService.getEmployeeRequests(principal.getEmployeeId());
        List<AdvanceRequestResponse> responses = requests.stream()
                .map(this::toResponse)
                .toList();
        return ResponseEntity.ok(ApiResponse.success(responses, "Your advance requests retrieved successfully"));
    }

    /**
     * GET /api/advances/all
     * Get all advance requests (HR/ADMIN only)
     */
    @GetMapping("/all")
    public ResponseEntity<ApiResponse<List<AdvanceRequestResponse>>> getAllRequests(
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

        List<AdvanceRequestResponse> responses = requests.stream()
                .map(this::toResponse)
                .toList();
        return ResponseEntity.ok(ApiResponse.success(responses, "All advance requests retrieved successfully"));
    }

    /**
     * PUT /api/advances/process/{advanceId}
     * Process an advance request (approve/reject) - HR/ADMIN only
     * Uses @Valid to validate ProcessAdvanceRequestDto fields
     */
    @PutMapping("/process/{advanceId}")
    public ResponseEntity<?> processRequest(@PathVariable Long advanceId,
                                            @Valid @RequestBody ProcessAdvanceRequestDto dto,
                                            @AuthenticationPrincipal EmployeeUserDetails principal) {
        if (!hasAnyRole(principal, "HR", "ADMIN")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }

        try {
            AdvanceRequest processed = advanceRequestService.processRequest(
                    advanceId, dto.status(), dto.note(), principal.getEmployeeId());
            return ResponseEntity.ok(ApiResponse.success(
                    Map.of("status", processed.getStatus()),
                    "Advance request processed successfully"
            ));
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage());
        } catch (IllegalStateException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }

    /**
     * PUT /api/advances/deliver/{advanceId}
     * Mark an approved advance request as delivered / paid - HR/ADMIN only
     */
    @PutMapping("/deliver/{advanceId}")
    public ResponseEntity<?> deliverRequest(@PathVariable Long advanceId,
                                            @AuthenticationPrincipal EmployeeUserDetails principal) {
        if (!hasAnyRole(principal, "HR", "ADMIN")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }

        try {
            AdvanceRequest delivered = advanceRequestService.deliverAdvanceRequest(advanceId, principal.getEmployeeId());
            return ResponseEntity.ok(ApiResponse.success(
                    Map.of("status", delivered.getStatus(), "paidAt", delivered.getPaidAt() != null ? delivered.getPaidAt().toString() : null),
                    "Advance request marked as delivered successfully"
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
    public ResponseEntity<ApiResponse<AdvanceRequestResponse>> getRequest(
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

        return ResponseEntity.ok(ApiResponse.success(toResponse(request), "Advance request retrieved successfully"));
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
                request.getPaidAt() != null ? request.getPaidAt().toString() : null,
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
