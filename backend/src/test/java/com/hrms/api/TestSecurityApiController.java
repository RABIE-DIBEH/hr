package com.hrms.api;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
class TestSecurityApiController {

    @PostMapping("/api/auth/login")
    ResponseEntity<String> login() {
        return ResponseEntity.ok("ok");
    }

    @GetMapping("/api/employees/me")
    ResponseEntity<String> me() {
        return ResponseEntity.ok("ok");
    }

    @GetMapping("/api/admin/metrics")
    ResponseEntity<String> metrics() {
        return ResponseEntity.ok("ok");
    }

    @GetMapping("/api/payroll/history")
    ResponseEntity<String> payrollHistory() {
        return ResponseEntity.ok("ok");
    }

    @GetMapping("/api/attendance/my-records")
    ResponseEntity<String> myAttendance() {
        return ResponseEntity.ok("ok");
    }

    @PutMapping("/api/attendance/manual-correct/{recordId}")
    ResponseEntity<String> manualCorrect(@PathVariable Long recordId) {
        return ResponseEntity.ok(String.valueOf(recordId));
    }

    @DeleteMapping("/api/nfc-cards/{employeeId}")
    ResponseEntity<String> deleteCard(@PathVariable Long employeeId) {
        return ResponseEntity.ok(String.valueOf(employeeId));
    }
}
