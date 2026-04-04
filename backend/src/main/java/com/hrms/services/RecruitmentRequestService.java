package com.hrms.services;

import com.hrms.core.models.RecruitmentRequest;
import com.hrms.core.repositories.RecruitmentRequestRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class RecruitmentRequestService {

    private final RecruitmentRequestRepository recruitmentRequestRepository;
    private final InboxService inboxService;

    public RecruitmentRequestService(RecruitmentRequestRepository recruitmentRequestRepository, InboxService inboxService) {
        this.recruitmentRequestRepository = recruitmentRequestRepository;
        this.inboxService = inboxService;
    }

    /**
     * Submit a new recruitment request
     */
    @Transactional
    public RecruitmentRequest submitRequest(RecruitmentRequest request) {
        // Check for duplicate national ID in pending requests
        if (recruitmentRequestRepository.existsPendingByNationalId(request.getNationalId())) {
            throw new IllegalArgumentException("A pending request with this national ID already exists");
        }

        request.setStatus("Pending");
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
     * Process a recruitment request (approve/reject) - Manager/HR/Admin only
     */
    @Transactional
    public RecruitmentRequest processRequest(Long requestId, String status, String note, Long processorId) {
        Optional<RecruitmentRequest> optional = recruitmentRequestRepository.findById(requestId);
        
        if (optional.isEmpty()) {
            throw new IllegalArgumentException("Recruitment request not found");
        }

        RecruitmentRequest request = optional.get();

        if (!"Pending".equals(request.getStatus())) {
            throw new IllegalStateException("Request has already been processed");
        }

        if (!"Approved".equals(status) && !"Rejected".equals(status)) {
            throw new IllegalArgumentException("Status must be 'Approved' or 'Rejected'");
        }

        request.setStatus(status);
        request.setManagerNote(note);
        request.setProcessedAt(LocalDateTime.now());
        request.setApprovedBy(processorId);

        RecruitmentRequest saved = recruitmentRequestRepository.save(request);

        // Notify the original requester
        if (saved.getRequestedBy() != null) {
            inboxService.sendPersonalMessage(
                "Recruitment Request " + status,
                "Your recruitment request for " + saved.getJobDescription() + " has been " + status.toLowerCase() + ".",
                saved.getRequestedBy(),
                "System",
                "MEDIUM"
            );
        }

        return saved;
    }

    /**
     * Get all pending requests for manager review
     */
    public List<RecruitmentRequest> getPendingRequests() {
        return recruitmentRequestRepository.findAllPendingRequests();
    }

    /**
     * Get pending requests filtered by department (for department managers)
     */
    public List<RecruitmentRequest> getPendingRequestsByDepartment(String department) {
        if (department == null || department.trim().isEmpty()) {
            return getPendingRequests();
        }
        return recruitmentRequestRepository.findByDepartment(department);
    }

    /**
     * Get all requests created by a specific user
     */
    public List<RecruitmentRequest> getUserRequests(Long userId) {
        return recruitmentRequestRepository.findByRequestedBy(userId);
    }

    /**
     * Get all requests with a specific status
     */
    public List<RecruitmentRequest> getRequestsByStatus(String status) {
        return recruitmentRequestRepository.findByStatus(status);
    }

    /**
     * Get a specific request by ID
     */
    public Optional<RecruitmentRequest> getRequestById(Long requestId) {
        return recruitmentRequestRepository.findById(requestId);
    }

    /**
     * Check if user can process requests (MANAGER, HR, or ADMIN)
     */
    public static boolean canProcessRequest(String roleName) {
        return "MANAGER".equals(roleName) || "HR".equals(roleName) || "ADMIN".equals(roleName);
    }

    /**
     * Check if user can create requests (HR or ADMIN only)
     */
    public static boolean canCreateRequest(String roleName) {
        return "HR".equals(roleName) || "ADMIN".equals(roleName);
    }
}
