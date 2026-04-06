package com.hrms.core.models;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDateTime;

@Entity
@Table(name = "Attendance_Records")
public class AttendanceRecord {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long recordId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    private LocalDateTime checkIn;
    private LocalDateTime checkOut;

    @Column(precision = 5, scale = 2)
    private BigDecimal workHours;

    private String status = "Normal";

    private Boolean isVerifiedByManager = false;

    private LocalDateTime verifiedAt;
    private String managerNotes;
    private String reviewStatus = "PENDING_REVIEW";
    private String payrollStatus = "PENDING_APPROVAL";
    private Boolean manuallyAdjusted = false;
    private LocalDateTime manuallyAdjustedAt;
    private Long manuallyAdjustedBy;
    private String manualAdjustmentReason;

    public AttendanceRecord() {}

    public AttendanceRecord(Long recordId, Employee employee, LocalDateTime checkIn, LocalDateTime checkOut, String status, Boolean isVerifiedByManager, String reviewStatus, String payrollStatus) {
        this.recordId = recordId;
        this.employee = employee;
        this.checkIn = checkIn;
        this.checkOut = checkOut;
        this.status = status;
        this.isVerifiedByManager = isVerifiedByManager;
        this.reviewStatus = reviewStatus;
        this.payrollStatus = payrollStatus;
    }

    public static AttendanceRecordBuilder builder() {
        return new AttendanceRecordBuilder();
    }

    public void calculateWorkHours() {
        if (checkIn != null && checkOut != null) {
            Duration duration = Duration.between(checkIn, checkOut);
            long seconds = duration.getSeconds();
            this.workHours = BigDecimal.valueOf(seconds / 3600.0);
        }
    }

    // Getters and Setters
    public Long getRecordId() { return recordId; }
    public void setRecordId(Long recordId) { this.recordId = recordId; }
    public Employee getEmployee() { return employee; }
    public void setEmployee(Employee employee) { this.employee = employee; }
    public LocalDateTime getCheckIn() { return checkIn; }
    public void setCheckIn(LocalDateTime checkIn) { this.checkIn = checkIn; }
    public LocalDateTime getCheckOut() { return checkOut; }
    public void setCheckOut(LocalDateTime checkOut) { this.checkOut = checkOut; }
    public BigDecimal getWorkHours() { return workHours; }
    public void setWorkHours(BigDecimal workHours) { this.workHours = workHours; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Boolean getIsVerifiedByManager() { return isVerifiedByManager != null && isVerifiedByManager; }
    public void setIsVerifiedByManager(Boolean verified) { this.isVerifiedByManager = verified; }
    public LocalDateTime getVerifiedAt() { return verifiedAt; }
    public void setVerifiedAt(LocalDateTime verifiedAt) { this.verifiedAt = verifiedAt; }
    public String getManagerNotes() { return managerNotes; }
    public void setManagerNotes(String managerNotes) { this.managerNotes = managerNotes; }
    public String getReviewStatus() { return reviewStatus; }
    public void setReviewStatus(String reviewStatus) { this.reviewStatus = reviewStatus; }
    public String getPayrollStatus() { return payrollStatus; }
    public void setPayrollStatus(String payrollStatus) { this.payrollStatus = payrollStatus; }
    public Boolean getManuallyAdjusted() { return manuallyAdjusted != null && manuallyAdjusted; }
    public void setManuallyAdjusted(Boolean manuallyAdjusted) { this.manuallyAdjusted = manuallyAdjusted; }
    public LocalDateTime getManuallyAdjustedAt() { return manuallyAdjustedAt; }
    public void setManuallyAdjustedAt(LocalDateTime manuallyAdjustedAt) { this.manuallyAdjustedAt = manuallyAdjustedAt; }
    public Long getManuallyAdjustedBy() { return manuallyAdjustedBy; }
    public void setManuallyAdjustedBy(Long manuallyAdjustedBy) { this.manuallyAdjustedBy = manuallyAdjustedBy; }
    public String getManualAdjustmentReason() { return manualAdjustmentReason; }
    public void setManualAdjustmentReason(String manualAdjustmentReason) { this.manualAdjustmentReason = manualAdjustmentReason; }

    public static class AttendanceRecordBuilder {
        private Long recordId;
        private Employee employee;
        private LocalDateTime checkIn;
        private LocalDateTime checkOut;
        private BigDecimal workHours;
        private String status = "Normal";
        private Boolean isVerifiedByManager = false;
        private String reviewStatus = "PENDING_REVIEW";
        private String payrollStatus = "PENDING_APPROVAL";

        public AttendanceRecordBuilder recordId(Long id) { this.recordId = id; return this; }
        public AttendanceRecordBuilder employee(Employee emp) { this.employee = emp; return this; }
        public AttendanceRecordBuilder checkIn(LocalDateTime in) { this.checkIn = in; return this; }
        public AttendanceRecordBuilder checkOut(LocalDateTime out) { this.checkOut = out; return this; }
        public AttendanceRecordBuilder workHours(BigDecimal hours) { this.workHours = hours; return this; }
        public AttendanceRecordBuilder status(String s) { this.status = s; return this; }
        public AttendanceRecordBuilder isVerifiedByManager(Boolean v) { this.isVerifiedByManager = v; return this; }
        public AttendanceRecordBuilder reviewStatus(String reviewStatus) { this.reviewStatus = reviewStatus; return this; }
        public AttendanceRecordBuilder payrollStatus(String payrollStatus) { this.payrollStatus = payrollStatus; return this; }
        public AttendanceRecord build() {
            AttendanceRecord record = new AttendanceRecord(recordId, employee, checkIn, checkOut, status, isVerifiedByManager, reviewStatus, payrollStatus);
            record.setWorkHours(this.workHours);
            return record;
        }
    }
}
