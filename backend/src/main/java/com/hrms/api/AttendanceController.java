package com.hrms.api;

import com.hrms.api.dto.FraudReportRequest;
import com.hrms.api.dto.ManualAttendanceCorrectionRequest;
import com.hrms.api.dto.NfcClockRequest;
import com.hrms.api.dto.ApiResponse;
import com.hrms.api.dto.IdResponseDto;
import com.hrms.api.dto.StatusResponseDto;
import com.hrms.api.dto.PaginatedResponse;
import com.hrms.api.dto.AttendanceRecordDto;
import com.hrms.security.EmployeeUserDetails;
import com.hrms.services.AttendanceService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/attendance")
public class AttendanceController {

    private final AttendanceService attendanceService;

    public AttendanceController(AttendanceService attendanceService) {
        this.attendanceService = attendanceService;
    }

    @PostMapping("/nfc-clock")
    public ResponseEntity<ApiResponse<StatusResponseDto>> clockByNfc(
            @Valid @RequestBody NfcClockRequest request,
            @AuthenticationPrincipal EmployeeUserDetails principal) {

        String result = attendanceService.clockByNfcUid(request.cardUid(), principal);
        if (result.startsWith("Error")) {
            // Use 400 (Bad Request) for NFC business errors, NOT 401.
            // 401 means "unauthenticated" and triggers the frontend to redirect to /login.
            return ResponseEntity.status(400).body(ApiResponse.error(400, result));
        }

        return ResponseEntity.ok(ApiResponse.success(new StatusResponseDto(result), result));
    }

    @PutMapping("/report-fraud/{recordId}")
    public ResponseEntity<ApiResponse<StatusResponseDto>> reportFraud(
            @PathVariable Long recordId,

            @Valid @RequestBody FraudReportRequest request,
            @AuthenticationPrincipal EmployeeUserDetails principal) {

        return attendanceService.reportFraud(recordId, request.noteOrDefault(), principal)
                .map(record -> ResponseEntity.ok(ApiResponse.success(
                        new StatusResponseDto("Fraud reported successfully for record: " + recordId),
                        "Fraud reported successfully"
                )))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/my")
    public ResponseEntity<ApiResponse<PaginatedResponse<AttendanceRecordDto>>> getMyRecords(
            @AuthenticationPrincipal EmployeeUserDetails principal,
            @PageableDefault(size = 20) Pageable pageable) {
        Page<AttendanceRecordDto> page = attendanceService.getMyRecords(principal.getEmployeeId(), pageable);
        return ResponseEntity.ok(ApiResponse.success(
                PaginatedResponse.of(page.getContent(), page.getTotalElements(), page.getNumber(), page.getSize()),
                "Your attendance records retrieved successfully"
        ));
    }

    @GetMapping("/manager/today")
    public ResponseEntity<ApiResponse<PaginatedResponse<AttendanceRecordDto>>> getManagerTodayRecords(
            @AuthenticationPrincipal EmployeeUserDetails principal,
            @PageableDefault(size = 20) Pageable pageable) {
        Page<AttendanceRecordDto> page = attendanceService.getTodayRecordsForManager(principal.getEmployeeId(), pageable, principal);
        return ResponseEntity.ok(ApiResponse.success(
                PaginatedResponse.of(page.getContent(), page.getTotalElements(), page.getNumber(), page.getSize()),
                "Today's team attendance retrieved successfully"
        ));
    }

    @PutMapping("/verify/{recordId}")
    public ResponseEntity<ApiResponse<StatusResponseDto>> verifyRecord(
            @PathVariable Long recordId,

            @Valid @RequestBody(required = false) FraudReportRequest request,
            @AuthenticationPrincipal EmployeeUserDetails principal) {

        String note = (request != null && request.noteOrDefault() != null) ? request.noteOrDefault() : "Verified via Dashboard";
        return attendanceService.verifyRecord(recordId, note, principal)
                .map(record -> ResponseEntity.ok(ApiResponse.success(
                        new StatusResponseDto("Attendance record verified successfully."),
                        "Attendance verified successfully"
                )))
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/manual-correct/{recordId}")
    public ResponseEntity<ApiResponse<StatusResponseDto>> manuallyCorrectRecord(
            @PathVariable Long recordId,
            @Valid @RequestBody ManualAttendanceCorrectionRequest request,
            @AuthenticationPrincipal EmployeeUserDetails principal) {
        boolean approveForPayroll = request.approveForPayroll() == null || request.approveForPayroll();
        return attendanceService.manuallyCorrectRecord(
                        recordId,
                        request.checkIn(),
                        request.checkOut(),
                        request.reason(),
                        approveForPayroll,
                        principal)
                .map(record -> ResponseEntity.ok(ApiResponse.success(
                        new StatusResponseDto("Attendance corrected successfully."),
                        "Attendance corrected successfully"
                )))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/hr/monthly")
    public ResponseEntity<ApiResponse<PaginatedResponse<AttendanceRecordDto>>> getCompanyMonthlyAttendance(
            @RequestParam int month,
            @RequestParam int year,
            @AuthenticationPrincipal EmployeeUserDetails principal,
            @PageableDefault(size = 20) Pageable pageable) {

        Page<AttendanceRecordDto> page = attendanceService.getCompanyMonthlyAttendance(month, year, pageable, principal);
        return ResponseEntity.ok(ApiResponse.success(
                PaginatedResponse.of(page.getContent(), page.getTotalElements(), page.getNumber(), page.getSize()),
                "Company monthly attendance retrieved successfully"
        ));
    }
}
