package com.hrms.workflows;

import com.hrms.AbstractContainerBaseTest;
import com.hrms.core.models.Employee;
import com.hrms.core.repositories.EmployeeRepository;
import com.hrms.core.repositories.RoleRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Integration test for Role-Based Access Control (RBAC) workflow:
 * - Each role tries unauthorized endpoints → 403
 * - Each role tries authorized endpoints → 200
 * - SUPER_ADMIN can access everything
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class RoleBasedAccessControlIntegrationTest extends AbstractContainerBaseTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private Employee superAdmin;
    private Employee admin;
    private Employee hrEmployee;
    private Employee manager;
    private Employee regularEmployee;
    private Employee payrollEmployee;

    @BeforeEach
    void setUp() {
        employeeRepository.deleteAll();

        // Create employees with different roles
        // Note: Role IDs are based on data.sql seeding: 
        // 1=SUPER_ADMIN, 2=ADMIN, 3=HR, 4=MANAGER, 5=EMPLOYEE, 6=PAYROLL
        
        superAdmin = Employee.builder()
                .fullName("Super Admin")
                .email("superadmin@hrms.com")
                .passwordHash(passwordEncoder.encode("SuperAdminPass123"))
                .status("Active")
                .roleId(1L) // SUPER_ADMIN
                .build();
        employeeRepository.save(superAdmin);

        admin = Employee.builder()
                .fullName("Admin User")
                .email("admin@hrms.com")
                .passwordHash(passwordEncoder.encode("AdminPass123"))
                .status("Active")
                .roleId(2L) // ADMIN
                .build();
        employeeRepository.save(admin);

        hrEmployee = Employee.builder()
                .fullName("HR User")
                .email("hr@hrms.com")
                .passwordHash(passwordEncoder.encode("HrPass123"))
                .status("Active")
                .roleId(3L) // HR
                .build();
        employeeRepository.save(hrEmployee);

        manager = Employee.builder()
                .fullName("Manager User")
                .email("manager@hrms.com")
                .passwordHash(passwordEncoder.encode("ManagerPass123"))
                .status("Active")
                .roleId(4L) // MANAGER
                .build();
        employeeRepository.save(manager);

        regularEmployee = Employee.builder()
                .fullName("Regular Employee")
                .email("employee@hrms.com")
                .passwordHash(passwordEncoder.encode("EmployeePass123"))
                .status("Active")
                .roleId(5L) // EMPLOYEE
                .build();
        employeeRepository.save(regularEmployee);

        payrollEmployee = Employee.builder()
                .fullName("Payroll Employee")
                .email("payroll@hrms.com")
                .passwordHash(passwordEncoder.encode("PayrollPass123"))
                .status("Active")
                .roleId(6L) // PAYROLL
                .build();
        employeeRepository.save(payrollEmployee);
    }

    private String getAuthToken(String email, String password) throws Exception {
        String loginRequest = String.format("""
                {
                    "email": "%s",
                    "password": "%s"
                }
                """, email, password);

        String response = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginRequest))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.token").exists())
                .andReturn()
                .getResponse()
                .getContentAsString();

        // Extract token from response (simplified - in real test we'd parse JSON properly)
        // For this integration test, we'll use the actual token extraction
        return response.split("\"token\":\"")[1].split("\"")[0];
    }

    @Test
    void superAdmin_CanAccessAllEndpoints() throws Exception {
        String token = getAuthToken("superadmin@hrms.com", "SuperAdminPass123");

        // Test admin endpoints
        mockMvc.perform(get("/api/admin/metrics")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());

        // Test HR endpoints
        mockMvc.perform(get("/api/employees")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());

        // Test payroll endpoints
        mockMvc.perform(get("/api/payroll/history")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());

        // Test manager endpoints (employee directory)
        mockMvc.perform(get("/api/employees/directory")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());

        // Test employee endpoints
        mockMvc.perform(get("/api/employees/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());
    }

    @Test
    void admin_CannotAccessPayrollEndpoints() throws Exception {
        String token = getAuthToken("admin@hrms.com", "AdminPass123");

        // Admin can access admin endpoints
        mockMvc.perform(get("/api/admin/metrics")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());

        // Admin can access HR endpoints
        mockMvc.perform(get("/api/employees")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());

        // Admin should NOT be able to access payroll endpoints
        mockMvc.perform(get("/api/payroll/history")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    @Test
    void hrEmployee_CanAccessHrEndpointsOnly() throws Exception {
        String token = getAuthToken("hr@hrms.com", "HrPass123");

        // HR can access HR endpoints
        mockMvc.perform(get("/api/employees")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());

        // HR should NOT be able to access admin endpoints
        mockMvc.perform(get("/api/admin/metrics")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());

        // HR should NOT be able to access payroll endpoints
        mockMvc.perform(get("/api/payroll/history")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    @Test
    void manager_CanAccessManagerEndpointsOnly() throws Exception {
        String token = getAuthToken("manager@hrms.com", "ManagerPass123");

        // Manager can access employee directory
        mockMvc.perform(get("/api/employees/directory")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());

        // Manager should NOT be able to access admin endpoints
        mockMvc.perform(get("/api/admin/metrics")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());

        // Manager should NOT be able to access HR endpoints (full employee list)
        mockMvc.perform(get("/api/employees")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());

        // Manager should NOT be able to access payroll endpoints
        mockMvc.perform(get("/api/payroll/history")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    @Test
    void regularEmployee_CanAccessOnlyPersonalEndpoints() throws Exception {
        String token = getAuthToken("employee@hrms.com", "EmployeePass123");

        // Employee can access personal endpoints
        mockMvc.perform(get("/api/employees/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/payroll/my-slips")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());

        // Employee should NOT be able to access admin endpoints
        mockMvc.perform(get("/api/admin/metrics")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());

        // Employee should NOT be able to access HR endpoints
        mockMvc.perform(get("/api/employees")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());

        // Employee should NOT be able to access manager endpoints
        mockMvc.perform(get("/api/employees/directory")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());

        // Employee should NOT be able to access payroll admin endpoints
        mockMvc.perform(get("/api/payroll/history")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    @Test
    void payrollEmployee_CanAccessPayrollEndpointsOnly() throws Exception {
        String token = getAuthToken("payroll@hrms.com", "PayrollPass123");

        // Payroll employee can access payroll endpoints
        mockMvc.perform(get("/api/payroll/history")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());

        // Payroll should NOT be able to access admin endpoints
        mockMvc.perform(get("/api/admin/metrics")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());

        // Payroll should NOT be able to access HR endpoints
        mockMvc.perform(get("/api/employees")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());

        // Payroll should NOT be able to access manager endpoints
        mockMvc.perform(get("/api/employees/directory")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    @Test
    void unauthorizedAccess_WithoutToken_Returns401() throws Exception {
        // All protected endpoints should return 401 without token
        mockMvc.perform(get("/api/employees/me"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/admin/metrics"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/payroll/history"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void invalidToken_Returns401() throws Exception {
        // Invalid token should return 401
        mockMvc.perform(get("/api/employees/me")
                        .header("Authorization", "Bearer invalid-token"))
                .andExpect(status().isUnauthorized());
    }
}