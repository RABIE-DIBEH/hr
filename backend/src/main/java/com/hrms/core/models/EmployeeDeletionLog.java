package com.hrms.core.models;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Audit row written when an employee is archived (soft-deleted).
 */
@Entity
@Table(name = "employee_deletion_logs")
public class EmployeeDeletionLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "employee_id", nullable = false)
    private Long employeeId;

    @Column(name = "performed_by_employee_id", nullable = false)
    private Long performedByEmployeeId;

    @Column(nullable = false, length = 2000)
    private String reason;

    @Column(name = "deleted_at", nullable = false)
    private LocalDateTime deletedAt;

    public EmployeeDeletionLog() {}

    public EmployeeDeletionLog(Long employeeId, Long performedByEmployeeId, String reason, LocalDateTime deletedAt) {
        this.employeeId = employeeId;
        this.performedByEmployeeId = performedByEmployeeId;
        this.reason = reason;
        this.deletedAt = deletedAt;
    }

    public Long getId() {
        return id;
    }

    public Long getEmployeeId() {
        return employeeId;
    }

    public Long getPerformedByEmployeeId() {
        return performedByEmployeeId;
    }

    public String getReason() {
        return reason;
    }

    public LocalDateTime getDeletedAt() {
        return deletedAt;
    }
}
