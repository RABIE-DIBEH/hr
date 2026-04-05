package com.hrms.core.repositories;

import com.hrms.core.models.LeaveRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface LeaveRequestRepository extends JpaRepository<LeaveRequest, Long> {
    
    @Query("SELECT l FROM LeaveRequest l WHERE l.employee.employeeId = :employeeId ORDER BY l.requestedAt DESC")
    Page<LeaveRequest> findAllByEmployeeId(Long employeeId, Pageable pageable);

    @Query("SELECT l FROM LeaveRequest l WHERE l.employee.managerId = :managerId AND l.status = 'PENDING_MANAGER'")
    Page<LeaveRequest> findPendingRequestsForManager(Long managerId, Pageable pageable);

    @Query("SELECT l FROM LeaveRequest l WHERE l.status = 'PENDING_HR'")
    Page<LeaveRequest> findPendingRequestsForHr(Pageable pageable);
}
