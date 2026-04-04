package com.hrms.api;

import com.hrms.api.dto.FraudReportRequest;
import com.hrms.api.dto.NfcClockRequest;
import com.hrms.api.dto.ApiResponse;
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
    public ResponseEntity<?> clockByNfc(
            @Valid @RequestBody NfcClockRequest request,
            @AuthenticationPrincipal EmployeeUserDetails principal) {

        String result = attendanceService.clockByNfcUid(request.cardUid(), principal);
        if (result.startsWith("Error")) {
            return ResponseEntity.status(401).body(ApiResponse.error(401, result));
        }

        return ResponseEntity.ok(ApiResponse.success(Map.of("result", result), result));
    }

    @PutMapping("/report-fraud/{recordId}")
    public ResponseEntity<ApiResponse<Map<String, String>>> reportFraud(
            @PathVariable Long recordId,
            @RequestBody FraudReportRequest request,
            @AuthenticationPrincipal EmployeeUserDetails principal) {

        return attendanceService.reportFraud(recordId, request.noteOrDefault(), principal)
                .map(record -> ResponseEntity.ok(ApiResponse.success(
                        Map.of("message", "Fraud reported successfully for record: " + recordId),
                        "Fraud reported successfully"
                )))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/my-records")
    public ResponseEntity<ApiResponse<List<AttendanceRecord>>> getMyRecords(@AuthenticationPrincipal EmployeeUserDetails principal) {
        return ResponseEntity.ok(ApiResponse.success(
                attendanceService.getMyRecords(principal.getEmployeeId()),
                "Your attendance records retrieved successfully"
        ));
    }

    @GetMapping("/manager/today")
    public ResponseEntity<ApiResponse<List<AttendanceRecord>>> getManagerTodayRecords(@AuthenticationPrincipal EmployeeUserDetails principal) {
        return ResponseEntity.ok(ApiResponse.success(
                attendanceService.getTodayRecordsForManager(principal.getEmployeeId()),
                "Today's team attendance retrieved successfully"
        ));
    }

    @PutMapping("/verify/{recordId}")
    public ResponseEntity<ApiResponse<Map<String, String>>> verifyRecord(
            @PathVariable Long recordId,
            @RequestBody(required = false) FraudReportRequest request,
            @AuthenticationPrincipal EmployeeUserDetails principal) {

        String note = (request != null && request.noteOrDefault() != null) ? request.noteOrDefault() : "Verified via Dashboard";
        return attendanceService.verifyRecord(recordId, note, principal)
                .map(record -> ResponseEntity.ok(ApiResponse.success(
                        Map.of("message", "Attendance record verified successfully."),
                        "Attendance verified successfully"
                )))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/hr/monthly")
    public ResponseEntity<ApiResponse<List<AttendanceRecord>>> getCompanyMonthlyAttendance(
            @RequestParam int month,
            @RequestParam int year,
            @AuthenticationPrincipal EmployeeUserDetails principal) {
        
        return ResponseEntity.ok(ApiResponse.success(
                attendanceService.getCompanyMonthlyAttendance(month, year, principal),
                "Company monthly attendance retrieved successfully"
        ));
    }
}
