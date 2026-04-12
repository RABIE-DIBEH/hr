package com.hrms.services;

import com.hrms.api.dto.PayrollBulkResult;
import com.hrms.api.exception.BusinessException;
import com.hrms.api.exception.ErrorCode;
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
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class PayrollService {

    private final AttendanceRecordRepository attendanceRepository;
    private final PayrollRepository payrollRepository;
    private final AdvanceRequestService advanceRequestService;
    private final EmployeeRepository employeeRepository;

    @Value("${app.payroll.locked:false}")
    private boolean payrollLocked;

    public PayrollService(AttendanceRecordRepository attendanceRepository,
                          PayrollRepository payrollRepository,
                          AdvanceRequestService advanceRequestService,
                          EmployeeRepository employeeRepository) {
        this.attendanceRepository = attendanceRepository;
        this.payrollRepository = payrollRepository;
        this.advanceRequestService = advanceRequestService;
        this.employeeRepository = employeeRepository;
    }

    public boolean isPayrollLocked() {
        return payrollLocked;
    }

    /**
     * Guard that throws PAYROLL_LOCKED whenever the engine is frozen.
     * Called at the top of every calculation method.
     */
    private void assertPayrollUnlocked() {
        if (payrollLocked) {
            throw new BusinessException(ErrorCode.PAYROLL_LOCKED,
                    "Payroll engine is locked pending formula verification (May 2026). Set app.payroll.locked=false to re-enable.");
        }
    }

    @Transactional
    public Payroll calculateMonthlyPayroll(Employee employee, int month, int year) {
        assertPayrollUnlocked();
        List<AttendanceRecord> records = attendanceRepository.findMonthlyRecordsByPayrollStatuses(
                employee.getEmployeeId(),
                month,
                year,
                List.of("APPROVED_FOR_PAYROLL", "PROCESSED")
        );

        BigDecimal totalHours = records.stream()
                .filter(r -> r.getWorkHours() != null)
                .map(AttendanceRecord::getWorkHours)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal standardHours = BigDecimal.valueOf(160);
        BigDecimal baseSalary = employee.getBaseSalary() != null ? employee.getBaseSalary() : BigDecimal.ZERO;
        
        BigDecimal hourlyRate = baseSalary.divide(standardHours, 2, RoundingMode.HALF_UP);
        BigDecimal netSalary = hourlyRate.multiply(totalHours).setScale(2, RoundingMode.HALF_UP);

        Payroll payroll = payrollRepository.findByEmployeeEmployeeIdAndMonthAndYear(employee.getEmployeeId(), month, year)
                .orElse(Payroll.builder()
                        .employee(employee)
                        .month(month)
                        .year(year)
                        .build());
        // Ensure we keep the fully-loaded Employee instance (avoid serializing a lazy proxy later).
        payroll.setEmployee(employee);

        BigDecimal advanceDeductions = advanceRequestService.getUndeductedDeliveredAmountForEmployee(employee.getEmployeeId(), month, year);
        BigDecimal payrollDeductions = advanceDeductions.max(BigDecimal.ZERO);
        BigDecimal netSalaryWithDeductions = netSalary.subtract(payrollDeductions).setScale(2, RoundingMode.HALF_UP);

        payroll.setTotalWorkHours(totalHours);
        payroll.setAdvanceDeductions(advanceDeductions);
        payroll.setOvertimeHours(totalHours.subtract(standardHours).max(BigDecimal.ZERO));
        payroll.setDeductions(payrollDeductions);
        payroll.setNetSalary(netSalaryWithDeductions);

        Payroll saved = payrollRepository.save(payroll);
        records.forEach(record -> record.setPayrollStatus("PROCESSED"));
        advanceRequestService.markDeliveredAdvancesAsDeducted(employee.getEmployeeId(), month, year);
        return saved;
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
        assertPayrollUnlocked();
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
                requester
        );
    }

    /**
     * Calculate payroll for active employees in a specific department.
     */
    @Transactional
    public PayrollBulkResult calculateAllMonthlyPayrollByDepartment(int month, int year, Long departmentId, String requester) {
        assertPayrollUnlocked();
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
                requester
        );
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
        // Join-fetch employee to avoid LazyInitializationException when controller maps to DTO after tx closes.
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
