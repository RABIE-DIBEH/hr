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
     * Find all pending recruitment requests by multiple statuses
     */
    @Query("SELECT r FROM RecruitmentRequest r WHERE r.status IN :statuses ORDER BY r.requestedAt DESC")
    List<RecruitmentRequest> findAllByStatuses(@Param("statuses") List<String> statuses);

    /**
     * Find all requests created by a specific HR user
     */
    @Query("SELECT r FROM RecruitmentRequest r WHERE r.requestedBy = :requestedBy ORDER BY r.requestedAt DESC")
    List<RecruitmentRequest> findByRequestedBy(@Param("requestedBy") Long requestedBy);

    /**
     * Find all recruitment requests regardless of status
     */
    @Query("SELECT r FROM RecruitmentRequest r ORDER BY r.requestedAt DESC")
    List<RecruitmentRequest> findAllRequests();

    /**
     * Find all requests with a specific status
     */
    @Query("SELECT r FROM RecruitmentRequest r WHERE r.status = :status ORDER BY r.requestedAt DESC")
    List<RecruitmentRequest> findByStatus(@Param("status") String status);

    /**
     * Find requests by department and status
     */
    @Query("SELECT r FROM RecruitmentRequest r WHERE r.department = :department AND r.status IN :statuses ORDER BY r.requestedAt DESC")
    List<RecruitmentRequest> findByDepartmentAndStatuses(@Param("department") String department, @Param("statuses") List<String> statuses);

    /**
     * Check if a national ID already exists in non-rejected requests
     */
    @Query("SELECT COUNT(r) > 0 FROM RecruitmentRequest r WHERE r.nationalId = :nationalId AND r.status != 'REJECTED'")
    boolean existsActiveByNationalId(@Param("nationalId") String nationalId);
}
