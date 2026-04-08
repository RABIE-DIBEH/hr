package com.hrms.core.models;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "Departments")
public class Department {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long departmentId;

    @Column(name = "department_name", nullable = false, unique = true)
    private String departmentName;

    @Column(name = "department_code", unique = true, length = 20)
    private String departmentCode;

    @Column(name = "manager_id")
    private Long managerId;

    @Column(length = 500)
    private String description;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    public Department() {}

    public Department(Long departmentId, String departmentName, String departmentCode, Long managerId, String description) {
        this.departmentId = departmentId;
        this.departmentName = departmentName;
        this.departmentCode = departmentCode;
        this.managerId = managerId;
        this.description = description;
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    public Long getDepartmentId() { return departmentId; }
    public void setDepartmentId(Long departmentId) { this.departmentId = departmentId; }

    public String getDepartmentName() { return departmentName; }
    public void setDepartmentName(String departmentName) { this.departmentName = departmentName; }

    public String getDepartmentCode() { return departmentCode; }
    public void setDepartmentCode(String departmentCode) { this.departmentCode = departmentCode; }

    public Long getManagerId() { return managerId; }
    public void setManagerId(Long managerId) { this.managerId = managerId; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public LocalDateTime getCreatedAt() { return createdAt; }
}
