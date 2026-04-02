package com.hrms.core.models;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "Employees")
public class Employee {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long employeeId;

    @Column(nullable = false)
    private String fullName;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String passwordHash;

    private Long teamId;
    private Long roleId;
    private Long managerId;

    @Column(precision = 12, scale = 2)
    private BigDecimal baseSalary;

    private String status = "Active";

    private LocalDateTime createdAt;

    public Employee() {}

    public Employee(Long employeeId, String fullName, String email, String passwordHash, Long teamId, Long roleId, Long managerId, BigDecimal baseSalary, String status) {
        this.employeeId = employeeId;
        this.fullName = fullName;
        this.email = email;
        this.passwordHash = passwordHash;
        this.teamId = teamId;
        this.roleId = roleId;
        this.managerId = managerId;
        this.baseSalary = baseSalary;
        this.status = status;
    }

    public static EmployeeBuilder builder() {
        return new EmployeeBuilder();
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getEmployeeId() { return employeeId; }
    public void setEmployeeId(Long employeeId) { this.employeeId = employeeId; }
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }
    public Long getTeamId() { return teamId; }
    public void setTeamId(Long teamId) { this.teamId = teamId; }
    public Long getRoleId() { return roleId; }
    public void setRoleId(Long roleId) { this.roleId = roleId; }
    public Long getManagerId() { return managerId; }
    public void setManagerId(Long managerId) { this.managerId = managerId; }
    public BigDecimal getBaseSalary() { return baseSalary; }
    public void setBaseSalary(BigDecimal baseSalary) { this.baseSalary = baseSalary; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public LocalDateTime getCreatedAt() { return createdAt; }

    // Full builder for compatibility
    public static class EmployeeBuilder {
        private Long employeeId;
        private String fullName;
        private String email;
        private String passwordHash;
        private Long teamId;
        private Long roleId;
        private Long managerId;
        private BigDecimal baseSalary;
        private String status = "Active";

        public EmployeeBuilder employeeId(Long id) { this.employeeId = id; return this; }
        public EmployeeBuilder fullName(String name) { this.fullName = name; return this; }
        public EmployeeBuilder email(String email) { this.email = email; return this; }
        public EmployeeBuilder passwordHash(String hash) { this.passwordHash = hash; return this; }
        public EmployeeBuilder teamId(Long id) { this.teamId = id; return this; }
        public EmployeeBuilder roleId(Long id) { this.roleId = id; return this; }
        public EmployeeBuilder managerId(Long id) { this.managerId = id; return this; }
        public EmployeeBuilder baseSalary(BigDecimal salary) { this.baseSalary = salary; return this; }
        public EmployeeBuilder status(String status) { this.status = status; return this; }
        public Employee build() {
            return new Employee(employeeId, fullName, email, passwordHash, teamId, roleId, managerId, baseSalary, status);
        }
    }
}
