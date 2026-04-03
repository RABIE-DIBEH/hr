package com.hrms.api;

import com.hrms.api.dto.FraudReportRequest;
import com.hrms.api.dto.NfcClockRequest;
import com.hrms.security.EmployeeUserDetails;
import com.hrms.services.AttendanceService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import com.hrms.core.models.AttendanceRecord;
import java.util.List;

@RestController
@RequestMapping("/api/attendance")
public class AttendanceController {

    private final AttendanceService attendanceService;

    public AttendanceController(AttendanceService attendanceService) {
        this.attendanceService = attendanceService;
    }

    @PostMapping("/nfc-clock")
    public ResponseEntity<Map<String, String>> clockByNfc(
            @Valid @RequestBody NfcClockRequest request,
            @AuthenticationPrincipal EmployeeUserDetails principal) {

        String result = attendanceService.clockByNfcUid(request.cardUid(), principal);
        if (result.startsWith("Error")) {
            return ResponseEntity.status(401).body(Map.of("message", result));
        }

        return ResponseEntity.ok(Map.of("message", result));
    }

    @PutMapping("/report-fraud/{recordId}")
    public ResponseEntity<Map<String, String>> reportFraud(
            @PathVariable Long recordId,
            @RequestBody FraudReportRequest request,
            @AuthenticationPrincipal EmployeeUserDetails principal) {

        return attendanceService.reportFraud(recordId, request.noteOrDefault(), principal)
                .map(record -> ResponseEntity.ok(Map.of("message", "Fraud reported successfully for record: " + recordId)))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/my-records")
    public ResponseEntity<List<AttendanceRecord>> getMyRecords(@AuthenticationPrincipal EmployeeUserDetails principal) {
        return ResponseEntity.ok(attendanceService.getMyRecords(principal.getEmployeeId()));
    }

    @GetMapping("/manager/today")
    public ResponseEntity<List<AttendanceRecord>> getManagerTodayRecords(@AuthenticationPrincipal EmployeeUserDetails principal) {
        return ResponseEntity.ok(attendanceService.getTodayRecordsForManager(principal.getEmployeeId()));
    }

    @PutMapping("/verify/{recordId}")
    public ResponseEntity<Map<String, String>> verifyRecord(
            @PathVariable Long recordId,
            @RequestBody(required = false) FraudReportRequest request,
            @AuthenticationPrincipal EmployeeUserDetails principal) {

        String note = (request != null && request.noteOrDefault() != null) ? request.noteOrDefault() : "Verified via Dashboard";
        return attendanceService.verifyRecord(recordId, note, principal)
                .map(record -> ResponseEntity.ok(Map.of("message", "Attendance record verified successfully.")))
                .orElse(ResponseEntity.notFound().build());
    }
}
