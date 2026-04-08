package com.hrms.core.repositories;

import com.hrms.core.models.Department;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface DepartmentRepository extends JpaRepository<Department, Long> {

    Optional<Department> findByDepartmentName(String name);

    Optional<Department> findByDepartmentCode(String code);

    List<Department> findByManagerId(Long managerId);

    @Query("SELECT d FROM Department d ORDER BY d.departmentName ASC")
    List<Department> findAllOrderedByName();
}
