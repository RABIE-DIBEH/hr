package com.hrms.services;

import com.hrms.core.models.Employee;
import com.hrms.core.models.LeaveRequest;
import com.hrms.core.repositories.EmployeeRepository;
import com.hrms.core.repositories.LeaveRequestRepository;
import com.hrms.security.EmployeeUserDetails;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Tests for department-scoped pending leave listing for managers in {@link LeaveService}.
 * Verifies:
 * <ul>
 *   <li>Managers with a department use {@code findPendingRequestsForManagerInDepartment}</li>
 *   <li>Managers without a department use {@code findPendingRequestsForManager}</li>
 *   <li>Non-manager roles (e.g. HR) do not use the department-scoped query</li>
 * </ul>
 */
@ExtendWith(MockitoExtension.class)
class LeaveServiceDepartmentScopingTest {

    @Mock
    private LeaveRequestRepository leaveRequestRepository;

    @Mock
    private EmployeeRepository employeeRepository;

    @Mock
    private InboxService inboxService;

    @Mock
    private EmailService emailService;

    private LeaveService leaveService;

    @BeforeEach
    void setUp() {
        leaveService = new LeaveService(leaveRequestRepository, employeeRepository, inboxService, emailService);
    }

    private Employee managerEmployee(Long id, Long departmentId) {
        return Employee.builder()
                .employeeId(id)
                .fullName("Manager " + id)
                .email("m" + id + "@test.com")
                .passwordHash("secret")
                .departmentId(departmentId)
                .baseSalary(BigDecimal.valueOf(8000))
                .status("Active")
                .build();
    }

    private LeaveRequest pendingLeave(Employee requester) {
        LeaveRequest lr = new LeaveRequest();
        lr.setRequestId(1L);
        lr.setEmployee(requester);
        lr.setStatus("PENDING_MANAGER");
        return lr;
    }

    @Test
    void getPendingRequestsForManager_ManagerWithDepartment_UsesDepartmentScopedRepository() {
        Employee manager = managerEmployee(4L, 1L);
        EmployeeUserDetails principal = new EmployeeUserDetails(manager, "MANAGER", "Engineering", "Engineering");
        Pageable pageable = PageRequest.of(0, 20);

        Employee report = managerEmployee(10L, 1L);
        report.setManagerId(4L);
        Page<LeaveRequest> page = new PageImpl<>(List.of(pendingLeave(report)), pageable, 1);
        when(leaveRequestRepository.findPendingRequestsForManagerInDepartment(eq(4L), eq(1L), eq(pageable)))
                .thenReturn(page);

        Page<LeaveRequest> result = leaveService.getPendingRequestsForManager(4L, pageable, principal);

        assertEquals(1, result.getTotalElements());
        verify(leaveRequestRepository).findPendingRequestsForManagerInDepartment(eq(4L), eq(1L), eq(pageable));
        verify(leaveRequestRepository, never()).findPendingRequestsForManager(any(), any());
    }

    @Test
    void getPendingRequestsForManager_ManagerWithoutDepartment_UsesManagerOnlyRepository() {
        Employee manager = managerEmployee(4L, null);
        EmployeeUserDetails principal = new EmployeeUserDetails(manager, "MANAGER", "Engineering", "Engineering");
        Pageable pageable = PageRequest.of(0, 20);

        Employee report = managerEmployee(10L, null);
        report.setManagerId(4L);
        Page<LeaveRequest> page = new PageImpl<>(List.of(pendingLeave(report)), pageable, 1);
        when(leaveRequestRepository.findPendingRequestsForManager(eq(4L), eq(pageable))).thenReturn(page);

        Page<LeaveRequest> result = leaveService.getPendingRequestsForManager(4L, pageable, principal);

        assertEquals(1, result.getTotalElements());
        verify(leaveRequestRepository).findPendingRequestsForManager(eq(4L), eq(pageable));
        verify(leaveRequestRepository, never()).findPendingRequestsForManagerInDepartment(any(), any(), any());
    }

    @Test
    void getPendingRequestsForManager_HrPrincipal_DoesNotUseDepartmentScopedQuery() {
        Employee hr = managerEmployee(3L, 5L);
        EmployeeUserDetails hrPrincipal = new EmployeeUserDetails(hr, "HR", "HR", "HR");
        Pageable pageable = PageRequest.of(0, 20);

        Employee report = managerEmployee(10L, 5L);
        report.setManagerId(3L);
        Page<LeaveRequest> page = new PageImpl<>(List.of(pendingLeave(report)), pageable, 1);
        when(leaveRequestRepository.findPendingRequestsForManager(eq(3L), eq(pageable))).thenReturn(page);

        Page<LeaveRequest> result = leaveService.getPendingRequestsForManager(3L, pageable, hrPrincipal);

        assertEquals(1, result.getTotalElements());
        verify(leaveRequestRepository).findPendingRequestsForManager(eq(3L), eq(pageable));
        verify(leaveRequestRepository, never()).findPendingRequestsForManagerInDepartment(any(), any(), any());
    }
}
