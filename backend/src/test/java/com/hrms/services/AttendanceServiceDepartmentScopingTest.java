package com.hrms.services;

import com.hrms.api.dto.AttendanceRecordDto;
import com.hrms.core.models.AttendanceRecord;
import com.hrms.core.models.Employee;
import com.hrms.core.repositories.AttendanceRecordRepository;
import com.hrms.core.repositories.NFCCardRepository;
import com.hrms.core.repositories.SystemLogRepository;
import com.hrms.security.EmployeeUserDetails;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

/**
 * Tests for department-scoped attendance filtering in AttendanceService.
 * Verifies that:
 * - Managers with a department see only their department's records
 * - Managers without a department fall back to managerId scoping
 * - Privileged users (HR/Admin/SUPER_ADMIN) see all records
 */
@ExtendWith(MockitoExtension.class)
class AttendanceServiceDepartmentScopingTest {

    @Mock
    private AttendanceRecordRepository attendanceRepository;

    @Mock
    private NFCCardRepository nfcCardRepository;

    @Mock
    private SystemLogRepository systemLogRepository;

    private AttendanceService attendanceService;

    // ── Helper: Create employee with department ──
    private Employee createEmployee(Long id, String name, String email, Long departmentId, Long managerId) {
        Employee e = Employee.builder()
                .employeeId(id)
                .fullName(name)
                .email(email)
                .passwordHash("secret")
                .departmentId(departmentId)
                .managerId(managerId)
                .baseSalary(java.math.BigDecimal.valueOf(5000))
                .status("Active")
                .build();
        return e;
    }

    // ── Helper: Create attendance record ──
    private AttendanceRecord createRecord(Long id, Employee employee, LocalDateTime checkIn) {
        AttendanceRecord r = AttendanceRecord.builder()
                .recordId(id)
                .employee(employee)
                .checkIn(checkIn)
                .status("Normal")
                .isVerifiedByManager(false)
                .reviewStatus("PENDING_REVIEW")
                .payrollStatus("PENDING_APPROVAL")
                .build();
        return r;
    }

    // ── Helper: Create principal with a specific role ──
    private EmployeeUserDetails principal(Employee employee, String role) {
        return new EmployeeUserDetails(employee, role, "Engineering", "Engineering");
    }

    @BeforeEach
    void setUp() {
        attendanceService = new AttendanceService(attendanceRepository, nfcCardRepository, systemLogRepository);
    }

    // ═══════════════════════════════════════════
    // Test 1: Privileged user (HR) sees ALL records
    // ═══════════════════════════════════════════

    @Test
    void getTodayRecordsForManager_HrAdmin_ReturnsAllRecords() {
        Employee hr = createEmployee(3L, "Sara HR", "hr@hrms.com", 2L, null);
        EmployeeUserDetails hrPrincipal = new EmployeeUserDetails(hr, "HR", "HR", "Human Resources");

        Employee emp1 = createEmployee(10L, "Emp1", "emp1@test.com", 1L, 4L);
        Employee emp2 = createEmployee(20L, "Emp2", "emp2@test.com", 2L, 4L);
        LocalDateTime today = LocalDateTime.now();

        List<AttendanceRecord> allRecords = List.of(
                createRecord(1L, emp1, today),
                createRecord(2L, emp2, today)
        );
        Page<AttendanceRecord> page = new PageImpl<>(allRecords, PageRequest.of(0, 20), 2);

        when(attendanceRepository.findAllRecentRecords(any())).thenReturn(page);

        Page<AttendanceRecordDto> result = attendanceService.getTodayRecordsForManager(
                hr.getEmployeeId(), PageRequest.of(0, 20), hrPrincipal);

        assertEquals(2, result.getTotalElements());
        // Verify privileged path: calls findAllRecentRecords (not manager-scoped)
        verify(attendanceRepository).findAllRecentRecords(any());
        verify(attendanceRepository, never()).findRecentRecordsForManager(any(), any());
        verify(attendanceRepository, never()).findRecentRecordsForManagerInDepartment(any(), any(), any());
    }

    @Test
    void getTodayRecordsForManager_SuperAdmin_ReturnsAllRecords() {
        Employee superAdmin = createEmployee(1L, "Dev Super Admin", "dev@hrms.com", 1L, null);
        EmployeeUserDetails adminPrincipal = new EmployeeUserDetails(
                superAdmin, "SUPER_ADMIN", "Engineering", "Engineering");

        List<AttendanceRecord> allRecords = List.of(
                createRecord(1L, createEmployee(10L, "Emp1", "emp1@test.com", 1L, 4L), LocalDateTime.now())
        );
        Page<AttendanceRecord> page = new PageImpl<>(allRecords, PageRequest.of(0, 20), 1);

        when(attendanceRepository.findAllRecentRecords(any())).thenReturn(page);

        Page<AttendanceRecordDto> result = attendanceService.getTodayRecordsForManager(
                superAdmin.getEmployeeId(), PageRequest.of(0, 20), adminPrincipal);

        assertEquals(1, result.getTotalElements());
        verify(attendanceRepository).findAllRecentRecords(any());
    }

    // ═══════════════════════════════════════════
    // Test 2: Manager WITH departmentId → department-scoped query
    // ═══════════════════════════════════════════

    @Test
    void getTodayRecordsForManager_ManagerWithDepartment_FiltersByDepartment() {
        Employee manager = createEmployee(4L, "Khalid Manager", "manager@hrms.com", 1L, null);
        EmployeeUserDetails managerPrincipal = new EmployeeUserDetails(
                manager, "MANAGER", "Engineering", "Engineering");

        Employee deptEmp = createEmployee(10L, "Dept Employee", "dept@test.com", 1L, 4L);
        LocalDateTime today = LocalDateTime.now();

        List<AttendanceRecord> deptRecords = List.of(
                createRecord(1L, deptEmp, today)
        );
        Page<AttendanceRecord> page = new PageImpl<>(deptRecords, PageRequest.of(0, 20), 1);

        when(attendanceRepository.findRecentRecordsForManagerInDepartment(
                eq(4L), eq(1L), any())).thenReturn(page);

        Page<AttendanceRecordDto> result = attendanceService.getTodayRecordsForManager(
                4L, PageRequest.of(0, 20), managerPrincipal);

        assertEquals(1, result.getTotalElements());
        // Verify department-scoped query was called
        verify(attendanceRepository).findRecentRecordsForManagerInDepartment(eq(4L), eq(1L), any());
        // Verify non-department query was NOT called
        verify(attendanceRepository, never()).findRecentRecordsForManager(any(), any());
        verify(attendanceRepository, never()).findAllRecentRecords(any());
    }

    // ═══════════════════════════════════════════
    // Test 3: Manager WITHOUT departmentId → managerId fallback
    // ═══════════════════════════════════════════

    @Test
    void getTodayRecordsForManager_ManagerWithoutDepartment_FallbackToManagerId() {
        Employee manager = createEmployee(4L, "Khalid Manager", "manager@hrms.com", null, null);
        EmployeeUserDetails managerPrincipal = new EmployeeUserDetails(
                manager, "MANAGER", "Engineering", "Engineering");

        LocalDateTime today = LocalDateTime.now();
        Employee directReport = createEmployee(10L, "Direct Report", "direct@test.com", null, 4L);

        List<AttendanceRecord> records = List.of(
                createRecord(1L, directReport, today)
        );
        Page<AttendanceRecord> page = new PageImpl<>(records, PageRequest.of(0, 20), 1);

        when(attendanceRepository.findRecentRecordsForManager(eq(4L), any())).thenReturn(page);

        Page<AttendanceRecordDto> result = attendanceService.getTodayRecordsForManager(
                4L, PageRequest.of(0, 20), managerPrincipal);

        assertEquals(1, result.getTotalElements());
        // Verify managerId-scoped query was called (not department-scoped)
        verify(attendanceRepository).findRecentRecordsForManager(eq(4L), any());
        verify(attendanceRepository, never()).findRecentRecordsForManagerInDepartment(any(), any(), any());
        verify(attendanceRepository, never()).findAllRecentRecords(any());
    }
}
