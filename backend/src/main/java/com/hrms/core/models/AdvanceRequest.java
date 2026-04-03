package com.hrms.core.models;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "Advance_Requests")
public class AdvanceRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long advanceId;

    @Column(name = "employee_id", nullable = false)
    private Long employeeId;

    @Column(name = "amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Column(name = "reason", length = 500)
    private String reason;

    @Column(name = "status", nullable = false, length = 20)
    private String status;

    @Column(name = "requested_at")
    private LocalDateTime requestedAt;

    @Column(name = "processed_at")
    private LocalDateTime processedAt;

    @Column(name = "processed_by")
    private Long processedBy;

    @Column(name = "hr_note", length = 500)
    private String hrNote;

    // No-arg constructor (JPA requirement)
    public AdvanceRequest() {
    }

    // All-args constructor
    public AdvanceRequest(Long employeeId, BigDecimal amount, String reason) {
        this.employeeId = employeeId;
        this.amount = amount;
        this.reason = reason;
        this.status = "Pending";
        this.requestedAt = LocalDateTime.now();
    }

    @PrePersist
    protected void onCreate() {
        if (this.requestedAt == null) {
            this.requestedAt = LocalDateTime.now();
        }
        if (this.status == null) {
            this.status = "Pending";
        }
    }

    // Getters and Setters
    public Long getAdvanceId() {
        return advanceId;
    }

    public void setAdvanceId(Long advanceId) {
        this.advanceId = advanceId;
    }

    public Long getEmployeeId() {
        return employeeId;
    }

    public void setEmployeeId(Long employeeId) {
        this.employeeId = employeeId;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getRequestedAt() {
        return requestedAt;
    }

    public void setRequestedAt(LocalDateTime requestedAt) {
        this.requestedAt = requestedAt;
    }

    public LocalDateTime getProcessedAt() {
        return processedAt;
    }

    public void setProcessedAt(LocalDateTime processedAt) {
        this.processedAt = processedAt;
    }

    public Long getProcessedBy() {
        return processedBy;
    }

    public void setProcessedBy(Long processedBy) {
        this.processedBy = processedBy;
    }

    public String getHrNote() {
        return hrNote;
    }

    public void setHrNote(String hrNote) {
        this.hrNote = hrNote;
    }

    // Manual Builder
    public static class AdvanceRequestBuilder {
        private Long employeeId;
        private BigDecimal amount;
        private String reason;

        public AdvanceRequestBuilder employeeId(Long employeeId) {
            this.employeeId = employeeId;
            return this;
        }

        public AdvanceRequestBuilder amount(BigDecimal amount) {
            this.amount = amount;
            return this;
        }

        public AdvanceRequestBuilder reason(String reason) {
            this.reason = reason;
            return this;
        }

        public AdvanceRequest build() {
            return new AdvanceRequest(employeeId, amount, reason);
        }
    }
}
