package com.hrms.api;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.hrms.api.dto.ProcessRecruitmentRequestDto;
import com.hrms.api.dto.ProcessRecruitmentResult;
import com.hrms.core.models.Employee;
import com.hrms.core.models.RecruitmentRequest;
import com.hrms.core.repositories.EmployeeRepository;
import com.hrms.security.EmployeeUserDetails;
import com.hrms.services.RecruitmentRequestService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.MethodParameter;
import org.springframework.http.MediaType;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.validation.beanvalidation.LocalValidatorFactoryBean;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

import java.math.BigDecimal;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class RecruitmentRequestControllerTest {

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;
    private EmployeeUserDetails hrPrincipal;
    private EmployeeUserDetails employeePrincipal;

    @org.mockito.Mock
    private RecruitmentRequestService recruitmentRequestService;

    @org.mockito.Mock
    private EmployeeRepository employeeRepository;

    @BeforeEach
    void setUp() {
        Employee hrEmployee = Employee.builder()
                .employeeId(1L)
                .fullName("HR Manager")
                .email("hr@hrms.com")
                .passwordHash("secret")
                .status("Active")
                .build();
        hrPrincipal = new EmployeeUserDetails(hrEmployee, "HR", "General");

        Employee regularEmployee = Employee.builder()
                .employeeId(2L)
                .fullName("Regular Employee")
                .email("employee@hrms.com")
                .passwordHash("secret")
                .status("Active")
                .build();
        employeePrincipal = new EmployeeUserDetails(regularEmployee, "EMPLOYEE", "General");

        objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());

        mockMvc = MockMvcBuilders.standaloneSetup(new RecruitmentRequestController(recruitmentRequestService, employeeRepository))
                .setControllerAdvice(new GlobalExceptionHandler())
                .setCustomArgumentResolvers(new AuthenticationPrincipalResolver(hrPrincipal))
                .setMessageConverters(new MappingJackson2HttpMessageConverter(objectMapper))
                .build();
    }

    @Test
    void processRequest_Reject_ReturnsTypedResponse() throws Exception {
        RecruitmentRequest request = new RecruitmentRequest.RecruitmentRequestBuilder()
                .fullName("John Doe")
                .email("john@example.com")
                .nationalId("1234567890")
                .department("Engineering")
                .jobDescription("Software Engineer")
                .build();
        request.setRequestId(1L);
        request.setStatus(RecruitmentRequest.STATUS_REJECTED);
        request.setRequestedBy(1L);

        ProcessRecruitmentResult result = ProcessRecruitmentResult.withoutCredentials(request);

        when(recruitmentRequestService.processRequest(
                eq(1L), eq("Rejected"), eq("Not a fit"), eq(null), eq(1L), eq("HR")))
                .thenReturn(result);

        ProcessRecruitmentRequestDto dto = new ProcessRecruitmentRequestDto("Rejected", "Not a fit", null);

        mockMvc.perform(put("/api/recruitment/process/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.request.fullName").value("John Doe"))
                .andExpect(jsonPath("$.data.username").doesNotExist())
                .andExpect(jsonPath("$.data.password").doesNotExist());
    }

    @Test
    void processRequest_ApproveWithCredentials_ReturnsTypedResponse() throws Exception {
        RecruitmentRequest request = new RecruitmentRequest.RecruitmentRequestBuilder()
                .fullName("Jane Smith")
                .email("jane@example.com")
                .nationalId("0987654321")
                .department("Marketing")
                .jobDescription("Marketing Manager")
                .build();
        request.setRequestId(2L);
        request.setStatus(RecruitmentRequest.STATUS_APPROVED);
        request.setRequestedBy(1L);

        ProcessRecruitmentResult result = ProcessRecruitmentResult.withCredentials(
                request, "jane.smith", "P@ssw0rd1", "1001"
        );

        when(recruitmentRequestService.processRequest(
                eq(2L), eq("Approved"), eq("Welcome aboard!"), eq(new BigDecimal("12000")), eq(1L), eq("HR")))
                .thenReturn(result);

        ProcessRecruitmentRequestDto dto = new ProcessRecruitmentRequestDto("Approved", "Welcome aboard!", new BigDecimal("12000"));

        mockMvc.perform(put("/api/recruitment/process/2")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.request.fullName").value("Jane Smith"))
                .andExpect(jsonPath("$.data.username").value("jane.smith"))
                .andExpect(jsonPath("$.data.password").value("P@ssw0rd1"))
                .andExpect(jsonPath("$.data.employeeId").value("1001"));
    }

    @Test
    void processRequest_NonAuthorized_Returns403() throws Exception {
        mockMvc = MockMvcBuilders.standaloneSetup(new RecruitmentRequestController(recruitmentRequestService, employeeRepository))
                .setControllerAdvice(new GlobalExceptionHandler())
                .setCustomArgumentResolvers(new AuthenticationPrincipalResolver(employeePrincipal))
                .setMessageConverters(new MappingJackson2HttpMessageConverter(objectMapper))
                .build();

        ProcessRecruitmentRequestDto dto = new ProcessRecruitmentRequestDto("Approved", "Test", null);

        mockMvc.perform(put("/api/recruitment/process/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
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
