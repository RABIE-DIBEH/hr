package com.hrms.services;

import com.hrms.core.models.Employee;
import com.hrms.core.models.RecruitmentRequest;
import com.hrms.core.models.Team;
import com.hrms.core.models.UsersRole;
import com.hrms.core.repositories.EmployeeRepository;
import com.hrms.core.repositories.RecruitmentRequestRepository;
import com.hrms.core.repositories.RoleRepository;
import com.hrms.core.repositories.TeamRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

@Service
public class RecruitmentRequestService {

    private final RecruitmentRequestRepository recruitmentRequestRepository;

    public RecruitmentRequestService(RecruitmentRequestRepository recruitmentRequestRepository) {
        this.recruitmentRequestRepository = recruitmentRequestRepository;
    }

    /**
     * Submit a new recruitment request (Stage 1)
     */
    @Transactional
    public RecruitmentRequest submitRequest(RecruitmentRequest request) {
        // Check for duplicate national ID in active requests
        if (recruitmentRequestRepository.existsActiveByNationalId(request.getNationalId())) {
            throw new IllegalArgumentException("An active request or employee with this national ID already exists");
        }
        
        // Check for duplicate email
        if (employeeRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new IllegalArgumentException("An employee with this email already exists");
        }

        request.setStatus(RecruitmentRequest.STATUS_PENDING_MANAGER);
        request.setRequestedAt(LocalDateTime.now());
        RecruitmentRequest saved = recruitmentRequestRepository.save(request);

        // Notify HR role about new recruitment request
        inboxService.sendMessage(
            "New Recruitment Request",
            "A new recruitment request for " + saved.getJobDescription() + " has been submitted and is pending review.",
            "HR",
            "System",
            "MEDIUM"
        );

        return saved;
    }

    /**
     * Process a recruitment request (Stage 2 & 3)
     */
    @Transactional
    public RecruitmentRequest processRequest(Long requestId, String action, String note, BigDecimal adjustedSalary, Long processorId, String processorRole) {
        Optional<RecruitmentRequest> optional = recruitmentRequestRepository.findById(requestId);
        if (optional.isEmpty()) {
            throw new IllegalArgumentException("Recruitment request not found");
        }

        RecruitmentRequest request = optional.get();
        String currentStatus = request.getStatus();

        if (RecruitmentRequest.STATUS_APPROVED.equals(currentStatus) || RecruitmentRequest.STATUS_REJECTED.equals(currentStatus)) {
            throw new IllegalStateException("Request has already been finalized");
        }

        if ("Rejected".equalsIgnoreCase(action)) {
            request.setStatus(RecruitmentRequest.STATUS_REJECTED);
            request.setManagerNote(note);
            request.setProcessedAt(LocalDateTime.now());
            request.setApprovedBy(processorId);
            return recruitmentRequestRepository.save(request);
        }

        // Action is "Approved"
        if (RecruitmentRequest.STATUS_PENDING_MANAGER.equals(currentStatus)) {
            // Manager Approval -> Move to Payroll
            request.setStatus(RecruitmentRequest.STATUS_PENDING_PAYROLL);
            if (adjustedSalary != null) {
                request.setExpectedSalary(adjustedSalary);
            }
        } else if (RecruitmentRequest.STATUS_PENDING_PAYROLL.equals(currentStatus)) {
            // Payroll Approval -> Move to Final Approved and Create Employee
            request.setStatus(RecruitmentRequest.STATUS_APPROVED);
            if (adjustedSalary != null) {
                request.setExpectedSalary(adjustedSalary);
            }
            createEmployeeFromRequest(request);
        }

        request.setManagerNote(note);
        request.setProcessedAt(LocalDateTime.now());
        request.setApprovedBy(processorId);

        return recruitmentRequestRepository.save(request);
    }

    private void createEmployeeFromRequest(RecruitmentRequest request) {
        // Find default role and team based on department
        Long roleId = roleRepository.findByRoleName("EMPLOYEE")
                .map(UsersRole::getRoleId).orElse(null);
        
        Long teamId = teamRepository.findAll().stream()
                .filter(t -> t.getTeamName().equalsIgnoreCase(request.getDepartment()))
                .map(Team::getTeamId)
                .findFirst().orElse(null);

        // Create new employee record
        Employee employee = Employee.builder()
                .fullName(request.getFullName())
                .email(request.getEmail())
                // Use a default password that they must change, or generate based on national ID
                .passwordHash(passwordEncoder.encode("Welcome@123"))
                .roleId(roleId)
                .teamId(teamId)
                .baseSalary(request.getExpectedSalary())
                .status("Active")
                .build();

        employeeRepository.save(employee);
    }

    /**
     * Get pending requests for the current user based on their role
     */
    public List<RecruitmentRequest> getPendingRequestsForRole(String roleName, String department) {
        if ("MANAGER".equals(roleName)) {
            // Managers see requests in their department that are pending manager review
            return recruitmentRequestRepository.findByDepartmentAndStatuses(department, List.of(RecruitmentRequest.STATUS_PENDING_MANAGER));
        } else if ("PAYROLL".equals(roleName)) {
            // Payroll sees all requests pending payroll review
            return recruitmentRequestRepository.findByStatus(RecruitmentRequest.STATUS_PENDING_PAYROLL);
        } else if ("HR".equals(roleName) || "ADMIN".equals(roleName) || "SUPER_ADMIN".equals(roleName)) {
            // HR/Admin see everything pending
            return recruitmentRequestRepository.findAllByStatuses(Arrays.asList(
                    RecruitmentRequest.STATUS_PENDING_MANAGER,
                    RecruitmentRequest.STATUS_PENDING_PAYROLL
            ));
        }
        return List.of();
    }

    public List<RecruitmentRequest> getPendingRequests() {
        return recruitmentRequestRepository.findAllByStatuses(Arrays.asList(
                RecruitmentRequest.STATUS_PENDING_MANAGER,
                RecruitmentRequest.STATUS_PENDING_PAYROLL
        ));
    }

    public List<RecruitmentRequest> getPendingRequestsByDepartment(String department) {
        return recruitmentRequestRepository.findByDepartmentAndStatuses(department, Arrays.asList(
                RecruitmentRequest.STATUS_PENDING_MANAGER,
                RecruitmentRequest.STATUS_PENDING_PAYROLL
        ));
    }

    public List<RecruitmentRequest> getUserRequests(Long userId) {
        return recruitmentRequestRepository.findByRequestedBy(userId);
    }

    public List<RecruitmentRequest> getRequestsByStatus(String status) {
        return recruitmentRequestRepository.findByStatus(status);
    }

    public Optional<RecruitmentRequest> getRequestById(Long requestId) {
        return recruitmentRequestRepository.findById(requestId);
    }
}
