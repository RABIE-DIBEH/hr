package com.hrms.services;

import com.hrms.api.exception.BusinessException;
import com.hrms.api.exception.ErrorCode;
import com.hrms.core.models.Department;
import com.hrms.core.repositories.DepartmentRepository;
import com.hrms.core.repositories.EmployeeRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DepartmentServiceTest {

    @Mock
    private DepartmentRepository departmentRepository;

    @Mock
    private EmployeeRepository employeeRepository;

    @InjectMocks
    private DepartmentService departmentService;

    @Test
    void getAllDepartments_ReturnsOrderedList() {
        List<Department> depts = List.of(
                createDepartment(1L, "Engineering", "ENG"),
                createDepartment(2L, "Finance", "FIN")
        );
        when(departmentRepository.findAllOrderedByName()).thenReturn(depts);

        List<Department> result = departmentService.getAllDepartments();

        assertEquals(2, result.size());
        assertEquals("Engineering", result.get(0).getDepartmentName());
        verify(departmentRepository).findAllOrderedByName();
    }

    @Test
    void getDepartmentById_ExistingId_ReturnsDepartment() {
        Department dept = createDepartment(1L, "HR", "HR");
        when(departmentRepository.findById(1L)).thenReturn(Optional.of(dept));

        Optional<Department> result = departmentService.getDepartmentById(1L);

        assertTrue(result.isPresent());
        assertEquals("HR", result.get().getDepartmentName());
    }

    @Test
    void getDepartmentById_NonExistingId_ReturnsEmpty() {
        when(departmentRepository.findById(99L)).thenReturn(Optional.empty());

        Optional<Department> result = departmentService.getDepartmentById(99L);

        assertTrue(result.isEmpty());
    }

    @Test
    void createDepartment_SavesAndReturns() {
        Department dept = new Department(null, "Marketing", "MKT", 5L, "Marketing dept");
        Department saved = new Department(1L, "Marketing", "MKT", 5L, "Marketing dept");
        when(departmentRepository.save(any())).thenReturn(saved);

        Department result = departmentService.createDepartment(dept);

        assertNotNull(result);
        assertEquals(1L, result.getDepartmentId());
        assertEquals("Marketing", result.getDepartmentName());
        verify(departmentRepository).save(dept);
    }

    @Test
    void updateDepartment_Existing_UpdatesFields() {
        Department existing = createDepartment(1L, "Old Name", "ENG");
        Department updates = new Department(null, "New Name", null, null, "New description");

        when(departmentRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(departmentRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        Department result = departmentService.updateDepartment(1L, updates);

        assertEquals("New Name", result.getDepartmentName());
        assertEquals("ENG", result.getDepartmentCode()); // unchanged
        assertEquals("New description", result.getDescription());
        verify(departmentRepository).save(existing);
    }

    @Test
    void updateDepartment_NonExisting_ThrowsException() {
        when(departmentRepository.findById(99L)).thenReturn(Optional.empty());

        BusinessException ex = assertThrows(BusinessException.class, () ->
                departmentService.updateDepartment(99L, new Department()));
        assertEquals(ErrorCode.DEPARTMENT_NOT_FOUND, ex.getErrorCode());
    }

    @Test
    void deleteDepartment_NoEmployees_DeletesSuccessfully() {
        Department dept = createDepartment(1L, "Finance", "FIN");
        when(departmentRepository.findById(1L)).thenReturn(Optional.of(dept));
        when(employeeRepository.countByDepartmentId(1L)).thenReturn(0L);

        departmentService.deleteDepartment(1L);

        verify(departmentRepository).delete(dept);
    }

    @Test
    void deleteDepartment_WithEmployees_ThrowsException() {
        Department dept = createDepartment(1L, "Engineering", "ENG");
        when(departmentRepository.findById(1L)).thenReturn(Optional.of(dept));
        when(employeeRepository.countByDepartmentId(1L)).thenReturn(5L);

        BusinessException ex = assertThrows(BusinessException.class, () ->
                departmentService.deleteDepartment(1L));

        assertEquals(ErrorCode.VALIDATION_ERROR, ex.getErrorCode());
        assertTrue(ex.getMessage().contains("Cannot delete department"));
        assertTrue(ex.getMessage().contains("5 employee(s)"));
        verify(departmentRepository, never()).delete(any());
    }

    @Test
    void deleteDepartment_NonExisting_ThrowsException() {
        when(departmentRepository.findById(99L)).thenReturn(Optional.empty());

        BusinessException ex = assertThrows(BusinessException.class, () ->
                departmentService.deleteDepartment(99L));
        assertEquals(ErrorCode.DEPARTMENT_NOT_FOUND, ex.getErrorCode());
    }

    @Test
    void getDepartmentsManagedBy_ReturnsManagerDepartments() {
        List<Department> depts = List.of(createDepartment(1L, "Engineering", "ENG"));
        when(departmentRepository.findByManagerId(10L)).thenReturn(depts);

        List<Department> result = departmentService.getDepartmentsManagedBy(10L);

        assertEquals(1, result.size());
        verify(departmentRepository).findByManagerId(10L);
    }

    @Test
    void getDepartmentByName_Existing_ReturnsDepartment() {
        Department dept = createDepartment(1L, "Operations", "OPS");
        when(departmentRepository.findByDepartmentName("Operations")).thenReturn(Optional.of(dept));

        Optional<Department> result = departmentService.getDepartmentByName("Operations");

        assertTrue(result.isPresent());
        assertEquals("Operations", result.get().getDepartmentName());
    }

    @Test
    void getDepartmentByCode_Existing_ReturnsDepartment() {
        Department dept = createDepartment(1L, "General", "GEN");
        when(departmentRepository.findByDepartmentCode("GEN")).thenReturn(Optional.of(dept));

        Optional<Department> result = departmentService.getDepartmentByCode("GEN");

        assertTrue(result.isPresent());
        assertEquals("GEN", result.get().getDepartmentCode());
    }

    // Helper
    private Department createDepartment(Long id, String name, String code) {
        Department d = new Department(id, name, code, null, null);
        return d;
    }
}
