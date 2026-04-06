package com.hrms.core.repositories;

import com.hrms.AbstractContainerBaseTest;
import com.hrms.core.models.Employee;
import com.hrms.core.models.LeaveRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

class LeaveRequestRepositoryIntegrationTest extends AbstractContainerBaseTest {

    @Autowired
    private LeaveRequestRepository repository;

    @Autowired
    private EmployeeRepository employeeRepository;

    private Employee employee;
    private Employee managerEmployee;

    @BeforeEach
    void setUp() {
        repository.deleteAll();
        employeeRepository.deleteAll();

        employee = employeeRepository.save(Employee.builder()
                .fullName("Leave Requester")
                .email("leave@hrms.com")
                .passwordHash("hashed")
                .managerId(100L)
                .baseSalary(new BigDecimal("5000"))
                .build());

        managerEmployee = employeeRepository.save(Employee.builder()
                .fullName("Manager")
                .email("manager-leave@hrms.com")
                .passwordHash("hashed")
                .baseSalary(new BigDecimal("7000"))
                .build());
    }

    @Test
    void findAllByEmployeeId_Pagination() {
        // Create 7 leave requests for the employee
        for (int i = 0; i < 7; i++) {
            LeaveRequest lr = new LeaveRequest();
            lr.setEmployee(employee);
            lr.setLeaveType("ANNUAL");
            lr.setStartDate(LocalDate.now().plusDays(i));
            lr.setEndDate(LocalDate.now().plusDays(i + 1));
            lr.setDuration(2.0);
            lr.setReason("Vacation " + i);
            lr.setStatus("PENDING_MANAGER");
            repository.save(lr);
        }

        Page<LeaveRequest> page = repository.findAllByEmployeeId(
                employee.getEmployeeId(), PageRequest.of(0, 3));

        assertThat(page.getTotalElements()).isEqualTo(7);
        assertThat(page.getContent()).hasSize(3);
        assertThat(page.hasNext()).isTrue();
    }

    @Test
    void findPendingRequestsForManager_OnlyReturnsPending() {
        Long managerId = managerEmployee.getEmployeeId();

        // Create 3 pending requests
        for (int i = 0; i < 3; i++) {
            LeaveRequest lr = new LeaveRequest();
            lr.setEmployee(employee);
            lr.setLeaveType("ANNUAL");
            lr.setStartDate(LocalDate.now().plusDays(i));
            lr.setEndDate(LocalDate.now().plusDays(i + 1));
            lr.setDuration(1.0);
            lr.setStatus("PENDING_MANAGER");
            lr.setEmployee(employee);
            // Set managerId on employee for this test
            employee.setManagerId(managerId);
            employeeRepository.save(employee);
            repository.save(lr);
        }

        // Create 1 approved request
        LeaveRequest approved = new LeaveRequest();
        approved.setEmployee(employee);
        approved.setLeaveType("SICK");
        approved.setStartDate(LocalDate.now().plusDays(10));
        approved.setEndDate(LocalDate.now().plusDays(11));
        approved.setDuration(2.0);
        approved.setStatus("APPROVED");
        repository.save(approved);

        Page<LeaveRequest> page = repository.findPendingRequestsForManager(
                managerId, PageRequest.of(0, 10));

        assertThat(page.getTotalElements()).isEqualTo(3);
        assertThat(page.getContent()).allMatch(lr -> "PENDING_MANAGER".equals(lr.getStatus()));
    }

    @Test
    void findPendingRequestsForHr_OnlyReturnsPendingHr() {
        // Create 2 PENDING_HR requests
        for (int i = 0; i < 2; i++) {
            LeaveRequest lr = new LeaveRequest();
            lr.setEmployee(employee);
            lr.setLeaveType("EMERGENCY");
            lr.setStartDate(LocalDate.now().plusDays(i));
            lr.setEndDate(LocalDate.now().plusDays(i));
            lr.setDuration(1.0);
            lr.setStatus("PENDING_HR");
            repository.save(lr);
        }

        // Create 1 PENDING_MANAGER request (should NOT be returned)
        LeaveRequest managerPending = new LeaveRequest();
        managerPending.setEmployee(employee);
        managerPending.setLeaveType("ANNUAL");
        managerPending.setStartDate(LocalDate.now().plusDays(5));
        managerPending.setEndDate(LocalDate.now().plusDays(6));
        managerPending.setDuration(2.0);
        managerPending.setStatus("PENDING_MANAGER");
        repository.save(managerPending);

        Page<LeaveRequest> page = repository.findPendingRequestsForHr(
                PageRequest.of(0, 10));

        assertThat(page.getTotalElements()).isEqualTo(2);
        assertThat(page.getContent()).allMatch(lr -> "PENDING_HR".equals(lr.getStatus()));
    }

    @Test
    void findAllInRange_ReturnsOverlappingRequests() {
        LocalDate rangeStart = LocalDate.of(2024, 6, 1);
        LocalDate rangeEnd = LocalDate.of(2024, 6, 30);

        // Request within range
        LeaveRequest within = new LeaveRequest();
        within.setEmployee(employee);
        within.setLeaveType("ANNUAL");
        within.setStartDate(LocalDate.of(2024, 6, 10));
        within.setEndDate(LocalDate.of(2024, 6, 15));
        within.setDuration(5.0);
        within.setStatus("APPROVED");
        repository.save(within);

        // Request outside range
        LeaveRequest outside = new LeaveRequest();
        outside.setEmployee(employee);
        outside.setLeaveType("ANNUAL");
        outside.setStartDate(LocalDate.of(2024, 8, 1));
        outside.setEndDate(LocalDate.of(2024, 8, 5));
        outside.setDuration(5.0);
        outside.setStatus("APPROVED");
        repository.save(outside);

        // Rejected request within range (should be excluded)
        LeaveRequest rejected = new LeaveRequest();
        rejected.setEmployee(employee);
        rejected.setLeaveType("ANNUAL");
        rejected.setStartDate(LocalDate.of(2024, 6, 20));
        rejected.setEndDate(LocalDate.of(2024, 6, 22));
        rejected.setDuration(3.0);
        rejected.setStatus("REJECTED");
        repository.save(rejected);

        var results = repository.findAllInRange(rangeStart, rangeEnd);
        assertThat(results).hasSize(1);
        assertThat(results.get(0).getLeaveType()).isEqualTo("ANNUAL");
    }

    @Test
    void prePersist_SetsRequestedAt() {
        LeaveRequest lr = new LeaveRequest();
        lr.setEmployee(employee);
        lr.setLeaveType("ANNUAL");
        lr.setStartDate(LocalDate.now().plusDays(1));
        lr.setEndDate(LocalDate.now().plusDays(2));
        lr.setDuration(2.0);
        lr.setStatus("PENDING_MANAGER");
        repository.save(lr);

        assertThat(lr.getRequestedAt()).isNotNull();
        assertThat(lr.getRequestedAt()).isBeforeOrEqualTo(LocalDateTime.now());
    }
}
