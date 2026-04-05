package com.hrms.api;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.hrms.core.models.AttendanceRecord;
import com.hrms.core.models.Employee;
import com.hrms.security.EmployeeUserDetails;
import com.hrms.services.AttendanceService;
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

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class AttendanceControllerTest {

    @Mock
    private AttendanceService attendanceService;

    private MockMvc mockMvc;
    private EmployeeUserDetails principal;

    @BeforeEach
    void setUp() {
        Employee superAdmin = Employee.builder()
                .employeeId(1L)
                .fullName("Dev Super Admin")
                .email("dev@hrms.com")
                .passwordHash("secret")
                .status("Active")
                .build();
        principal = new EmployeeUserDetails(superAdmin, "SUPER_ADMIN", "Engineering");

        ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());

        mockMvc = MockMvcBuilders.standaloneSetup(new AttendanceController(attendanceService))
                .setControllerAdvice(new GlobalExceptionHandler())
                .setCustomArgumentResolvers(
                        new PageableHandlerMethodArgumentResolver(),
                        new AuthenticationPrincipalResolver(principal)
                )
                .setMessageConverters(new MappingJackson2HttpMessageConverter(objectMapper))
                .build();
    }

    @Test
    void getManagerTodayRecords_AllowsSuperAdminToViewCompanyAttendance() throws Exception {
        Employee employee = Employee.builder()
                .employeeId(55L)
                .fullName("Attendance User")
                .email("attendance@example.com")
                .passwordHash("secret")
                .status("Active")
                .build();

        AttendanceRecord record = AttendanceRecord.builder()
                .employee(employee)
                .checkIn(LocalDateTime.of(2026, 4, 5, 8, 30))
                .status("Normal")
                .isVerifiedByManager(false)
                .build();
        record.setRecordId(99L);

        when(attendanceService.getTodayRecordsForManager(eq(1L), eq(PageRequest.of(0, 20)), eq(principal)))
                .thenReturn(new PageImpl<>(List.of(record), PageRequest.of(0, 20), 1));

        mockMvc.perform(get("/api/attendance/manager/today"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.items[0].recordId").value(99))
                .andExpect(jsonPath("$.data.items[0].employee.employeeId").value(55));

        ArgumentCaptor<org.springframework.data.domain.Pageable> pageableCaptor =
                ArgumentCaptor.forClass(org.springframework.data.domain.Pageable.class);
        verify(attendanceService).getTodayRecordsForManager(eq(1L), pageableCaptor.capture(), eq(principal));
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
