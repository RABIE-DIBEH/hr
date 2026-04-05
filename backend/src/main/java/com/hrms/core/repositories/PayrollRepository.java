package com.hrms.core.repositories;

import com.hrms.core.models.Payroll;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PayrollRepository extends JpaRepository<Payroll, Long> {
    Optional<Payroll> findByEmployeeEmployeeIdAndMonthAndYear(Long employeeId, int month, int year);

    /**
     * Get all payroll records for a specific employee, ordered by month/year descending
     */
    @Query("SELECT p FROM Payroll p WHERE p.employee.employeeId = :employeeId ORDER BY p.year DESC, p.month DESC")
    List<Payroll> findByEmployeeId(@Param("employeeId") Long employeeId);
}
