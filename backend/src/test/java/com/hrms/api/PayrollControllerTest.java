package com.hrms.api;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.hrms.core.models.Employee;
import com.hrms.core.models.Payroll;
import com.hrms.core.repositories.DepartmentRepository;
import com.hrms.core.repositories.EmployeeRepository;
import com.hrms.core.repositories.RoleRepository;
import com.hrms.security.EmployeeUserDetails;
import com.hrms.services.PayrollExcelExportService;
import com.hrms.services.PayrollPdfService;
import com.hrms.services.PayrollService;
import org.springframework.http.converter.ByteArrayHttpMessageConverter;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.MethodParameter;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;
import org.springframework.data.web.PageableHandlerMethodArgumentResolver;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class PayrollControllerTest {

    @Mock
    private PayrollService payrollService;

    @Mock
    private EmployeeRepository employeeRepository;

    @Mock
    private DepartmentRepository departmentRepository;

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private PayrollExcelExportService payrollExcelExportService;

    @Mock
    private PayrollPdfService payrollPdfService;

    private MockMvc mockMvc;
    private Employee employee;
    private EmployeeUserDetails superAdminPrincipal;

    @BeforeEach
    void setUp() {
        employee = Employee.builder()
                .employeeId(99L)
                .fullName("Target Employee")
                .email("target@example.com")
                .passwordHash("secret")
                .baseSalary(new BigDecimal("8000.00"))
                .status("Active")
                .build();

        Employee superAdmin = Employee.builder()
                .employeeId(1L)
                .fullName("Dev Super Admin")
                .email("dev@hrms.com")
                .passwordHash("secret")
                .status("Active")
                .build();
        superAdminPrincipal = new EmployeeUserDetails(superAdmin, "SUPER_ADMIN", "Engineering");

        ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());

        mockMvc = MockMvcBuilders.standaloneSetup(new PayrollController(
                        payrollService,
                        employeeRepository,
                        departmentRepository,
                        roleRepository,
                        payrollExcelExportService,
                        payrollPdfService))
                .setControllerAdvice(new GlobalExceptionHandler())
                .setCustomArgumentResolvers(
                        new PageableHandlerMethodArgumentResolver(),
                        new AuthenticationPrincipalResolver(superAdminPrincipal)
                )
                .setMessageConverters(
                        new MappingJackson2HttpMessageConverter(objectMapper),
                        new ByteArrayHttpMessageConverter())
                .build();
    }

    @Test
    void calculatePayroll_AllowsSuperAdminToTargetAnotherEmployee() throws Exception {
        Payroll payroll = Payroll.builder()
                .employee(employee)
                .month(4)
                .year(2026)
                .build();
        payroll.setPayrollId(12L);
        payroll.setTotalWorkHours(new BigDecimal("160.00"));
        payroll.setOvertimeHours(BigDecimal.ZERO);
        payroll.setDeductions(BigDecimal.ZERO);
        payroll.setNetSalary(new BigDecimal("8000.00"));

        when(employeeRepository.findById(99L)).thenReturn(Optional.of(employee));
        when(payrollService.calculateMonthlyPayroll(employee, 4, 2026)).thenReturn(payroll);

        mockMvc.perform(post("/api/payroll/calculate")
                        .param("employeeId", "99")
                        .param("month", "4")
                        .param("year", "2026"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.payrollId").value(12))
                .andExpect(jsonPath("$.data.employeeId").value(99))
                .andExpect(jsonPath("$.data.employeeName").value("Target Employee"));

        verify(payrollService).calculateMonthlyPayroll(employee, 4, 2026);
    }

    @Test
    void getAllPayrollHistory_AllowsSuperAdmin() throws Exception {
        Payroll payroll = Payroll.builder()
                .employee(employee)
                .month(4)
                .year(2026)
                .build();
        payroll.setPayrollId(12L);
        payroll.setTotalWorkHours(new BigDecimal("160.00"));
        payroll.setOvertimeHours(BigDecimal.ZERO);
        payroll.setDeductions(BigDecimal.ZERO);
        payroll.setNetSalary(new BigDecimal("8000.00"));

        when(payrollService.getAllPayrollHistory(any())).thenReturn(new PageImpl<>(List.of(payroll), PageRequest.of(0, 20), 1));

        mockMvc.perform(get("/api/payroll/history"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.items[0].employeeId").value(99))
                .andExpect(jsonPath("$.data.items[0].employeeName").value("Target Employee"));

        ArgumentCaptor<org.springframework.data.domain.Pageable> pageableCaptor =
                ArgumentCaptor.forClass(org.springframework.data.domain.Pageable.class);
        verify(payrollService).getAllPayrollHistory(pageableCaptor.capture());
        assertEquals(0, pageableCaptor.getValue().getPageNumber());
        assertEquals(20, pageableCaptor.getValue().getPageSize());
    }

    @Test
    void calculateAllPayroll_Allowed_ReturnsTypedResponse() throws Exception {
        com.hrms.api.dto.PayrollBulkResult result = new com.hrms.api.dto.PayrollBulkResult(
                4, 2026, 50, 48, 2, "dev@hrms.com"
        );

        when(payrollService.calculateAllMonthlyPayroll(4, 2026, "dev@hrms.com")).thenReturn(result);

        mockMvc.perform(post("/api/payroll/calculate-all")
                        .param("month", "4")
                        .param("year", "2026"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.month").value(4))
                .andExpect(jsonPath("$.data.year").value(2026))
                .andExpect(jsonPath("$.data.totalProcessed").value(50))
                .andExpect(jsonPath("$.data.successCount").value(48))
                .andExpect(jsonPath("$.data.errorCount").value(2))
                .andExpect(jsonPath("$.data.requester").value("dev@hrms.com"));
    }

    @Test
    void calculateAllPayroll_NonHr_Returns403() throws Exception {
        Employee regularEmployee = Employee.builder()
                .employeeId(2L)
                .fullName("Regular Employee")
                .email("employee@hrms.com")
                .passwordHash("secret")
                .status("Active")
                .build();
        EmployeeUserDetails employeePrincipal = new EmployeeUserDetails(regularEmployee, "EMPLOYEE", "General");

        ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());

        mockMvc = MockMvcBuilders.standaloneSetup(new PayrollController(
                        payrollService,
                        employeeRepository,
                        departmentRepository,
                        roleRepository,
                        payrollExcelExportService,
                        payrollPdfService))
                .setControllerAdvice(new GlobalExceptionHandler())
                .setCustomArgumentResolvers(
                        new PageableHandlerMethodArgumentResolver(),
                        new AuthenticationPrincipalResolver(employeePrincipal)
                )
                .setMessageConverters(new MappingJackson2HttpMessageConverter(objectMapper))
                .build();

        mockMvc.perform(post("/api/payroll/calculate-all")
                        .param("month", "4")
                        .param("year", "2026"))
                .andExpect(status().isForbidden());
    }

    @Test
    void exportPayroll_ExcelFormat_ReturnsExcelFile() throws Exception {
        // Given
        Payroll payroll = Payroll.builder()
                .employee(employee)
                .month(4)
                .year(2026)
                .build();
        payroll.setPayrollId(12L);
        payroll.setTotalWorkHours(new BigDecimal("160.00"));
        payroll.setOvertimeHours(BigDecimal.ZERO);
        payroll.setDeductions(BigDecimal.ZERO);
        payroll.setNetSalary(new BigDecimal("8000.00"));

        when(payrollService.getMonthlyPayroll(eq(4), eq(2026), any()))
                .thenReturn(new org.springframework.data.domain.PageImpl<>(List.of(payroll)));
        
        when(payrollExcelExportService.generatePayrollWorkbook(any(), any(), any(), any(), any(), any()))
                .thenReturn(new org.apache.poi.xssf.usermodel.XSSFWorkbook());

        // When/Then
        mockMvc.perform(post("/api/payroll/export")
                        .param("month", "4")
                        .param("year", "2026")
                        .param("format", "excel"))
                .andExpect(status().isOk())
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.header().string("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.header().string("Content-Disposition", "attachment; filename=\"payroll_4_2026.xlsx\""));
    }

    @Test
    void exportPayroll_PdfFormat_ReturnsPdfFile() throws Exception {
        // Given
        Payroll payroll = Payroll.builder()
                .employee(employee)
                .month(4)
                .year(2026)
                .build();
        payroll.setPayrollId(12L);
        payroll.setTotalWorkHours(new BigDecimal("160.00"));
        payroll.setOvertimeHours(BigDecimal.ZERO);
        payroll.setDeductions(BigDecimal.ZERO);
        payroll.setNetSalary(new BigDecimal("8000.00"));

        when(payrollService.getMonthlyPayroll(eq(4), eq(2026), any()))
                .thenReturn(new org.springframework.data.domain.PageImpl<>(List.of(payroll)));
        
        when(payrollPdfService.generatePayrollPdf(any(), any(), any(), any(), any()))
                .thenReturn(new byte[0]);

        // When/Then
        mockMvc.perform(post("/api/payroll/export")
                        .param("month", "4")
                        .param("year", "2026")
                        .param("format", "pdf"))
                .andExpect(status().isOk())
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.header().string("Content-Type", "application/pdf"))
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.header().string("Content-Disposition", "attachment; filename=\"payroll_4_2026.pdf\""));
    }

    @Test
    void exportPayroll_InvalidFormat_ReturnsBadRequest() throws Exception {
        mockMvc.perform(post("/api/payroll/export")
                        .param("month", "4")
                        .param("year", "2026")
                        .param("format", "invalid"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void exportPayroll_NonPayrollRole_ReturnsForbidden() throws Exception {
        Employee regularEmployee = Employee.builder()
                .employeeId(2L)
                .fullName("Regular Employee")
                .email("employee@hrms.com")
                .passwordHash("secret")
                .status("Active")
                .build();
        EmployeeUserDetails employeePrincipal = new EmployeeUserDetails(regularEmployee, "EMPLOYEE", "General");

        ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());

        mockMvc = MockMvcBuilders.standaloneSetup(new PayrollController(
                        payrollService,
                        employeeRepository,
                        departmentRepository,
                        roleRepository,
                        payrollExcelExportService,
                        payrollPdfService))
                .setControllerAdvice(new GlobalExceptionHandler())
                .setCustomArgumentResolvers(
                        new PageableHandlerMethodArgumentResolver(),
                        new AuthenticationPrincipalResolver(employeePrincipal)
                )
                .setMessageConverters(new MappingJackson2HttpMessageConverter(objectMapper))
                .build();

        mockMvc.perform(post("/api/payroll/export")
                        .param("month", "4")
                        .param("year", "2026")
                        .param("format", "excel"))
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
