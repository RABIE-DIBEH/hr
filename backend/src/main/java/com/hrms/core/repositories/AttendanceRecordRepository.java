package com.hrms.core.repositories;

import com.hrms.core.models.AttendanceRecord;
import com.hrms.core.models.Employee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AttendanceRecordRepository extends JpaRepository<AttendanceRecord, Long> {
    
    @Query("SELECT a FROM AttendanceRecord a WHERE a.employee.employeeId = :employeeId AND a.checkOut IS NULL")
    Optional<AttendanceRecord> findActiveSessionByEmployeeId(Long employeeId);

    @Query("SELECT a FROM AttendanceRecord a WHERE a.employee.employeeId = :employeeId " +
           "AND EXTRACT(MONTH FROM a.checkIn) = :month " +
           "AND EXTRACT(YEAR FROM a.checkIn) = :year")
    List<AttendanceRecord> findMonthlyRecords(Long employeeId, int month, int year);
}
