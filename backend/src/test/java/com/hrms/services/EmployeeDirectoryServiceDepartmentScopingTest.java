package com.hrms.services;

import com.hrms.api.dto.EmployeeSummaryResponse;
import com.hrms.core.models.Employee;
import com.hrms.core.repositories.DepartmentRepository;
import com.hrms.core.repositories.EmployeeDeletionLogRepository;
import com.hrms.core.repositories.EmployeeRepository;
import com.hrms.core.repositories.NFCCardRepository;
import com.hrms.core.repositories.RoleRepository;
import com.hrms.core.repositories.SystemLogRepository;
import com.hrms.core.repositories.TeamRepository;
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
import org.springframework.security.crypto.password.PasswordEncoder;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Tests for department-scoped employee listing in {@link EmployeeDirectoryService}.
 * Verifies:
 * <ul>
 *   <li>Managers with a department see only their department in {@code listAllSummaries}</li>
 *   <li>Managers without a department fall back to full listing (same as HR)</li>
 *   <li>HR sees all employees (not department-filtered)</li>
 *   <li>{@code listDirectReports} uses department + manager when the manager has a department</li>
 *   <li>{@code listDirectReports} falls back to manager-only when the manager has no department</li>
 * </ul>
 */
@ExtendWith(MockitoExtension.class)
class EmployeeDirectoryServiceDepartmentScopingTest {

    @Mock
    private EmployeeRepository employeeRepository;

    @Mock
    private TeamRepository teamRepository;

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private DepartmentRepository departmentRepository;

    @Mock
    private NFCCardRepository nfcCardRepository;

    @Mock
    private EmployeeDeletionLogRepository employeeDeletionLogRepository;

    @Mock
    private SystemLogRepository systemLogRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    private EmployeeDirectoryService service;

    @BeforeEach
    void setUp() {
        service = new EmployeeDirectoryService(
                employeeRepository,
                teamRepository,
                roleRepository,
                departmentRepository,
                nfcCardRepository,
                employeeDeletionLogRepository,
                systemLogRepository,
                passwordEncoder
        );
        when(nfcCardRepository.findByEmployee_EmployeeId(anyLong())).thenReturn(Optional.empty());
    }

    private Employee employee(Long id, Long departmentId, Long managerId) {
        return Employee.builder()
                .employeeId(id)
                .fullName("User " + id)
                .email("u" + id + "@test.com")
                .passwordHash("secret")
                .departmentId(departmentId)
                .managerId(managerId)
                .baseSalary(BigDecimal.valueOf(5000))
                .status("Active")
                .build();
    }

    @Test
    void listAllSummaries_ManagerWithDepartment_UsesFindByDepartmentId() {
        Employee manager = employee(4L, 1L, null);
        EmployeeUserDetails principal = new EmployeeUserDetails(manager, "MANAGER", "T", "D");
        Pageable pageable = PageRequest.of(0, 20);
        Page<Employee> page = new PageImpl<>(List.of(employee(10L, 1L, 4L)), pageable, 1);
        when(employeeRepository.findByDepartmentId(eq(1L), eq(pageable))).thenReturn(page);

        Page<EmployeeSummaryResponse> result = service.listAllSummaries(pageable, principal);

        assertEquals(1, result.getTotalElements());
        verify(employeeRepository).findByDepartmentId(eq(1L), eq(pageable));
        verify(employeeRepository, never()).findAll(any(Pageable.class));
    }

    @Test
    void listAllSummaries_ManagerWithoutDepartment_UsesFindAll() {
        Employee manager = employee(4L, null, null);
        EmployeeUserDetails principal = new EmployeeUserDetails(manager, "MANAGER", "T", "D");
        Pageable pageable = PageRequest.of(0, 20);
        Page<Employee> page = new PageImpl<>(List.of(employee(10L, 2L, null)), pageable, 1);
        when(employeeRepository.findAll(eq(pageable))).thenReturn(page);

        Page<EmployeeSummaryResponse> result = service.listAllSummaries(pageable, principal);

        assertEquals(1, result.getTotalElements());
        verify(employeeRepository).findAll(eq(pageable));
        verify(employeeRepository, never()).findByDepartmentId(anyLong(), any(Pageable.class));
    }

    @Test
    void listAllSummaries_HrPrincipal_UsesFindAll() {
        Employee hr = employee(3L, 1L, null);
        EmployeeUserDetails principal = new EmployeeUserDetails(hr, "HR", "T", "D");
        Pageable pageable = PageRequest.of(0, 20);
        Page<Employee> page = new PageImpl<>(List.of(employee(10L, 1L, null), employee(11L, 2L, null)), pageable, 2);
        when(employeeRepository.findAll(eq(pageable))).thenReturn(page);

        Page<EmployeeSummaryResponse> result = service.listAllSummaries(pageable, principal);

        assertEquals(2, result.getTotalElements());
        verify(employeeRepository).findAll(eq(pageable));
        verify(employeeRepository, never()).findByDepartmentId(anyLong(), any(Pageable.class));
    }

    @Test
    void listDirectReports_ManagerWithDepartment_UsesManagerAndDepartmentQuery() {
        Employee manager = employee(4L, 1L, null);
        EmployeeUserDetails principal = new EmployeeUserDetails(manager, "MANAGER", "T", "D");
        Pageable pageable = PageRequest.of(0, 20);
        Page<Employee> page = new PageImpl<>(List.of(employee(10L, 1L, 4L)), pageable, 1);
        when(employeeRepository.findAllByManagerIdAndDepartmentId(eq(4L), eq(1L), eq(pageable))).thenReturn(page);

        Page<EmployeeSummaryResponse> result = service.listDirectReports(4L, pageable, principal);

        assertEquals(1, result.getTotalElements());
        verify(employeeRepository).findAllByManagerIdAndDepartmentId(eq(4L), eq(1L), eq(pageable));
        verify(employeeRepository, never()).findAllByManagerId(anyLong(), any(Pageable.class));
    }

    @Test
    void listDirectReports_ManagerWithoutDepartment_UsesManagerIdOnly() {
        Employee manager = employee(4L, null, null);
        EmployeeUserDetails principal = new EmployeeUserDetails(manager, "MANAGER", "T", "D");
        Pageable pageable = PageRequest.of(0, 20);
        Page<Employee> page = new PageImpl<>(List.of(employee(10L, null, 4L)), pageable, 1);
        when(employeeRepository.findAllByManagerId(eq(4L), eq(pageable))).thenReturn(page);

        Page<EmployeeSummaryResponse> result = service.listDirectReports(4L, pageable, principal);

        assertEquals(1, result.getTotalElements());
        verify(employeeRepository).findAllByManagerId(eq(4L), eq(pageable));
        verify(employeeRepository, never()).findAllByManagerIdAndDepartmentId(anyLong(), anyLong(), any(Pageable.class));
    }
}
