package com.hrms.api;

import com.hrms.core.models.NfcDevice;
import com.hrms.core.models.SystemLog;
import com.hrms.services.AdminService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @GetMapping("/metrics")
    public ResponseEntity<Map<String, Object>> getMetrics() {
        return ResponseEntity.ok(adminService.getSystemMetrics());
    }

    @GetMapping("/logs")
    public ResponseEntity<List<SystemLog>> getLogs() {
        return ResponseEntity.ok(adminService.getRecentLogs());
    }

    @GetMapping("/devices")
    public ResponseEntity<List<NfcDevice>> getDevices() {
        return ResponseEntity.ok(adminService.getAllDevices());
    }

    @DeleteMapping("/logs")
    public ResponseEntity<Map<String, String>> clearLogs() {
        adminService.clearAllLogs("Admin");
        return ResponseEntity.ok(Map.of("message", "Logs cleared successfully"));
    }

    @PostMapping("/devices")
    public ResponseEntity<NfcDevice> addDevice(@RequestBody NfcDevice device) {
        return ResponseEntity.ok(adminService.addNfcDevice(device));
    }

    @PostMapping("/backup")
    public ResponseEntity<Map<String, String>> triggerBackup() {
        String status = adminService.triggerBackup("Admin");
        return ResponseEntity.ok(Map.of("message", status));
    }
}
