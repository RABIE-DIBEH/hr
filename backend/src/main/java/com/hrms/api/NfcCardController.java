package com.hrms.api;

import com.hrms.api.dto.ApiResponse;
import com.hrms.api.dto.AssignNfcCardRequest;
import com.hrms.api.dto.NfcCardResponseDto;
import com.hrms.api.dto.ReplaceNfcCardRequest;
import com.hrms.api.dto.StatusResponseDto;
import com.hrms.api.dto.UpdateNfcCardStatusRequest;
import com.hrms.services.NfcCardManagementService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/nfc-cards")
public class NfcCardController {

    private final NfcCardManagementService nfcCardManagementService;

    public NfcCardController(NfcCardManagementService nfcCardManagementService) {
        this.nfcCardManagementService = nfcCardManagementService;
    }

    @GetMapping("/employees/{employeeId}")
    public ResponseEntity<ApiResponse<NfcCardResponseDto>> getEmployeeCard(@PathVariable Long employeeId) {
        return nfcCardManagementService.getCardForEmployee(employeeId)
                .map(card -> ResponseEntity.ok(ApiResponse.success(
                        NfcCardResponseDto.from(card),
                        "NFC card retrieved successfully"
                )))
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.error(404, "No NFC card found for employee")));
    }

    @PostMapping("/employees/{employeeId}")
    public ResponseEntity<ApiResponse<NfcCardResponseDto>> assignCard(
            @PathVariable Long employeeId,
            @Valid @RequestBody AssignNfcCardRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(
                NfcCardResponseDto.from(nfcCardManagementService.assignCard(employeeId, request.uid())),
                "NFC card assigned successfully"
        ));
    }

    @PutMapping("/employees/{employeeId}/replace")
    public ResponseEntity<ApiResponse<NfcCardResponseDto>> replaceCard(
            @PathVariable Long employeeId,
            @Valid @RequestBody ReplaceNfcCardRequest request) {
        return ResponseEntity.ok(ApiResponse.success(
                NfcCardResponseDto.from(nfcCardManagementService.replaceCard(employeeId, request.newUid())),
                "NFC card replaced successfully"
        ));
    }

    @PutMapping("/employees/{employeeId}/status")
    public ResponseEntity<ApiResponse<NfcCardResponseDto>> updateStatus(
            @PathVariable Long employeeId,
            @Valid @RequestBody UpdateNfcCardStatusRequest request) {
        return ResponseEntity.ok(ApiResponse.success(
                NfcCardResponseDto.from(nfcCardManagementService.updateStatus(employeeId, request.status())),
                "NFC card status updated successfully"
        ));
    }

    @DeleteMapping("/employees/{employeeId}")
    public ResponseEntity<ApiResponse<StatusResponseDto>> unassignCard(@PathVariable Long employeeId) {
        nfcCardManagementService.unassignCard(employeeId);
        return ResponseEntity.ok(ApiResponse.success(
                new StatusResponseDto("unassigned"),
                "NFC card unassigned successfully"
        ));
    }
}
