package com.hrms.services;

import com.hrms.core.models.AttendanceRecord;
import com.hrms.core.repositories.AttendanceRecordRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Automated fraud detection service that runs periodically and flags
 * suspicious attendance records based on configurable rules.
 */
@Service
public class FraudDetectionService {

    private static final Logger log = LoggerFactory.getLogger(FraudDetectionService.class);

    private final AttendanceRecordRepository attendanceRepository;

    // Thresholds for suspicious activity
    private static final BigDecimal MAX_NORMAL_WORK_HOURS = BigDecimal.valueOf(16); // More than 16 hours is suspicious
    private static final int MIN_WORK_HOURS_FOR_FRAUD_CHECK = 1; // Only check records with at least 1 hour

    public FraudDetectionService(AttendanceRecordRepository attendanceRepository) {
        this.attendanceRepository = attendanceRepository;
    }

    /**
     * Runs every day at 2:00 AM to check yesterday's attendance records.
     * Flags records that exceed normal work hour thresholds.
     */
    @Scheduled(cron = "0 0 2 * * ?")
    @Transactional
    public void detectSuspiciousAttendance() {
        log.info("Starting automated fraud detection for attendance records...");

        LocalDate yesterday = LocalDate.now().minusDays(1);
        LocalDateTime startOfYesterday = yesterday.atStartOfDay();
        LocalDateTime endOfYesterday = yesterday.plusDays(1).atStartOfDay();

        // Find all attendance records from yesterday that have check-out
        List<AttendanceRecord> yesterdayRecords = attendanceRepository.findAll().stream()
                .filter(r -> r.getCheckIn() != null && r.getCheckOut() != null)
                .filter(r -> !r.getCheckIn().isBefore(startOfYesterday) && r.getCheckIn().isBefore(endOfYesterday))
                .filter(r -> "Normal".equals(r.getStatus()) || "Verified".equals(r.getStatus()))
                .toList();

        int flaggedCount = 0;
        for (AttendanceRecord record : yesterdayRecords) {
            if (isSuspicious(record)) {
                flagAsSuspicious(record);
                flaggedCount++;
            }
        }

        log.info("Fraud detection completed. Flagged {} suspicious record(s) out of {} checked.",
                flaggedCount, yesterdayRecords.size());
    }

    /**
     * Checks if a record exhibits suspicious patterns:
     * 1. Work hours exceed the maximum normal threshold
     * 2. Check-in and check-out times are illogical
     */
    private boolean isSuspicious(AttendanceRecord record) {
        // Check work hours threshold
        if (record.getWorkHours() != null && record.getWorkHours().compareTo(MAX_NORMAL_WORK_HOURS) > 0) {
            log.warn("Suspicious work hours detected for employee {} on {}: {} hours",
                    record.getEmployee().getEmployeeId(),
                    record.getCheckIn().toLocalDate(),
                    record.getWorkHours());
            return true;
        }

        // Check for negative work hours (clock-out before clock-in)
        if (record.getWorkHours() != null && record.getWorkHours().compareTo(BigDecimal.ZERO) < 0) {
            log.warn("Negative work hours detected for employee {} on {}",
                    record.getEmployee().getEmployeeId(),
                    record.getCheckIn().toLocalDate());
            return true;
        }

        return false;
    }

    /**
     * Flags a record as suspicious without changing its payroll status.
     * Sets reviewStatus to SUSPICIOUS for HR/Manager review.
     */
    private void flagAsSuspicious(AttendanceRecord record) {
        record.setReviewStatus("SUSPICIOUS");
        record.setManagerNotes("[AUTO-FLAGGED] Suspicious activity detected by system. Requires manual review.");
        record.setIsVerifiedByManager(false);
        attendanceRepository.save(record);
    }
}
