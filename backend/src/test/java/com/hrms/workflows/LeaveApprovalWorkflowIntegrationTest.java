package com.hrms.workflows;

import com.hrms.AbstractContainerBaseTest;
import com.hrms.core.models.Employee;
import com.hrms.core.models.LeaveRequest;
import com.hrms.core.repositories.EmployeeRepository;
import com.hrms.core.repositories.LeaveRequestRepository;
import com.hrms.security.EmployeeUserDetails;
import com.hrms.services.LeaveService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Integration test for the complete leave approval workflow:
 * 1. Employee submits leave request → PENDING_MANAGER
 * 2. Manager approves → PENDING_HR
 * 3. HR approves → APPROVED
 * 4. Leave balance updated
 */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
class LeaveApprovalWorkflowIntegrationTest extends AbstractContainerBaseTest {

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private LeaveRequestRepository leaveRequestRepository;

    @Autowired
    private LeaveService leaveService;

    private Employee employee;
    private Employee manager;
    private Employee hrEmployee;
    private EmployeeUserDetails managerUserDetails;
    private EmployeeUserDetails hrUserDetails;

    @BeforeEach
    void setUp() {
        leaveRequestRepository.deleteAll();
        employeeRepository.deleteAll();

        // Create manager
        manager = Employee.builder()
                .fullName("Test Manager")
                .email("manager@hrms.com")
                .passwordHash("hashed")
                .baseSalary(new BigDecimal("7000.00"))
                .status("Active")
                .roleId(4L) // MANAGER role
                .build();
        manager = employeeRepository.save(manager);

        // Create HR employee
        hrEmployee = Employee.builder()
                .fullName("Test HR")
                .email("hr@hrms.com")
                .passwordHash("hashed")
                .baseSalary(new BigDecimal("6000.00"))
                .status("Active")
                .roleId(2L) // HR role
                .build();
        hrEmployee = employeeRepository.save(hrEmployee);

        // Create regular employee with manager
        employee = Employee.builder()
                .fullName("Test Employee")
                .email("employee@hrms.com")
                .passwordHash("hashed")
                .baseSalary(new BigDecimal("5000.00"))
                .status("Active")
                .roleId(5L) // EMPLOYEE role
                .managerId(manager.getEmployeeId())
                .leaveBalanceDays(20.0) // Initial leave balance
                .overtimeBalanceHours(10.0) // Initial overtime balance
                .build();
        employee = employeeRepository.save(employee);

        // Create user details for authentication
        managerUserDetails = new EmployeeUserDetails(manager, "MANAGER", "Test Team");
        hrUserDetails = new EmployeeUserDetails(hrEmployee, "HR", "HR Team");
    }

    @Test
    void leaveApprovalWorkflow_CompleteFlow() {
        // Step 1: Employee submits leave request
        LeaveRequest leaveRequest = new LeaveRequest();
        leaveRequest.setLeaveType("ANNUAL");
        leaveRequest.setStartDate(LocalDate.now().plusDays(1));
        leaveRequest.setEndDate(LocalDate.now().plusDays(5));
        leaveRequest.setDuration(5.0);
        leaveRequest.setReason("Vacation");
        
        LeaveRequest savedRequest = leaveService.submitRequest(employee, leaveRequest);
        
        // Verify initial state
        assertThat(savedRequest.getStatus()).isEqualTo("PENDING_MANAGER");
        assertThat(savedRequest.getRequestedAt()).isNotNull();
        assertThat(savedRequest.getProcessedAt()).isNull();

        // Step 2: Manager approves the request
        var managerApproved = leaveService.processRequest(
                savedRequest.getRequestId(),
                "APPROVED",
                "Manager approved - have a good vacation!",
                managerUserDetails
        );
        
        assertThat(managerApproved).isPresent();
        LeaveRequest managerApprovedRequest = managerApproved.get();
        assertThat(managerApprovedRequest.getStatus()).isEqualTo("PENDING_HR");
        assertThat(managerApprovedRequest.getManagerNote()).contains("Manager approved");
        assertThat(managerApprovedRequest.getProcessedAt()).isNotNull();

        // Step 3: HR approves the request
        var hrApproved = leaveService.processRequest(
                savedRequest.getRequestId(),
                "APPROVED",
                "HR approved - balance updated",
                hrUserDetails
        );
        
        assertThat(hrApproved).isPresent();
        LeaveRequest hrApprovedRequest = hrApproved.get();
        assertThat(hrApprovedRequest.getStatus()).isEqualTo("APPROVED");
        assertThat(hrApprovedRequest.getManagerNote()).contains("HR approved");
        assertThat(hrApprovedRequest.getProcessedAt()).isNotNull();

        // Step 4: Verify leave balance was deducted
        Employee updatedEmployee = employeeRepository.findById(employee.getEmployeeId()).orElseThrow();
        assertThat(updatedEmployee.getLeaveBalanceDays()).isEqualTo(15.0); // 20 - 5 = 15

        // Step 5: Verify the request appears in approved lists
        var approvedRequests = leaveRequestRepository.findAllInRange(
                LocalDate.now().plusDays(1),
                LocalDate.now().plusDays(5)
        );
        assertThat(approvedRequests).hasSize(1);
        assertThat(approvedRequests.get(0).getStatus()).isEqualTo("APPROVED");
    }

    @Test
    void leaveApprovalWorkflow_ManagerRejects() {
        // Employee submits leave request
        LeaveRequest leaveRequest = new LeaveRequest();
        leaveRequest.setLeaveType("ANNUAL");
        leaveRequest.setStartDate(LocalDate.now().plusDays(1));
        leaveRequest.setEndDate(LocalDate.now().plusDays(3));
        leaveRequest.setDuration(3.0);
        leaveRequest.setReason("Personal");
        
        LeaveRequest savedRequest = leaveService.submitRequest(employee, leaveRequest);

        // Manager rejects the request
        var rejected = leaveService.processRequest(
                savedRequest.getRequestId(),
                "REJECTED",
                "Not enough staff during that period",
                managerUserDetails
        );
        
        assertThat(rejected).isPresent();
        LeaveRequest rejectedRequest = rejected.get();
        assertThat(rejectedRequest.getStatus()).isEqualTo("REJECTED");
        assertThat(rejectedRequest.getManagerNote()).contains("Not enough staff");
        assertThat(rejectedRequest.getProcessedAt()).isNotNull();

        // Verify leave balance was NOT deducted
        Employee updatedEmployee = employeeRepository.findById(employee.getEmployeeId()).orElseThrow();
        assertThat(updatedEmployee.getLeaveBalanceDays()).isEqualTo(20.0); // Unchanged
    }

    @Test
    void leaveApprovalWorkflow_HrRejectsAfterManagerApproval() {
        // Employee submits leave request
        LeaveRequest leaveRequest = new LeaveRequest();
        leaveRequest.setLeaveType("ANNUAL");
        leaveRequest.setStartDate(LocalDate.now().plusDays(1));
        leaveRequest.setEndDate(LocalDate.now().plusDays(5));
        leaveRequest.setDuration(5.0);
        leaveRequest.setReason("Vacation");
        
        LeaveRequest savedRequest = leaveService.submitRequest(employee, leaveRequest);

        // Manager approves
        leaveService.processRequest(
                savedRequest.getRequestId(),
                "APPROVED",
                "Manager approved",
                managerUserDetails
        );

        // HR rejects
        var hrRejected = leaveService.processRequest(
                savedRequest.getRequestId(),
                "REJECTED",
                "Policy violation - insufficient balance",
                hrUserDetails
        );
        
        assertThat(hrRejected).isPresent();
        LeaveRequest rejectedRequest = hrRejected.get();
        assertThat(rejectedRequest.getStatus()).isEqualTo("REJECTED");
        assertThat(rejectedRequest.getManagerNote()).contains("Policy violation");
        assertThat(rejectedRequest.getProcessedAt()).isNotNull();

        // Verify leave balance was NOT deducted
        Employee updatedEmployee = employeeRepository.findById(employee.getEmployeeId()).orElseThrow();
        assertThat(updatedEmployee.getLeaveBalanceDays()).isEqualTo(20.0); // Unchanged
    }

    @Test
    void leaveApprovalWorkflow_OvertimeLeave_DeductsOvertimeBalance() {
        // Employee submits overtime leave request
        LeaveRequest leaveRequest = new LeaveRequest();
        leaveRequest.setLeaveType("HOURLY");
        leaveRequest.setStartDate(LocalDate.now().plusDays(1));
        leaveRequest.setEndDate(LocalDate.now().plusDays(1));
        leaveRequest.setDuration(8.0); // 8 hours
        leaveRequest.setReason("Doctor appointment");
        
        LeaveRequest savedRequest = leaveService.submitRequest(employee, leaveRequest);

        // Manager approves
        leaveService.processRequest(
                savedRequest.getRequestId(),
                "APPROVED",
                "Manager approved",
                managerUserDetails
        );

        // HR approves (final approval)
        leaveService.processRequest(
                savedRequest.getRequestId(),
                "APPROVED",
                "HR approved",
                hrUserDetails
        );

        // Verify overtime balance was deducted, not regular leave balance
        Employee updatedEmployee = employeeRepository.findById(employee.getEmployeeId()).orElseThrow();
        assertThat(updatedEmployee.getLeaveBalanceDays()).isEqualTo(20.0); // Unchanged
        assertThat(updatedEmployee.getOvertimeBalanceHours()).isEqualTo(2.0); // 10 - 8 = 2
    }

    @Test
    void leaveApprovalWorkflow_EmployeeWithoutManager_GoesStraightToHr() {
        // Create employee without manager
        Employee noManagerEmployee = Employee.builder()
                .fullName("No Manager Employee")
                .email("nomanager@hrms.com")
                .passwordHash("hashed")
                .baseSalary(new BigDecimal("4000.00"))
                .status("Active")
                .roleId(5L)
                .leaveBalanceDays(15.0)
                .build();
        noManagerEmployee = employeeRepository.save(noManagerEmployee);

        // Employee submits leave request
        LeaveRequest leaveRequest = new LeaveRequest();
        leaveRequest.setLeaveType("SICK");
        leaveRequest.setStartDate(LocalDate.now().plusDays(1));
        leaveRequest.setEndDate(LocalDate.now().plusDays(2));
        leaveRequest.setDuration(2.0);
        leaveRequest.setReason("Sick leave");
        
        LeaveRequest savedRequest = leaveService.submitRequest(noManagerEmployee, leaveRequest);

        // Should go straight to PENDING_HR (no manager)
        assertThat(savedRequest.getStatus()).isEqualTo("PENDING_HR");

        // HR can approve directly
        var hrApproved = leaveService.processRequest(
                savedRequest.getRequestId(),
                "APPROVED",
                "HR approved sick leave",
                hrUserDetails
        );
        
        assertThat(hrApproved).isPresent();
        assertThat(hrApproved.get().getStatus()).isEqualTo("APPROVED");
    }

    @Test
    void leaveApprovalWorkflow_MultipleRequests_Pagination() {
        // Create multiple leave requests
        for (int i = 1; i <= 7; i++) {
            LeaveRequest lr = new LeaveRequest();
            lr.setEmployee(employee);
            lr.setLeaveType("ANNUAL");
            lr.setStartDate(LocalDate.now().plusDays(i));
            lr.setEndDate(LocalDate.now().plusDays(i + 2));
            lr.setDuration(3.0);
            lr.setReason("Request " + i);
            lr.setStatus("PENDING_MANAGER");
            leaveRequestRepository.save(lr);
        }

        // Test pagination for manager's pending requests
        var page = leaveRequestRepository.findPendingRequestsForManager(
                manager.getEmployeeId(),
                org.springframework.data.domain.PageRequest.of(0, 3)
        );
        
        assertThat(page.getTotalElements()).isEqualTo(7);
        assertThat(page.getContent()).hasSize(3);
        assertThat(page.hasNext()).isTrue();
        assertThat(page.getContent()).allMatch(lr -> "PENDING_MANAGER".equals(lr.getStatus()));
    }

    @Test
    void leaveApprovalWorkflow_UnauthorizedAccess_Prevented() {
        // Create another manager who is NOT this employee's manager
        Employee otherManager = Employee.builder()
                .fullName("Other Manager")
                .email("othermanager@hrms.com")
                .passwordHash("hashed")
                .baseSalary(new BigDecimal("7500.00"))
                .status("Active")
                .roleId(4L)
                .build();
        employeeRepository.save(otherManager);
        
        EmployeeUserDetails otherManagerUserDetails = new EmployeeUserDetails(otherManager, "MANAGER", "Other Team");

        // Employee submits leave request
        LeaveRequest leaveRequest = new LeaveRequest();
        leaveRequest.setLeaveType("ANNUAL");
        leaveRequest.setStartDate(LocalDate.now().plusDays(1));
        leaveRequest.setEndDate(LocalDate.now().plusDays(3));
        leaveRequest.setDuration(3.0);
        leaveRequest.setReason("Test");
        
        LeaveRequest savedRequest = leaveService.submitRequest(employee, leaveRequest);

        // Other manager tries to process - should fail
        try {
            leaveService.processRequest(
                    savedRequest.getRequestId(),
                    "APPROVED",
                    "Trying to approve",
                    otherManagerUserDetails
            );
        } catch (org.springframework.security.access.AccessDeniedException e) {
            // Expected - unauthorized access prevented
            assertThat(e.getMessage()).contains("Cannot process this leave request");
        }

        // Verify request is still pending
        LeaveRequest unchanged = leaveRequestRepository.findById(savedRequest.getRequestId()).orElseThrow();
        assertThat(unchanged.getStatus()).isEqualTo("PENDING_MANAGER");
    }
}