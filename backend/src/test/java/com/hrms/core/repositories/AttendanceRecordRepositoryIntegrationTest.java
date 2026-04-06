package com.hrms.core.repositories;

import com.hrms.AbstractContainerBaseTest;
import com.hrms.core.models.AttendanceRecord;
import com.hrms.core.models.Employee;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class AttendanceRecordRepositoryIntegrationTest extends AbstractContainerBaseTest {

    @Autowired
    private AttendanceRecordRepository repository;

    @Autowired
    private EmployeeRepository employeeRepository;

    private Employee employee;
    private Employee otherEmployee;

    @BeforeEach
    void setUp() {
        repository.deleteAll();
        employeeRepository.deleteAll();

        employee = employeeRepository.save(Employee.builder()
                .fullName("Test Employee")
                .email("test-att@hrms.com")
                .passwordHash("hashed")
                .managerId(100L)
                .baseSalary(new BigDecimal("5000"))
                .build());

        otherEmployee = employeeRepository.save(Employee.builder()
                .fullName("Other Employee")
                .email("other-att@hrms.com")
                .passwordHash("hashed")
                .managerId(100L)
                .baseSalary(new BigDecimal("4000"))
                .build());
    }

    @Test
    void findAllByEmployee_EmployeeIdOrderByCheckInDesc_Pagination() {
        // Create 8 attendance records for the employee
        for (int i = 0; i < 8; i++) {
            AttendanceRecord record = AttendanceRecord.builder()
                    .employee(employee)
                    .checkIn(LocalDateTime.now().minusDays(i))
                    .status("Normal")
                    .build();
            record.setCheckOut(LocalDateTime.now().minusDays(i).plusHours(8));
            repository.save(record);
        }

        Page<AttendanceRecord> page = repository.findAllByEmployee_EmployeeIdOrderByCheckInDesc(
                employee.getEmployeeId(), PageRequest.of(0, 3));

        assertThat(page.getTotalElements()).isEqualTo(8);
        assertThat(page.getContent()).hasSize(3);
        assertThat(page.hasNext()).isTrue();
        // Verify descending order
        assertThat(page.getContent().get(0).getCheckIn())
                .isAfterOrEqualTo(page.getContent().get(1).getCheckIn());
    }

    @Test
    void findAllMonthlyRecords_Pagination() {
        int currentMonth = LocalDateTime.now().getMonthValue();
        int currentYear = LocalDateTime.now().getYear();

        // Create 6 records for current month
        for (int i = 0; i < 6; i++) {
            AttendanceRecord record = AttendanceRecord.builder()
                    .employee(employee)
                    .checkIn(LocalDateTime.of(currentYear, currentMonth, i + 1, 9, 0))
                    .status("Normal")
                    .build();
            record.setCheckOut(LocalDateTime.of(currentYear, currentMonth, i + 1, 17, 0));
            repository.save(record);
        }
        // Create 3 records for a different month
        int otherMonth = currentMonth == 1 ? 12 : currentMonth - 1;
        for (int i = 0; i < 3; i++) {
            AttendanceRecord record = AttendanceRecord.builder()
                    .employee(employee)
                    .checkIn(LocalDateTime.of(currentYear, otherMonth, i + 1, 9, 0))
                    .status("Normal")
                    .build();
            record.setCheckOut(LocalDateTime.of(currentYear, otherMonth, i + 1, 17, 0));
            repository.save(record);
        }

        Page<AttendanceRecord> page = repository.findAllMonthlyRecords(
                currentMonth, currentYear, PageRequest.of(0, 4));

        assertThat(page.getTotalElements()).isEqualTo(6);
        assertThat(page.getContent()).hasSize(4);
        assertThat(page.hasNext()).isTrue();
    }

    @Test
    void findActiveSessionByEmployeeId_ReturnsNullWhenNoActiveSession() {
        var found = repository.findActiveSessionByEmployeeId(employee.getEmployeeId());
        assertThat(found).isEmpty();
    }

    @Test
    void findActiveSessionByEmployeeId_ReturnsSessionWithNullCheckOut() {
        AttendanceRecord active = AttendanceRecord.builder()
                .employee(employee)
                .checkIn(LocalDateTime.now())
                .status("Active")
                .build();
        repository.save(active);

        var found = repository.findActiveSessionByEmployeeId(employee.getEmployeeId());
        assertThat(found).isPresent();
        assertThat(found.get().getCheckOut()).isNull();
    }

    @Test
    void calculateWorkHours_CorrectlyComputesDuration() {
        LocalDateTime checkIn = LocalDateTime.of(2024, 5, 1, 9, 0);
        LocalDateTime checkOut = LocalDateTime.of(2024, 5, 1, 17, 30);

        AttendanceRecord record = AttendanceRecord.builder()
                .employee(employee)
                .checkIn(checkIn)
                .build();
        record.setCheckOut(checkOut);
        record.calculateWorkHours();

        assertThat(record.getWorkHours()).isEqualByComparingTo(BigDecimal.valueOf(8.5));
    }
}
