package com.hrms.api;

import com.hrms.core.models.Employee;
import com.hrms.core.models.RecruitmentRequest;
import com.hrms.core.models.UsersRole;
import com.hrms.core.repositories.EmployeeRepository;
import com.hrms.core.repositories.RoleRepository;
import com.hrms.api.dto.RecruitmentRequestDto;
import com.hrms.api.dto.ProcessRecruitmentRequestDto;
import com.hrms.api.dto.RecruitmentRequestResponse;
import com.hrms.api.dto.ApiResponse;
import com.hrms.security.EmployeeUserDetails;
import com.hrms.services.RecruitmentRequestService;
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
@RequestMapping("/api/recruitment")
public class RecruitmentRequestController {

    private final RecruitmentRequestService recruitmentRequestService;
    private final EmployeeRepository employeeRepository;
    private final RoleRepository roleRepository;

    public RecruitmentRequestController(RecruitmentRequestService recruitmentRequestService,
                                        EmployeeRepository employeeRepository,
                                        RoleRepository roleRepository) {
        this.recruitmentRequestService = recruitmentRequestService;
        this.employeeRepository = employeeRepository;
        this.roleRepository = roleRepository;
    }

    /**
     * POST /api/recruitment/request
     * Submit a new recruitment request (HR/ADMIN only)
     * Uses @Valid to validate RecruitmentRequestDto fields via Bean Validation annotations
     */
    @PostMapping("/request")
    public ResponseEntity<?> createRequest(@Valid @RequestBody RecruitmentRequestDto dto,
                                           @AuthenticationPrincipal EmployeeUserDetails principal) {
        // Validate role - only HR/ADMIN can create requests
        if (!hasRole(principal, "HR") && !hasRole(principal, "ADMIN")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only HR and ADMIN can create recruitment requests");
        }

        // Build recruitment request from DTO
        RecruitmentRequest request = new RecruitmentRequest.RecruitmentRequestBuilder()
                .fullName(dto.fullName())
                .nationalId(dto.nationalId())
                .address(dto.address())
                .jobDescription(dto.jobDescription())
                .department(dto.department())
                .age(dto.age())
                .insuranceNumber(dto.insuranceNumber())
                .healthNumber(dto.healthNumber())
                .militaryServiceStatus(dto.militaryServiceStatus())
                .maritalStatus(dto.maritalStatus())
                .numberOfChildren(dto.numberOfChildren())
                .mobileNumber(dto.mobileNumber())
                .expectedSalary(dto.expectedSalary())
                .requestedBy(principal.getEmployeeId())
                .build();

        try {
            RecruitmentRequest saved = recruitmentRequestService.submitRequest(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(
                    ApiResponse.success(
                            Map.of("requestId", saved.getRequestId()),
                            "Recruitment request submitted successfully"
                    )
            );
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }

    /**
     * GET /api/recruitment/pending
     * Get all pending recruitment requests (MANAGER/HR/ADMIN)
     */
    @GetMapping("/pending")
    public ResponseEntity<ApiResponse<List<RecruitmentRequestResponse>>> getPendingRequests(
            @RequestParam(required = false) String department,
            @AuthenticationPrincipal EmployeeUserDetails principal) {
        
        // Validate role
        if (!hasAnyRole(principal, "MANAGER", "HR", "ADMIN")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }

        List<RecruitmentRequest> requests;
        if (department != null && !department.trim().isEmpty()) {
            requests = recruitmentRequestService.getPendingRequestsByDepartment(department);
        } else {
            requests = recruitmentRequestService.getPendingRequests();
        }

        List<RecruitmentRequestResponse> responses = requests.stream()
                .map(this::toResponse)
                .toList();
        return ResponseEntity.ok(ApiResponse.success(responses, "Pending recruitment requests retrieved successfully"));
    }

    /**
     * GET /api/recruitment/my-requests
     * Get all requests created by the current user
     */
    @GetMapping("/my-requests")
    public ResponseEntity<ApiResponse<List<RecruitmentRequestResponse>>> getMyRequests(
            @AuthenticationPrincipal EmployeeUserDetails principal) {
        
        List<RecruitmentRequest> requests = recruitmentRequestService.getUserRequests(principal.getEmployeeId());
        List<RecruitmentRequestResponse> responses = requests.stream()
                .map(this::toResponse)
                .toList();
        return ResponseEntity.ok(ApiResponse.success(responses, "Your recruitment requests retrieved successfully"));
    }

    /**
     * GET /api/recruitment/all
     * Get all recruitment requests (HR/ADMIN only)
     */
    @GetMapping("/all")
    public ResponseEntity<ApiResponse<List<RecruitmentRequestResponse>>> getAllRequests(
            @RequestParam(required = false) String status,
            @AuthenticationPrincipal EmployeeUserDetails principal) {
        
        if (!hasAnyRole(principal, "HR", "ADMIN")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }

        List<RecruitmentRequest> requests;
        if (status != null && !status.trim().isEmpty()) {
            requests = recruitmentRequestService.getRequestsByStatus(status);
        } else {
            requests = recruitmentRequestService.getPendingRequests();
        }

        List<RecruitmentRequestResponse> responses = requests.stream()
                .map(this::toResponse)
                .toList();
        return ResponseEntity.ok(ApiResponse.success(responses, "All recruitment requests retrieved successfully"));
    }

    /**
     * PUT /api/recruitment/process/{requestId}
     * Process a recruitment request (approve/reject) - MANAGER/HR/ADMIN
     * Uses @Valid to validate ProcessRecruitmentRequestDto fields
     */
    @PutMapping("/process/{requestId}")
    public ResponseEntity<?> processRequest(@PathVariable Long requestId,
                                            @Valid @RequestBody ProcessRecruitmentRequestDto dto,
                                            @AuthenticationPrincipal EmployeeUserDetails principal) {
        // Validate role
        if (!hasAnyRole(principal, "MANAGER", "HR", "ADMIN")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }

        try {
            RecruitmentRequest processed = recruitmentRequestService.processRequest(
                    requestId, dto.status(), dto.note(), principal.getEmployeeId());
            return ResponseEntity.ok(ApiResponse.success(
                    Map.of("status", processed.getStatus()),
                    "Request processed successfully"
            ));
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage());
        } catch (IllegalStateException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }

    /**
     * GET /api/recruitment/{requestId}
     * Get a specific recruitment request
     */
    @GetMapping("/{requestId}")
    public ResponseEntity<ApiResponse<RecruitmentRequestResponse>> getRequest(
            @PathVariable Long requestId,
            @AuthenticationPrincipal EmployeeUserDetails principal) {
        
        Optional<RecruitmentRequest> optional = recruitmentRequestService.getRequestById(requestId);
        if (optional.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Request not found");
        }

        RecruitmentRequest request = optional.get();

        // Check access: requester can view, or MANAGER/HR/ADMIN can view all
        if (!request.getRequestedBy().equals(principal.getEmployeeId()) 
                && !hasAnyRole(principal, "MANAGER", "HR", "ADMIN")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }

        return ResponseEntity.ok(ApiResponse.success(toResponse(request), "Recruitment request retrieved successfully"));
    }

    // Helper methods

    private RecruitmentRequestResponse toResponse(RecruitmentRequest request) {
        String requestedByName = getEmployeeName(request.getRequestedBy());
        String processedAt = request.getProcessedAt() != null ? request.getProcessedAt().toString() : null;
        
        return new RecruitmentRequestResponse(
                request.getRequestId(),
                request.getFullName(),
                request.getNationalId(),
                request.getAddress(),
                request.getJobDescription(),
                request.getDepartment(),
                request.getAge(),
                request.getInsuranceNumber(),
                request.getHealthNumber(),
                request.getMilitaryServiceStatus(),
                request.getMaritalStatus(),
                request.getNumberOfChildren(),
                request.getMobileNumber(),
                request.getExpectedSalary(),
                request.getRequestedBy(),
                requestedByName,
                request.getStatus(),
                request.getManagerNote(),
                request.getRequestedAt() != null ? request.getRequestedAt().toString() : null,
                processedAt,
                request.getApprovedBy()
        );
    }

    private String getEmployeeName(Long employeeId) {
        if (employeeId == null) return null;
        Optional<Employee> emp = employeeRepository.findById(employeeId);
        return emp.map(Employee::getFullName).orElse("Unknown");
    }

    private static boolean hasRole(EmployeeUserDetails principal, String role) {
        return principal.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_" + role));
    }

    private static boolean hasAnyRole(EmployeeUserDetails principal, String... roles) {
        for (String role : roles) {
            if (hasRole(principal, role)) {
                return true;
            }
        }
        return false;
    }
}
