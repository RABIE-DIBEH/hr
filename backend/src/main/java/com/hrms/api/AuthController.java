package com.hrms.api;

import com.hrms.api.dto.LoginRequest;
import com.hrms.api.dto.ApiResponse;
import com.hrms.services.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request.email(), request.password())
                .map(token -> ResponseEntity.ok(
                        ApiResponse.success(Map.of("token", token), "Login successful")
                ))
                .orElse(ResponseEntity.status(401).body(
                        ApiResponse.error(401, "Invalid credentials")
                ));
    }
}
