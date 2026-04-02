package com.hrms.services;

import com.hrms.core.models.AttendanceRecord;
import com.hrms.core.models.Employee;
import com.hrms.core.models.Payroll;
import com.hrms.core.repositories.AttendanceRecordRepository;
import com.hrms.core.repositories.PayrollRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Service
public class PayrollService {

    private final AttendanceRecordRepository attendanceRepository;
    private final PayrollRepository payrollRepository;

    public PayrollService(AttendanceRecordRepository attendanceRepository, PayrollRepository payrollRepository) {
        this.attendanceRepository = attendanceRepository;
        this.payrollRepository = payrollRepository;
    }

    @Transactional
    public Payroll calculateMonthlyPayroll(Employee employee, int month, int year) {
        List<AttendanceRecord> records = attendanceRepository.findMonthlyRecords(employee.getEmployeeId(), month, year);

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

        payroll.setTotalWorkHours(totalHours);
        payroll.setNetSalary(netSalary);
        payroll.setOvertimeHours(totalHours.subtract(standardHours).max(BigDecimal.ZERO));
        payroll.setDeductions(BigDecimal.ZERO); 

        return payrollRepository.save(payroll);
    }
}
