package com.hrms.core.repositories;

import com.hrms.core.models.AdvanceRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AdvanceRequestRepository extends JpaRepository<AdvanceRequest, Long> {

    /**
     * Find all pending advance requests
     */
    @Query("SELECT a FROM AdvanceRequest a WHERE a.status = 'Pending' ORDER BY a.requestedAt DESC")
    List<AdvanceRequest> findAllPendingRequests();

    /**
     * Find all advance requests for a specific employee
     */
    @Query("SELECT a FROM AdvanceRequest a WHERE a.employeeId = :employeeId ORDER BY a.requestedAt DESC")
    List<AdvanceRequest> findByEmployeeId(@Param("employeeId") Long employeeId);

    /**
     * Find all requests with a specific status
     */
    @Query("SELECT a FROM AdvanceRequest a WHERE a.status = :status ORDER BY a.requestedAt DESC")
    List<AdvanceRequest> findByStatus(@Param("status") String status);

    /**
     * Get total pending advance amount for an employee
     */
    @Query("SELECT COALESCE(SUM(a.amount), 0) FROM AdvanceRequest a WHERE a.employeeId = :employeeId AND a.status = 'Pending'")
    java.math.BigDecimal sumPendingAmountByEmployee(@Param("employeeId") Long employeeId);

    /**
     * Get total amount for delivered advances that have not yet been deducted from payroll
     */
    @Query("SELECT COALESCE(SUM(a.amount), 0) FROM AdvanceRequest a WHERE a.employeeId = :employeeId AND a.status = 'Delivered' AND a.deducted = false")
    java.math.BigDecimal sumUndeductedDeliveredAmountByEmployee(@Param("employeeId") Long employeeId);

    /**
     * Find delivered advances that are ready to be deducted from payroll
     */
    @Query("SELECT a FROM AdvanceRequest a WHERE a.employeeId = :employeeId AND a.status = 'Delivered' AND a.deducted = false ORDER BY a.paidAt DESC")
    List<AdvanceRequest> findUndeductedDeliveredAdvancesByEmployee(@Param("employeeId") Long employeeId);
