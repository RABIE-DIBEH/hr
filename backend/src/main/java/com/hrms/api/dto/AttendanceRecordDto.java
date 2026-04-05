package com.hrms.api.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * DTO for AttendanceRecord to avoid lazy-loading and serialization issues.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record AttendanceRecordDto(
        Long recordId,
        Long employeeId,
        String employeeName,
        String employeeEmail,
        LocalDateTime checkIn,
        LocalDateTime checkOut,
        BigDecimal workHours,
        String status,
        Boolean isVerifiedByManager,
        LocalDateTime verifiedAt,
        String managerNotes,
        String reviewStatus,
        String payrollStatus,
        Boolean manuallyAdjusted,
        LocalDateTime manuallyAdjustedAt,
        Long manuallyAdjustedBy,
        String manualAdjustmentReason
) {
    public static AttendanceRecordDto of(
            Long recordId,
            Long employeeId,
            String employeeName,
            String employeeEmail,
            LocalDateTime checkIn,
            LocalDateTime checkOut,
            BigDecimal workHours,
            String status,
            Boolean isVerifiedByManager,
            LocalDateTime verifiedAt,
            String managerNotes,
            String reviewStatus,
            String payrollStatus,
            Boolean manuallyAdjusted,
            LocalDateTime manuallyAdjustedAt,
            Long manuallyAdjustedBy,
            String manualAdjustmentReason) {
        return new AttendanceRecordDto(
                recordId,
                employeeId,
                employeeName,
                employeeEmail,
                checkIn,
                checkOut,
                workHours,
                status,
                isVerifiedByManager,
                verifiedAt,
                managerNotes,
                reviewStatus,
                payrollStatus,
                manuallyAdjusted,
                manuallyAdjustedAt,
                manuallyAdjustedBy,
                manualAdjustmentReason
        );
    }
}
