package com.hrms.core.models;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "Payroll")
public class Payroll {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long payrollId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    private int month;
    private int year;

    @Column(precision = 10, scale = 2)
    private BigDecimal totalWorkHours;

    @Column(precision = 10, scale = 2)
    private BigDecimal overtimeHours;

    @Column(precision = 12, scale = 2)
    private BigDecimal advanceDeductions;

    @Column(precision = 10, scale = 2)
    private BigDecimal deductions;

    @Column(precision = 12, scale = 2)
    private BigDecimal netSalary;

    private LocalDateTime generatedAt;

    /**
     * Nullable on purpose:
     * - We rely on Hibernate `ddl-auto=update` in dev.
     * - Adding a NOT NULL column to an existing PostgreSQL table with existing rows can fail.
     * Treat null as "not paid" in code.
     */
    @Column(name = "paid")
    private Boolean paid = false;

    @Column(name = "paid_at")
    private LocalDateTime paidAt;

    public Payroll() {}

    public Payroll(Long payrollId, Employee employee, int month, int year) {
        this.payrollId = payrollId;
        this.employee = employee;
        this.month = month;
        this.year = year;
    }

    public static PayrollBuilder builder() {
        return new PayrollBuilder();
    }

    @PrePersist
    protected void onCreate() {
        generatedAt = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getPayrollId() { return payrollId; }
    public void setPayrollId(Long id) { this.payrollId = id; }
    public Employee getEmployee() { return employee; }
    public void setEmployee(Employee emp) { this.employee = emp; }
    public int getMonth() { return month; }
    public void setMonth(int month) { this.month = month; }
    public int getYear() { return year; }
    public void setYear(int year) { this.year = year; }
    public BigDecimal getTotalWorkHours() { return totalWorkHours; }
    public void setTotalWorkHours(BigDecimal hours) { this.totalWorkHours = hours; }
    public BigDecimal getNetSalary() { return netSalary; }
    public void setNetSalary(BigDecimal salary) { this.netSalary = salary; }
    public BigDecimal getOvertimeHours() { return overtimeHours; }
    public void setOvertimeHours(BigDecimal hours) { this.overtimeHours = hours; }
    public BigDecimal getAdvanceDeductions() { return advanceDeductions; }
    public void setAdvanceDeductions(BigDecimal advanceDeductions) { this.advanceDeductions = advanceDeductions; }
    public BigDecimal getDeductions() { return deductions; }
    public void setDeductions(BigDecimal deductions) { this.deductions = deductions; }
    public LocalDateTime getGeneratedAt() { return generatedAt; }
    public void setGeneratedAt(LocalDateTime generatedAt) { this.generatedAt = generatedAt; }
    public boolean isPaid() { return paid != null && paid; }
    public void setPaid(boolean paid) { this.paid = paid; }
    public LocalDateTime getPaidAt() { return paidAt; }
    public void setPaidAt(LocalDateTime paidAt) { this.paidAt = paidAt; }

    public static class PayrollBuilder {
        private Long payrollId;
        private Employee employee;
        private int month;
        private int year;

        public PayrollBuilder employee(Employee emp) { this.employee = emp; return this; }
        public PayrollBuilder month(int m) { this.month = m; return this; }
        public PayrollBuilder year(int y) { this.year = y; return this; }
        public Payroll build() {
            return new Payroll(payrollId, employee, month, year);
        }
    }
}
