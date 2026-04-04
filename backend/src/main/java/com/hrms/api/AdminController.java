package com.hrms.api;

import com.hrms.api.dto.ApiResponse;
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
    public ResponseEntity<ApiResponse<Map<String, Object>>> getMetrics() {
        return ResponseEntity.ok(ApiResponse.success(
                adminService.getSystemMetrics(),
                "System metrics retrieved successfully"
        ));
    }

    @GetMapping("/logs")
    public ResponseEntity<ApiResponse<List<SystemLog>>> getLogs() {
        return ResponseEntity.ok(ApiResponse.success(
                adminService.getRecentLogs(),
                "Recent system logs retrieved successfully"
        ));
    }

    @GetMapping("/devices")
    public ResponseEntity<ApiResponse<List<NfcDevice>>> getDevices() {
        return ResponseEntity.ok(ApiResponse.success(
                adminService.getAllDevices(),
                "NFC devices retrieved successfully"
        ));
    }

    @DeleteMapping("/logs")
    public ResponseEntity<ApiResponse<Map<String, String>>> clearLogs() {
        adminService.clearAllLogs("Admin");
        return ResponseEntity.ok(ApiResponse.success(
                Map.of("status", "cleared"),
                "Logs cleared successfully"
        ));
    }

    @PostMapping("/devices")
    public ResponseEntity<ApiResponse<NfcDevice>> addDevice(@RequestBody NfcDevice device) {
        return ResponseEntity.ok(ApiResponse.success(
                adminService.addNfcDevice(device),
                "NFC device added successfully"
        ));
    }

    @PostMapping("/backup")
    public ResponseEntity<ApiResponse<Map<String, String>>> triggerBackup() {
        String status = adminService.triggerBackup("Admin");
        return ResponseEntity.ok(ApiResponse.success(
                Map.of("status", status),
                "Backup triggered successfully"
        ));
    }
}
