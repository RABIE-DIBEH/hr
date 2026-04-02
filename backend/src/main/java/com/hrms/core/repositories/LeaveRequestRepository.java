package com.hrms.core.repositories;

import com.hrms.core.models.LeaveRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LeaveRequestRepository extends JpaRepository<LeaveRequest, Long> {
    
    @Query("SELECT l FROM LeaveRequest l WHERE l.employee.employeeId = :employeeId ORDER BY l.requestedAt DESC")
    List<LeaveRequest> findAllByEmployeeId(Long employeeId);

    @Query("SELECT l FROM LeaveRequest l WHERE l.employee.managerId = :managerId AND l.status = 'Pending'")
    List<LeaveRequest> findPendingRequestsForManager(Long managerId);
}
