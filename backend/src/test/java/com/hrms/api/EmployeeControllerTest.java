package com.hrms.api;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.hrms.api.dto.EmployeeProfileUpdate;
import com.hrms.core.models.Employee;
import com.hrms.core.repositories.EmployeeRepository;
import com.hrms.security.EmployeeUserDetails;
import com.hrms.services.EmployeeDirectoryService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.MethodParameter;
import org.springframework.http.MediaType;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class EmployeeControllerTest {

    private MockMvc mockMvc;
    private EmployeeUserDetails principal;
    private ObjectMapper objectMapper;

    @org.mockito.Mock
    private EmployeeDirectoryService employeeDirectoryService;

    @org.mockito.Mock
    private EmployeeRepository employeeRepository;

    private EmployeeUserDetails hrPrincipal;

    @BeforeEach
    void setUp() {
        Employee employee = Employee.builder()
                .employeeId(1L)
                .fullName("Test User")
                .email("test@hrms.com")
                .passwordHash("secret")
                .status("Active")
                .build();
        principal = new EmployeeUserDetails(employee, "EMPLOYEE", "General");

        Employee hrEmployee = Employee.builder()
                .employeeId(1L)
                .fullName("HR Admin")
                .email("hr@hrms.com")
                .passwordHash("secret")
                .status("Active")
                .build();
        hrPrincipal = new EmployeeUserDetails(hrEmployee, "HR", "General");

        objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());

        mockMvc = MockMvcBuilders.standaloneSetup(new EmployeeController(employeeDirectoryService, employeeRepository))
                .setControllerAdvice(new GlobalExceptionHandler())
                .setCustomArgumentResolvers(new AuthenticationPrincipalResolver(principal))
                .setMessageConverters(new MappingJackson2HttpMessageConverter(objectMapper))
                .build();
    }

    @Test
    void currentEmployee_ReturnsProfile() throws Exception {
        when(employeeDirectoryService.getProfile(eq(1L)))
                .thenReturn(new com.hrms.api.dto.EmployeeProfileResponse(
                        1L, "Test User", "test@hrms.com", null, "General",
                        4L, "EMPLOYEE", null, null, "Active", null, null, null, null
                ));

        mockMvc.perform(get("/api/employees/me"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.fullName").value("Test User"))
                .andExpect(jsonPath("$.data.email").value("test@hrms.com"));
    }

    @Test
    void updateProfile_ValidRequest_ReturnsUpdatedProfile() throws Exception {
        EmployeeProfileUpdate update = new EmployeeProfileUpdate(
                "Updated Name", "updated@hrms.com", "0512345678", "Riyadh", "1234567890", null
        );

        when(employeeDirectoryService.updateProfile(eq(1L), any(EmployeeProfileUpdate.class)))
                .thenReturn(new com.hrms.api.dto.EmployeeProfileResponse(
                        1L, "Updated Name", "updated@hrms.com", null, "General",
                        4L, "EMPLOYEE", null, null, "Active", "0512345678", "Riyadh", "1234567890", null
                ));

        mockMvc.perform(put("/api/employees/me")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(update)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.fullName").value("Updated Name"))
                .andExpect(jsonPath("$.data.mobileNumber").value("0512345678"))
                .andExpect(jsonPath("$.data.address").value("Riyadh"))
                .andExpect(jsonPath("$.data.nationalId").value("1234567890"));

        verify(employeeDirectoryService).updateProfile(eq(1L), any(EmployeeProfileUpdate.class));
    }

    @Test
    void updateProfile_BlankOptionalFields_NormalizedToNull() throws Exception {
        // Send blank strings for optional fields — DTO should normalize to null
        String body = """
                {"fullName":"Test User","email":"test@hrms.com","mobileNumber":"","address":"","nationalId":""}
                """;

        when(employeeDirectoryService.updateProfile(eq(1L), any(EmployeeProfileUpdate.class)))
                .thenReturn(new com.hrms.api.dto.EmployeeProfileResponse(
                        1L, "Test User", "test@hrms.com", null, "General",
                        4L, "EMPLOYEE", null, null, "Active", null, null, null, null
                ));

        mockMvc.perform(put("/api/employees/me")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk());

        // Capture the actual DTO passed to the service and assert normalization
        ArgumentCaptor<EmployeeProfileUpdate> captor = ArgumentCaptor.forClass(EmployeeProfileUpdate.class);
        verify(employeeDirectoryService).updateProfile(eq(1L), captor.capture());
        EmployeeProfileUpdate captured = captor.getValue();
        assertNull(captured.mobileNumber(), "blank mobileNumber should be normalized to null");
        assertNull(captured.address(), "blank address should be normalized to null");
        assertNull(captured.nationalId(), "blank nationalId should be normalized to null");
    }

    @Test
    void updateProfile_InvalidMobile_Returns400() throws Exception {
        String body = """
                {"fullName":"Test User","email":"test@hrms.com","mobileNumber":"999999","address":"","nationalId":""}
                """;

        mockMvc.perform(put("/api/employees/me")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest());
    }

    @Test
    void updateProfile_MissingEmail_Returns400() throws Exception {
        String body = """
                {"fullName":"Test User","email":"","mobileNumber":"","address":"","nationalId":""}
                """;

        mockMvc.perform(put("/api/employees/me")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest());
    }

    @Test
    void deleteEmployee_Allowed_ReturnsTypedResponse() throws Exception {
        com.hrms.api.dto.EmployeeDeletionResponse response = new com.hrms.api.dto.EmployeeDeletionResponse(
                2L, "Target Employee", "target@hrms.com", "Active", "Terminated", 1L, "HR Admin"
        );

        when(employeeDirectoryService.deleteEmployee(eq(2L), eq(1L))).thenReturn(response);

        mockMvc = MockMvcBuilders.standaloneSetup(new EmployeeController(employeeDirectoryService, employeeRepository))
                .setControllerAdvice(new GlobalExceptionHandler())
                .setCustomArgumentResolvers(new AuthenticationPrincipalResolver(hrPrincipal))
                .setMessageConverters(new MappingJackson2HttpMessageConverter(objectMapper))
                .build();

        mockMvc.perform(delete("/api/employees/2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.employeeId").value(2))
                .andExpect(jsonPath("$.data.fullName").value("Target Employee"))
                .andExpect(jsonPath("$.data.email").value("target@hrms.com"))
                .andExpect(jsonPath("$.data.previousStatus").value("Active"))
                .andExpect(jsonPath("$.data.newStatus").value("Terminated"));

        verify(employeeDirectoryService).deleteEmployee(eq(2L), eq(1L));
    }

    @Test
    void deleteEmployee_SelfDeletion_Returns400() throws Exception {
        mockMvc = MockMvcBuilders.standaloneSetup(new EmployeeController(employeeDirectoryService, employeeRepository))
                .setControllerAdvice(new GlobalExceptionHandler())
                .setCustomArgumentResolvers(new AuthenticationPrincipalResolver(hrPrincipal))
                .setMessageConverters(new MappingJackson2HttpMessageConverter(objectMapper))
                .build();

        mockMvc.perform(delete("/api/employees/1"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void deleteEmployee_NonAdmin_Returns403() throws Exception {
        Employee regularEmployee = Employee.builder()
                .employeeId(2L)
                .fullName("Regular Employee")
                .email("regular@hrms.com")
                .passwordHash("secret")
                .status("Active")
                .build();
        EmployeeUserDetails employeePrincipal = new EmployeeUserDetails(regularEmployee, "EMPLOYEE", "General");

        mockMvc = MockMvcBuilders.standaloneSetup(new EmployeeController(employeeDirectoryService, employeeRepository))
                .setControllerAdvice(new GlobalExceptionHandler())
                .setCustomArgumentResolvers(new AuthenticationPrincipalResolver(employeePrincipal))
                .setMessageConverters(new MappingJackson2HttpMessageConverter(objectMapper))
                .build();

        mockMvc.perform(delete("/api/employees/3"))
                .andExpect(status().isForbidden());
    }

    @Test
    void resetPassword_Allowed_ReturnsTypedResponse() throws Exception {
        com.hrms.api.dto.PasswordResetResponse response = new com.hrms.api.dto.PasswordResetResponse(
                2L, "Target Employee", "target@hrms.com", "NewPassword123", 1L, "HR Admin"
        );

        when(employeeDirectoryService.resetEmployeePassword(eq(2L), eq(1L))).thenReturn(response);

        mockMvc = MockMvcBuilders.standaloneSetup(new EmployeeController(employeeDirectoryService, employeeRepository))
                .setControllerAdvice(new GlobalExceptionHandler())
                .setCustomArgumentResolvers(new AuthenticationPrincipalResolver(hrPrincipal))
                .setMessageConverters(new MappingJackson2HttpMessageConverter(objectMapper))
                .build();

        mockMvc.perform(post("/api/employees/2/reset-password"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.employeeId").value(2))
                .andExpect(jsonPath("$.data.fullName").value("Target Employee"))
                .andExpect(jsonPath("$.data.email").value("target@hrms.com"))
                .andExpect(jsonPath("$.data.newPassword").value("NewPassword123"))
                .andExpect(jsonPath("$.data.resetBy").value(1))
                .andExpect(jsonPath("$.data.resetByName").value("HR Admin"));

        verify(employeeDirectoryService).resetEmployeePassword(eq(2L), eq(1L));
    }

    @Test
    void resetPassword_NonManager_Returns403() throws Exception {
        Employee regularEmployee = Employee.builder()
                .employeeId(2L)
                .fullName("Regular Employee")
                .email("regular@hrms.com")
                .passwordHash("secret")
                .status("Active")
                .build();
        EmployeeUserDetails employeePrincipal = new EmployeeUserDetails(regularEmployee, "EMPLOYEE", "General");

        mockMvc = MockMvcBuilders.standaloneSetup(new EmployeeController(employeeDirectoryService, employeeRepository))
                .setControllerAdvice(new GlobalExceptionHandler())
                .setCustomArgumentResolvers(new AuthenticationPrincipalResolver(employeePrincipal))
                .setMessageConverters(new MappingJackson2HttpMessageConverter(objectMapper))
                .build();

        mockMvc.perform(post("/api/employees/3/reset-password"))
                .andExpect(status().isForbidden());
    }

    private static final class AuthenticationPrincipalResolver implements HandlerMethodArgumentResolver {
        private final EmployeeUserDetails principal;

        private AuthenticationPrincipalResolver(EmployeeUserDetails principal) {
            this.principal = principal;
        }

        @Override
        public boolean supportsParameter(MethodParameter parameter) {
            return parameter.hasParameterAnnotation(AuthenticationPrincipal.class)
                    && EmployeeUserDetails.class.isAssignableFrom(parameter.getParameterType());
        }

        @Override
        public Object resolveArgument(MethodParameter parameter,
                                      ModelAndViewContainer mavContainer,
                                      NativeWebRequest webRequest,
                                      WebDataBinderFactory binderFactory) {
            return principal;
        }
    }
}
