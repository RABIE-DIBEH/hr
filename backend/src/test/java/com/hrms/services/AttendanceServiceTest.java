package com.hrms.services;

import com.hrms.core.models.AttendanceRecord;
import com.hrms.core.models.Employee;
import com.hrms.core.repositories.AttendanceRecordRepository;
import com.hrms.core.repositories.NFCCardRepository;
import com.hrms.security.EmployeeUserDetails;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class AttendanceServiceTest {

    @Mock
    private AttendanceRecordRepository attendanceRepository;

    @Mock
    private NFCCardRepository nfcCardRepository;

    @InjectMocks
    private AttendanceService attendanceService;

    private Employee employee;
    private AttendanceRecord record;
    private EmployeeUserDetails managerPrincipal;
    private EmployeeUserDetails otherPrincipal;

    @BeforeEach
    void setUp() {
        employee = Employee.builder()
                .employeeId(1L)
                .fullName("John Doe")
                .managerId(10L)
                .build();

        record = AttendanceRecord.builder()
                .employee(employee)
                .checkIn(LocalDateTime.now().minusHours(2))
                .status("Normal")
                .isVerifiedByManager(false)
                .build();
        record.setRecordId(100L);

        managerPrincipal = mock(EmployeeUserDetails.class);
        otherPrincipal = mock(EmployeeUserDetails.class);
    }

    @Test
    void reportFraud_ByManager_Success() {
        // Arrange
        when(managerPrincipal.getEmployeeId()).thenReturn(10L);
        doReturn(Collections.singletonList(new SimpleGrantedAuthority("ROLE_MANAGER")))
                .when(managerPrincipal).getAuthorities();
        
        when(attendanceRepository.findById(100L)).thenReturn(Optional.of(record));
        when(attendanceRepository.save(any(AttendanceRecord.class))).thenAnswer(i -> i.getArguments()[0]);

        // Act
        Optional<AttendanceRecord> result = attendanceService.reportFraud(100L, "Caught suspicious activity", managerPrincipal);

        // Assert
        assertTrue(result.isPresent());
        assertEquals("Fraud", result.get().getStatus());
        assertEquals("FRAUD", result.get().getReviewStatus());
        assertEquals("EXCLUDED_FROM_PAYROLL", result.get().getPayrollStatus());
        assertTrue(result.get().getIsVerifiedByManager());
        assertEquals("Caught suspicious activity", result.get().getManagerNotes());
        verify(attendanceRepository).save(any(AttendanceRecord.class));
    }

    @Test
    void reportFraud_ByNonManager_ThrowsAccessDenied() {
        // Arrange
        doReturn(Collections.singletonList(new SimpleGrantedAuthority("ROLE_EMPLOYEE")))
                .when(otherPrincipal).getAuthorities();

        when(attendanceRepository.findById(100L)).thenReturn(Optional.of(record));

        // Act & Assert
        assertThrows(AccessDeniedException.class, () -> 
            attendanceService.reportFraud(100L, "Flagging as fraud", otherPrincipal)
        );
    }

    @Test
    void clockWithNfc_NewSession_CheckIn() {
        // Arrange
        when(attendanceRepository.findActiveSessionByEmployeeId(1L)).thenReturn(Optional.empty());

        // Act
        String result = attendanceService.clockWithNfc(employee);

        // Assert
        assertTrue(result.contains("Checked In Successfully"));
        verify(attendanceRepository).save(any(AttendanceRecord.class));
    }

    @Test
    void clockWithNfc_ActiveSession_CheckOut() {
        // Arrange
        when(attendanceRepository.findActiveSessionByEmployeeId(1L)).thenReturn(Optional.of(record));

        // Act
        String result = attendanceService.clockWithNfc(employee);

        // Assert
        assertTrue(result.contains("Checked Out Successfully"));
        assertNotNull(record.getCheckOut());
        assertNotNull(record.getWorkHours());
        verify(attendanceRepository).save(record);
    }

    @Test
    void manuallyCorrectRecord_ByHr_ApprovesForPayroll() {
        EmployeeUserDetails hrPrincipal = mock(EmployeeUserDetails.class);
        doReturn(Collections.singletonList(new SimpleGrantedAuthority("ROLE_HR")))
                .when(hrPrincipal).getAuthorities();
        when(hrPrincipal.getEmployeeId()).thenReturn(20L);
        when(attendanceRepository.findById(100L)).thenReturn(Optional.of(record));
        when(attendanceRepository.save(any(AttendanceRecord.class))).thenAnswer(i -> i.getArguments()[0]);

        LocalDateTime checkIn = LocalDateTime.of(2026, 4, 5, 8, 0);
        LocalDateTime checkOut = LocalDateTime.of(2026, 4, 5, 16, 30);

        Optional<AttendanceRecord> corrected = attendanceService.manuallyCorrectRecord(
                100L,
                checkIn,
                checkOut,
                "Manual correction after missed badge",
                true,
                hrPrincipal
        );

        assertTrue(corrected.isPresent());
        assertEquals("MANUALLY_CORRECTED", corrected.get().getReviewStatus());
        assertEquals("APPROVED_FOR_PAYROLL", corrected.get().getPayrollStatus());
        assertTrue(corrected.get().getManuallyAdjusted());
        assertEquals(20L, corrected.get().getManuallyAdjustedBy());
        assertNotNull(corrected.get().getWorkHours());
    }
}
