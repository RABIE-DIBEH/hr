package com.hrms.services;

import com.hrms.core.models.AttendanceRecord;
import com.hrms.core.models.Employee;
import com.hrms.core.models.Payroll;
import com.hrms.core.repositories.AttendanceRecordRepository;
import com.hrms.core.repositories.PayrollRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PayrollServiceTest {

    @Mock
    private AttendanceRecordRepository attendanceRepository;

    @Mock
    private PayrollRepository payrollRepository;

    @Mock
    private AdvanceRequestService advanceRequestService;

    @InjectMocks
    private PayrollService payrollService;

    private Employee employee;

    @BeforeEach
    void setUp() {
        employee = Employee.builder()
                .employeeId(1L)
                .fullName("Test Employee")
                .baseSalary(new BigDecimal("5000"))
                .build();
    }

    @Test
    void calculateMonthlyPayroll_standard160Hours_hasAbsenceDeductions() {
        // base = 5000. 
        // daily = 5000/26 = 192.31
        // workedHours = 160 -> workedDays = 20
        // absenceDays = 26 - 20 = 6
        // deductions = 6 * 192.31 = 1153.86
        // net = 5000 - 1153.86 = 3846.14 -> 3846 (truncated)
        AttendanceRecord record = AttendanceRecord.builder()
                .recordId(1L)
                .workHours(new BigDecimal("160"))
                .build();

        when(attendanceRepository.findMonthlyRecordsByPayrollStatuses(anyLong(), anyInt(), anyInt(), anyList()))
                .thenReturn(List.of(record));
        when(payrollRepository.findByEmployeeEmployeeIdAndMonthAndYear(anyLong(), anyInt(), anyInt()))
                .thenReturn(Optional.empty());
        when(advanceRequestService.getUndeductedDeliveredAmountForEmployee(anyLong(), anyInt(), anyInt()))
                .thenReturn(BigDecimal.ZERO);
        when(payrollRepository.save(any(Payroll.class))).thenAnswer(i -> i.getArguments()[0]);

        Payroll result = payrollService.calculateMonthlyPayroll(employee, 5, 2026);

        assertNotNull(result);
        assertEquals(new BigDecimal("160"), result.getTotalWorkHours());
        assertEquals(new BigDecimal("3846"), result.getNetSalary());
        assertEquals(new BigDecimal("1153"), result.getDeductions());
        assertEquals(new BigDecimal("0"), result.getOvertimeHours());
        verify(advanceRequestService).markDeliveredAdvancesAsDeducted(1L, 5, 2026);
    }

    @Test
    void calculateMonthlyPayroll_withOvertime_andDeductions() {
        // base = 5000. 
        // daily = 192.31, hourly = 24.04
        // workedHours = 200 -> overtime = 40. additions = 40 * 24.04 = 961.60
        // workedDays = 25 -> absence = 1. deductions = 1 * 192.31 = 192.31
        // net = 5000 + 961.60 - 192.31 = 5769.29 -> 5769 (truncated)
        AttendanceRecord record = AttendanceRecord.builder()
                .recordId(1L)
                .workHours(new BigDecimal("200"))
                .build();

        when(attendanceRepository.findMonthlyRecordsByPayrollStatuses(anyLong(), anyInt(), anyInt(), anyList()))
                .thenReturn(List.of(record));
        when(payrollRepository.findByEmployeeEmployeeIdAndMonthAndYear(anyLong(), anyInt(), anyInt()))
                .thenReturn(Optional.empty());
        when(advanceRequestService.getUndeductedDeliveredAmountForEmployee(anyLong(), anyInt(), anyInt()))
                .thenReturn(BigDecimal.ZERO);
        when(payrollRepository.save(any(Payroll.class))).thenAnswer(i -> i.getArguments()[0]);

        Payroll result = payrollService.calculateMonthlyPayroll(employee, 5, 2026);

        assertEquals(new BigDecimal("200"), result.getTotalWorkHours());
        assertEquals(new BigDecimal("40"), result.getOvertimeHours());
        assertEquals(new BigDecimal("192"), result.getDeductions()); // truncated from 192.31
        assertEquals(new BigDecimal("5769"), result.getNetSalary());
    }

    @Test
    void calculateMonthlyPayroll_absenceMonth() {
        // base = 5000
        // 120h = 15 days -> 11 absent days
        // deductions = 11 * 192.31 = 2115.41
        // net = 5000 - 2115.41 = 2884.59 -> 2884
        AttendanceRecord record = AttendanceRecord.builder()
                .recordId(1L)
                .workHours(new BigDecimal("120"))
                .build();

        when(attendanceRepository.findMonthlyRecordsByPayrollStatuses(anyLong(), anyInt(), anyInt(), anyList()))
                .thenReturn(List.of(record));
        when(payrollRepository.findByEmployeeEmployeeIdAndMonthAndYear(anyLong(), anyInt(), anyInt()))
                .thenReturn(Optional.empty());
        when(advanceRequestService.getUndeductedDeliveredAmountForEmployee(anyLong(), anyInt(), anyInt()))
                .thenReturn(BigDecimal.ZERO);
        when(payrollRepository.save(any(Payroll.class))).thenAnswer(i -> i.getArguments()[0]);

        Payroll result = payrollService.calculateMonthlyPayroll(employee, 5, 2026);

        assertEquals(new BigDecimal("120"), result.getTotalWorkHours());
        assertEquals(new BigDecimal("0"), result.getOvertimeHours());
        assertEquals(new BigDecimal("2115"), result.getDeductions());
        assertEquals(new BigDecimal("2884"), result.getNetSalary());
    }

    @Test
    void calculateMonthlyPayroll_withAdvances() {
        // standard 160h + 500 advance. 
        // deductions = 1153.86 + 500 = 1653.86 -> 1653
        // net = 3846.14 - 500 = 3346.14 -> 3346
        AttendanceRecord record = AttendanceRecord.builder()
                .recordId(1L)
                .workHours(new BigDecimal("160"))
                .build();

        when(attendanceRepository.findMonthlyRecordsByPayrollStatuses(anyLong(), anyInt(), anyInt(), anyList()))
                .thenReturn(List.of(record));
        when(payrollRepository.findByEmployeeEmployeeIdAndMonthAndYear(anyLong(), anyInt(), anyInt()))
                .thenReturn(Optional.empty());
        when(advanceRequestService.getUndeductedDeliveredAmountForEmployee(anyLong(), anyInt(), anyInt()))
                .thenReturn(new BigDecimal("500"));
        when(payrollRepository.save(any(Payroll.class))).thenAnswer(i -> i.getArguments()[0]);

        Payroll result = payrollService.calculateMonthlyPayroll(employee, 5, 2026);

        assertEquals(new BigDecimal("160"), result.getTotalWorkHours());
        assertEquals(new BigDecimal("0"), result.getOvertimeHours());
        assertEquals(new BigDecimal("1653"), result.getDeductions());
        assertEquals(new BigDecimal("3346"), result.getNetSalary());
    }

    @Test
    void calculateMonthlyPayroll_noAttendance_resultsInZeroSalary() {
        when(attendanceRepository.findMonthlyRecordsByPayrollStatuses(anyLong(), anyInt(), anyInt(), anyList()))
                .thenReturn(Collections.emptyList());
        when(payrollRepository.findByEmployeeEmployeeIdAndMonthAndYear(anyLong(), anyInt(), anyInt()))
                .thenReturn(Optional.empty());
        when(advanceRequestService.getUndeductedDeliveredAmountForEmployee(anyLong(), anyInt(), anyInt()))
                .thenReturn(BigDecimal.ZERO);
        when(payrollRepository.save(any(Payroll.class))).thenAnswer(i -> i.getArguments()[0]);

        Payroll result = payrollService.calculateMonthlyPayroll(employee, 5, 2026);

        assertEquals(new BigDecimal("0"), result.getTotalWorkHours());
        assertEquals(new BigDecimal("0"), result.getNetSalary());
    }
}
