package com.hrms.core.repositories;

import com.hrms.core.models.AdvanceRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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
    @Query("SELECT a FROM AdvanceRequest a WHERE a.status = 'PENDING_MANAGER' ORDER BY a.requestedAt DESC")
    Page<AdvanceRequest> findAllPendingRequests(Pageable pageable);

    @Query("SELECT a FROM AdvanceRequest a WHERE a.status = 'PENDING_PAYROLL' ORDER BY a.requestedAt DESC")
    Page<AdvanceRequest> findAllPendingPayrollRequests(Pageable pageable);

    @Query("SELECT a FROM AdvanceRequest a WHERE a.status = 'APPROVED' AND a.paid = false ORDER BY a.processedAt DESC")
    Page<AdvanceRequest> findAllApprovedAwaitingDelivery(Pageable pageable);

    @Query("SELECT a FROM AdvanceRequest a WHERE a.status = 'APPROVED' AND a.paid = false " +
            "AND COALESCE(a.salaryMonth, MONTH(a.requestedAt)) = :month " +
            "AND COALESCE(a.salaryYear, YEAR(a.requestedAt)) = :year " +
            "ORDER BY a.processedAt DESC")
    List<AdvanceRequest> findAllApprovedAwaitingDeliveryForMonth(@Param("month") int month, @Param("year") int year);

    /**
     * Find all advance requests for a specific employee
     */
    @Query("SELECT a FROM AdvanceRequest a WHERE a.employeeId = :employeeId ORDER BY a.requestedAt DESC")
    Page<AdvanceRequest> findByEmployeeId(@Param("employeeId") Long employeeId, Pageable pageable);

    /**
     * Find all advance requests regardless of status
     */
    @Query("SELECT a FROM AdvanceRequest a ORDER BY a.requestedAt DESC")
    Page<AdvanceRequest> findAllRequests(Pageable pageable);

    /**
     * Find all requests with a specific status
     */
    @Query("SELECT a FROM AdvanceRequest a WHERE a.status = :status ORDER BY a.requestedAt DESC")
    Page<AdvanceRequest> findByStatus(@Param("status") String status, Pageable pageable);

    /**
     * Get total pending advance amount for an employee
     */
    @Query("SELECT COALESCE(SUM(a.amount), 0) FROM AdvanceRequest a WHERE a.employeeId = :employeeId AND a.status = 'PENDING_MANAGER'")
    java.math.BigDecimal sumPendingAmountByEmployee(@Param("employeeId") Long employeeId);

    /**
     * Get total amount for delivered advances that have not yet been deducted from payroll
     */
    @Query("SELECT COALESCE(SUM(a.amount), 0) FROM AdvanceRequest a " +
            "WHERE a.employeeId = :employeeId AND a.status = 'DELIVERED' AND a.deducted = false " +
            "AND COALESCE(a.salaryMonth, MONTH(a.requestedAt)) = :month " +
            "AND COALESCE(a.salaryYear, YEAR(a.requestedAt)) = :year")
    java.math.BigDecimal sumUndeductedDeliveredAmountByEmployeeForMonth(@Param("employeeId") Long employeeId,
                                                                        @Param("month") int month,
                                                                        @Param("year") int year);

    /**
     * Find delivered advances that are ready to be deducted from payroll
     * This one does NOT need pagination as it is used for internal payroll calculation
     */
    @Query("SELECT a FROM AdvanceRequest a WHERE a.employeeId = :employeeId AND a.status = 'DELIVERED' AND a.deducted = false " +
            "AND COALESCE(a.salaryMonth, MONTH(a.requestedAt)) = :month " +
            "AND COALESCE(a.salaryYear, YEAR(a.requestedAt)) = :year " +
            "ORDER BY a.paidAt DESC")
    List<AdvanceRequest> findUndeductedDeliveredAdvancesByEmployeeForMonth(@Param("employeeId") Long employeeId,
                                                                           @Param("month") int month,
                                                                           @Param("year") int year);

    @Query("SELECT a FROM AdvanceRequest a WHERE a.status = 'DELIVERED' " +
            "AND COALESCE(a.salaryMonth, MONTH(a.requestedAt)) = :month " +
            "AND COALESCE(a.salaryYear, YEAR(a.requestedAt)) = :year " +
            "ORDER BY a.paidAt DESC")
    Page<AdvanceRequest> findDeliveredForSalaryMonthYear(@Param("month") int month,
                                                         @Param("year") int year,
                                                         Pageable pageable);
}
