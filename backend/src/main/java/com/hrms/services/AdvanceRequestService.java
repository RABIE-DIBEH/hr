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

    public AdvanceRequestService(AdvanceRequestRepository advanceRequestRepository) {
        this.advanceRequestRepository = advanceRequestRepository;
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
        return advanceRequestRepository.save(request);
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

        return advanceRequestRepository.save(request);
    }

    /**
     * Mark an approved advance request as delivered / paid
     */
    @Transactional
    public AdvanceRequest deliverAdvanceRequest(Long advanceId, Long processorId) {
        AdvanceRequest request = advanceRequestRepository.findById(advanceId)
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
        request.setProcessedBy(processorId);
        request.setProcessedAt(LocalDateTime.now());

        return advanceRequestRepository.save(request);
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
