package com.hrms.services;

import com.hrms.core.models.AdvanceRequest;
import com.hrms.core.repositories.AdvanceRequestRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class AdvanceRequestService {

    private final AdvanceRequestRepository advanceRequestRepository;
    private final InboxService inboxService;

    public AdvanceRequestService(AdvanceRequestRepository advanceRequestRepository, InboxService inboxService) {
        this.advanceRequestRepository = advanceRequestRepository;
        this.inboxService = inboxService;
    }

    /**
     * Submit a new advance request
     */
    @Transactional
    public AdvanceRequest submitRequest(AdvanceRequest request) {
        // Validate amount is positive
        if (request.getAmount() == null || request.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Amount must be greater than zero");
        }

        request.setStatus("Pending");
        request.setRequestedAt(LocalDateTime.now());
        AdvanceRequest saved = advanceRequestRepository.save(request);

        // Notify HR about new request
        inboxService.sendMessage(
            "New Advance Request",
            "A new advance request of " + saved.getAmount() + " has been submitted and is pending review.",
            "HR",
            "System",
            "MEDIUM"
        );

        return saved;
    }

    /**
     * Process an advance request (approve/reject) - HR/Admin only
     */
    @Transactional
    public AdvanceRequest processRequest(Long advanceId, String status, String note, Long processorId) {
        Optional<AdvanceRequest> optional = advanceRequestRepository.findById(advanceId);
        
        if (optional.isEmpty()) {
            throw new IllegalArgumentException("Advance request not found");
        }

        AdvanceRequest request = optional.get();

        if (!"Pending".equals(request.getStatus())) {
            throw new IllegalStateException("Request has already been processed");
        }

        if (!"Approved".equals(status) && !"Rejected".equals(status)) {
            throw new IllegalArgumentException("Status must be 'Approved' or 'Rejected'");
        }

        request.setStatus(status);
        request.setHrNote(note);
        request.setProcessedAt(LocalDateTime.now());
        request.setProcessedBy(processorId);

        AdvanceRequest saved = advanceRequestRepository.save(request);

        // Notify Employee about the decision
        String title = "Advance Request " + status;
        String message = "Your advance request for " + saved.getAmount() + " has been " + status.toLowerCase() + ".";
        if (note != null && !note.isBlank()) {
            message += " Note: " + note;
        }

        inboxService.sendPersonalMessage(
            title,
            message,
            saved.getEmployeeId(),
            "HR Department",
            status.equals("Approved") ? "MEDIUM" : "HIGH"
        );

        return saved;
    }

    /**
     * Get all pending advance requests for HR/Payroll review
     */
    public List<AdvanceRequest> getPendingRequests() {
        return advanceRequestRepository.findAllPendingRequests();
    }

    /**
     * Get all advance requests for a specific employee
     */
    public List<AdvanceRequest> getEmployeeRequests(Long employeeId) {
        return advanceRequestRepository.findByEmployeeId(employeeId);
    }

    /**
     * Get all requests with a specific status
     */
    public List<AdvanceRequest> getRequestsByStatus(String status) {
        return advanceRequestRepository.findByStatus(status);
    }

    /**
     * Get a specific request by ID
     */
    public Optional<AdvanceRequest> getRequestById(Long advanceId) {
        return advanceRequestRepository.findById(advanceId);
    }

    /**
     * Get total pending advance amount for an employee
     */
    public BigDecimal getPendingAmountForEmployee(Long employeeId) {
        return advanceRequestRepository.sumPendingAmountByEmployee(employeeId);
    }
}
