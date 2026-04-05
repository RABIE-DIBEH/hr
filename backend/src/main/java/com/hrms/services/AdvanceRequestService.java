package com.hrms.services;

import com.hrms.core.models.AdvanceRequest;
import com.hrms.core.repositories.AdvanceRequestRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Objects;

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
        AdvanceRequest request = advanceRequestRepository.findById(Objects.requireNonNull(advanceId))
                .orElseThrow(() -> new IllegalArgumentException("Advance request not found"));

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
     * Mark an approved advance request as delivered / paid
     */
    public AdvanceRequest deliverAdvanceRequest(Long advanceId, Long processorId) {
        AdvanceRequest request = advanceRequestRepository.findById(Objects.requireNonNull(advanceId))
                .orElseThrow(() -> new IllegalArgumentException("Advance request not found"));

        if (!"Approved".equals(request.getStatus())) {
            throw new IllegalStateException("Only approved advance requests can be marked as delivered");
        }

        if (request.isPaid()) {
            throw new IllegalStateException("Advance request has already been marked as delivered");
        }

        request.setPaid(true);
        request.setPaidAt(LocalDateTime.now());
        request.setStatus("Delivered");
        AdvanceRequest saved = advanceRequestRepository.save(request);

        // Notify Employee about delivery
        inboxService.sendPersonalMessage(
            "Advance Funds Delivered",
            "Your advance request for " + saved.getAmount() + " has been marked as delivered/paid. The amount will be deducted from your next payroll.",
            saved.getEmployeeId(),
            "Payroll Department",
            "MEDIUM"
        );

        return saved;
    }

    /**
     * Get all pending advance requests for HR/Payroll review
     */
    public Page<AdvanceRequest> getPendingRequests(Pageable pageable) {
        return advanceRequestRepository.findAllPendingRequests(pageable);
    }

    /**
     * Get all advance requests for a specific employee
     */
    public Page<AdvanceRequest> getEmployeeRequests(Long employeeId, Pageable pageable) {
        return advanceRequestRepository.findByEmployeeId(employeeId, pageable);
    }

    /**
     * Get all advance requests regardless of status
     */
    public Page<AdvanceRequest> getAllRequests(Pageable pageable) {
        return advanceRequestRepository.findAllRequests(pageable);
    }

    /**
     * Get all requests with a specific status
     */
    public Page<AdvanceRequest> getRequestsByStatus(String status, Pageable pageable) {
        return advanceRequestRepository.findByStatus(status, pageable);
    }

    /**
     * Get a specific request by ID
     */
    public Optional<AdvanceRequest> getRequestById(Long advanceId) {
        return advanceRequestRepository.findById(Objects.requireNonNull(advanceId));
    }

    /**
     * Get total pending advance amount for an employee
     */
    public BigDecimal getPendingAmountForEmployee(Long employeeId) {
        return advanceRequestRepository.sumPendingAmountByEmployee(employeeId);
    }

    /**
     * Get total paid advances available for payroll deduction
     */
    public BigDecimal getUndeductedDeliveredAmountForEmployee(Long employeeId) {
        return advanceRequestRepository.sumUndeductedDeliveredAmountByEmployee(employeeId);
    }

    /**
     * Mark delivered advances as deducted after payroll creation
     */
    @Transactional
    public void markDeliveredAdvancesAsDeducted(Long employeeId) {
        List<AdvanceRequest> advances = advanceRequestRepository.findUndeductedDeliveredAdvancesByEmployee(employeeId);
        advances.forEach(request -> request.setDeducted(true));
        advanceRequestRepository.saveAll(advances);
    }
}
