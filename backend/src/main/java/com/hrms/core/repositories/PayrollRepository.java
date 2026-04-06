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
<<<<<<< HEAD
    // Join-fetch employee to avoid LazyInitializationException when controller maps to DTOs after tx closes.
    @Query("SELECT p FROM Payroll p JOIN FETCH p.employee WHERE p.employee.employeeId = :employeeId ORDER BY p.year DESC, p.month DESC")
=======
    @EntityGraph(attributePaths = "employee")
    @Query("SELECT p FROM Payroll p WHERE p.employee.employeeId = :employeeId ORDER BY p.year DESC, p.month DESC")
>>>>>>> d3ed4975408d000b01cc96f738a0f60ca54029a9
    Page<Payroll> findByEmployeeId(@Param("employeeId") Long employeeId, Pageable pageable);

    /**
     * Get all payroll records across all employees, ordered by month/year descending
     */
<<<<<<< HEAD
    // Join-fetch employee to avoid LazyInitializationException when controller maps to DTOs after tx closes.
    @Query("SELECT p FROM Payroll p JOIN FETCH p.employee ORDER BY p.year DESC, p.month DESC, p.employee.fullName ASC")
=======
    @EntityGraph(attributePaths = "employee")
    @Query("SELECT p FROM Payroll p ORDER BY p.year DESC, p.month DESC, p.employee.fullName ASC")
>>>>>>> d3ed4975408d000b01cc96f738a0f60ca54029a9
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
}
