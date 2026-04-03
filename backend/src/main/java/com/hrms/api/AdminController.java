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
}
