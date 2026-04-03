package com.hrms.api;

import com.hrms.core.models.Employee;
import com.hrms.core.models.RecruitmentRequest;
import com.hrms.core.models.UsersRole;
import com.hrms.core.repositories.EmployeeRepository;
import com.hrms.core.repositories.RoleRepository;
import com.hrms.api.dto.RecruitmentRequestResponse;
import com.hrms.security.EmployeeUserDetails;
import com.hrms.services.RecruitmentRequestService;
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
     */
    @PostMapping("/request")
    public ResponseEntity<?> createRequest(@RequestBody Map<String, Object> requestData,
                                           @AuthenticationPrincipal EmployeeUserDetails principal) {
        // Validate role - only HR/ADMIN can create requests
        if (!hasRole(principal, "HR") && !hasRole(principal, "ADMIN")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only HR and ADMIN can create recruitment requests");
        }

        // Validate required fields
        String fullName = getRequiredString(requestData, "fullName", "Full name is required");
        String nationalId = getRequiredString(requestData, "nationalId", "National ID is required");
        String address = getRequiredString(requestData, "address", "Address is required");
        String jobDescription = getRequiredString(requestData, "jobDescription", "Job description is required");
        String department = getRequiredString(requestData, "department", "Department is required");
        String militaryServiceStatus = getRequiredString(requestData, "militaryServiceStatus", "Military service status is required");
        String maritalStatus = getRequiredString(requestData, "maritalStatus", "Marital status is required");
        String mobileNumber = getRequiredString(requestData, "mobileNumber", "Mobile number is required");

        Integer age = getRequiredInteger(requestData, "age", "Age is required");
        BigDecimal expectedSalary = getRequiredBigDecimal(requestData, "expectedSalary", "Expected salary is required");

        // Optional fields
        String insuranceNumber = (String) requestData.get("insuranceNumber");
        String healthNumber = (String) requestData.get("healthNumber");
        Integer numberOfChildren = requestData.get("numberOfChildren") != null 
                ? ((Number) requestData.get("numberOfChildren")).intValue() : null;

        // Build and save request
        RecruitmentRequest request = new RecruitmentRequest.RecruitmentRequestBuilder()
                .fullName(fullName)
                .nationalId(nationalId)
                .address(address)
                .jobDescription(jobDescription)
                .department(department)
                .age(age)
                .insuranceNumber(insuranceNumber)
                .healthNumber(healthNumber)
                .militaryServiceStatus(militaryServiceStatus)
                .maritalStatus(maritalStatus)
                .numberOfChildren(numberOfChildren)
                .mobileNumber(mobileNumber)
                .expectedSalary(expectedSalary)
                .requestedBy(principal.getEmployeeId())
                .build();

        try {
            RecruitmentRequest saved = recruitmentRequestService.submitRequest(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                    "message", "Recruitment request submitted successfully",
                    "requestId", saved.getRequestId()
            ));
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }

    /**
     * GET /api/recruitment/pending
     * Get all pending recruitment requests (MANAGER/HR/ADMIN)
     */
    @GetMapping("/pending")
    public ResponseEntity<List<RecruitmentRequestResponse>> getPendingRequests(
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

        return ResponseEntity.ok(requests.stream()
                .map(this::toResponse)
                .toList());
    }

    /**
     * GET /api/recruitment/my-requests
     * Get all requests created by the current user
     */
    @GetMapping("/my-requests")
    public ResponseEntity<List<RecruitmentRequestResponse>> getMyRequests(
            @AuthenticationPrincipal EmployeeUserDetails principal) {
        
        List<RecruitmentRequest> requests = recruitmentRequestService.getUserRequests(principal.getEmployeeId());
        return ResponseEntity.ok(requests.stream()
                .map(this::toResponse)
                .toList());
    }

    /**
     * GET /api/recruitment/all
     * Get all recruitment requests (HR/ADMIN only)
     */
    @GetMapping("/all")
    public ResponseEntity<List<RecruitmentRequestResponse>> getAllRequests(
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

        return ResponseEntity.ok(requests.stream()
                .map(this::toResponse)
                .toList());
    }

    /**
     * PUT /api/recruitment/process/{requestId}
     * Process a recruitment request (approve/reject) - MANAGER/HR/ADMIN
     */
    @PutMapping("/process/{requestId}")
    public ResponseEntity<?> processRequest(@PathVariable Long requestId,
                                            @RequestBody Map<String, String> processData,
                                            @AuthenticationPrincipal EmployeeUserDetails principal) {
        // Validate role
        if (!hasAnyRole(principal, "MANAGER", "HR", "ADMIN")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }

        String status = processData.get("status");
        String note = processData.get("note");

        if (status == null || (!"Approved".equals(status) && !"Rejected".equals(status))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Status must be 'Approved' or 'Rejected'");
        }

        try {
            RecruitmentRequest processed = recruitmentRequestService.processRequest(
                    requestId, status, note, principal.getEmployeeId());
            return ResponseEntity.ok(Map.of(
                    "message", "Request processed successfully",
                    "status", processed.getStatus()
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
    public ResponseEntity<RecruitmentRequestResponse> getRequest(
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

        return ResponseEntity.ok(toResponse(request));
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

    private String getRequiredString(Map<String, Object> data, String key, String errorMessage) {
        Object value = data.get(key);
        if (value == null || value.toString().trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, errorMessage);
        }
        return value.toString().trim();
    }

    private Integer getRequiredInteger(Map<String, Object> data, String key, String errorMessage) {
        Object value = data.get(key);
        if (value == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, errorMessage);
        }
        try {
            return ((Number) value).intValue();
        } catch (ClassCastException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, errorMessage);
        }
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
