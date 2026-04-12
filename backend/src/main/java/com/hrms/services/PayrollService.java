package com.hrms.services;

import com.hrms.api.dto.PayrollBulkResult;
import com.hrms.core.models.AttendanceRecord;
import com.hrms.core.models.Employee;
import com.hrms.core.models.Payroll;
import com.hrms.core.repositories.AttendanceRecordRepository;
import com.hrms.core.repositories.EmployeeRepository;
import com.hrms.core.repositories.PayrollRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class PayrollService {

    private static final List<String> PAYROLL_ELIGIBLE_STATUSES = List.of("APPROVED_FOR_PAYROLL", "PROCESSED");

    private final AttendanceRecordRepository attendanceRepository;
    private final PayrollRepository payrollRepository;
    private final AdvanceRequestService advanceRequestService;
    private final EmployeeRepository employeeRepository;
    private final PayrollFormulaEngine payrollFormulaEngine;

    @Value("${app.payroll.locked:false}")
    private boolean payrollLocked;

    public PayrollService(AttendanceRecordRepository attendanceRepository,
            PayrollRepository payrollRepository,
            AdvanceRequestService advanceRequestService,
            EmployeeRepository employeeRepository,
            PayrollFormulaEngine payrollFormulaEngine) {
        this.attendanceRepository = attendanceRepository;
        this.payrollRepository = payrollRepository;
        this.advanceRequestService = advanceRequestService;
        this.employeeRepository = employeeRepository;
        this.payrollFormulaEngine = payrollFormulaEngine;
    }

    public boolean isPayrollLocked() {
        return payrollLocked;
    }

    @Transactional
    public PayrollFormulaEngine.PayrollResult getPayrollPreview(Employee employee, int month, int year) {
        List<AttendanceRecord> records = findPayrollEligibleRecords(employee.getEmployeeId(), month, year);
        return buildPayrollResult(employee, month, year, records);
    }

    @Transactional
    public Payroll calculateMonthlyPayroll(Employee employee, int month, int year) {
        List<AttendanceRecord> records = findPayrollEligibleRecords(employee.getEmployeeId(), month, year);
        PayrollFormulaEngine.PayrollResult result = buildPayrollResult(employee, month, year, records);

        Payroll payroll = payrollRepository
                .findByEmployeeEmployeeIdAndMonthAndYear(employee.getEmployeeId(), month, year)
                .orElse(Payroll.builder()
                        .employee(employee)
                        .month(month)
                        .year(year)
                        .build());

        payroll.setEmployee(employee);
        payroll.setTotalWorkHours(result.workedHours());
        payroll.setAdvanceDeductions(result.advanceDeductions());
        payroll.setOvertimeHours(result.overtimeHours());
        // We persist totalDeductions into the Deductions column
        payroll.setDeductions(result.totalDeductions());
        payroll.setNetSalary(result.netSalary());

        Payroll saved = payrollRepository.save(payroll);

        records.forEach(record -> record.setPayrollStatus("PROCESSED"));
        attendanceRepository.saveAll(records);
        advanceRequestService.markDeliveredAdvancesAsDeducted(employee.getEmployeeId(), month, year);

        return saved;
    }

    private List<AttendanceRecord> findPayrollEligibleRecords(Long employeeId, int month, int year) {
        return attendanceRepository.findMonthlyRecordsByPayrollStatuses(
                employeeId,
                month,
                year,
                PAYROLL_ELIGIBLE_STATUSES);
    }

    private PayrollFormulaEngine.PayrollResult buildPayrollResult(
            Employee employee,
            int month,
            int year,
            List<AttendanceRecord> records) {
        BigDecimal totalHours = records.stream()
                .map(AttendanceRecord::getWorkHours)
                .filter(hours -> hours != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal workedDays = BigDecimal.valueOf(records.stream()
                .map(AttendanceRecord::getWorkHours)
                .filter(this::hasPositiveHours)
                .count());

        BigDecimal baseSalary = employee.getBaseSalary() != null ? employee.getBaseSalary() : BigDecimal.ZERO;
        BigDecimal advanceDeductions = advanceRequestService
                .getUndeductedDeliveredAmountForEmployee(employee.getEmployeeId(), month, year);

        return payrollFormulaEngine.calculate(baseSalary, totalHours, workedDays, advanceDeductions);
    }

    private boolean hasPositiveHours(BigDecimal hours) {
        return hours != null && hours.compareTo(BigDecimal.ZERO) > 0;
    }

    /**
     * Get all payroll records for a specific employee
     */
    @Transactional(readOnly = true)
    public Page<Payroll> getEmployeePayrollHistory(Long employeeId, Pageable pageable) {
        return payrollRepository.findByEmployeeId(employeeId, pageable);
    }

    /**
     * Get all payroll records across all employees (HR/Admin only)
     * If departmentId is provided, filters by department
     */
    @Transactional(readOnly = true)
    public Page<Payroll> getAllPayrollHistory(Pageable pageable) {
        return payrollRepository.findAllPayrollRecords(pageable);
    }

    /**
     * Get all payroll records filtered by department
     */
    @Transactional(readOnly = true)
    public Page<Payroll> getAllPayrollHistoryByDepartment(Long departmentId, Pageable pageable) {
        return payrollRepository.findByDepartmentId(departmentId, pageable);
    }

    /**
     * Calculate payroll for ALL active employees for the given month/year.
     * Returns a summary of processed employees, skipped, and errors.
     */
    @Transactional
    public PayrollBulkResult calculateAllMonthlyPayroll(int month, int year, String requester) {
        List<Employee> allEmployees = employeeRepository.findAll();
        int successCount = 0;
        int errorCount = 0;

        for (Employee emp : allEmployees) {
            if ("Terminated".equalsIgnoreCase(emp.getStatus())) {
                continue;
            }
            try {
                calculateMonthlyPayroll(emp, month, year);
                successCount++;
            } catch (Exception e) {
                errorCount++;
            }
        }

        return new PayrollBulkResult(
                month,
                year,
                allEmployees.size(),
                successCount,
                errorCount,
                requester);
    }

    /**
     * Calculate payroll for active employees in a specific department.
     */
    @Transactional
    public PayrollBulkResult calculateAllMonthlyPayrollByDepartment(int month, int year, Long departmentId,
            String requester) {
        List<Employee> deptEmployees = employeeRepository.findByDepartmentIdAndStatus(departmentId, "Active");
        int successCount = 0;
        int errorCount = 0;

        for (Employee emp : deptEmployees) {
            try {
                calculateMonthlyPayroll(emp, month, year);
                successCount++;
            } catch (Exception e) {
                errorCount++;
            }
        }

        return new PayrollBulkResult(
                month,
                year,
                deptEmployees.size(),
                successCount,
                errorCount,
                requester);
    }

    @Transactional(readOnly = true)
    public Page<Payroll> getMonthlyPayroll(int month, int year, Pageable pageable) {
        return payrollRepository.findMonthlyPayrollPage(month, year, pageable);
    }

    /**
     * Get monthly payroll filtered by department
     */
    @Transactional(readOnly = true)
    public Page<Payroll> getMonthlyPayrollByDepartment(Long departmentId, int month, int year, Pageable pageable) {
        return payrollRepository.findMonthlyPayrollPageByDepartment(departmentId, month, year, pageable);
    }

    @Transactional
    public Payroll markPayrollAsPaid(Long employeeId, int month, int year) {
        // Join-fetch employee to avoid LazyInitializationException when controller maps
        // to DTO after tx closes.
        Payroll payroll = payrollRepository.findByEmployeeIdAndMonthAndYearFetchEmployee(employeeId, month, year)
                .orElseThrow(() -> new IllegalArgumentException("Payroll not found"));
        payroll.setPaid(true);
        payroll.setPaidAt(LocalDateTime.now());
        return payrollRepository.save(payroll);
    }

    @Transactional
    public int markAllPayrollAsPaid(int month, int year) {
        List<Payroll> slips = payrollRepository.findAllMonthlyPayroll(month, year);
        int updated = 0;
        for (Payroll p : slips) {
            if (!p.isPaid()) {
                p.setPaid(true);
                p.setPaidAt(LocalDateTime.now());
                updated++;
            }
        }
        payrollRepository.saveAll(slips);
        return updated;
    }

    @Transactional(readOnly = true)
    public java.math.BigDecimal getTotalNetSalaryForMonth(int month, int year) {
        return payrollRepository.sumNetSalaryForMonth(month, year);
    }

    @Transactional(readOnly = true)
    public long getPayrollCountForMonth(int month, int year) {
        return payrollRepository.countForMonth(month, year);
    }

    @Transactional(readOnly = true)
    public long getPaidPayrollCountForMonth(int month, int year) {
        return payrollRepository.countPaidForMonth(month, year);
    }

    // --- Department-scoped summary methods ---

    @Transactional(readOnly = true)
    public java.math.BigDecimal getTotalNetSalaryForMonthByDepartment(Long departmentId, int month, int year) {
        return payrollRepository.sumNetSalaryForMonthByDepartment(departmentId, month, year);
    }

    @Transactional(readOnly = true)
    public long getPayrollCountForMonthByDepartment(Long departmentId, int month, int year) {
        return payrollRepository.countForMonthByDepartment(departmentId, month, year);
    }

    @Transactional(readOnly = true)
    public long getPaidPayrollCountForMonthByDepartment(Long departmentId, int month, int year) {
        return payrollRepository.countPaidForMonthByDepartment(departmentId, month, year);
    }
}
