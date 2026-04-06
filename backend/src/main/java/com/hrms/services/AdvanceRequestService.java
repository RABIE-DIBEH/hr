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

        request.setStatus(AdvanceRequest.STATUS_PENDING_MANAGER);
        request.setRequestedAt(LocalDateTime.now());
        request.setSalaryMonth(request.getRequestedAt().getMonthValue());
        request.setSalaryYear(request.getRequestedAt().getYear());
        AdvanceRequest saved = advanceRequestRepository.save(request);

        // Stage 2: notify managers that a new advance request is awaiting manager approval.
        inboxService.sendMessage(
            "New Advance Request",
            "A new advance request of " + saved.getAmount() + " has been submitted and is pending review.",
            "MANAGER",
            "System",
            null,
            "MEDIUM"
        );

        return saved;
    }

    /**
     * Process an advance request (approve/reject).
     * Stage 2: MANAGER processes PENDING_MANAGER -> PENDING_PAYROLL/REJECTED
     * Stage 3: PAYROLL processes PENDING_PAYROLL -> APPROVED/REJECTED
     */
    @Transactional
    public AdvanceRequest processRequest(
            Long advanceId,
            String action,
            String note,
            BigDecimal adjustedAmount,
            String adjustedReason,
            Long processorId,
            String processorRole
    ) {
        AdvanceRequest request = advanceRequestRepository.findById(Objects.requireNonNull(advanceId))
                .orElseThrow(() -> new IllegalArgumentException("Advance request not found"));

        if (!"Approved".equalsIgnoreCase(action) && !"Rejected".equalsIgnoreCase(action)) {
            throw new IllegalArgumentException("Status must be 'Approved' or 'Rejected'");
        }

        String current = request.getStatus();
        boolean isManagerStage = AdvanceRequest.STATUS_PENDING_MANAGER.equals(current);
        boolean isPayrollStage = AdvanceRequest.STATUS_PENDING_PAYROLL.equals(current);

        if (!isManagerStage && !isPayrollStage) {
            throw new IllegalStateException("Request is not in a processable stage");
        }

        // Stage ownership
        if (isManagerStage && !"MANAGER".equalsIgnoreCase(processorRole) && !"SUPER_ADMIN".equalsIgnoreCase(processorRole)) {
            throw new IllegalStateException("Only MANAGER can process requests in PENDING_MANAGER stage");
        }
        if (isPayrollStage && !"PAYROLL".equalsIgnoreCase(processorRole) && !"SUPER_ADMIN".equalsIgnoreCase(processorRole)) {
            throw new IllegalStateException("Only PAYROLL can process requests in PENDING_PAYROLL stage");
        }

        if (isManagerStage) {
            // Manager can modify amount/reason before sending to payroll.
            if (adjustedAmount != null) {
                if (adjustedAmount.compareTo(BigDecimal.ZERO) <= 0) {
                    throw new IllegalArgumentException("Amount must be greater than zero");
                }
                request.setAmount(adjustedAmount);
            }
            if (adjustedReason != null && !adjustedReason.isBlank()) {
                request.setReason(adjustedReason);
            }
        }

        if ("Rejected".equalsIgnoreCase(action)) {
            request.setStatus(AdvanceRequest.STATUS_REJECTED);
        } else {
            request.setStatus(isManagerStage ? AdvanceRequest.STATUS_PENDING_PAYROLL : AdvanceRequest.STATUS_APPROVED);
        }

        request.setHrNote(note);
        request.setProcessedAt(LocalDateTime.now());
        request.setProcessedBy(processorId);

        AdvanceRequest saved = advanceRequestRepository.save(request);

        if (isManagerStage) {
            // Forward to payroll only on manager approval.
            if (AdvanceRequest.STATUS_PENDING_PAYROLL.equals(saved.getStatus())) {
                inboxService.sendMessage(
                        "Advance Request Pending Payroll Approval",
                        "A manager approved an advance request of " + saved.getAmount() + " for employeeId=" + saved.getEmployeeId() + ". It is pending payroll final approval.",
                        "PAYROLL",
                        "System",
                        null,
                        "HIGH"
                );
            }
        } else if (isPayrollStage) {
            // Notify employee about final decision (approved/rejected).
            String finalStatus = saved.getStatus();
            String title = "Advance Request " + finalStatus;
            String message = "Your advance request for " + saved.getAmount() + " is now " + finalStatus + ".";
            if (note != null && !note.isBlank()) {
                message += " Note: " + note;
            }
            inboxService.sendPersonalMessage(
                    title,
                    message,
                    saved.getEmployeeId(),
                    "Payroll Management Department",
                    null,
                    AdvanceRequest.STATUS_APPROVED.equals(finalStatus) ? "MEDIUM" : "HIGH"
            );
        }

        return saved;
    }

    /**
     * Mark an approved advance request as delivered / paid
     */
    public AdvanceRequest deliverAdvanceRequest(Long advanceId, Long processorId) {
        AdvanceRequest request = advanceRequestRepository.findById(Objects.requireNonNull(advanceId))
                .orElseThrow(() -> new IllegalArgumentException("Advance request not found"));

        if (!AdvanceRequest.STATUS_APPROVED.equals(request.getStatus())) {
            throw new IllegalStateException("Only payroll-approved advance requests can be marked as delivered");
        }

        if (request.isPaid()) {
            throw new IllegalStateException("Advance request has already been marked as delivered");
        }

        request.setPaid(true);
        request.setPaidAt(LocalDateTime.now());
        request.setStatus(AdvanceRequest.STATUS_DELIVERED);
        AdvanceRequest saved = advanceRequestRepository.save(request);

        // Notify Employee about delivery
        inboxService.sendPersonalMessage(
            "Advance Funds Delivered",
            "Your advance request for " + saved.getAmount() + " has been marked as delivered/paid. The amount will be deducted from your next payroll.",
            saved.getEmployeeId(),
            "Payroll Management Department",
            null,
            "MEDIUM"
        );

        return saved;
    }

    /**
     * Get stage-specific pending advance requests.
     */
    public Page<AdvanceRequest> getPendingRequestsForRole(String roleName, Pageable pageable) {
        if ("MANAGER".equalsIgnoreCase(roleName)) {
            return advanceRequestRepository.findAllPendingRequests(pageable);
        }
        if ("PAYROLL".equalsIgnoreCase(roleName)) {
            return advanceRequestRepository.findAllPendingPayrollRequests(pageable);
        }
        return Page.empty();
    }

    public Page<AdvanceRequest> getApprovedAwaitingDelivery(Pageable pageable) {
        return advanceRequestRepository.findAllApprovedAwaitingDelivery(pageable);
    }

    public Page<AdvanceRequest> getDeliveredForSalaryMonthYear(int month, int year, Pageable pageable) {
        return advanceRequestRepository.findDeliveredForSalaryMonthYear(month, year, pageable);
    }

    public List<AdvanceRequest> getApprovedAwaitingDeliveryForMonth(int month, int year) {
        return advanceRequestRepository.findAllApprovedAwaitingDeliveryForMonth(month, year);
    }

    @Transactional
    public int deliverAllApprovedAwaitingDelivery(int month, int year, Long processorId) {
        List<AdvanceRequest> toDeliver = advanceRequestRepository.findAllApprovedAwaitingDeliveryForMonth(month, year);
        int delivered = 0;
        for (AdvanceRequest req : toDeliver) {
            if (req.isPaid()) continue;
            req.setPaid(true);
            req.setPaidAt(LocalDateTime.now());
            req.setStatus(AdvanceRequest.STATUS_DELIVERED);
            req.setProcessedBy(processorId);
            req.setProcessedAt(LocalDateTime.now());
            delivered++;
            inboxService.sendPersonalMessage(
                    "Advance Funds Delivered",
                    "Your advance request for " + req.getAmount() + " has been marked as delivered/paid. The amount will be deducted from your month-end payroll.",
                    req.getEmployeeId(),
                    "Payroll Management Department",
                    null,
                    "MEDIUM"
            );
        }
        advanceRequestRepository.saveAll(toDeliver);
        return delivered;
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
    public BigDecimal getUndeductedDeliveredAmountForEmployee(Long employeeId, int month, int year) {
        return advanceRequestRepository.sumUndeductedDeliveredAmountByEmployeeForMonth(employeeId, month, year);
    }

    /**
     * Mark delivered advances as deducted after payroll creation
     */
    @Transactional
    public void markDeliveredAdvancesAsDeducted(Long employeeId, int month, int year) {
        List<AdvanceRequest> advances = advanceRequestRepository.findUndeductedDeliveredAdvancesByEmployeeForMonth(employeeId, month, year);
        advances.forEach(request -> request.setDeducted(true));
        advanceRequestRepository.saveAll(advances);
    }
}
