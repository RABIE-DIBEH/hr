package com.hrms.services;

import com.hrms.core.models.Employee;
import com.hrms.core.models.UsersRole;
import com.hrms.core.repositories.EmployeeRepository;
import com.hrms.core.repositories.RoleRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private EmployeeRepository employeeRepository;

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private JwtService jwtService;

    private AuthService authService;
    private PasswordEncoder passwordEncoder;

    @BeforeEach
    void setUp() {
        passwordEncoder = new BCryptPasswordEncoder();
        authService = new AuthService(employeeRepository, roleRepository, passwordEncoder, jwtService);
    }

    @Test
    void login_ValidCredentials_ReturnsToken() {
        // Given
        String email = "test@hrms.com";
        String password = "Password123";
        String bcryptHash = passwordEncoder.encode(password);
        
        Employee employee = Employee.builder()
                .employeeId(1L)
                .fullName("Test User")
                .email(email)
                .passwordHash(bcryptHash)
                .status("Active")
                .roleId(1L)
                .build();

        when(employeeRepository.findByEmailIgnoreCase(email)).thenReturn(Optional.of(employee));
        UsersRole employeeRole = new UsersRole("EMPLOYEE");
        employeeRole.setRoleId(1L);
        when(roleRepository.findById(1L)).thenReturn(Optional.of(employeeRole));
        when(jwtService.generateToken(eq(email), any())).thenReturn("jwt-token-123");

        // When
        Optional<String> result = authService.login(email, password);

        // Then
        assertTrue(result.isPresent());
        assertEquals("jwt-token-123", result.get());
        verify(employeeRepository).findByEmailIgnoreCase(email);
        verify(jwtService).generateToken(eq(email), any());
    }

    @Test
    void login_InvalidPassword_ReturnsEmpty() {
        // Given
        String email = "test@hrms.com";
        String correctPassword = "Password123";
        String wrongPassword = "WrongPassword";
        String bcryptHash = passwordEncoder.encode(correctPassword);
        
        Employee employee = Employee.builder()
                .employeeId(1L)
                .fullName("Test User")
                .email(email)
                .passwordHash(bcryptHash)
                .status("Active")
                .roleId(1L)
                .build();

        when(employeeRepository.findByEmailIgnoreCase(email)).thenReturn(Optional.of(employee));

        // When
        Optional<String> result = authService.login(email, wrongPassword);

        // Then
        assertFalse(result.isPresent());
        verify(employeeRepository).findByEmailIgnoreCase(email);
        verify(jwtService, never()).generateToken(any(), any());
    }

    @Test
    void login_PlaintextPassword_UpgradesToBCrypt() {
        // Given
        String email = "test@hrms.com";
        String password = "PlaintextPass";
        String plaintextHash = password; // Plaintext password stored as-is
        
        Employee employee = Employee.builder()
                .employeeId(1L)
                .fullName("Test User")
                .email(email)
                .passwordHash(plaintextHash)
                .status("Active")
                .roleId(1L)
                .build();

        when(employeeRepository.findByEmailIgnoreCase(email)).thenReturn(Optional.of(employee));
        UsersRole employeeRole = new UsersRole("EMPLOYEE");
        employeeRole.setRoleId(1L);
        when(roleRepository.findById(1L)).thenReturn(Optional.of(employeeRole));
        when(jwtService.generateToken(eq(email), any())).thenReturn("jwt-token-123");
        when(employeeRepository.save(any(Employee.class))).thenReturn(employee);

        // When
        Optional<String> result = authService.login(email, password);

        // Then
        assertTrue(result.isPresent());
        assertEquals("jwt-token-123", result.get());
        
        // Verify password was upgraded to BCrypt
        verify(employeeRepository).save(argThat(savedEmployee -> {
            String newHash = savedEmployee.getPasswordHash();
            return newHash.startsWith("$2a$") || newHash.startsWith("$2b$") || newHash.startsWith("$2y$");
        }));
    }

    @Test
    void login_InactiveEmployee_ReturnsEmpty() {
        // Given
        String email = "test@hrms.com";
        String password = "Password123";
        String bcryptHash = passwordEncoder.encode(password);
        
        Employee employee = Employee.builder()
                .employeeId(1L)
                .fullName("Test User")
                .email(email)
                .passwordHash(bcryptHash)
                .status("Inactive") // Inactive status
                .roleId(1L)
                .build();

        when(employeeRepository.findByEmailIgnoreCase(email)).thenReturn(Optional.of(employee));

        // When
        Optional<String> result = authService.login(email, password);

        // Then
        assertFalse(result.isPresent());
        verify(employeeRepository).findByEmailIgnoreCase(email);
        verify(jwtService, never()).generateToken(any(), any());
    }

    @Test
    void login_EmployeeWithoutRole_ReturnsEmpty() {
        // Given
        String email = "test@hrms.com";
        String password = "Password123";
        String bcryptHash = passwordEncoder.encode(password);
        
        Employee employee = Employee.builder()
                .employeeId(1L)
                .fullName("Test User")
                .email(email)
                .passwordHash(bcryptHash)
                .status("Active")
                .roleId(null) // No role assigned
                .build();

        when(employeeRepository.findByEmailIgnoreCase(email)).thenReturn(Optional.of(employee));

        // When
        Optional<String> result = authService.login(email, password);

        // Then
        assertFalse(result.isPresent());
        verify(employeeRepository).findByEmailIgnoreCase(email);
        verify(jwtService, never()).generateToken(any(), any());
    }

    @Test
    void changePassword_ValidCurrentPassword_ReturnsTrue() {
        // Given
        Long employeeId = 1L;
        String currentPassword = "OldPass123";
        String newPassword = "NewPass456";
        String currentHash = passwordEncoder.encode(currentPassword);
        
        Employee employee = Employee.builder()
                .employeeId(employeeId)
                .fullName("Test User")
                .email("test@hrms.com")
                .passwordHash(currentHash)
                .status("Active")
                .roleId(1L)
                .build();

        when(employeeRepository.findById(employeeId)).thenReturn(Optional.of(employee));
        when(employeeRepository.save(any(Employee.class))).thenReturn(employee);

        // When
        boolean result = authService.changePassword(employeeId, currentPassword, newPassword);

        // Then
        assertTrue(result);
        verify(employeeRepository).save(argThat(savedEmployee -> {
            String newHash = savedEmployee.getPasswordHash();
            return passwordEncoder.matches(newPassword, newHash);
        }));
    }

    @Test
    void changePassword_InvalidCurrentPassword_ReturnsFalse() {
        // Given
        Long employeeId = 1L;
        String currentPassword = "OldPass123";
        String wrongPassword = "WrongPass";
        String newPassword = "NewPass456";
        String currentHash = passwordEncoder.encode(currentPassword);
        
        Employee employee = Employee.builder()
                .employeeId(employeeId)
                .fullName("Test User")
                .email("test@hrms.com")
                .passwordHash(currentHash)
                .status("Active")
                .roleId(1L)
                .build();

        when(employeeRepository.findById(employeeId)).thenReturn(Optional.of(employee));

        // When
        boolean result = authService.changePassword(employeeId, wrongPassword, newPassword);

        // Then
        assertFalse(result);
        verify(employeeRepository, never()).save(any());
    }

    @Test
    void changePassword_EmployeeNotFound_ThrowsException() {
        // Given
        Long employeeId = 999L;
        String currentPassword = "OldPass123";
        String newPassword = "NewPass456";

        when(employeeRepository.findById(employeeId)).thenReturn(Optional.empty());

        // When & Then
        assertThrows(org.springframework.web.server.ResponseStatusException.class,
                () -> authService.changePassword(employeeId, currentPassword, newPassword));
    }
}