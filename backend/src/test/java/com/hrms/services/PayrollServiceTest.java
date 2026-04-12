package com.hrms.services;

import com.hrms.core.models.AttendanceRecord;
import com.hrms.core.models.Employee;
import com.hrms.core.models.Payroll;
import com.hrms.core.repositories.AttendanceRecordRepository;
import com.hrms.core.repositories.EmployeeRepository;
import com.hrms.core.repositories.PayrollRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.ArrayList;
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

    @Mock
    private EmployeeRepository employeeRepository;

    @org.mockito.Spy
    private PayrollFormulaEngine payrollFormulaEngine = new PayrollFormulaEngine();

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
    void getPayrollPreview_standardMonth_countsWorkedDaysFromAttendanceRows() {
        stubMonthlyRecords(recordsForHours("8", 20));
        stubAdvanceDeductions(BigDecimal.ZERO);

        PayrollFormulaEngine.PayrollResult preview = payrollService.getPayrollPreview(employee, 5, 2026);

        assertEquals(new BigDecimal("160"), preview.workedHours());
        assertEquals(new BigDecimal("0"), preview.overtimeHours());
        assertEquals(new BigDecimal("6"), preview.absenceDays());
        assertEquals(new BigDecimal("1153"), preview.totalDeductions());
        assertEquals(new BigDecimal("3846"), preview.netSalary());
    }

    @Test
    void getPayrollPreview_overtimeMonth_keepsAbsenceBasedOnWorkedDayCount() {
        stubMonthlyRecords(recordsForHours("10", 20));
        stubAdvanceDeductions(BigDecimal.ZERO);

        PayrollFormulaEngine.PayrollResult preview = payrollService.getPayrollPreview(employee, 5, 2026);

        assertEquals(new BigDecimal("200"), preview.workedHours());
        assertEquals(new BigDecimal("40"), preview.overtimeHours());
        assertEquals(new BigDecimal("6"), preview.absenceDays());
        assertEquals(new BigDecimal("1153"), preview.totalDeductions());
        assertEquals(new BigDecimal("4807"), preview.netSalary());
    }

    @Test
    void getPayrollPreview_absenceMonth_usesWorkedAttendanceCount() {
        stubMonthlyRecords(recordsForHours("8", 15));
        stubAdvanceDeductions(BigDecimal.ZERO);

        PayrollFormulaEngine.PayrollResult preview = payrollService.getPayrollPreview(employee, 5, 2026);

        assertEquals(new BigDecimal("120"), preview.workedHours());
        assertEquals(new BigDecimal("0"), preview.overtimeHours());
        assertEquals(new BigDecimal("11"), preview.absenceDays());
        assertEquals(new BigDecimal("2115"), preview.totalDeductions());
        assertEquals(new BigDecimal("2884"), preview.netSalary());
    }

    @Test
    void getPayrollPreview_advanceDeductionMonth_addsDeliveredAdvances() {
        stubMonthlyRecords(recordsForHours("8", 20));
        stubAdvanceDeductions(new BigDecimal("500"));

        PayrollFormulaEngine.PayrollResult preview = payrollService.getPayrollPreview(employee, 5, 2026);

        assertEquals(new BigDecimal("160"), preview.workedHours());
        assertEquals(new BigDecimal("0"), preview.overtimeHours());
        assertEquals(new BigDecimal("6"), preview.absenceDays());
        assertEquals(new BigDecimal("1653"), preview.totalDeductions());
        assertEquals(new BigDecimal("3346"), preview.netSalary());
    }

    @Test
    void getPayrollPreview_zeroAttendanceMonth_returnsFullAbsenceDeduction() {
        stubMonthlyRecords(Collections.emptyList());
        stubAdvanceDeductions(BigDecimal.ZERO);

        PayrollFormulaEngine.PayrollResult preview = payrollService.getPayrollPreview(employee, 5, 2026);

        assertEquals(new BigDecimal("0"), preview.workedHours());
        assertEquals(new BigDecimal("0"), preview.overtimeHours());
        assertEquals(new BigDecimal("26"), preview.absenceDays());
        assertEquals(new BigDecimal("5000"), preview.totalDeductions());
        assertEquals(new BigDecimal("0"), preview.netSalary());
    }

    @Test
    void calculateMonthlyPayroll_persistsCalculatedFields_marksAttendanceProcessed_andDeductsAdvances() {
        List<AttendanceRecord> records = recordsForHours("8", 20);
        stubMonthlyRecords(records);
        stubAdvanceDeductions(new BigDecimal("500"));
        when(payrollRepository.findByEmployeeEmployeeIdAndMonthAndYear(anyLong(), anyInt(), anyInt()))
                .thenReturn(Optional.empty());
        when(payrollRepository.save(any(Payroll.class))).thenAnswer(i -> i.getArguments()[0]);
        when(attendanceRepository.saveAll(anyList())).thenAnswer(i -> i.getArguments()[0]);

        Payroll payroll = payrollService.calculateMonthlyPayroll(employee, 5, 2026);

        assertNotNull(payroll);
        assertEquals(new BigDecimal("160"), payroll.getTotalWorkHours());
        assertEquals(new BigDecimal("500"), payroll.getAdvanceDeductions());
        assertEquals(new BigDecimal("0"), payroll.getOvertimeHours());
        assertEquals(new BigDecimal("1653"), payroll.getDeductions());
        assertEquals(new BigDecimal("3346"), payroll.getNetSalary());
        assertTrue(records.stream().allMatch(record -> "PROCESSED".equals(record.getPayrollStatus())));
        verify(attendanceRepository).saveAll(records);
        verify(advanceRequestService).markDeliveredAdvancesAsDeducted(1L, 5, 2026);
    }

    private void stubMonthlyRecords(List<AttendanceRecord> records) {
        when(attendanceRepository.findMonthlyRecordsByPayrollStatuses(anyLong(), anyInt(), anyInt(), anyList()))
                .thenReturn(records);
    }

    private void stubAdvanceDeductions(BigDecimal advanceAmount) {
        when(advanceRequestService.getUndeductedDeliveredAmountForEmployee(anyLong(), anyInt(), anyInt()))
                .thenReturn(advanceAmount);
    }

    private List<AttendanceRecord> recordsForHours(String hoursPerDay, int days) {
        List<AttendanceRecord> records = new ArrayList<>();
        for (int index = 0; index < days; index++) {
            records.add(AttendanceRecord.builder()
                    .recordId((long) index + 1)
                    .workHours(new BigDecimal(hoursPerDay))
                    .payrollStatus("APPROVED_FOR_PAYROLL")
                    .build());
        }
        return records;
    }
}
