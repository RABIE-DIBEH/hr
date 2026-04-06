package com.hrms.api;

import com.hrms.api.dto.LoginRequest;
import com.hrms.api.dto.ChangePasswordRequest;
import com.hrms.core.models.Employee;
import com.hrms.security.EmployeeUserDetails;
import com.hrms.services.AuthService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.MethodParameter;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.validation.beanvalidation.LocalValidatorFactoryBean;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

import java.util.Optional;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
public class AuthControllerTest {

    private MockMvc mockMvc;

    @Mock
    private AuthService authService;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private EmployeeUserDetails principal;

    @BeforeEach
    void setUp() {
        LocalValidatorFactoryBean validator = new LocalValidatorFactoryBean();
        validator.afterPropertiesSet();

        Employee employee = Employee.builder()
                .employeeId(1L)
                .fullName("Test User")
                .email("test@example.com")
                .passwordHash("secret")
                .status("Active")
                .build();
        principal = new EmployeeUserDetails(employee, "EMPLOYEE", "General");

        mockMvc = MockMvcBuilders.standaloneSetup(new AuthController(authService))
                .setControllerAdvice(new GlobalExceptionHandler())
                .setValidator(validator)
                .setCustomArgumentResolvers(new AuthenticationPrincipalResolver(principal))
                .build();
    }

    @Test
    public void login_WithValidCredentials_ReturnsToken() throws Exception {
        // Arrange
        String email = "test@example.com";
        String password = "password";
        String token = "mock-jwt-token";
        LoginRequest loginRequest = new LoginRequest(email, password);

        when(authService.login(email, password)).thenReturn(Optional.of(token));

        // Act & Assert
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(200))
                .andExpect(jsonPath("$.message").value("Login successful"))
                .andExpect(jsonPath("$.data.token").value(token));
    }

    @Test
    public void login_WithInvalidCredentials_Returns401() throws Exception {
        // Arrange
        LoginRequest loginRequest = new LoginRequest("wrong@example.com", "wrongpass");

        when(authService.login(anyString(), anyString())).thenReturn(Optional.empty());

        // Act & Assert
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.message").value("Invalid credentials"));
    }

    @Test
    public void changePassword_WithValidRequest_Returns200() throws Exception {
        // Arrange
        ChangePasswordRequest request = new ChangePasswordRequest("oldPass", "newPass666");
        when(authService.changePassword(eq(1L), eq("oldPass"), eq("newPass666"))).thenReturn(true);

        // Act & Assert
        mockMvc.perform(post("/api/auth/change-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(200))
                .andExpect(jsonPath("$.message").value("تم تغيير كلمة المرور بنجاح"));
    }

    @Test
    public void changePassword_WithWrongCurrentPassword_Returns400() throws Exception {
        // Arrange
        ChangePasswordRequest request = new ChangePasswordRequest("wrongPass", "newPass666");
        when(authService.changePassword(eq(1L), eq("wrongPass"), eq("newPass666"))).thenReturn(false);

        // Act & Assert
        mockMvc.perform(post("/api/auth/change-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message").value("كلمة المرور الحالية غير صحيحة"));
    }

    @Test
    public void changePassword_WithShortNewPassword_Returns400() throws Exception {
        // Arrange
        ChangePasswordRequest request = new ChangePasswordRequest("oldPass", "123");

        // Act & Assert
        mockMvc.perform(post("/api/auth/change-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));
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
