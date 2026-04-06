package com.hrms.core.models;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "Advance_Requests")
public class AdvanceRequest {

    public static final String STATUS_PENDING_MANAGER = "PENDING_MANAGER";
    public static final String STATUS_PENDING_PAYROLL = "PENDING_PAYROLL";
    public static final String STATUS_APPROVED = "APPROVED";
    public static final String STATUS_REJECTED = "REJECTED";
    public static final String STATUS_DELIVERED = "DELIVERED";

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

    @Column(name = "salary_month", nullable = false)
    private Integer salaryMonth;

    @Column(name = "salary_year", nullable = false)
    private Integer salaryYear;

    @Column(name = "processed_at")
    private LocalDateTime processedAt;

    @Column(name = "processed_by")
    private Long processedBy;

    @Column(name = "hr_note", length = 500)
    private String hrNote;

    @Column(name = "paid", nullable = false)
    private boolean paid = false;

    @Column(name = "paid_at")
    private LocalDateTime paidAt;

    @Column(name = "deducted", nullable = false)
    private boolean deducted = false;

    // No-arg constructor (JPA requirement)
    public AdvanceRequest() {
    }

    // All-args constructor
    public AdvanceRequest(Long employeeId, BigDecimal amount, String reason) {
        this.employeeId = employeeId;
        this.amount = amount;
        this.reason = reason;
        this.status = STATUS_PENDING_MANAGER;
        this.requestedAt = LocalDateTime.now();
        this.salaryMonth = this.requestedAt.getMonthValue();
        this.salaryYear = this.requestedAt.getYear();
    }

    @PrePersist
    protected void onCreate() {
        if (this.requestedAt == null) {
            this.requestedAt = LocalDateTime.now();
        }
        if (this.salaryMonth == null) {
            this.salaryMonth = this.requestedAt.getMonthValue();
        }
        if (this.salaryYear == null) {
            this.salaryYear = this.requestedAt.getYear();
        }
        if (this.status == null) {
            this.status = STATUS_PENDING_MANAGER;
        }
        this.paid = this.paid;
        this.deducted = this.deducted;
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

    public Integer getSalaryMonth() {
        return salaryMonth;
    }

    public void setSalaryMonth(Integer salaryMonth) {
        this.salaryMonth = salaryMonth;
    }

    public Integer getSalaryYear() {
        return salaryYear;
    }

    public void setSalaryYear(Integer salaryYear) {
        this.salaryYear = salaryYear;
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

    public boolean isPaid() {
        return paid;
    }

    public void setPaid(boolean paid) {
        this.paid = paid;
    }

    public LocalDateTime getPaidAt() {
        return paidAt;
    }

    public void setPaidAt(LocalDateTime paidAt) {
        this.paidAt = paidAt;
    }

    public boolean isDeducted() {
        return deducted;
    }

    public void setDeducted(boolean deducted) {
        this.deducted = deducted;
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
