package com.hrms.core.models;

import jakarta.persistence.*;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "Employees")
@SQLDelete(sql = "UPDATE Employees SET deleted = true, deleted_at = CURRENT_TIMESTAMP WHERE employee_id = ?")
@SQLRestriction("deleted = false")
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
    private Long departmentId;

    @Column(precision = 12, scale = 2)
    private BigDecimal baseSalary;

    private String status = "Active";

    private LocalDateTime createdAt;
    
    @Column(name = "leave_balance_days")
    private Double leaveBalanceDays = 21.0;

    @Column(name = "overtime_balance_hours")
    private Double overtimeBalanceHours = 0.0;

    @Column(name = "mobile_number")
    private String mobileNumber;

    @Column(name = "address")
    private String address;

    @Column(name = "national_id")
    private String nationalId;

    @Column(name = "avatar_url")
    private String avatarUrl;

    @Column(nullable = false)
    private boolean deleted = false;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    public Employee() {}

    public Employee(Long employeeId, String fullName, String email, String passwordHash, Long teamId, Long roleId, Long managerId, Long departmentId, BigDecimal baseSalary, String status, String avatarUrl, String mobileNumber, String address, String nationalId, Double leaveBalanceDays, Double overtimeBalanceHours, boolean deleted, LocalDateTime deletedAt) {
        this.employeeId = employeeId;
        this.fullName = fullName;
        this.email = email;
        this.passwordHash = passwordHash;
        this.teamId = teamId;
        this.roleId = roleId;
        this.managerId = managerId;
        this.departmentId = departmentId;
        this.baseSalary = baseSalary;
        this.status = status;
        this.avatarUrl = avatarUrl;
        this.mobileNumber = mobileNumber;
        this.address = address;
        this.nationalId = nationalId;
        this.leaveBalanceDays = leaveBalanceDays != null ? leaveBalanceDays : 21.0;
        this.overtimeBalanceHours = overtimeBalanceHours != null ? overtimeBalanceHours : 0.0;
        this.deleted = deleted;
        this.deletedAt = deletedAt;
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
    public Double getLeaveBalanceDays() { return leaveBalanceDays; }
    public void setLeaveBalanceDays(Double leaveBalanceDays) { this.leaveBalanceDays = leaveBalanceDays; }
    public Double getOvertimeBalanceHours() { return overtimeBalanceHours; }
    public void setOvertimeBalanceHours(Double overtimeBalanceHours) { this.overtimeBalanceHours = overtimeBalanceHours; }
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
    public String getMobileNumber() { return mobileNumber; }
    public void setMobileNumber(String mobileNumber) { this.mobileNumber = mobileNumber; }
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    public String getNationalId() { return nationalId; }
    public void setNationalId(String nationalId) { this.nationalId = nationalId; }
    public String getAvatarUrl() { return avatarUrl; }
    public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }
    public Long getDepartmentId() { return departmentId; }
    public void setDepartmentId(Long departmentId) { this.departmentId = departmentId; }

    public boolean isDeleted() { return deleted; }
    public void setDeleted(boolean deleted) { this.deleted = deleted; }
    public LocalDateTime getDeletedAt() { return deletedAt; }
    public void setDeletedAt(LocalDateTime deletedAt) { this.deletedAt = deletedAt; }

    // Full builder for compatibility
    public static class EmployeeBuilder {
        private Long employeeId;
        private String fullName;
        private String email;
        private String passwordHash;
        private Long teamId;
        private Long roleId;
        private Long managerId;
        private Long departmentId;
        private BigDecimal baseSalary;
        private String status = "Active";
        private String avatarUrl;
        private String mobileNumber;
        private String address;
        private String nationalId;
        private Double leaveBalanceDays;
        private Double overtimeBalanceHours;
        private boolean deleted = false;
        private LocalDateTime deletedAt;

        public EmployeeBuilder employeeId(Long id) { this.employeeId = id; return this; }
        public EmployeeBuilder fullName(String name) { this.fullName = name; return this; }
        public EmployeeBuilder email(String email) { this.email = email; return this; }
        public EmployeeBuilder passwordHash(String hash) { this.passwordHash = hash; return this; }
        public EmployeeBuilder teamId(Long id) { this.teamId = id; return this; }
        public EmployeeBuilder roleId(Long id) { this.roleId = id; return this; }
        public EmployeeBuilder managerId(Long id) { this.managerId = id; return this; }
        public EmployeeBuilder departmentId(Long id) { this.departmentId = id; return this; }
        public EmployeeBuilder baseSalary(BigDecimal salary) { this.baseSalary = salary; return this; }
        public EmployeeBuilder status(String status) { this.status = status; return this; }
        public EmployeeBuilder avatarUrl(String url) { this.avatarUrl = url; return this; }
        public EmployeeBuilder mobileNumber(String mobileNumber) { this.mobileNumber = mobileNumber; return this; }
        public EmployeeBuilder address(String address) { this.address = address; return this; }
        public EmployeeBuilder nationalId(String nationalId) { this.nationalId = nationalId; return this; }
        public EmployeeBuilder leaveBalanceDays(Double leaveBalanceDays) { this.leaveBalanceDays = leaveBalanceDays; return this; }
        public EmployeeBuilder overtimeBalanceHours(Double overtimeBalanceHours) { this.overtimeBalanceHours = overtimeBalanceHours; return this; }
        public EmployeeBuilder deleted(boolean deleted) { this.deleted = deleted; return this; }
        public EmployeeBuilder deletedAt(LocalDateTime deletedAt) { this.deletedAt = deletedAt; return this; }

        public Employee build() {
            return new Employee(employeeId, fullName, email, passwordHash, teamId, roleId, managerId, departmentId, baseSalary, status, avatarUrl, mobileNumber, address, nationalId, leaveBalanceDays, overtimeBalanceHours, deleted, deletedAt);
        }
    }
}
