package com.hrms.api;

import com.hrms.core.models.Employee;
import com.hrms.core.models.LeaveRequest;
import com.hrms.services.LeaveService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/leaves")
public class LeaveController {

    private final LeaveService leaveService;

    public LeaveController(LeaveService leaveService) {
        this.leaveService = leaveService;
    }

    @PostMapping("/request")
    public ResponseEntity<LeaveRequest> requestLeave(@RequestBody LeaveRequest request) {
        Employee mockEmployee = Employee.builder().employeeId(1L).build(); 
        return ResponseEntity.ok(leaveService.submitRequest(mockEmployee, request));
    }

    @GetMapping("/my-requests")
    public ResponseEntity<List<LeaveRequest>> getMyRequests(@RequestParam Long employeeId) {
        return ResponseEntity.ok(leaveService.getEmployeeRequests(employeeId));
    }

    @GetMapping("/manager/pending")
    public ResponseEntity<List<LeaveRequest>> getPendingForManager(@RequestParam Long managerId) {
        return ResponseEntity.ok(leaveService.getPendingRequestsForManager(managerId));
    }

    @PutMapping("/process/{requestId}")
    public ResponseEntity<LeaveRequest> processRequest(
            @PathVariable Long requestId, 
            @RequestBody Map<String, String> decision) {
        
        String status = decision.get("status");
        String note = decision.get("note");
        
        return leaveService.processRequest(requestId, status, note)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
