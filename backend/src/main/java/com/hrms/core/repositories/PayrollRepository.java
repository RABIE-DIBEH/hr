package com.hrms.core.repositories;

import com.hrms.core.models.Payroll;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PayrollRepository extends JpaRepository<Payroll, Long> {
    @EntityGraph(attributePaths = "employee")
    Optional<Payroll> findByEmployeeEmployeeIdAndMonthAndYear(Long employeeId, int month, int year);

    @Query("""
            SELECT p FROM Payroll p
            JOIN FETCH p.employee
            WHERE p.employee.employeeId = :employeeId
              AND p.month = :month
              AND p.year = :year
            """)
    Optional<Payroll> findByEmployeeIdAndMonthAndYearFetchEmployee(
            @Param("employeeId") Long employeeId,
            @Param("month") int month,
            @Param("year") int year
    );

    /**
     * Get all payroll records for a specific employee, ordered by month/year descending
     */
    // Join-fetch employee to avoid LazyInitializationException when controller maps to DTOs after tx closes.
    @Query("SELECT p FROM Payroll p JOIN FETCH p.employee WHERE p.employee.employeeId = :employeeId ORDER BY p.year DESC, p.month DESC")
    Page<Payroll> findByEmployeeId(@Param("employeeId") Long employeeId, Pageable pageable);

    /**
     * Get all payroll records across all employees, ordered by month/year descending
     */
    // Join-fetch employee to avoid LazyInitializationException when controller maps to DTOs after tx closes.
    @Query("SELECT p FROM Payroll p JOIN FETCH p.employee ORDER BY p.year DESC, p.month DESC, p.employee.fullName ASC")
    Page<Payroll> findAllPayrollRecords(Pageable pageable);

    @EntityGraph(attributePaths = "employee")
    @Query("SELECT p FROM Payroll p WHERE p.month = :month AND p.year = :year ORDER BY p.employee.fullName ASC")
    List<Payroll> findAllMonthlyPayroll(@Param("month") int month, @Param("year") int year);

    @Query("SELECT p FROM Payroll p JOIN FETCH p.employee WHERE p.month = :month AND p.year = :year ORDER BY p.employee.fullName ASC")
    Page<Payroll> findMonthlyPayrollPage(@Param("month") int month, @Param("year") int year, Pageable pageable);

    @Query("SELECT COALESCE(SUM(p.netSalary), 0) FROM Payroll p WHERE p.month = :month AND p.year = :year")
    java.math.BigDecimal sumNetSalaryForMonth(@Param("month") int month, @Param("year") int year);

    @Query("SELECT COUNT(p) FROM Payroll p WHERE p.month = :month AND p.year = :year")
    long countForMonth(@Param("month") int month, @Param("year") int year);

    @Query("SELECT COUNT(p) FROM Payroll p WHERE p.month = :month AND p.year = :year AND p.paid = true")
    long countPaidForMonth(@Param("month") int month, @Param("year") int year);

    // --- Department-scoped payroll queries ---

    @Query("SELECT p FROM Payroll p JOIN FETCH p.employee " +
           "WHERE p.employee.departmentId = :departmentId " +
           "ORDER BY p.year DESC, p.month DESC, p.employee.fullName ASC")
    Page<Payroll> findByDepartmentId(@Param("departmentId") Long departmentId, Pageable pageable);

    @Query("SELECT p FROM Payroll p JOIN FETCH p.employee " +
           "WHERE p.employee.departmentId = :departmentId AND p.month = :month AND p.year = :year " +
           "ORDER BY p.employee.fullName ASC")
    Page<Payroll> findMonthlyPayrollPageByDepartment(
            @Param("departmentId") Long departmentId,
            @Param("month") int month,
            @Param("year") int year,
            Pageable pageable);

    @Query("SELECT COALESCE(SUM(p.netSalary), 0) FROM Payroll p " +
           "WHERE p.employee.departmentId = :departmentId AND p.month = :month AND p.year = :year")
    java.math.BigDecimal sumNetSalaryForMonthByDepartment(
            @Param("departmentId") Long departmentId,
            @Param("month") int month,
            @Param("year") int year);

    @Query("SELECT COUNT(p) FROM Payroll p " +
           "WHERE p.employee.departmentId = :departmentId AND p.month = :month AND p.year = :year")
    long countForMonthByDepartment(
            @Param("departmentId") Long departmentId,
            @Param("month") int month,
            @Param("year") int year);

    @Query("SELECT COUNT(p) FROM Payroll p " +
           "WHERE p.employee.departmentId = :departmentId AND p.month = :month AND p.year = :year AND p.paid = true")
    long countPaidForMonthByDepartment(
            @Param("departmentId") Long departmentId,
            @Param("month") int month,
            @Param("year") int year);
}
