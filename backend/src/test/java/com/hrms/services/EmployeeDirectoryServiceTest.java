package com.hrms.services;

import com.hrms.api.dto.EmployeeProfileResponse;
import com.hrms.api.dto.EmployeeProfileUpdate;
import com.hrms.core.models.Employee;
import com.hrms.core.repositories.EmployeeRepository;
import com.hrms.core.repositories.NFCCardRepository;
import com.hrms.core.repositories.RoleRepository;
import com.hrms.core.repositories.TeamRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EmployeeDirectoryServiceTest {

    @Mock
    private EmployeeRepository employeeRepository;

    @Mock
    private TeamRepository teamRepository;

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private NFCCardRepository nfcCardRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    private EmployeeDirectoryService service;

    @BeforeEach
    void setUp() {
        service = new EmployeeDirectoryService(
                employeeRepository, teamRepository, roleRepository, nfcCardRepository, passwordEncoder
        );
    }

    @Test
    void updateProfile_Success_UpdatesAllFields() {
        Employee employee = Employee.builder()
                .employeeId(1L)
                .fullName("Old Name")
                .email("old@hrms.com")
                .passwordHash("secret")
                .status("Active")
                .build();

        when(employeeRepository.findById(1L)).thenReturn(Optional.of(employee));
        when(employeeRepository.findByEmailIgnoreCase("new@hrms.com")).thenReturn(Optional.empty());
        when(employeeRepository.save(any(Employee.class))).thenAnswer(invocation -> invocation.getArgument(0));

        EmployeeProfileUpdate update = new EmployeeProfileUpdate(
                "New Name", "new@hrms.com", "0512345678", "Riyadh", "1234567890", null
        );

        EmployeeProfileResponse result = service.updateProfile(1L, update);

        assertEquals("New Name", result.fullName());
        assertEquals("new@hrms.com", result.email());
        assertEquals("0512345678", result.mobileNumber());
        assertEquals("Riyadh", result.address());
        assertEquals("1234567890", result.nationalId());

        verify(employeeRepository).save(employee);
        assertEquals("New Name", employee.getFullName());
        assertEquals("new@hrms.com", employee.getEmail());
        assertEquals("0512345678", employee.getMobileNumber());
        assertEquals("Riyadh", employee.getAddress());
        assertEquals("1234567890", employee.getNationalId());
    }

    @Test
    void updateProfile_BlankOptionalFields_ClearsExistingValues() {
        Employee employee = Employee.builder()
                .employeeId(1L)
                .fullName("Test User")
                .email("test@hrms.com")
                .passwordHash("secret")
                .status("Active")
                .build();
        // Simulate existing optional data
        employee.setMobileNumber("0511111111");
        employee.setAddress("Old Address");
        employee.setNationalId("0000000000");

        when(employeeRepository.findById(1L)).thenReturn(Optional.of(employee));
        // DTO normalizes blanks to null, so service receives null
        EmployeeProfileUpdate update = new EmployeeProfileUpdate(
                "Test User", "test@hrms.com", null, null, null, null
        );
        when(employeeRepository.findByEmailIgnoreCase("test@hrms.com"))
                .thenReturn(Optional.of(employee)); // same email, should be allowed
        when(employeeRepository.save(any(Employee.class))).thenAnswer(invocation -> invocation.getArgument(0));

        EmployeeProfileResponse result = service.updateProfile(1L, update);

        // Optional fields should be cleared (null)
        assertNull(result.mobileNumber());
        assertNull(result.address());
        assertNull(result.nationalId());

        assertNull(employee.getMobileNumber());
        assertNull(employee.getAddress());
        assertNull(employee.getNationalId());
    }

    @Test
    void updateProfile_BlankStringDto_NormalizesToNull() {
        // This test proves the compact constructor normalizes "" → null
        EmployeeProfileUpdate dto = new EmployeeProfileUpdate(
                "Test User", "test@hrms.com", "", "", "", null
        );

        assertNull(dto.mobileNumber(), "blank mobileNumber should be null");
        assertNull(dto.address(), "blank address should be null");
        assertNull(dto.nationalId(), "blank nationalId should be null");
    }

    @Test
    void updateProfile_DuplicateEmail_ThrowsConflict() {
        Employee employee = Employee.builder()
                .employeeId(1L)
                .fullName("Test User")
                .email("test@hrms.com")
                .passwordHash("secret")
                .status("Active")
                .build();

        Employee otherEmployee = Employee.builder()
                .employeeId(2L)
                .fullName("Other User")
                .email("duplicate@hrms.com")
                .passwordHash("secret")
                .status("Active")
                .build();

        when(employeeRepository.findById(1L)).thenReturn(Optional.of(employee));
        when(employeeRepository.findByEmailIgnoreCase("duplicate@hrms.com"))
                .thenReturn(Optional.of(otherEmployee));

        EmployeeProfileUpdate update = new EmployeeProfileUpdate(
                "Test User", "duplicate@hrms.com", null, null, null, null
        );

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> service.updateProfile(1L, update));

        assertEquals(409, ex.getStatusCode().value());
        verify(employeeRepository, never()).save(any());
    }

    @Test
    void updateProfile_SameEmailAllowed() {
        Employee employee = Employee.builder()
                .employeeId(1L)
                .fullName("Test User")
                .email("test@hrms.com")
                .passwordHash("secret")
                .status("Active")
                .build();

        when(employeeRepository.findById(1L)).thenReturn(Optional.of(employee));
        // findByEmailIgnoreCase returns the same employee — should NOT conflict
        when(employeeRepository.findByEmailIgnoreCase("test@hrms.com"))
                .thenReturn(Optional.of(employee));
        when(employeeRepository.save(any(Employee.class))).thenAnswer(invocation -> invocation.getArgument(0));

        EmployeeProfileUpdate update = new EmployeeProfileUpdate(
                "Updated Name", "test@hrms.com", null, null, null, null
        );

        EmployeeProfileResponse result = service.updateProfile(1L, update);

        assertEquals("Updated Name", result.fullName());
        assertEquals("test@hrms.com", result.email());
    }

    @Test
    void updateProfile_EmployeeNotFound_Throws404() {
        when(employeeRepository.findById(999L)).thenReturn(Optional.empty());

        EmployeeProfileUpdate update = new EmployeeProfileUpdate(
                "Name", "email@test.com", null, null, null, null
        );

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> service.updateProfile(999L, update));

        assertEquals(404, ex.getStatusCode().value());
    }
}
