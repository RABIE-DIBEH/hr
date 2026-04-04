package com.hrms.services;

import com.hrms.core.models.AttendanceRecord;
import com.hrms.core.models.Employee;
import com.hrms.core.models.NFCCard;
import com.hrms.core.repositories.AttendanceRecordRepository;
import com.hrms.core.repositories.NFCCardRepository;
import com.hrms.security.EmployeeUserDetails;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.math.BigDecimal;
import java.util.List;
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
                .build();
        attendanceRepository.save(newRecord);
        return "Checked In Successfully at " + newRecord.getCheckIn();
    }

    public java.util.List<AttendanceRecord> getMyRecords(Long employeeId) {
        return attendanceRepository.findAllByEmployee_EmployeeIdOrderByCheckInDesc(employeeId);
    }

    public java.util.List<AttendanceRecord> getTodayRecordsForManager(Long managerId) {
        return attendanceRepository.findTodayRecordsForManager(managerId);
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
        
        return Optional.of(attendanceRepository.save(record));
    }

    public List<AttendanceRecord> getCompanyMonthlyAttendance(int month, int year, EmployeeUserDetails actor) {
        return attendanceRepository.findAllMonthlyRecords(month, year);
    }
}
