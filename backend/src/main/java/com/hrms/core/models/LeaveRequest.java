package com.hrms.core.models;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "Leave_Requests")
public class LeaveRequest {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long requestId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @Column(nullable = false)
    private String leaveType; 

    @Column(nullable = false)
    private LocalDate startDate;

    @Column(nullable = false)
    private LocalDate endDate;

    private String status = "Pending";

    private String managerNote;
    
    private LocalDateTime requestedAt;
    private LocalDateTime processedAt;

    public LeaveRequest() {}

    @PrePersist
    protected void onCreate() {
        requestedAt = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getRequestId() { return requestId; }
    public void setRequestId(Long requestId) { this.requestId = requestId; }
    public Employee getEmployee() { return employee; }
    public void setEmployee(Employee employee) { this.employee = employee; }
    public String getLeaveType() { return leaveType; }
    public void setLeaveType(String type) { this.leaveType = type; }
    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate date) { this.startDate = date; }
    public LocalDate getEndDate() { return endDate; }
    public void setEndDate(LocalDate date) { this.endDate = date; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getManagerNote() { return managerNote; }
    public void setManagerNote(String note) { this.managerNote = note; }
    public LocalDateTime getRequestedAt() { return requestedAt; }
    public LocalDateTime getProcessedAt() { return processedAt; }
    public void setProcessedAt(LocalDateTime time) { this.processedAt = time; }
}
