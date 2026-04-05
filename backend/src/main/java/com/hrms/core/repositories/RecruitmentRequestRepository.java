package com.hrms.core.repositories;

import com.hrms.core.models.RecruitmentRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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
    Page<RecruitmentRequest> findAllByStatuses(@Param("statuses") List<String> statuses, Pageable pageable);

    /**
     * Find all requests created by a specific HR user
     */
    @Query("SELECT r FROM RecruitmentRequest r WHERE r.requestedBy = :requestedBy ORDER BY r.requestedAt DESC")
    Page<RecruitmentRequest> findByRequestedBy(@Param("requestedBy") Long requestedBy, Pageable pageable);

    /**
     * Find all recruitment requests regardless of status
     */
    @Query("SELECT r FROM RecruitmentRequest r ORDER BY r.requestedAt DESC")
    Page<RecruitmentRequest> findAllRequests(Pageable pageable);

    /**
     * Find all requests with a specific status
     */
    @Query("SELECT r FROM RecruitmentRequest r WHERE r.status = :status ORDER BY r.requestedAt DESC")
    Page<RecruitmentRequest> findByStatus(@Param("status") String status, Pageable pageable);

    /**
     * Find requests by department and status
     */
    @Query("SELECT r FROM RecruitmentRequest r WHERE r.department = :department AND r.status IN :statuses ORDER BY r.requestedAt DESC")
    Page<RecruitmentRequest> findByDepartmentAndStatuses(@Param("department") String department, @Param("statuses") List<String> statuses, Pageable pageable);

    /**
     * Check if a national ID already exists in non-rejected requests
     */
    @Query("SELECT COUNT(r) > 0 FROM RecruitmentRequest r WHERE r.nationalId = :nationalId AND r.status != 'REJECTED'")
    boolean existsActiveByNationalId(@Param("nationalId") String nationalId);

    /**
     * Find the maximum employee ID from all approved recruitment requests.
     * This allows manual entries to reset the counter for future auto-generations.
     */
    @Query("SELECT MAX(r.employeeId) FROM RecruitmentRequest r WHERE r.status = 'APPROVED'")
    Long findMaxEmployeeId();

    /**
     * Count approved recruitment requests by department for a given month/year
     */
    @Query("SELECT r.department, COUNT(r) FROM RecruitmentRequest r WHERE r.status = 'APPROVED' AND " +
           "MONTH(r.requestedAt) = :month AND YEAR(r.requestedAt) = :year " +
           "GROUP BY r.department")
    List<Object[]> countApprovedByDepartment(@Param("month") int month, @Param("year") int year);

    /**
     * Count all recruitment requests by status for a given month/year
     */
    @Query("SELECT r.status, COUNT(r) FROM RecruitmentRequest r WHERE " +
           "MONTH(r.requestedAt) = :month AND YEAR(r.requestedAt) = :year " +
           "GROUP BY r.status")
    List<Object[]> countByStatusAndMonthYear(@Param("month") int month, @Param("year") int year);

    /**
     * Find all approved recruitment requests for a given month/year
     */
    @Query("SELECT r FROM RecruitmentRequest r WHERE r.status = 'APPROVED' AND " +
           "MONTH(r.requestedAt) = :month AND YEAR(r.requestedAt) = :year " +
           "ORDER BY r.requestedAt DESC")
    List<RecruitmentRequest> findApprovedByMonthYear(@Param("month") int month, @Param("year") int year);
}
