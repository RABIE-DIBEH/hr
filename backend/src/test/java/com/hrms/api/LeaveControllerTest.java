package com.hrms.api;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.hrms.core.models.Employee;
import com.hrms.core.models.LeaveRequest;
import com.hrms.core.repositories.EmployeeRepository;
import com.hrms.security.EmployeeUserDetails;
import com.hrms.services.LeaveService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.MethodParameter;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.web.PageableHandlerMethodArgumentResolver;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class LeaveControllerTest {

    @Mock
    private LeaveService leaveService;

    @Mock
    private EmployeeRepository employeeRepository;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        Employee superAdmin = Employee.builder()
                .employeeId(1L)
                .fullName("Dev Super Admin")
                .email("dev@hrms.com")
                .passwordHash("secret")
                .status("Active")
                .build();
        EmployeeUserDetails principal = new EmployeeUserDetails(superAdmin, "SUPER_ADMIN", "Engineering");

        ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());

        mockMvc = MockMvcBuilders.standaloneSetup(new LeaveController(leaveService, employeeRepository))
                .setControllerAdvice(new GlobalExceptionHandler())
                .setCustomArgumentResolvers(
                        new PageableHandlerMethodArgumentResolver(),
                        new AuthenticationPrincipalResolver(principal)
                )
                .setMessageConverters(new MappingJackson2HttpMessageConverter(objectMapper))
                .build();
    }

    @Test
    void getMyRequests_AllowsSuperAdminToViewAnotherEmployeesRequests() throws Exception {
        Employee employee = Employee.builder()
                .employeeId(77L)
                .fullName("Another Employee")
                .email("another@example.com")
                .passwordHash("secret")
                .status("Active")
                .build();
        LeaveRequest leaveRequest = new LeaveRequest();
        leaveRequest.setRequestId(41L);
        leaveRequest.setEmployee(employee);
        leaveRequest.setLeaveType("Annual");
        leaveRequest.setStartDate(LocalDate.of(2026, 4, 10));
        leaveRequest.setEndDate(LocalDate.of(2026, 4, 12));
        leaveRequest.setDuration(3.0);
        leaveRequest.setStatus("PENDING_MANAGER");

        when(leaveService.getEmployeeRequests(eq(77L), eq(PageRequest.of(0, 20))))
                .thenReturn(new PageImpl<>(List.of(leaveRequest), PageRequest.of(0, 20), 1));

        mockMvc.perform(get("/api/leaves/my-requests").param("employeeId", "77"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.items[0].employee.employeeId").value(77))
                .andExpect(jsonPath("$.data.items[0].employee.fullName").value("Another Employee"));
    }

    @Test
    void getPendingForManager_AllowsSuperAdminToViewAnotherManagersQueue() throws Exception {
        Employee employee = Employee.builder()
                .employeeId(88L)
                .fullName("Managed Employee")
                .email("managed@example.com")
                .passwordHash("secret")
                .status("Active")
                .build();
        LeaveRequest leaveRequest = new LeaveRequest();
        leaveRequest.setRequestId(55L);
        leaveRequest.setEmployee(employee);
        leaveRequest.setLeaveType("Sick");
        leaveRequest.setStartDate(LocalDate.of(2026, 4, 15));
        leaveRequest.setEndDate(LocalDate.of(2026, 4, 15));
        leaveRequest.setDuration(1.0);
        leaveRequest.setStatus("PENDING_MANAGER");

        when(leaveService.getPendingRequestsForManager(eq(25L), eq(PageRequest.of(0, 20))))
                .thenReturn(new PageImpl<>(List.of(leaveRequest), PageRequest.of(0, 20), 1));

        mockMvc.perform(get("/api/leaves/manager/pending").param("managerId", "25"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.items[0].requestId").value(55))
                .andExpect(jsonPath("$.data.items[0].employee.fullName").value("Managed Employee"));

        ArgumentCaptor<org.springframework.data.domain.Pageable> pageableCaptor =
                ArgumentCaptor.forClass(org.springframework.data.domain.Pageable.class);
        verify(leaveService).getPendingRequestsForManager(eq(25L), pageableCaptor.capture());
        assertEquals(20, pageableCaptor.getValue().getPageSize());
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
