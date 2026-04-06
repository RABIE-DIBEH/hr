package com.hrms.core.repositories;

import com.hrms.core.models.LeaveRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface LeaveRequestRepository extends JpaRepository<LeaveRequest, Long> {
    
    @Query("SELECT l FROM LeaveRequest l JOIN FETCH l.employee WHERE l.employee.employeeId = :employeeId ORDER BY l.requestedAt DESC")
    Page<LeaveRequest> findAllByEmployeeId(Long employeeId, Pageable pageable);

    @Query("SELECT l FROM LeaveRequest l JOIN FETCH l.employee WHERE l.employee.managerId = :managerId AND l.status = 'PENDING_MANAGER'")
    Page<LeaveRequest> findPendingRequestsForManager(Long managerId, Pageable pageable);

    @Query("SELECT l FROM LeaveRequest l JOIN FETCH l.employee WHERE l.status IN ('PENDING_HR', 'PENDING_MANAGER') " +
           "ORDER BY l.requestedAt DESC")
    Page<LeaveRequest> findPendingRequestsForHr(Pageable pageable);

    @Query("SELECT l FROM LeaveRequest l JOIN FETCH l.employee WHERE (l.startDate <= :end AND l.endDate >= :start) AND l.status != 'REJECTED'")
    List<LeaveRequest> findAllInRange(@Param("start") LocalDate start, @Param("end") LocalDate end);

    @Query("SELECT l FROM LeaveRequest l JOIN FETCH l.employee WHERE l.employee.employeeId = :employeeId AND (l.startDate <= :end AND l.endDate >= :start) AND l.status != 'REJECTED'")
    List<LeaveRequest> findEmployeeLeavesInRange(@Param("employeeId") Long employeeId, @Param("start") LocalDate start, @Param("end") LocalDate end);

    /**
     * Find all leave requests for a given month and year (by checking if start or end falls in that month)
     */
    @Query("SELECT l FROM LeaveRequest l WHERE l.status != 'REJECTED' AND " +
           "((MONTH(l.startDate) = :month AND YEAR(l.startDate) = :year) OR " +
           "(MONTH(l.endDate) = :month AND YEAR(l.endDate) = :year)) " +
           "ORDER BY l.startDate DESC")
    List<LeaveRequest> findAllByMonthAndYear(@Param("month") int month, @Param("year") int year);

    /**
     * Count approved leave requests by type for a given month/year
     */
    @Query("SELECT l.leaveType, COUNT(l) FROM LeaveRequest l WHERE l.status = 'APPROVED' AND " +
           "((MONTH(l.startDate) = :month AND YEAR(l.startDate) = :year) OR " +
           "(MONTH(l.endDate) = :month AND YEAR(l.endDate) = :year)) " +
           "GROUP BY l.leaveType")
    List<Object[]> countByLeaveTypeAndMonthYear(@Param("month") int month, @Param("year") int year);
}
