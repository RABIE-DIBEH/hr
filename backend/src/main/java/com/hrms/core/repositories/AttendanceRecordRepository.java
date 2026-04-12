package com.hrms.core.repositories;

import com.hrms.core.models.AttendanceRecord;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AttendanceRecordRepository extends JpaRepository<AttendanceRecord, Long> {
    
    @Query("SELECT a FROM AttendanceRecord a WHERE a.employee.employeeId = :employeeId AND a.checkOut IS NULL")
    Optional<AttendanceRecord> findActiveSessionByEmployeeId(Long employeeId);

    Page<AttendanceRecord> findAllByEmployee_EmployeeIdOrderByCheckInDesc(Long employeeId, Pageable pageable);

    @Query("SELECT a FROM AttendanceRecord a " +
           "WHERE a.employee.managerId = :managerId " +
           "AND CAST(a.checkIn AS date) = CURRENT_DATE " +
           "ORDER BY a.checkIn DESC")
    Page<AttendanceRecord> findRecentRecordsForManager(@Param("managerId") Long managerId, Pageable pageable);

    @Query("SELECT a FROM AttendanceRecord a " +
           "WHERE a.employee.managerId = :managerId " +
           "AND a.employee.departmentId = :departmentId " +
           "AND CAST(a.checkIn AS date) = CURRENT_DATE " +
           "ORDER BY a.checkIn DESC")
    Page<AttendanceRecord> findRecentRecordsForManagerInDepartment(@Param("managerId") Long managerId, 
                                                                   @Param("departmentId") Long departmentId, 
                                                                   Pageable pageable);

    @Query("SELECT a FROM AttendanceRecord a " +
           "WHERE CAST(a.checkIn AS date) = CURRENT_DATE " +
           "ORDER BY a.checkIn DESC")
    Page<AttendanceRecord> findAllRecentRecords(Pageable pageable);

    @Query("SELECT a FROM AttendanceRecord a WHERE a.employee.employeeId = :employeeId " +
           "AND EXTRACT(MONTH FROM a.checkIn) = :month " +
           "AND EXTRACT(YEAR FROM a.checkIn) = :year")
    List<AttendanceRecord> findMonthlyRecords(@Param("employeeId") Long employeeId, @Param("month") int month, @Param("year") int year);

    @Query("SELECT a FROM AttendanceRecord a WHERE a.employee.employeeId = :employeeId " +
           "AND EXTRACT(MONTH FROM a.checkIn) = :month " +
           "AND EXTRACT(YEAR FROM a.checkIn) = :year " +
           "AND a.payrollStatus IN :payrollStatuses")
    List<AttendanceRecord> findMonthlyRecordsByPayrollStatuses(@Param("employeeId") Long employeeId, @Param("month") int month, @Param("year") int year, @Param("payrollStatuses") List<String> payrollStatuses);

    @Query("SELECT a FROM AttendanceRecord a WHERE EXTRACT(MONTH FROM a.checkIn) = :month " +
           "AND EXTRACT(YEAR FROM a.checkIn) = :year " +
           "ORDER BY a.checkIn ASC")
    List<AttendanceRecord> findAllMonthlyRecordsForReport(@Param("month") int month, @Param("year") int year);

    @Query("SELECT a FROM AttendanceRecord a WHERE EXTRACT(MONTH FROM a.checkIn) = :month " +
           "AND EXTRACT(YEAR FROM a.checkIn) = :year")
    Page<AttendanceRecord> findAllMonthlyRecordsPage(@Param("month") int month, @Param("year") int year, Pageable pageable);

    @Query("SELECT a FROM AttendanceRecord a WHERE a.employee.employeeId = :employeeId " +
           "AND EXTRACT(YEAR FROM a.checkIn) = :year")
    List<AttendanceRecord> findYearlyRecords(@Param("employeeId") Long employeeId, @Param("year") int year);

    @Query("SELECT a.employee.employeeId, SUM(a.workHours) FROM AttendanceRecord a " +
           "WHERE EXTRACT(MONTH FROM a.checkIn) = :month " +
           "AND EXTRACT(YEAR FROM a.checkIn) = :year " +
           "AND a.payrollStatus != 'EXCLUDED_FROM_PAYROLL' " +
           "AND a.workHours IS NOT NULL " +
           "GROUP BY a.employee.employeeId " +
           "ORDER BY SUM(a.workHours) DESC")
    List<Object[]> findMonthlyRanking(@Param("month") int month, @Param("year") int year);

    @Query("SELECT a.employee.employeeId, SUM(a.workHours) FROM AttendanceRecord a " +
           "WHERE EXTRACT(YEAR FROM a.checkIn) = :year " +
           "AND a.payrollStatus != 'EXCLUDED_FROM_PAYROLL' " +
           "AND a.workHours IS NOT NULL " +
           "GROUP BY a.employee.employeeId " +
           "ORDER BY SUM(a.workHours) DESC")
    List<Object[]> findYearlyRanking(@Param("year") int year);
}
