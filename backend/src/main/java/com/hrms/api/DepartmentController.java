package com.hrms.api;

import com.hrms.api.dto.ApiResponse;
import com.hrms.core.models.Department;
import com.hrms.security.EmployeeUserDetails;
import com.hrms.services.DepartmentService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/departments")
public class DepartmentController {

    private final DepartmentService departmentService;

    public DepartmentController(DepartmentService departmentService) {
        this.departmentService = departmentService;
    }

    /**
     * GET /api/departments
     * HR/Admin/SuperAdmin → all departments
     * Manager → only departments they manage
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<Department>>> getAllDepartments(
            @AuthenticationPrincipal EmployeeUserDetails principal) {

        List<Department> departments;

        if (hasAnyRole(principal, "ROLE_MANAGER")) {
            departments = departmentService.getDepartmentsManagedBy(principal.getEmployeeId());
        } else if (hasAnyRole(principal, "ROLE_HR", "ROLE_ADMIN", "ROLE_SUPER_ADMIN")) {
            departments = departmentService.getAllDepartments();
        } else {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Insufficient permissions to view departments");
        }

        return ResponseEntity.ok(ApiResponse.success(departments, "Departments retrieved successfully"));
    }

    /**
     * GET /api/departments/{id}
     * View a single department (any authenticated user)
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Department>> getDepartment(@PathVariable Long id) {
        return departmentService.getDepartmentById(id)
                .map(dept -> ResponseEntity.ok(ApiResponse.success(dept, "Department retrieved successfully")))
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.error("Department not found")));
    }

    /**
     * GET /api/departments/my
     * Get current user's department
     */
    @GetMapping("/my")
    public ResponseEntity<ApiResponse<Department>> getMyDepartment(
            @AuthenticationPrincipal EmployeeUserDetails principal) {

        Long deptId = principal.getDepartmentId();
        if (deptId == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("No department assigned"));
        }

        return departmentService.getDepartmentById(deptId)
                .map(dept -> ResponseEntity.ok(ApiResponse.success(dept, "Your department retrieved successfully")))
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.error("Department not found")));
    }

    /**
     * POST /api/departments
     * Create a new department (HR/Admin/SuperAdmin only)
     */
    @PostMapping
    public ResponseEntity<ApiResponse<Department>> createDepartment(
            @RequestBody Department department,
            @AuthenticationPrincipal EmployeeUserDetails principal) {

        if (!hasAnyRole(principal, "ROLE_HR", "ROLE_ADMIN", "ROLE_SUPER_ADMIN")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only HR/Admin can create departments");
        }

        if (department.getDepartmentName() == null || department.getDepartmentName().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Department name is required");
        }

        Department created = departmentService.createDepartment(department);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(created, "Department '" + created.getDepartmentName() + "' created successfully"));
    }

    /**
     * PUT /api/departments/{id}
     * Update a department (HR/Admin/SuperAdmin only)
     */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Department>> updateDepartment(
            @PathVariable Long id,
            @RequestBody Department department,
            @AuthenticationPrincipal EmployeeUserDetails principal) {

        if (!hasAnyRole(principal, "ROLE_HR", "ROLE_ADMIN", "ROLE_SUPER_ADMIN")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only HR/Admin can update departments");
        }

        Department updated = departmentService.updateDepartment(id, department);
        return ResponseEntity.ok(ApiResponse.success(updated, "Department updated successfully"));
    }

    /**
     * DELETE /api/departments/{id}
     * Delete a department (HR/Admin/SuperAdmin only). Fails if department has employees.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteDepartment(
            @PathVariable Long id,
            @AuthenticationPrincipal EmployeeUserDetails principal) {

        if (!hasAnyRole(principal, "ROLE_HR", "ROLE_ADMIN", "ROLE_SUPER_ADMIN")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only HR/Admin can delete departments");
        }

        departmentService.deleteDepartment(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Department deleted successfully"));
    }

    private static boolean hasAnyRole(EmployeeUserDetails principal, String... roles) {
        for (String role : roles) {
            if (principal.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals(role))) {
                return true;
            }
        }
        return false;
    }
}
