package com.hrms.api;

import com.hrms.api.dto.ApiResponse;
import com.hrms.api.dto.CreateNfcDeviceRequest;
import com.hrms.api.dto.NfcDeviceResponseDto;
import com.hrms.api.dto.StatusResponseDto;
import com.hrms.api.dto.SystemMetricsDto;
import com.hrms.core.models.SystemLog;
import com.hrms.services.AdminService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @GetMapping("/metrics")
    public ResponseEntity<ApiResponse<SystemMetricsDto>> getMetrics() {
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
    public ResponseEntity<ApiResponse<List<NfcDeviceResponseDto>>> getDevices() {
        return ResponseEntity.ok(ApiResponse.success(
                adminService.getAllDevices().stream()
                        .map(NfcDeviceResponseDto::from)
                        .toList(),
                "NFC devices retrieved successfully"
        ));
    }

    @DeleteMapping("/logs")
    public ResponseEntity<ApiResponse<StatusResponseDto>> clearLogs() {
        adminService.clearAllLogs("Admin");
        return ResponseEntity.ok(ApiResponse.success(
                new StatusResponseDto("cleared"),
                "Logs cleared successfully"
        ));
    }

    @PostMapping("/devices")
    public ResponseEntity<ApiResponse<NfcDeviceResponseDto>> addDevice(@Valid @RequestBody CreateNfcDeviceRequest device) {
        return ResponseEntity.ok(ApiResponse.success(
                NfcDeviceResponseDto.from(adminService.addNfcDevice(device)),
                "NFC device added successfully"
        ));
    }

    @PostMapping("/backup")
    public ResponseEntity<ApiResponse<StatusResponseDto>> triggerBackup() {
        String status = adminService.triggerBackup("Admin");
        return ResponseEntity.ok(ApiResponse.success(
                new StatusResponseDto(status),
                "Backup triggered successfully"
        ));
    }
}
