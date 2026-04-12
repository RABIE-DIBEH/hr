package com.hrms.services;

import com.hrms.api.dto.AttendanceRecordDto;
import com.hrms.api.exception.BusinessException;
import com.hrms.api.exception.ErrorCode;
import com.hrms.core.models.AttendanceRecord;
import com.hrms.core.models.Employee;
import com.hrms.core.models.NFCCard;
import com.hrms.core.repositories.AttendanceRecordRepository;
import com.hrms.core.repositories.NFCCardRepository;
import com.hrms.security.EmployeeUserDetails;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class AttendanceService {

    private final AttendanceRecordRepository attendanceRepository;
    private final NFCCardRepository nfcCardRepository;
    private final com.hrms.core.repositories.SystemLogRepository systemLogRepository;

    public AttendanceService(AttendanceRecordRepository attendanceRepository, 
                             NFCCardRepository nfcCardRepository,
                             com.hrms.core.repositories.SystemLogRepository systemLogRepository) {
        this.attendanceRepository = attendanceRepository;
        this.nfcCardRepository = nfcCardRepository;
        this.systemLogRepository = systemLogRepository;
    }

    @Transactional
    public String clockByNfcUid(String uid, EmployeeUserDetails principal) {
        Optional<NFCCard> nfcCard = nfcCardRepository.findByUid(uid);

        if (nfcCard.isEmpty()) {
            return "Error: Card not registered.";
        }

        NFCCard card = nfcCard.get();
        if (!"Active".equals(card.getStatus())) {
            return "Error: Card is blocked or inactive.";
        }

        if (card.getEmployee() == null) {
            return "Error: Card is not linked to an active employee.";
        }

        if (!canUseNfcCard(card, principal)) {
            return "Error: This NFC card is not linked to your account.";
        }

        return clockWithNfc(card.getEmployee());
    }

    private boolean canUseNfcCard(NFCCard card, EmployeeUserDetails principal) {
        boolean privileged = principal.getAuthorities().stream().anyMatch(a ->
                "ROLE_HR".equals(a.getAuthority()) ||
                "ROLE_ADMIN".equals(a.getAuthority()) ||
                "ROLE_SUPER_ADMIN".equals(a.getAuthority()));
        if (privileged) {
            return true;
        }
        return card.getEmployee().getEmployeeId().equals(principal.getEmployeeId());
    }

    @Transactional
    public Optional<AttendanceRecord> reportFraud(Long recordId, String note, EmployeeUserDetails principal) {
        Optional<AttendanceRecord> found = attendanceRepository.findById(recordId);
        if (found.isEmpty()) {
            return Optional.empty();
        }
        AttendanceRecord record = found.get();
        Employee target = record.getEmployee();
        if (!canReportFraudOn(target, principal)) {
            throw new AccessDeniedException("You cannot flag this attendance record");
        }
        record.setStatus("Fraud");
        record.setManagerNotes(note);
        record.setIsVerifiedByManager(true);
        record.setVerifiedAt(LocalDateTime.now());
        record.setWorkHours(java.math.BigDecimal.ZERO);
        record.setReviewStatus("FRAUD");
        record.setPayrollStatus("EXCLUDED_FROM_PAYROLL");
        return Optional.of(attendanceRepository.save(record));
    }

    private boolean canReportFraudOn(Employee target, EmployeeUserDetails principal) {
        for (var a : principal.getAuthorities()) {
            String authority = a.getAuthority();
            if ("ROLE_ADMIN".equals(authority) || "ROLE_HR".equals(authority) || "ROLE_SUPER_ADMIN".equals(authority)) {
                return true;
            }
            if ("ROLE_MANAGER".equals(authority)) {
                return target.getManagerId() != null && target.getManagerId().equals(principal.getEmployeeId());
            }
        }
        return false;
    }

    @Transactional
    public String clockWithNfc(Employee employee) {
        Optional<AttendanceRecord> activeSession =
                attendanceRepository.findActiveSessionByEmployeeId(employee.getEmployeeId());

        if (activeSession.isPresent()) {
            AttendanceRecord record = activeSession.get();
            record.setCheckOut(LocalDateTime.now());
            record.calculateWorkHours();
            attendanceRepository.save(record);
            return "Checked Out Successfully at " + record.getCheckOut();
        }
        AttendanceRecord newRecord = AttendanceRecord.builder()
                .employee(employee)
                .checkIn(LocalDateTime.now())
                .status("Normal")
                .isVerifiedByManager(false)
                .reviewStatus("PENDING_REVIEW")
                .payrollStatus("PENDING_APPROVAL")
                .build();
        attendanceRepository.save(newRecord);
        return "Checked In Successfully at " + newRecord.getCheckIn();
    }

    @Transactional(readOnly = true)
    public Page<AttendanceRecordDto> getMyRecords(Long employeeId, Pageable pageable) {
        return attendanceRepository.findAllByEmployee_EmployeeIdOrderByCheckInDesc(employeeId, pageable)
                .map(this::toDto);
    }

    @Transactional(readOnly = true)
    public Page<AttendanceRecordDto> getTodayRecordsForManager(Long managerId, Pageable pageable, EmployeeUserDetails principal) {
        boolean privileged = principal.getAuthorities().stream().anyMatch(a ->
                "ROLE_HR".equals(a.getAuthority()) ||
                "ROLE_ADMIN".equals(a.getAuthority()) ||
                "ROLE_SUPER_ADMIN".equals(a.getAuthority()));
        
        if (privileged) {
            return attendanceRepository.findAllRecentRecords(pageable).map(this::toDto);
        }
        
        // For MANAGERs, check if they have a department assigned
        if (principal.getAuthorities().stream().anyMatch(a -> "ROLE_MANAGER".equals(a.getAuthority())) 
                && principal.getDepartmentId() != null) {
            // Filter by both manager AND department
            return attendanceRepository.findRecentRecordsForManagerInDepartment(
                managerId, principal.getDepartmentId(), pageable).map(this::toDto);
        }
        
        // Regular manager without department assignment
        return attendanceRepository.findRecentRecordsForManager(managerId, pageable).map(this::toDto);
    }

    @Transactional
    public Optional<AttendanceRecord> verifyRecord(Long recordId, String note, EmployeeUserDetails principal) {
        Optional<AttendanceRecord> found = attendanceRepository.findById(recordId);
        if (found.isEmpty()) {
            return Optional.empty();
        }
        AttendanceRecord record = found.get();
        Employee target = record.getEmployee();
        
        if (!canReportFraudOn(target, principal)) {
            throw new AccessDeniedException("You cannot verify this attendance record");
        }
        
        record.setStatus("Verified");
        record.setManagerNotes(note);
        record.setIsVerifiedByManager(true);
        record.setVerifiedAt(LocalDateTime.now());
        record.setReviewStatus("VERIFIED");
        record.setPayrollStatus("APPROVED_FOR_PAYROLL");
        
        return Optional.of(attendanceRepository.save(record));
    }

    @Transactional
    public Optional<AttendanceRecord> manuallyCorrectRecord(
            Long recordId,
            LocalDateTime checkIn,
            LocalDateTime checkOut,
            String reason,
            boolean approveForPayroll,
            EmployeeUserDetails principal) {
        if (!hasAnyRole(principal, "ROLE_HR", "ROLE_ADMIN", "ROLE_SUPER_ADMIN")) {
            throw new AccessDeniedException("You cannot manually correct attendance records");
        }

        Optional<AttendanceRecord> found = attendanceRepository.findById(recordId);
        if (found.isEmpty()) {
            return Optional.empty();
        }

        AttendanceRecord record = found.get();
        String oldValues = String.format("In: %s, Out: %s", record.getCheckIn(), record.getCheckOut());

        LocalDateTime effectiveCheckIn = checkIn != null ? checkIn : record.getCheckIn();
        LocalDateTime effectiveCheckOut = checkOut != null ? checkOut : record.getCheckOut();

        if (effectiveCheckIn == null) {
            throw new BusinessException(ErrorCode.ATTENDANCE_VALIDATION_ERROR, "checkIn is required for manual correction");
        }
        if (effectiveCheckOut != null && effectiveCheckOut.isBefore(effectiveCheckIn)) {
            throw new BusinessException(ErrorCode.ATTENDANCE_VALIDATION_ERROR, "checkOut must be after checkIn");
        }

        record.setCheckIn(effectiveCheckIn);
        record.setCheckOut(effectiveCheckOut);
        if (effectiveCheckOut != null) {
            record.calculateWorkHours();
        } else {
            record.setWorkHours(null);
        }
        record.setStatus("Manually Corrected");
        record.setReviewStatus("MANUALLY_CORRECTED");
        record.setPayrollStatus(approveForPayroll ? "APPROVED_FOR_PAYROLL" : "PENDING_APPROVAL");
        record.setIsVerifiedByManager(true);
        record.setVerifiedAt(LocalDateTime.now());
        record.setManuallyAdjusted(true);
        record.setManuallyAdjustedAt(LocalDateTime.now());
        record.setManuallyAdjustedBy(principal.getEmployeeId());
        record.setManualAdjustmentReason(reason);
        record.setManagerNotes(reason);

        AttendanceRecord saved = attendanceRepository.save(record);

        // Audit Log
        String newValues = String.format("In: %s, Out: %s, Reason: %s", saved.getCheckIn(), saved.getCheckOut(), reason);
        systemLogRepository.save(com.hrms.core.models.SystemLog.builder()
            .actorId(principal.getEmployeeId())
            .targetId(saved.getEmployee().getEmployeeId())
            .actionType("ATTENDANCE_CORRECTION")
            .oldValue(oldValues)
            .newValue(newValues)
            .build());

        return Optional.of(saved);
    }

    @Transactional(readOnly = true)
    public Page<AttendanceRecordDto> getCompanyMonthlyAttendance(int month, int year, Pageable pageable, EmployeeUserDetails actor) {
        return attendanceRepository.findAllMonthlyRecordsPage(month, year, pageable).map(this::toDto);
    }

    @Transactional(readOnly = true)
    public com.hrms.api.dto.EmployeeProgressResponse getEmployeeMonthlySummary(Long employeeId, int month, int year) {
        // Calculate current month hours
        java.util.List<AttendanceRecord> currentRecords = attendanceRepository.findMonthlyRecords(employeeId, month, year);

        java.math.BigDecimal workedHours = currentRecords.stream()
                .filter(r -> !"EXCLUDED_FROM_PAYROLL".equals(r.getPayrollStatus()))
                .filter(r -> r.getWorkHours() != null)
                .map(AttendanceRecord::getWorkHours)
                .reduce(java.math.BigDecimal.ZERO, java.math.BigDecimal::add);

        // Calculate last month hours for comparison
        int lastMonth = month == 1 ? 12 : month - 1;
        int lastYear = month == 1 ? year - 1 : year;

        java.util.List<AttendanceRecord> lastRecords = attendanceRepository.findMonthlyRecords(employeeId, lastMonth, lastYear);

        java.math.BigDecimal lastMonthWorkedHours = lastRecords.stream()
                .filter(r -> !"EXCLUDED_FROM_PAYROLL".equals(r.getPayrollStatus()))
                .filter(r -> r.getWorkHours() != null)
                .map(AttendanceRecord::getWorkHours)
                .reduce(java.math.BigDecimal.ZERO, java.math.BigDecimal::add);

        // Calculate current year hours
        java.util.List<AttendanceRecord> yearlyRecords = attendanceRepository.findYearlyRecords(employeeId, year);
        java.math.BigDecimal yearlyWorkedHours = yearlyRecords.stream()
                .filter(r -> !"EXCLUDED_FROM_PAYROLL".equals(r.getPayrollStatus()))
                .filter(r -> r.getWorkHours() != null)
                .map(AttendanceRecord::getWorkHours)
                .reduce(java.math.BigDecimal.ZERO, java.math.BigDecimal::add);

        // Rankings
        java.util.List<Object[]> monthlyRanking = attendanceRepository.findMonthlyRanking(month, year);
        Integer monthlyRank = null;
        for (int i = 0; i < monthlyRanking.size(); i++) {
            if (String.valueOf(monthlyRanking.get(i)[0]).equals(String.valueOf(employeeId))) {
                monthlyRank = i + 1;
                break;
            }
        }

        java.util.List<Object[]> yearlyRanking = attendanceRepository.findYearlyRanking(year);
        Integer yearlyRank = null;
        for (int i = 0; i < yearlyRanking.size(); i++) {
            if (String.valueOf(yearlyRanking.get(i)[0]).equals(String.valueOf(employeeId))) {
                yearlyRank = i + 1;
                break;
            }
        }

        return new com.hrms.api.dto.EmployeeProgressResponse(
                month,
                year,
                workedHours,
                new java.math.BigDecimal("160"), // Target Hours
                lastMonthWorkedHours,
                yearlyWorkedHours,
                new java.math.BigDecimal("1920"), // Yearly Target (160 * 12)
                monthlyRank,
                yearlyRank,
                monthlyRanking.size()
        );
    }

    private boolean hasAnyRole(EmployeeUserDetails principal, String... roles) {
        for (String role : roles) {
            if (principal.getAuthorities().stream().anyMatch(a -> role.equals(a.getAuthority()))) {
                return true;
            }
        }
        return false;
    }

    private AttendanceRecordDto toDto(AttendanceRecord record) {
        Employee employee = record.getEmployee();
        return AttendanceRecordDto.of(
                record.getRecordId(),
                employee != null ? employee.getEmployeeId() : null,
                employee != null ? employee.getFullName() : "Unknown",
                employee != null ? employee.getEmail() : null,
                record.getCheckIn(),
                record.getCheckOut(),
                record.getWorkHours(),
                record.getStatus(),
                record.getIsVerifiedByManager(),
                record.getVerifiedAt(),
                record.getManagerNotes(),
                record.getReviewStatus(),
                record.getPayrollStatus(),
                record.getManuallyAdjusted(),
                record.getManuallyAdjustedAt(),
                record.getManuallyAdjustedBy(),
                record.getManualAdjustmentReason()
        );
    }
}
