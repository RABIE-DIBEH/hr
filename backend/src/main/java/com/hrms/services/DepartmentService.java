package com.hrms.services;

import com.hrms.core.models.Department;
import com.hrms.core.repositories.DepartmentRepository;
import com.hrms.core.repositories.EmployeeRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;

@Service
public class DepartmentService {

    private final DepartmentRepository departmentRepository;
    private final EmployeeRepository employeeRepository;

    public DepartmentService(DepartmentRepository departmentRepository,
                             EmployeeRepository employeeRepository) {
        this.departmentRepository = departmentRepository;
        this.employeeRepository = employeeRepository;
    }

    public List<Department> getAllDepartments() {
        return departmentRepository.findAllOrderedByName();
    }

    public Optional<Department> getDepartmentById(Long id) {
        return departmentRepository.findById(id);
    }

    public Optional<Department> getDepartmentByName(String name) {
        return departmentRepository.findByDepartmentName(name);
    }

    public Optional<Department> getDepartmentByCode(String code) {
        return departmentRepository.findByDepartmentCode(code);
    }

    @Transactional
    public Department createDepartment(Department department) {
        return departmentRepository.save(department);
    }

    @Transactional
    public Department updateDepartment(Long id, Department updates) {
        Department dept = departmentRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Department not found: " + id));

        if (updates.getDepartmentName() != null) {
            dept.setDepartmentName(updates.getDepartmentName());
        }
        if (updates.getDepartmentCode() != null) {
            dept.setDepartmentCode(updates.getDepartmentCode());
        }
        if (updates.getManagerId() != null) {
            dept.setManagerId(updates.getManagerId());
        }
        if (updates.getDescription() != null) {
            dept.setDescription(updates.getDescription());
        }

        return departmentRepository.save(dept);
    }

    @Transactional
    public void deleteDepartment(Long id) {
        Department dept = departmentRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Department not found: " + id));

        long employeeCount = employeeRepository.countByDepartmentId(id);
        if (employeeCount > 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot delete department '" + dept.getDepartmentName()
                    + "' — it has " + employeeCount + " employee(s). Reassign them first.");
        }

        departmentRepository.delete(dept);
    }

    public List<Department> getDepartmentsManagedBy(Long managerId) {
        return departmentRepository.findByManagerId(managerId);
    }
}
