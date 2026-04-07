package com.hrms.api;

import com.hrms.api.dto.LoginRequest;
import com.hrms.api.dto.LoginResponse;
import com.hrms.api.dto.ChangePasswordRequest;
import com.hrms.api.dto.ApiResponse;
import com.hrms.api.dto.StatusResponseDto;
import com.hrms.security.EmployeeUserDetails;
import com.hrms.services.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>> login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request.email(), request.password())
                .map(token -> ResponseEntity.ok(
                        ApiResponse.success(LoginResponse.from(token), "Login successful")
                ))
                .orElse(ResponseEntity.status(401).body(
                        ApiResponse.error(401, "Invalid credentials")
                ));
    }

    @PostMapping("/change-password")
    public ResponseEntity<ApiResponse<StatusResponseDto>> changePassword(
            @Valid @RequestBody ChangePasswordRequest request,
            @AuthenticationPrincipal EmployeeUserDetails principal) {
        
        boolean success = authService.changePassword(
                principal.getEmployeeId(), 
                request.currentPassword(), 
                request.newPassword());
        
        if (success) {
            return ResponseEntity.ok(ApiResponse.success(
                    new StatusResponseDto("success"), 
                    "تم تغيير كلمة المرور بنجاح"
            ));
        } else {
            return ResponseEntity.status(400).body(ApiResponse.error(400, "كلمة المرور الحالية غير صحيحة"));
        }
    }
}
