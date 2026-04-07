package com.hrms.workflows;

import com.hrms.AbstractContainerBaseTest;
import com.hrms.core.models.AttendanceRecord;
import com.hrms.core.models.Employee;
import com.hrms.core.models.NFCCard;
import com.hrms.core.repositories.AttendanceRecordRepository;
import com.hrms.core.repositories.EmployeeRepository;
import com.hrms.core.repositories.NFCCardRepository;
import com.hrms.security.EmployeeUserDetails;
import com.hrms.services.AttendanceService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Integration test for NFC Clock + Fraud Detection workflow:
 * 1. Clock in with NFC → creates attendance record
 * 2. Duplicate clock attempt → creates new record
 * 3. Fraud reporting by manager/HR
 */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
class NfcClockFraudDetectionIntegrationTest extends AbstractContainerBaseTest {

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private NFCCardRepository nfcCardRepository;

    @Autowired
    private AttendanceRecordRepository attendanceRepository;

    @Autowired
    private AttendanceService attendanceService;

    private Employee employee;
    private Employee manager;
    private NFCCard nfcCard;
    private final String nfcUid = "TEST-NFC-UID-12345";
    private EmployeeUserDetails employeeUserDetails;
    private EmployeeUserDetails managerUserDetails;

    @BeforeEach
    void setUp() {
        attendanceRepository.deleteAll();
        nfcCardRepository.deleteAll();
        employeeRepository.deleteAll();

        // Create employee
        employee = Employee.builder()
                .fullName("Test Employee")
                .email("test@hrms.com")
                .passwordHash("hashed")
                .baseSalary(new BigDecimal("5000.00"))
                .status("Active")
                .roleId(5L) // EMPLOYEE role
                .build();
        employee = employeeRepository.save(employee);

        // Create manager
        manager = Employee.builder()
                .fullName("Test Manager")
                .email("manager@hrms.com")
                .passwordHash("hashed")
                .baseSalary(new BigDecimal("7000.00"))
                .status("Active")
                .roleId(4L) // MANAGER role
                .build();
        manager = employeeRepository.save(manager);

        // Create NFC card for employee
        nfcCard = new NFCCard();
        nfcCard.setUid(nfcUid);
        nfcCard.setEmployee(employee);
        nfcCard.setStatus("Active");
        nfcCardRepository.save(nfcCard);

        // Create user details for authentication
        employeeUserDetails = new EmployeeUserDetails(employee, "EMPLOYEE", "Test Team");
        managerUserDetails = new EmployeeUserDetails(manager, "MANAGER", "Test Team");
    }

    @Test
    void nfcClockIn_FirstTime_CreatesAttendanceRecord() {
        // Clock in for the first time
        String result = attendanceService.clockByNfcUid(nfcUid, employeeUserDetails);

        assertThat(result).contains("Checked In Successfully");

        // Verify record was created
        List<AttendanceRecord> records = attendanceRepository.findAll();
        assertThat(records).hasSize(1);
        
        AttendanceRecord record = records.get(0);
        assertThat(record.getEmployee().getEmployeeId()).isEqualTo(employee.getEmployeeId());
        assertThat(record.getCheckIn()).isNotNull();
        assertThat(record.getCheckOut()).isNull();
        assertThat(record.getStatus()).isEqualTo("Normal");
        assertThat(record.getReviewStatus()).isEqualTo("PENDING_REVIEW");
    }

    @Test
    void nfcClockInThenOut_CompleteWorkDay() {
        // Clock in
        String clockInResult = attendanceService.clockByNfcUid(nfcUid, employeeUserDetails);
        assertThat(clockInResult).contains("Checked In Successfully");

        // Clock out
        String clockOutResult = attendanceService.clockByNfcUid(nfcUid, employeeUserDetails);
        assertThat(clockOutResult).contains("Checked Out Successfully");

        // Verify record was updated
        List<AttendanceRecord> records = attendanceRepository.findAll();
        assertThat(records).hasSize(1);
        
        AttendanceRecord record = records.get(0);
        assertThat(record.getCheckIn()).isNotNull();
        assertThat(record.getCheckOut()).isNotNull();
        assertThat(record.getWorkHours()).isNotNull().isGreaterThan(BigDecimal.ZERO);
    }

    @Test
    void duplicateClockIn_CreatesNewRecord() {
        // First clock in
        String firstResult = attendanceService.clockByNfcUid(nfcUid, employeeUserDetails);
        assertThat(firstResult).contains("Checked In Successfully");

        // Try to clock in again (duplicate) - should create new record
        String secondResult = attendanceService.clockByNfcUid(nfcUid, employeeUserDetails);
        assertThat(secondResult).contains("Checked In Successfully");

        // Verify two records exist
        List<AttendanceRecord> records = attendanceRepository.findAll();
        assertThat(records).hasSize(2);
        
        // Both should be clocked in (no automatic fraud detection in current implementation)
        assertThat(records).allMatch(r -> r.getCheckIn() != null && r.getCheckOut() == null);
    }

    @Test
    void reportFraud_ByManager_Success() {
        // Create an attendance record
        attendanceService.clockByNfcUid(nfcUid, employeeUserDetails);
        attendanceService.clockByNfcUid(nfcUid, employeeUserDetails); // Clock out
        
        List<AttendanceRecord> records = attendanceRepository.findAll();
        assertThat(records).hasSize(1);
        
        AttendanceRecord record = records.get(0);
        
        // Manager reports fraud
        var fraudReport = attendanceService.reportFraud(
                record.getRecordId(),
                "Suspicious timing - too short work day",
                managerUserDetails
        );
        
        assertThat(fraudReport).isPresent();
        AttendanceRecord fraudRecord = fraudReport.get();
        
        assertThat(fraudRecord.getStatus()).isEqualTo("Fraud");
        assertThat(fraudRecord.getManagerNotes()).contains("Suspicious timing");
        assertThat(fraudRecord.getIsVerifiedByManager()).isTrue();
        assertThat(fraudRecord.getVerifiedAt()).isNotNull();
        assertThat(fraudRecord.getReviewStatus()).isEqualTo("FRAUD");
        assertThat(fraudRecord.getPayrollStatus()).isEqualTo("EXCLUDED_FROM_PAYROLL");
        assertThat(fraudRecord.getWorkHours()).isEqualByComparingTo(BigDecimal.ZERO);
    }

    @Test
    void verifyRecord_ByManager_Success() {
        // Create an attendance record
        attendanceService.clockByNfcUid(nfcUid, employeeUserDetails);
        attendanceService.clockByNfcUid(nfcUid, employeeUserDetails); // Clock out
        
        List<AttendanceRecord> records = attendanceRepository.findAll();
        assertThat(records).hasSize(1);
        
        AttendanceRecord record = records.get(0);
        
        // Manager verifies the record
        var verified = attendanceService.verifyRecord(
                record.getRecordId(),
                "Record verified - normal work day",
                managerUserDetails
        );
        
        assertThat(verified).isPresent();
        AttendanceRecord verifiedRecord = verified.get();
        
        assertThat(verifiedRecord.getStatus()).isEqualTo("Verified");
        assertThat(verifiedRecord.getManagerNotes()).contains("Record verified");
        assertThat(verifiedRecord.getIsVerifiedByManager()).isTrue();
        assertThat(verifiedRecord.getVerifiedAt()).isNotNull();
        assertThat(verifiedRecord.getReviewStatus()).isEqualTo("VERIFIED");
        assertThat(verifiedRecord.getPayrollStatus()).isEqualTo("APPROVED_FOR_PAYROLL");
    }

    @Test
    void nfcCardNotRegistered_ReturnsError() {
        String result = attendanceService.clockByNfcUid("NON-EXISTENT-UID", employeeUserDetails);
        assertThat(result).contains("Card not registered");
    }

    @Test
    void nfcCardInactive_ReturnsError() {
        // Deactivate NFC card
        nfcCard.setStatus("Blocked");
        nfcCardRepository.save(nfcCard);

        String result = attendanceService.clockByNfcUid(nfcUid, employeeUserDetails);
        assertThat(result).contains("Card is blocked or inactive");
    }

    @Test
    void unauthorizedNfcUse_ReturnsError() {
        // Try to use someone else's NFC card
        Employee otherEmployee = Employee.builder()
                .fullName("Other Employee")
                .email("other@hrms.com")
                .passwordHash("hashed")
                .baseSalary(new BigDecimal("4000.00"))
                .status("Active")
                .roleId(5L)
                .build();
        employeeRepository.save(otherEmployee);

        EmployeeUserDetails otherUserDetails = new EmployeeUserDetails(otherEmployee, "EMPLOYEE", "Other Team");

        String result = attendanceService.clockByNfcUid(nfcUid, otherUserDetails);
        assertThat(result).contains("This NFC card is not linked to your account");
    }

    @Test
    void hrCanUseAnyNfcCard() {
        // Create HR user details - need to create an actual HR employee
        Employee hrEmployee = Employee.builder()
                .fullName("HR User")
                .email("hr@hrms.com")
                .passwordHash("hashed")
                .baseSalary(new BigDecimal("6000.00"))
                .status("Active")
                .roleId(2L) // HR role
                .build();
        employeeRepository.save(hrEmployee);
        EmployeeUserDetails hrUserDetails = new EmployeeUserDetails(hrEmployee, "HR", "HR Team");

        // HR should be able to use any NFC card
        String result = attendanceService.clockByNfcUid(nfcUid, hrUserDetails);
        assertThat(result).contains("Checked In Successfully");
    }

    @Test
    void manuallyCorrectRecord_ByHR_Success() {
        // Create an attendance record
        attendanceService.clockByNfcUid(nfcUid, employeeUserDetails);
        
        List<AttendanceRecord> records = attendanceRepository.findAll();
        assertThat(records).hasSize(1);
        
        AttendanceRecord record = records.get(0);
        
        // Create HR user details - need to create an actual HR employee
        Employee hrEmployee = Employee.builder()
                .fullName("HR User")
                .email("hr@hrms.com")
                .passwordHash("hashed")
                .baseSalary(new BigDecimal("6000.00"))
                .status("Active")
                .roleId(2L) // HR role
                .build();
        employeeRepository.save(hrEmployee);
        EmployeeUserDetails hrUserDetails = new EmployeeUserDetails(hrEmployee, "HR", "HR Team");
        
        // HR manually corrects the record
        var corrected = attendanceService.manuallyCorrectRecord(
                record.getRecordId(),
                record.getCheckIn().minusHours(1), // Adjust check-in earlier
                record.getCheckIn().plusHours(8), // Add check-out
                "Forgot to clock out, added manually",
                true, // Approve for payroll
                hrUserDetails
        );
        
        assertThat(corrected).isPresent();
        AttendanceRecord correctedRecord = corrected.get();
        
        assertThat(correctedRecord.getStatus()).isEqualTo("Manually Corrected");
        assertThat(correctedRecord.getManuallyAdjusted()).isTrue();
        assertThat(correctedRecord.getManualAdjustmentReason()).contains("Forgot to clock out");
        assertThat(correctedRecord.getManuallyAdjustedAt()).isNotNull();
        assertThat(correctedRecord.getManuallyAdjustedBy()).isEqualTo(999L);
        assertThat(correctedRecord.getReviewStatus()).isEqualTo("MANUALLY_CORRECTED");
        assertThat(correctedRecord.getPayrollStatus()).isEqualTo("APPROVED_FOR_PAYROLL");
        assertThat(correctedRecord.getWorkHours()).isEqualByComparingTo(new BigDecimal("8.0"));
    }
}