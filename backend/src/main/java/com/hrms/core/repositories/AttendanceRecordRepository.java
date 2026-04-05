package com.hrms.core.repositories;

import com.hrms.core.models.AttendanceRecord;
import com.hrms.core.models.Employee;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AttendanceRecordRepository extends JpaRepository<AttendanceRecord, Long> {
    
    @Query("SELECT a FROM AttendanceRecord a WHERE a.employee.employeeId = :employeeId AND a.checkOut IS NULL")
    Optional<AttendanceRecord> findActiveSessionByEmployeeId(Long employeeId);

    Page<AttendanceRecord> findAllByEmployee_EmployeeIdOrderByCheckInDesc(Long employeeId, Pageable pageable);

    @Query("SELECT a FROM AttendanceRecord a WHERE a.employee.managerId = :managerId " +
           "AND EXTRACT(YEAR FROM a.checkIn) = EXTRACT(YEAR FROM CURRENT_DATE) " +
           "AND EXTRACT(MONTH FROM a.checkIn) = EXTRACT(MONTH FROM CURRENT_DATE) " +
           "AND EXTRACT(DAY FROM a.checkIn) = EXTRACT(DAY FROM CURRENT_DATE)")
    Page<AttendanceRecord> findTodayRecordsForManager(Long managerId, Pageable pageable);

    @Query("SELECT a FROM AttendanceRecord a WHERE a.employee.employeeId = :employeeId " +
           "AND EXTRACT(MONTH FROM a.checkIn) = :month " +
           "AND EXTRACT(YEAR FROM a.checkIn) = :year")
    List<AttendanceRecord> findMonthlyRecords(Long employeeId, int month, int year);

    @Query("SELECT a FROM AttendanceRecord a WHERE EXTRACT(MONTH FROM a.checkIn) = :month " +
           "AND EXTRACT(YEAR FROM a.checkIn) = :year")
    Page<AttendanceRecord> findAllMonthlyRecords(int month, int year, Pageable pageable);
}
