package com.hrms.services;

import com.hrms.core.models.AttendanceRecord;
import com.hrms.core.models.Employee;
import com.hrms.core.models.NFCCard;
import com.hrms.core.repositories.AttendanceRecordRepository;
import com.hrms.core.repositories.NFCCardRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
    public String clockByNfcUid(String uid) {
        Optional<NFCCard> nfcCard = nfcCardRepository.findByUid(uid);
        
        if (nfcCard.isEmpty()) {
            return "Error: Card not registered.";
        }
        
        NFCCard card = nfcCard.get();
        if (!"Active".equals(card.getStatus())) {
            return "Error: Card is blocked or inactive.";
        }
        
        return clockWithNfc(card.getEmployee());
    }

    @Transactional
    public Optional<AttendanceRecord> reportFraud(Long recordId, String note) {
        return attendanceRepository.findById(recordId).map(record -> {
            record.setStatus("Fraud");
            record.setManagerNotes(note);
            record.setIsVerifiedByManager(true);
            record.setVerifiedAt(LocalDateTime.now());
            // Optionally: Cancel the work hours for this record
            record.setWorkHours(java.math.BigDecimal.ZERO);
            return attendanceRepository.save(record);
        });
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
        } else {
            AttendanceRecord newRecord = AttendanceRecord.builder()
                .employee(employee)
                .checkIn(LocalDateTime.now())
                .status("Normal")
                .isVerifiedByManager(false)
                .build();
            attendanceRepository.save(newRecord);
            return "Checked In Successfully at " + newRecord.getCheckIn();
        }
    }
}
