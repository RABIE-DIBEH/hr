package com.hrms.services;

import com.hrms.api.dto.LeaveRequestDto;
import com.hrms.core.models.Employee;
import com.hrms.core.models.LeaveRequest;
import com.hrms.core.repositories.EmployeeRepository;
import com.hrms.core.repositories.LeaveRequestRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LeaveRequestServiceTest {

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

    @Test
    void submitRequest_ValidRequest_CreatesLeaveRequest() {
        // Given
        Employee employee = Employee.builder()
                .employeeId(1L)
                .fullName("Test User")
                .email("test@hrms.com")
                .status("Active")
                .managerId(2L) // Has a manager
                .build();

        LeaveRequest requestData = new LeaveRequest();
        requestData.setLeaveType("Annual Leave");
        requestData.setStartDate(LocalDate.of(2026, 4, 10));
        requestData.setEndDate(LocalDate.of(2026, 4, 15));
        requestData.setDuration(5.0);
        requestData.setReason("Family vacation");

        when(leaveRequestRepository.save(any(LeaveRequest.class))).thenAnswer(invocation -> {
            LeaveRequest saved = invocation.getArgument(0);
            saved.setRequestId(100L);
            return saved;
        });

        // When
        LeaveRequest result = leaveService.submitRequest(employee, requestData);

        // Then
        assertNotNull(result);
        assertEquals(100L, result.getRequestId());
        assertEquals("Annual Leave", result.getLeaveType());
        assertEquals(LocalDate.of(2026, 4, 10), result.getStartDate());
        assertEquals(LocalDate.of(2026, 4, 15), result.getEndDate());
        assertEquals(5.0, result.getDuration());
        assertEquals("Family vacation", result.getReason());
        assertEquals("PENDING_MANAGER", result.getStatus());
        assertEquals(employee, result.getEmployee());

        verify(leaveRequestRepository).save(any(LeaveRequest.class));
        verify(inboxService).sendPersonalMessage(
                eq("New Leave Request"),
                contains("Employee Test User has submitted a leave request for Annual Leave."),
                eq(2L),
                eq("System"),
                isNull(),
                eq("MEDIUM")
        );
    }

    @Test
    void submitRequest_EmployeeWithoutManager_GoesToHR() {
        // Given
        Employee employee = Employee.builder()
                .employeeId(1L)
                .fullName("Test User")
                .email("test@hrms.com")
                .status("Active")
                .managerId(null) // No manager
                .build();

        LeaveRequest requestData = new LeaveRequest();
        requestData.setLeaveType("Sick Leave");
        requestData.setStartDate(LocalDate.of(2026, 4, 1));
        requestData.setEndDate(LocalDate.of(2026, 4, 3));
        requestData.setDuration(3.0);
        requestData.setReason("Feeling unwell");

        when(leaveRequestRepository.save(any(LeaveRequest.class))).thenAnswer(invocation -> {
            LeaveRequest saved = invocation.getArgument(0);
            saved.setRequestId(200L);
            return saved;
        });

        // When
        LeaveRequest result = leaveService.submitRequest(employee, requestData);

        // Then
        assertNotNull(result);
        assertEquals("PENDING_HR", result.getStatus());
        
        verify(inboxService).sendMessage(
                eq("New Leave Request (No Manager assigned)"),
                contains("Employee Test User (who has no manager) has submitted a leave request."),
                eq("HR"),
                eq("System"),
                isNull(),
                eq("MEDIUM")
        );
    }

    @Test
    void getEmployeeRequests_ReturnsPaginatedResults() {
        // Given
        Long employeeId = 1L;
        Pageable pageable = PageRequest.of(0, 10);

        Employee employee = Employee.builder()
                .employeeId(employeeId)
                .fullName("Test User")
                .email("test@hrms.com")
                .build();

        LeaveRequest leaveRequest = new LeaveRequest();
        leaveRequest.setRequestId(100L);
        leaveRequest.setEmployee(employee);
        leaveRequest.setLeaveType("Annual Leave");
        leaveRequest.setStartDate(LocalDate.of(2026, 4, 10));
        leaveRequest.setEndDate(LocalDate.of(2026, 4, 15));
        leaveRequest.setDuration(5.0);
        leaveRequest.setStatus("PENDING_MANAGER");

        Page<LeaveRequest> page = new PageImpl<>(List.of(leaveRequest), pageable, 1);
        when(leaveRequestRepository.findAllByEmployeeId(eq(employeeId), any(Pageable.class))).thenReturn(page);

        // When
        Page<LeaveRequest> result = leaveService.getEmployeeRequests(employeeId, pageable);

        // Then
        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        assertEquals(leaveRequest, result.getContent().get(0));
        verify(leaveRequestRepository).findAllByEmployeeId(eq(employeeId), any(Pageable.class));
    }

    @Test
    void getPendingRequestsForManager_ReturnsManagerTeamLeaves() {
        // Given
        Long managerId = 100L;
        Pageable pageable = PageRequest.of(0, 10);

        Employee employee = Employee.builder()
                .employeeId(1L)
                .fullName("Team Member")
                .email("team@hrms.com")
                .managerId(managerId)
                .build();

        LeaveRequest leaveRequest = new LeaveRequest();
        leaveRequest.setRequestId(200L);
        leaveRequest.setEmployee(employee);
        leaveRequest.setLeaveType("Sick Leave");
        leaveRequest.setStartDate(LocalDate.of(2026, 4, 1));
        leaveRequest.setEndDate(LocalDate.of(2026, 4, 3));
        leaveRequest.setDuration(3.0);
        leaveRequest.setStatus("PENDING_MANAGER");

        Page<LeaveRequest> page = new PageImpl<>(List.of(leaveRequest), pageable, 1);
        when(leaveRequestRepository.findPendingRequestsForManager(eq(managerId), any(Pageable.class))).thenReturn(page);

        // When
        Page<LeaveRequest> result = leaveService.getPendingRequestsForManager(managerId, pageable, null);

        // Then
        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        assertEquals(leaveRequest, result.getContent().get(0));
        verify(leaveRequestRepository).findPendingRequestsForManager(eq(managerId), any(Pageable.class));
    }

    @Test
    void getPendingRequestsForHr_ReturnsHrPendingLeaves() {
        // Given
        Pageable pageable = PageRequest.of(0, 10);

        Employee employee = Employee.builder()
                .employeeId(1L)
                .fullName("Test User")
                .email("test@hrms.com")
                .build();

        LeaveRequest leaveRequest = new LeaveRequest();
        leaveRequest.setRequestId(300L);
        leaveRequest.setEmployee(employee);
        leaveRequest.setLeaveType("Annual Leave");
        leaveRequest.setStartDate(LocalDate.of(2026, 4, 10));
        leaveRequest.setEndDate(LocalDate.of(2026, 4, 15));
        leaveRequest.setDuration(5.0);
        leaveRequest.setStatus("PENDING_HR");

        Page<LeaveRequest> page = new PageImpl<>(List.of(leaveRequest), pageable, 1);
        when(leaveRequestRepository.findPendingRequestsForHr(any(Pageable.class))).thenReturn(page);

        // When
        Page<LeaveRequest> result = leaveService.getPendingRequestsForHr(pageable);

        // Then
        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        assertEquals(leaveRequest, result.getContent().get(0));
        verify(leaveRequestRepository).findPendingRequestsForHr(any(Pageable.class));
    }

    @Test
    void getAllLeavesInRange_WithEmployeeId_ReturnsEmployeeLeaves() {
        // Given
        Long employeeId = 1L;
        LocalDate start = LocalDate.of(2026, 4, 1);
        LocalDate end = LocalDate.of(2026, 4, 30);

        Employee employee = Employee.builder()
                .employeeId(employeeId)
                .fullName("Test User")
                .email("test@hrms.com")
                .build();

        LeaveRequest leaveRequest = new LeaveRequest();
        leaveRequest.setRequestId(400L);
        leaveRequest.setEmployee(employee);
        leaveRequest.setLeaveType("Annual Leave");
        leaveRequest.setStartDate(LocalDate.of(2026, 4, 10));
        leaveRequest.setEndDate(LocalDate.of(2026, 4, 15));
        leaveRequest.setDuration(5.0);
        leaveRequest.setStatus("APPROVED");

        List<LeaveRequest> leaves = List.of(leaveRequest);
        when(leaveRequestRepository.findEmployeeLeavesInRange(eq(employeeId), eq(start), eq(end))).thenReturn(leaves);

        // When
        List<LeaveRequest> result = leaveService.getAllLeavesInRange(start, end, employeeId);

        // Then
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals(leaveRequest, result.get(0));
        verify(leaveRequestRepository).findEmployeeLeavesInRange(eq(employeeId), eq(start), eq(end));
    }

    @Test
    void getAllLeavesInRange_WithoutEmployeeId_ReturnsAllLeaves() {
        // Given
        LocalDate start = LocalDate.of(2026, 4, 1);
        LocalDate end = LocalDate.of(2026, 4, 30);

        Employee employee1 = Employee.builder()
                .employeeId(1L)
                .fullName("User 1")
                .email("user1@hrms.com")
                .build();

        Employee employee2 = Employee.builder()
                .employeeId(2L)
                .fullName("User 2")
                .email("user2@hrms.com")
                .build();

        LeaveRequest leave1 = new LeaveRequest();
        leave1.setRequestId(400L);
        leave1.setEmployee(employee1);
        leave1.setLeaveType("Annual Leave");
        leave1.setStartDate(LocalDate.of(2026, 4, 10));
        leave1.setEndDate(LocalDate.of(2026, 4, 15));
        leave1.setDuration(5.0);
        leave1.setStatus("APPROVED");

        LeaveRequest leave2 = new LeaveRequest();
        leave2.setRequestId(401L);
        leave2.setEmployee(employee2);
        leave2.setLeaveType("Sick Leave");
        leave2.setStartDate(LocalDate.of(2026, 4, 20));
        leave2.setEndDate(LocalDate.of(2026, 4, 22));
        leave2.setDuration(3.0);
        leave2.setStatus("PENDING_MANAGER");

        List<LeaveRequest> leaves = List.of(leave1, leave2);
        when(leaveRequestRepository.findAllInRange(eq(start), eq(end))).thenReturn(leaves);

        // When
        List<LeaveRequest> result = leaveService.getAllLeavesInRange(start, end, null);

        // Then
        assertNotNull(result);
        assertEquals(2, result.size());
        verify(leaveRequestRepository).findAllInRange(eq(start), eq(end));
    }
}