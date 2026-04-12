package com.hrms.workflows;

import com.hrms.AbstractContainerBaseTest;
import com.hrms.core.models.AttendanceRecord;
import com.hrms.core.models.Employee;
import com.hrms.core.models.Payroll;
import com.hrms.core.repositories.AttendanceRecordRepository;
import com.hrms.core.repositories.EmployeeRepository;
import com.hrms.core.repositories.PayrollRepository;
import com.hrms.services.PayrollService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Integration test for the complete payroll calculation workflow:
 * 1. Employee works (attendance records created)
 * 2. Payroll calculation triggered
 * 3. Payroll slip generated with correct calculations
 * 4. Deductions applied (advances)
 * 5. Net salary calculated
 * 6. Payroll marked as paid
 */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
class PayrollCalculationWorkflowIntegrationTest extends AbstractContainerBaseTest {

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private AttendanceRecordRepository attendanceRepository;

    @Autowired
    private PayrollRepository payrollRepository;

    @Autowired
    private PayrollService payrollService;

    private Employee employee;
    private final int testMonth = 4;
    private final int testYear = 2024;

    @BeforeEach
    void setUp() {
        attendanceRepository.deleteAll();
        payrollRepository.deleteAll();
        employeeRepository.deleteAll();

        // Create a test employee with base salary
        employee = Employee.builder()
                .fullName("Test Employee")
                .email("test@hrms.com")
                .passwordHash("hashed")
                .baseSalary(new BigDecimal("5000.00"))
                .status("Active")
                .roleId(4L) // EMPLOYEE role
                .build();
        employee = employeeRepository.save(employee);
    }

    @Test
    void payrollCalculationWorkflow_CompleteFlow() {
        // Step 1: Create attendance records for the employee
        createAttendanceRecords();

        // Step 2: Calculate payroll
        Payroll payroll = payrollService.calculateMonthlyPayroll(employee, testMonth, testYear);

        // Step 3: Verify payroll slip was created with correct calculations
        assertThat(payroll).isNotNull();
        assertThat(payroll.getEmployee().getEmployeeId()).isEqualTo(employee.getEmployeeId());
        assertThat(payroll.getMonth()).isEqualTo(testMonth);
        assertThat(payroll.getYear()).isEqualTo(testYear);
        
        // Verify total work hours (20 days * 8 hours = 160 hours)
        assertThat(payroll.getTotalWorkHours()).isEqualByComparingTo(new BigDecimal("160.00"));
        
        // Verify base calculations: 5000 base salary.
        // 160h = 20 worked days. Absence days = 26 - 20 = 6. 
        // Daily rate = 5000/26 = 192.31. Deductions = 6 * 192.31 = 1153.86
        // Net = 5000 - 1153.86 = 3846.14
        assertThat(payroll.getNetSalary()).isEqualByComparingTo(new BigDecimal("3846"));
        
        // Verify no overtime (exactly 160 hours)
        assertThat(payroll.getOvertimeHours()).isEqualByComparingTo(BigDecimal.ZERO);
        
        // Verify deductions for 6 absence days
        assertThat(payroll.getDeductions()).isEqualByComparingTo(new BigDecimal("1153"));

        // Step 4: Verify attendance records were marked as processed
        List<AttendanceRecord> processedRecords = attendanceRepository
                .findMonthlyRecordsByPayrollStatuses(employee.getEmployeeId(), testMonth, testYear, 
                    List.of("PROCESSED"));
        assertThat(processedRecords).hasSize(20); // All 20 records should be marked as PROCESSED

        // Step 5: Mark payroll as paid
        Payroll paidPayroll = payrollService.markPayrollAsPaid(employee.getEmployeeId(), testMonth, testYear);
        assertThat(paidPayroll.isPaid()).isTrue();
        assertThat(paidPayroll.getPaidAt()).isNotNull();

        // Step 6: Verify payroll can be retrieved
        var payrollPage = payrollService.getEmployeePayrollHistory(employee.getEmployeeId(), 
                org.springframework.data.domain.PageRequest.of(0, 10));
        assertThat(payrollPage.getTotalElements()).isEqualTo(1);
        assertThat(payrollPage.getContent().get(0).isPaid()).isTrue();
    }

    @Test
    void payrollCalculationWithOvertime_CalculatesCorrectly() {
        // Create attendance with overtime (20 days × 10h = 200h total)
        createAttendanceRecordsWithOvertime();

        Payroll payroll = payrollService.calculateMonthlyPayroll(employee, testMonth, testYear);

        // Verify calculations
        // Base: 5000
        // Daily: 5000/26 = 192.31. Hourly: 192.31/8 = 24.04
        // WorkedHours: 200, but WorkedDays comes from attendance row count = 20.
        // Overtime: 200 - 160 = 40. Additions: 40 * 24.04 = 961.60
        // Absence: 26 - 20 = 6. Deductions: 6 * 192.31 = 1153.86.
        // Total: 5000 + 961.60 - 1153.86 = 4807.74 -> 4807
        assertThat(payroll.getTotalWorkHours()).isEqualByComparingTo(new BigDecimal("200"));
        assertThat(payroll.getOvertimeHours()).isEqualByComparingTo(new BigDecimal("40"));
        assertThat(payroll.getDeductions()).isEqualByComparingTo(new BigDecimal("1153"));
        assertThat(payroll.getNetSalary()).isEqualByComparingTo(new BigDecimal("4807"));
    }

    @Test
    void payrollCalculationForAllEmployees_BulkProcessing() {
        // Create multiple employees
        Employee emp2 = Employee.builder()
                .fullName("Employee 2")
                .email("emp2@hrms.com")
                .passwordHash("hashed")
                .baseSalary(new BigDecimal("6000.00"))
                .status("Active")
                .roleId(4L)
                .build();
        employeeRepository.save(emp2);

        Employee terminatedEmp = Employee.builder()
                .fullName("Terminated Employee")
                .email("terminated@hrms.com")
                .passwordHash("hashed")
                .baseSalary(new BigDecimal("4000.00"))
                .status("Terminated")
                .roleId(4L)
                .build();
        employeeRepository.save(terminatedEmp);

        // Create attendance for active employees
        createAttendanceRecords();
        createAttendanceRecordsForEmployee(emp2);

        // Calculate payroll for all employees
        var result = payrollService.calculateAllMonthlyPayroll(testMonth, testYear, "test-user");

        // Verify bulk result
        assertThat(result.totalProcessed()).isEqualTo(3); // 2 active + 1 terminated
        assertThat(result.successCount()).isEqualTo(2); // Only active employees processed
        assertThat(result.errorCount()).isEqualTo(0);

        // Verify payrolls were created
        var payrolls = payrollRepository.findAll();
        assertThat(payrolls).hasSize(2); // Only for active employees
    }

    private void createAttendanceRecords() {
        for (int day = 1; day <= 20; day++) {
            AttendanceRecord record = AttendanceRecord.builder()
                    .employee(employee)
                    .checkIn(LocalDateTime.of(testYear, testMonth, day, 9, 0))
                    .checkOut(LocalDateTime.of(testYear, testMonth, day, 17, 0))
                    .workHours(new BigDecimal("8.0"))
                    .payrollStatus("APPROVED_FOR_PAYROLL")
                    .build();
            attendanceRepository.save(record);
        }
    }

    private void createAttendanceRecordsWithOvertime() {
        for (int day = 1; day <= 20; day++) {
            AttendanceRecord record = AttendanceRecord.builder()
                    .employee(employee)
                    .checkIn(LocalDateTime.of(testYear, testMonth, day, 9, 0))
                    .checkOut(LocalDateTime.of(testYear, testMonth, day, 19, 0)) // 10 hours
                    .workHours(new BigDecimal("10.0"))
                    .payrollStatus("APPROVED_FOR_PAYROLL")
                    .build();
            attendanceRepository.save(record);
        }
    }

    private void createAttendanceRecordsForEmployee(Employee emp) {
        for (int day = 1; day <= 15; day++) {
            AttendanceRecord record = AttendanceRecord.builder()
                    .employee(emp)
                    .checkIn(LocalDateTime.of(testYear, testMonth, day, 9, 0))
                    .checkOut(LocalDateTime.of(testYear, testMonth, day, 17, 0))
                    .workHours(new BigDecimal("8.0"))
                    .payrollStatus("APPROVED_FOR_PAYROLL")
                    .build();
            attendanceRepository.save(record);
        }
    }
}
