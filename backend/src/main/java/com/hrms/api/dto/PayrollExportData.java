package com.hrms.api.dto;

import com.hrms.services.PayrollFormulaEngine;
import java.math.BigDecimal;

/**
 * Combined data for payroll export.
 * Contains both employee metadata and calculated payroll results.
 */
public record PayrollExportData(
    String employeeCode,
    String employeeName,
    String jobTitle,
    String department,
    PayrollFormulaEngine.PayrollResult calculationResult
) {
    /**
     * Creates export data from employee info and calculation result.
     */
    public static PayrollExportData of(
            String employeeCode,
            String employeeName,
            String jobTitle,
            String department,
            PayrollFormulaEngine.PayrollResult calculationResult) {
        return new PayrollExportData(
            employeeCode,
            employeeName,
            jobTitle,
            department,
            calculationResult
        );
    }

    /**
     * Helper to get net salary from calculation result.
     */
    public BigDecimal netSalary() {
        return calculationResult.netSalary();
    }

    /**
     * Helper to get basic salary from calculation result.
     */
    public BigDecimal basicSalary() {
        return calculationResult.basicSalary();
    }

    /**
     * Helper to get total additions from calculation result.
     */
    public BigDecimal totalAdditions() {
        return calculationResult.totalAdditions();
    }

    /**
     * Helper to get total deductions from calculation result.
     */
    public BigDecimal totalDeductions() {
        return calculationResult.totalDeductions();
    }

    /**
     * Helper to get overtime hours from calculation result.
     */
    public BigDecimal overtimeHours() {
        return calculationResult.overtimeHours();
    }

    /**
     * Helper to get absence days from calculation result.
     */
    public BigDecimal absenceDays() {
        return calculationResult.absenceDays();
    }

    /**
     * Helper to get advance deductions from calculation result.
     */
    public BigDecimal advanceDeductions() {
        return calculationResult.advanceDeductions();
    }

    /**
     * Helper to get daily wage from calculation result.
     */
    public BigDecimal dailyWage() {
        return calculationResult.dailyWage();
    }

    /**
     * Helper to get hourly wage from calculation result.
     */
    public BigDecimal hourlyWage() {
        return calculationResult.hourlyWage();
    }

    /**
     * Helper to get worked hours from calculation result.
     */
    public BigDecimal workedHours() {
        return calculationResult.workedHours();
    }
}