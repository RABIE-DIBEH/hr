package com.hrms.api;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.hrms.core.models.Department;
import com.hrms.core.models.Employee;
import com.hrms.core.repositories.EmployeeRepository;
import com.hrms.security.EmployeeUserDetails;
import com.hrms.services.DepartmentService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.MethodParameter;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class DepartmentControllerTest {

    @Mock
    private DepartmentService departmentService;

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    // ── Helper: Create a department ──
    private Department createDept(Long id, String name, String code) {
        Department d = new Department();
        d.setDepartmentId(id);
        d.setDepartmentName(name);
        d.setDepartmentCode(code);
        d.setDescription(name + " department");
        return d;
    }

    // ── Helper: Create an employee with departmentId ──
    private Employee createEmployee(Long id, String name, String email, Long departmentId) {
        Employee e = Employee.builder()
                .employeeId(id)
                .fullName(name)
                .email(email)
                .passwordHash("secret")
                .departmentId(departmentId)
                .status("Active")
                .build();
        return e;
    }

    // ── Helper: Create principal with a given role ──
    private EmployeeUserDetails principal(Employee employee, String role) {
        return new EmployeeUserDetails(employee, role, "Engineering", "Engineering");
    }

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());

        // Default setup uses SUPER_ADMIN — override per-test via custom resolvers
        Employee superAdmin = createEmployee(1L, "Dev Super Admin", "dev@hrms.com", 1L);
        EmployeeUserDetails defaultPrincipal = new EmployeeUserDetails(
                superAdmin, "SUPER_ADMIN", "Engineering", "Engineering");

        mockMvc = MockMvcBuilders.standaloneSetup(new DepartmentController(departmentService))
                .setControllerAdvice(new GlobalExceptionHandler())
                .setCustomArgumentResolvers(new AuthenticationPrincipalResolver(defaultPrincipal))
                .setMessageConverters(new MappingJackson2HttpMessageConverter(objectMapper))
                .build();
    }

    // ── Override principal for specific tests ──
    private MockMvc mockMvcWithPrincipal(Employee employee, String role) {
        EmployeeUserDetails p = new EmployeeUserDetails(employee, role, "Engineering", "Engineering");
        return MockMvcBuilders.standaloneSetup(new DepartmentController(departmentService))
                .setControllerAdvice(new GlobalExceptionHandler())
                .setCustomArgumentResolvers(new AuthenticationPrincipalResolver(p))
                .setMessageConverters(new MappingJackson2HttpMessageConverter(objectMapper))
                .build();
    }

    // ═══════════════════════════════════════════
    // GET /api/departments — Role-based access
    // ═══════════════════════════════════════════

    @Test
    void getAllDepartments_SuperAdmin_ReturnsAll() throws Exception {
        List<Department> depts = List.of(
                createDept(1L, "Engineering", "ENG"),
                createDept(2L, "HR", "HR")
        );
        when(departmentService.getAllDepartments()).thenReturn(depts);

        mockMvc.perform(get("/api/departments"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data.length()").value(2))
                .andExpect(jsonPath("$.data[0].departmentName").value("Engineering"));

        verify(departmentService).getAllDepartments();
    }

    @Test
    void getAllDepartments_Hr_ReturnsAll() throws Exception {
        Employee hr = createEmployee(3L, "Sara HR", "hr@hrms.com", 2L);
        List<Department> depts = List.of(
                createDept(1L, "Engineering", "ENG"),
                createDept(2L, "HR", "HR"),
                createDept(3L, "Finance", "FIN")
        );
        when(departmentService.getAllDepartments()).thenReturn(depts);

        mockMvcWithPrincipal(hr, "HR")
                .perform(get("/api/departments"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(3));

        verify(departmentService).getAllDepartments();
    }

    @Test
    void getAllDepartments_Admin_ReturnsAll() throws Exception {
        Employee admin = createEmployee(2L, "System Admin", "admin@hrms.com", 1L);
        List<Department> depts = List.of(createDept(1L, "Engineering", "ENG"));
        when(departmentService.getAllDepartments()).thenReturn(depts);

        mockMvcWithPrincipal(admin, "ADMIN")
                .perform(get("/api/departments"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(1));
    }

    @Test
    void getAllDepartments_Manager_ReturnsOnlyManagedDepartments() throws Exception {
        Employee manager = createEmployee(4L, "Khalid Manager", "manager@hrms.com", 1L);
        List<Department> managedDepts = List.of(createDept(1L, "Engineering", "ENG"));
        when(departmentService.getDepartmentsManagedBy(4L)).thenReturn(managedDepts);

        mockMvcWithPrincipal(manager, "MANAGER")
                .perform(get("/api/departments"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(1))
                .andExpect(jsonPath("$.data[0].departmentName").value("Engineering"));

        verify(departmentService).getDepartmentsManagedBy(4L);
        verify(departmentService, never()).getAllDepartments();
    }

    @Test
    void getAllDepartments_Employee_Returns403() throws Exception {
        Employee emp = createEmployee(5L, "Lina Employee", "employee@hrms.com", 1L);

        mockMvcWithPrincipal(emp, "EMPLOYEE")
                .perform(get("/api/departments"))
                .andExpect(status().isForbidden());
    }

    // ═══════════════════════════════════════════
    // POST /api/departments — Create
    // ═══════════════════════════════════════════

    @Test
    void createDepartment_Hr_Returns201() throws Exception {
        Employee hr = createEmployee(3L, "Sara HR", "hr@hrms.com", 2L);
        Department input = createDept(null, "Testing", "TST");
        Department created = createDept(7L, "Testing", "TST");
        when(departmentService.createDepartment(any())).thenReturn(created);

        mockMvcWithPrincipal(hr, "HR")
                .perform(post("/api/departments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(input)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.departmentId").value(7))
                .andExpect(jsonPath("$.data.departmentName").value("Testing"));

        verify(departmentService).createDepartment(any(Department.class));
    }

    @Test
    void createDepartment_Manager_Returns403() throws Exception {
        Employee manager = createEmployee(4L, "Khalid Manager", "manager@hrms.com", 1L);
        Department input = createDept(null, "Testing", "TST");

        mockMvcWithPrincipal(manager, "MANAGER")
                .perform(post("/api/departments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(input)))
                .andExpect(status().isForbidden());

        verify(departmentService, never()).createDepartment(any());
    }

    @Test
    void createDepartment_BlankName_Returns400() throws Exception {
        Employee hr = createEmployee(3L, "Sara HR", "hr@hrms.com", 2L);
        Department input = createDept(null, "", "TST");

        mockMvcWithPrincipal(hr, "HR")
                .perform(post("/api/departments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(input)))
                .andExpect(status().isBadRequest());

        verify(departmentService, never()).createDepartment(any());
    }

    // ═══════════════════════════════════════════
    // PUT /api/departments/{id} — Update
    // ═══════════════════════════════════════════

    @Test
    void updateDepartment_Hr_Returns200() throws Exception {
        Employee hr = createEmployee(3L, "Sara HR", "hr@hrms.com", 2L);
        Department existing = createDept(1L, "Engineering", "ENG");
        Department updates = createDept(null, "Software Engineering", "SWE");
        when(departmentService.updateDepartment(eq(1L), any())).thenReturn(existing);

        mockMvcWithPrincipal(hr, "HR")
                .perform(put("/api/departments/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updates)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.departmentName").value("Engineering"));

        verify(departmentService).updateDepartment(eq(1L), any(Department.class));
    }

    @Test
    void updateDepartment_Manager_Returns403() throws Exception {
        Employee manager = createEmployee(4L, "Khalid Manager", "manager@hrms.com", 1L);
        Department updates = createDept(null, "Updated", "UPD");

        mockMvcWithPrincipal(manager, "MANAGER")
                .perform(put("/api/departments/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updates)))
                .andExpect(status().isForbidden());

        verify(departmentService, never()).updateDepartment(any(), any());
    }

    // ═══════════════════════════════════════════
    // DELETE /api/departments/{id} — Delete
    // ═══════════════════════════════════════════

    @Test
    void deleteDepartment_Hr_Returns200() throws Exception {
        Employee hr = createEmployee(3L, "Sara HR", "hr@hrms.com", 2L);

        mockMvcWithPrincipal(hr, "HR")
                .perform(delete("/api/departments/5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Department deleted successfully"));

        verify(departmentService).deleteDepartment(5L);
    }

    @Test
    void deleteDepartment_WithEmployees_Returns400() throws Exception {
        Employee hr = createEmployee(3L, "Sara HR", "hr@hrms.com", 2L);
        doThrow(new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "Cannot delete department 'Engineering' — it has 5 employee(s). Reassign them first."))
                .when(departmentService).deleteDepartment(1L);

        mockMvcWithPrincipal(hr, "HR")
                .perform(delete("/api/departments/1"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void deleteDepartment_Manager_Returns403() throws Exception {
        Employee manager = createEmployee(4L, "Khalid Manager", "manager@hrms.com", 1L);

        mockMvcWithPrincipal(manager, "MANAGER")
                .perform(delete("/api/departments/1"))
                .andExpect(status().isForbidden());

        verify(departmentService, never()).deleteDepartment(any());
    }

    // ═══════════════════════════════════════════
    // GET /api/departments/{id} — Single department
    // ═══════════════════════════════════════════

    @Test
    void getDepartment_ExistingId_Returns200() throws Exception {
        Department dept = createDept(1L, "Engineering", "ENG");
        when(departmentService.getDepartmentById(1L)).thenReturn(Optional.of(dept));

        mockMvc.perform(get("/api/departments/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.departmentName").value("Engineering"));
    }

    @Test
    void getDepartment_NonExistingId_Returns404() throws Exception {
        when(departmentService.getDepartmentById(99L)).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/departments/99"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Department not found"));
    }

    // ═══════════════════════════════════════════
    // GET /api/departments/my — Current user's department
    // ═══════════════════════════════════════════

    @Test
    void getMyDepartment_WithDepartment_Returns200() throws Exception {
        Employee emp = createEmployee(5L, "Lina Employee", "employee@hrms.com", 1L);
        Department dept = createDept(1L, "Engineering", "ENG");
        when(departmentService.getDepartmentById(1L)).thenReturn(Optional.of(dept));

        mockMvcWithPrincipal(emp, "EMPLOYEE")
                .perform(get("/api/departments/my"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.departmentName").value("Engineering"));
    }

    @Test
    void getMyDepartment_NoDepartment_Returns404() throws Exception {
        Employee emp = createEmployee(99L, "New Employee", "new@hrms.com", null);

        mockMvcWithPrincipal(emp, "EMPLOYEE")
                .perform(get("/api/departments/my"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("No department assigned"));
    }

    @Test
    void getMyDepartment_InvalidDepartmentId_Returns404() throws Exception {
        Employee emp = createEmployee(99L, "New Employee", "new@hrms.com", 999L);
        when(departmentService.getDepartmentById(999L)).thenReturn(Optional.empty());

        mockMvcWithPrincipal(emp, "EMPLOYEE")
                .perform(get("/api/departments/my"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Department not found"));
    }

    // ═══════════════════════════════════════════
    // AuthenticationPrincipalResolver
    // ═══════════════════════════════════════════

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
