package com.hrms.api;

import com.hrms.security.EmployeeUserDetails;
import com.hrms.services.AttendanceService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/attendance")
public class AttendanceController {

    private final AttendanceService attendanceService;

    public AttendanceController(AttendanceService attendanceService) {
        this.attendanceService = attendanceService;
    }

    @PostMapping("/nfc-clock")
    public ResponseEntity<Map<String, String>> clockByNfc(
            @RequestBody Map<String, String> request,
            @AuthenticationPrincipal EmployeeUserDetails principal) {
        String uid = request.get("cardUid");
        if (uid == null || uid.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Card UID is required"));
        }

        String result = attendanceService.clockByNfcUid(uid, principal);
        if (result.startsWith("Error")) {
            return ResponseEntity.status(401).body(Map.of("message", result));
        }

        return ResponseEntity.ok(Map.of("message", result));
    }

    @PutMapping("/report-fraud/{recordId}")
    public ResponseEntity<Map<String, String>> reportFraud(
            @PathVariable Long recordId,
            @RequestBody Map<String, String> request,
            @AuthenticationPrincipal EmployeeUserDetails principal) {

        String note = request.getOrDefault("note", "Suspicious activity reported by manager");
        return attendanceService.reportFraud(recordId, note, principal)
                .map(record -> ResponseEntity.ok(Map.of("message", "Fraud reported successfully for record: " + recordId)))
                .orElse(ResponseEntity.notFound().build());
    }
}
