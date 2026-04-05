package com.hrms.services;

import com.hrms.core.models.AttendanceRecord;
import com.hrms.core.models.Employee;
import com.hrms.core.models.Payroll;
import com.hrms.core.repositories.AttendanceRecordRepository;
import com.hrms.core.repositories.PayrollRepository;
import com.hrms.services.AdvanceRequestService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Service
public class PayrollService {

    private final AttendanceRecordRepository attendanceRepository;
    private final PayrollRepository payrollRepository;
    private final AdvanceRequestService advanceRequestService;

    public PayrollService(AttendanceRecordRepository attendanceRepository,
                          PayrollRepository payrollRepository,
                          AdvanceRequestService advanceRequestService) {
        this.attendanceRepository = attendanceRepository;
        this.payrollRepository = payrollRepository;
        this.advanceRequestService = advanceRequestService;
    }

    @Transactional
    public Payroll calculateMonthlyPayroll(Employee employee, int month, int year) {
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

        BigDecimal advanceDeductions = advanceRequestService.getUndeductedDeliveredAmountForEmployee(employee.getEmployeeId());
        BigDecimal payrollDeductions = advanceDeductions.max(BigDecimal.ZERO);
        BigDecimal netSalaryWithDeductions = netSalary.subtract(payrollDeductions).setScale(2, RoundingMode.HALF_UP);

        payroll.setTotalWorkHours(totalHours);
        payroll.setAdvanceDeductions(advanceDeductions);
        payroll.setOvertimeHours(totalHours.subtract(standardHours).max(BigDecimal.ZERO));
        payroll.setDeductions(payrollDeductions);
        payroll.setNetSalary(netSalaryWithDeductions);

        Payroll saved = payrollRepository.save(payroll);
        records.forEach(record -> record.setPayrollStatus("PROCESSED"));
        advanceRequestService.markDeliveredAdvancesAsDeducted(employee.getEmployeeId());
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
     */
    @Transactional(readOnly = true)
    public Page<Payroll> getAllPayrollHistory(Pageable pageable) {
        return payrollRepository.findAllPayrollRecords(pageable);
    }
}
