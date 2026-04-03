package com.hrms.core.repositories;

import com.hrms.core.models.RecruitmentRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RecruitmentRequestRepository extends JpaRepository<RecruitmentRequest, Long> {

    /**
     * Find all pending recruitment requests
     */
    @Query("SELECT r FROM RecruitmentRequest r WHERE r.status = 'Pending' ORDER BY r.requestedAt DESC")
    List<RecruitmentRequest> findAllPendingRequests();

    /**
     * Find all requests created by a specific HR user
     */
    @Query("SELECT r FROM RecruitmentRequest r WHERE r.requestedBy = :requestedBy ORDER BY r.requestedAt DESC")
    List<RecruitmentRequest> findByRequestedBy(@Param("requestedBy") Long requestedBy);

    /**
     * Find all requests with a specific status
     */
    @Query("SELECT r FROM RecruitmentRequest r WHERE r.status = :status ORDER BY r.requestedAt DESC")
    List<RecruitmentRequest> findByStatus(@Param("status") String status);

    /**
     * Find requests by department
     */
    @Query("SELECT r FROM RecruitmentRequest r WHERE r.department = :department ORDER BY r.requestedAt DESC")
    List<RecruitmentRequest> findByDepartment(@Param("department") String department);

    /**
     * Check if a national ID already exists
     */
    @Query("SELECT COUNT(r) > 0 FROM RecruitmentRequest r WHERE r.nationalId = :nationalId AND r.status = 'Pending'")
    boolean existsPendingByNationalId(@Param("nationalId") String nationalId);
}
