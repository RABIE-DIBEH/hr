package com.hrms.services;

import com.hrms.core.models.AttendanceRecord;
import com.hrms.core.models.Employee;
import com.hrms.core.models.NFCCard;
import com.hrms.core.repositories.AttendanceRecordRepository;
import com.hrms.core.repositories.NFCCardRepository;
import com.hrms.security.EmployeeUserDetails;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class AttendanceService {

    private final AttendanceRecordRepository attendanceRepository;
    private final NFCCardRepository nfcCardRepository;

    public AttendanceService(AttendanceRecordRepository attendanceRepository, NFCCardRepository nfcCardRepository) {
        this.attendanceRepository = attendanceRepository;
        this.nfcCardRepository = nfcCardRepository;
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

    public Page<AttendanceRecord> getMyRecords(Long employeeId, Pageable pageable) {
        return attendanceRepository.findAllByEmployee_EmployeeIdOrderByCheckInDesc(employeeId, pageable);
    }

    public Page<AttendanceRecord> getTodayRecordsForManager(Long managerId, Pageable pageable, EmployeeUserDetails principal) {
        boolean privileged = principal.getAuthorities().stream().anyMatch(a ->
                "ROLE_HR".equals(a.getAuthority()) ||
                "ROLE_ADMIN".equals(a.getAuthority()) ||
                "ROLE_SUPER_ADMIN".equals(a.getAuthority()));
        if (privileged) {
            return attendanceRepository.findTodayRecords(pageable);
        }
        return attendanceRepository.findTodayRecordsForManager(managerId, pageable);
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
        LocalDateTime effectiveCheckIn = checkIn != null ? checkIn : record.getCheckIn();
        LocalDateTime effectiveCheckOut = checkOut != null ? checkOut : record.getCheckOut();

        if (effectiveCheckIn == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "checkIn is required for manual correction");
        }
        if (effectiveCheckOut != null && effectiveCheckOut.isBefore(effectiveCheckIn)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "checkOut must be after checkIn");
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

        return Optional.of(attendanceRepository.save(record));
    }

    public Page<AttendanceRecord> getCompanyMonthlyAttendance(int month, int year, Pageable pageable, EmployeeUserDetails actor) {
        return attendanceRepository.findAllMonthlyRecords(month, year, pageable);
    }

    private boolean hasAnyRole(EmployeeUserDetails principal, String... roles) {
        for (String role : roles) {
            if (principal.getAuthorities().stream().anyMatch(a -> role.equals(a.getAuthority()))) {
                return true;
            }
        }
        return false;
    }
}
