package com.hrms.api;

import com.hrms.services.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
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
    public ResponseEntity<Map<String, String>> login(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String password = request.get("password");

        if (!StringUtils.hasText(email) || password == null || password.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email and password are required"));
        }

        return authService.login(email, password)
                .map(token -> ResponseEntity.ok(Map.of("token", token)))
                .orElse(ResponseEntity.status(401).body(Map.of("message", "Invalid credentials")));
    }
}
