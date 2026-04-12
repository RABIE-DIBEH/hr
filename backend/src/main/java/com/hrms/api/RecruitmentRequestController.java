package com.hrms.api;

import com.hrms.api.dto.*;
import com.hrms.api.exception.BusinessException;
import com.hrms.api.exception.ErrorCode;
import com.hrms.core.models.Employee;
import com.hrms.core.models.RecruitmentRequest;
import com.hrms.core.repositories.EmployeeRepository;
import com.hrms.security.EmployeeUserDetails;
import com.hrms.services.RecruitmentRequestService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/recruitment")
public class RecruitmentRequestController {

    private final RecruitmentRequestService recruitmentRequestService;
    private final EmployeeRepository employeeRepository;

    public RecruitmentRequestController(RecruitmentRequestService recruitmentRequestService,
                                        EmployeeRepository employeeRepository) {
        this.recruitmentRequestService = recruitmentRequestService;
        this.employeeRepository = employeeRepository;
    }

    /**
     * POST /api/recruitment/request
     * Submit a new recruitment request (HR only)
     */
    @PostMapping("/request")
    public ResponseEntity<ApiResponse<IdResponseDto>> createRequest(@Valid @RequestBody RecruitmentRequestDto dto,
                                           @AuthenticationPrincipal EmployeeUserDetails principal) {
        if (!hasAnyRole(principal, "HR", "SUPER_ADMIN")) {
            throw new BusinessException(ErrorCode.FORBIDDEN_OPERATION, "Only HR can create recruitment requests");
        }

        RecruitmentRequest request = new RecruitmentRequest.RecruitmentRequestBuilder()
                .fullName(dto.fullName())
                .email(dto.email())
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
                .employeeId(dto.employeeId())
                .autoGenerateEmployeeId(dto.autoGenerateEmployeeId())
                .build();

        try {
            RecruitmentRequest saved = recruitmentRequestService.submitRequest(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(
                    ApiResponse.success(
                            new IdResponseDto(saved.getRequestId()),
                            "Recruitment request submitted successfully"
                    )
            );
        } catch (IllegalArgumentException | IllegalStateException e) {
            throw new BusinessException(ErrorCode.RECRUITMENT_INVALID_STATE, e.getMessage());
        }
    }

    /**
     * GET /api/recruitment/pending
     * Get pending recruitment requests relevant to the current user's role
     */
    @GetMapping("/pending")
    public ResponseEntity<ApiResponse<PaginatedResponse<RecruitmentRequestResponse>>> getPendingRequests(
            @RequestParam(required = false) String department,
            @AuthenticationPrincipal EmployeeUserDetails principal,
            @PageableDefault(size = 20) Pageable pageable) {
        
        if (!hasAnyRole(principal, "MANAGER", "HR", "ADMIN", "SUPER_ADMIN", "PAYROLL")) {
            throw new BusinessException(ErrorCode.FORBIDDEN_OPERATION, "Access denied");
        }

        String dept = department != null ? department : principal.getTeamName();
        Page<RecruitmentRequest> page = recruitmentRequestService.getPendingRequestsForRole(principal.getRoleName(), dept, pageable);

        List<RecruitmentRequestResponse> responses = page.getContent().stream()
                .map(this::toResponse)
                .toList();
        
        return ResponseEntity.ok(ApiResponse.success(
                PaginatedResponse.of(responses, page.getTotalElements(), page.getNumber(), page.getSize()),
                "Pending recruitment requests retrieved successfully"
        ));
    }

    /**
     * GET /api/recruitment/my-requests
     * Get all requests created by the current user
     */
    @GetMapping("/my-requests")
    public ResponseEntity<ApiResponse<PaginatedResponse<RecruitmentRequestResponse>>> getMyRequests(
            @AuthenticationPrincipal EmployeeUserDetails principal,
            @PageableDefault(size = 20) Pageable pageable) {
        
        Page<RecruitmentRequest> page = recruitmentRequestService.getUserRequests(principal.getEmployeeId(), pageable);
        List<RecruitmentRequestResponse> responses = page.getContent().stream()
                .map(this::toResponse)
                .toList();
        
        return ResponseEntity.ok(ApiResponse.success(
                PaginatedResponse.of(responses, page.getTotalElements(), page.getNumber(), page.getSize()),
                "Your recruitment requests retrieved successfully"
        ));
    }

    /**
     * GET /api/recruitment/all
     * Get all recruitment requests (HR/ADMIN/PAYROLL only)
     */
    @GetMapping("/all")
    public ResponseEntity<ApiResponse<PaginatedResponse<RecruitmentRequestResponse>>> getAllRequests(
            @RequestParam(required = false) String status,
            @AuthenticationPrincipal EmployeeUserDetails principal,
            @PageableDefault(size = 20) Pageable pageable) {
        
        if (!hasAnyRole(principal, "HR", "ADMIN", "SUPER_ADMIN", "PAYROLL")) {
            throw new BusinessException(ErrorCode.FORBIDDEN_OPERATION, "Access denied");
        }

        Page<RecruitmentRequest> page;
        if (status != null && !status.trim().isEmpty()) {
            page = recruitmentRequestService.getRequestsByStatus(status, pageable);
        } else {
            page = recruitmentRequestService.getAllRequests(pageable);
        }

        List<RecruitmentRequestResponse> responses = page.getContent().stream()
                .map(this::toResponse)
                .toList();
        
        return ResponseEntity.ok(ApiResponse.success(
                PaginatedResponse.of(responses, page.getTotalElements(), page.getNumber(), page.getSize()),
                "All recruitment requests retrieved successfully"
        ));
    }

    /**
     * PUT /api/recruitment/process/{requestId}
     * Process a recruitment request (approve/reject)
     * Returns generated credentials when a new employee is created (final approval).
     */
    @PutMapping("/process/{requestId}")
    public ResponseEntity<ApiResponse<ProcessRecruitmentResponse>> processRequest(
            @PathVariable Long requestId,
            @Valid @RequestBody ProcessRecruitmentRequestDto dto,
            @AuthenticationPrincipal EmployeeUserDetails principal) {
        if (!hasAnyRole(principal, "MANAGER", "HR", "ADMIN", "SUPER_ADMIN", "PAYROLL")) {
            throw new BusinessException(ErrorCode.FORBIDDEN_OPERATION, "Access denied");
        }

        try {
            ProcessRecruitmentResult result = recruitmentRequestService.processRequest(
                    requestId, dto.status(), dto.note(), dto.salary(), principal.getEmployeeId(), principal.getRoleName());

            RecruitmentRequestResponse responseDto = toResponse(result.request());
            ProcessRecruitmentResponse responseBody = result.username() != null
                    ? ProcessRecruitmentResponse.withCredentials(responseDto, result.username(), result.password(), result.employeeId())
                    : ProcessRecruitmentResponse.withoutCredentials(responseDto);

            String message = result.username() != null
                    ? String.format("Request approved! Employee credentials — Username: %s, Password: %s (Share with employee)", result.username(), result.password())
                    : "Request processed successfully";

            return ResponseEntity.ok(ApiResponse.success(responseBody, message));
        } catch (IllegalArgumentException e) {
            throw new BusinessException(ErrorCode.RECRUITMENT_NOT_FOUND, e.getMessage());
        } catch (IllegalStateException e) {
            throw new BusinessException(ErrorCode.RECRUITMENT_INVALID_STATE, e.getMessage());
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
            throw new BusinessException(ErrorCode.RECRUITMENT_NOT_FOUND, "Request not found");
        }

        RecruitmentRequest request = optional.get();

        if (!request.getRequestedBy().equals(principal.getEmployeeId())
                && !hasAnyRole(principal, "MANAGER", "HR", "ADMIN", "SUPER_ADMIN", "PAYROLL")) {
            throw new BusinessException(ErrorCode.FORBIDDEN_OPERATION, "Access denied");
        }

        return ResponseEntity.ok(ApiResponse.success(toResponse(request), "Recruitment request retrieved successfully"));
    }

    /**
     * GET /api/recruitment/next-employee-id
     * Get the next available auto-generated employee ID
     */
    @GetMapping("/next-employee-id")
    public ResponseEntity<ApiResponse<IdResponseDto>> getNextEmployeeId(
            @AuthenticationPrincipal EmployeeUserDetails principal) {

        if (!hasAnyRole(principal, "HR", "ADMIN", "SUPER_ADMIN")) {
            throw new BusinessException(ErrorCode.FORBIDDEN_OPERATION, "Access denied");
        }

        Long nextId = recruitmentRequestService.generateNextEmployeeId();
        return ResponseEntity.ok(ApiResponse.success(
                new IdResponseDto(nextId),
                "Next available employee ID"
        ));
    }

    private RecruitmentRequestResponse toResponse(RecruitmentRequest request) {
        String requestedByName = getEmployeeName(request.getRequestedBy());
        String processedAt = request.getProcessedAt() != null ? request.getProcessedAt().toString() : null;

        return new RecruitmentRequestResponse(
                request.getRequestId(),
                request.getFullName(),
                request.getEmail(),
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
                request.getApprovedBy(),
                request.getEmployeeId(),
                request.getAutoGenerateEmployeeId()
        );
    }

    private String getEmployeeName(Long employeeId) {
        if (employeeId == null) return null;
        return employeeRepository.findById(employeeId)
                .map(Employee::getFullName).orElse("Unknown");
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
