package com.hrms.api;

import com.hrms.security.EmployeeUserDetailsService;
import com.hrms.security.JwtAuthenticationFilter;
import com.hrms.services.JwtService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Primary;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.Mockito.mock;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = TestSecurityApiController.class)
@Import({
        SecurityConfig.class,
        SecurityConfigAccessRulesTest.TestSecurityBeans.class
})
class SecurityConfigAccessRulesTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void loginEndpoint_isPublic() throws Exception {
        mockMvc.perform(post("/api/auth/login"))
                .andExpect(status().isOk());
    }

    @Test
    void employeesMe_requiresAuthentication() throws Exception {
        mockMvc.perform(get("/api/employees/me"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(roles = "EMPLOYEE")
    void employeesMe_allowsAuthenticatedUser() throws Exception {
        mockMvc.perform(get("/api/employees/me"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "EMPLOYEE")
    void adminEndpoints_forbidNonAdminRole() throws Exception {
        mockMvc.perform(get("/api/admin/metrics"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void adminEndpoints_allowAdminRole() throws Exception {
        mockMvc.perform(get("/api/admin/metrics"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "EMPLOYEE")
    void payrollHistory_forbidsEmployeeRole() throws Exception {
        mockMvc.perform(get("/api/payroll/history"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "PAYROLL")
    void payrollHistory_allowsPayrollRole() throws Exception {
        mockMvc.perform(get("/api/payroll/history"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "EMPLOYEE")
    void myAttendanceRecords_allowAuthenticatedUser() throws Exception {
        mockMvc.perform(get("/api/attendance/my-records"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "MANAGER")
    void manualCorrection_forbidsManagerRole() throws Exception {
        mockMvc.perform(put("/api/attendance/manual-correct/10"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "HR")
    void manualCorrection_allowsHrRole() throws Exception {
        mockMvc.perform(put("/api/attendance/manual-correct/10"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "EMPLOYEE")
    void nfcCardDelete_forbidsEmployeeRole() throws Exception {
        mockMvc.perform(delete("/api/nfc-cards/10"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "HR")
    void nfcCardDelete_allowsHrRole() throws Exception {
        mockMvc.perform(delete("/api/nfc-cards/10"))
                .andExpect(status().isOk());
    }

    public static class TestSecurityBeans {
        @Bean
        @Primary
        JwtAuthenticationFilter jwtAuthenticationFilter() {
            JwtService jwtService = mock(JwtService.class);
            EmployeeUserDetailsService userDetailsService = mock(EmployeeUserDetailsService.class);
            return new JwtAuthenticationFilter(jwtService, userDetailsService);
        }
    }

}
