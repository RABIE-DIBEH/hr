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
                .baseSalary(new BigDecimal("1600.00"))
                .build();
    }

    @Test
    void calculateMonthlyPayroll_standardHours_noDeductions() {
        // 160 hours @ 1600 base = 10.00 hourly rate
        // 160 * 10 = 1600.00 net salary
        AttendanceRecord record = AttendanceRecord.builder()
                .recordId(1L)
                .workHours(new BigDecimal("160.00"))
                .build();

        when(attendanceRepository.findMonthlyRecordsByPayrollStatuses(anyLong(), anyInt(), anyInt(), anyList()))
                .thenReturn(List.of(record));
        when(payrollRepository.findByEmployeeEmployeeIdAndMonthAndYear(anyLong(), anyInt(), anyInt()))
                .thenReturn(Optional.empty());
        when(advanceRequestService.getUndeductedDeliveredAmountForEmployee(anyLong()))
                .thenReturn(BigDecimal.ZERO);
        when(payrollRepository.save(any(Payroll.class))).thenAnswer(i -> i.getArguments()[0]);

        Payroll result = payrollService.calculateMonthlyPayroll(employee, 5, 2024);

        assertNotNull(result);
        assertEquals(new BigDecimal("160.00"), result.getTotalWorkHours());
        assertEquals(new BigDecimal("1600.00"), result.getNetSalary());
        assertEquals(0, BigDecimal.ZERO.compareTo(result.getDeductions()));
        assertEquals(0, BigDecimal.ZERO.compareTo(result.getOvertimeHours()));
        verify(advanceRequestService).markDeliveredAdvancesAsDeducted(1L);
    }

    @Test
    void calculateMonthlyPayroll_withOvertime_andDeductions() {
        // 180 hours @ 1600 base = 10.00 hourly rate
        // 180 * 10 = 1800.00 gross
        // 1800 - 200 (advance) = 1600.00 net
        AttendanceRecord record = AttendanceRecord.builder()
                .recordId(1L)
                .workHours(new BigDecimal("180.00"))
                .build();

        when(attendanceRepository.findMonthlyRecordsByPayrollStatuses(anyLong(), anyInt(), anyInt(), anyList()))
                .thenReturn(List.of(record));
        when(payrollRepository.findByEmployeeEmployeeIdAndMonthAndYear(anyLong(), anyInt(), anyInt()))
                .thenReturn(Optional.empty());
        when(advanceRequestService.getUndeductedDeliveredAmountForEmployee(anyLong()))
                .thenReturn(new BigDecimal("200.00"));
        when(payrollRepository.save(any(Payroll.class))).thenAnswer(i -> i.getArguments()[0]);

        Payroll result = payrollService.calculateMonthlyPayroll(employee, 5, 2024);

        assertEquals(new BigDecimal("180.00"), result.getTotalWorkHours());
        assertEquals(new BigDecimal("20.00"), result.getOvertimeHours());
        assertEquals(new BigDecimal("200.00"), result.getDeductions());
        assertEquals(new BigDecimal("1600.00"), result.getNetSalary());
    }

    @Test
    void calculateMonthlyPayroll_noAttendance_resultsInZeroSalary() {
        when(attendanceRepository.findMonthlyRecordsByPayrollStatuses(anyLong(), anyInt(), anyInt(), anyList()))
                .thenReturn(Collections.emptyList());
        when(payrollRepository.findByEmployeeEmployeeIdAndMonthAndYear(anyLong(), anyInt(), anyInt()))
                .thenReturn(Optional.empty());
        when(advanceRequestService.getUndeductedDeliveredAmountForEmployee(anyLong()))
                .thenReturn(BigDecimal.ZERO);
        when(payrollRepository.save(any(Payroll.class))).thenAnswer(i -> i.getArguments()[0]);

        Payroll result = payrollService.calculateMonthlyPayroll(employee, 5, 2024);

        assertEquals(BigDecimal.ZERO, result.getTotalWorkHours());
        assertEquals(BigDecimal.ZERO.setScale(2), result.getNetSalary());
    }
}
