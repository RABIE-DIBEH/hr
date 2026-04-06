package com.hrms.core;

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

/**
 * Validates all required environment variables on startup.
 * Fails fast with clear, actionable error messages before any beans initialize.
 */
@Component
public class EnvironmentValidator {

    private static final Logger log = LoggerFactory.getLogger(EnvironmentValidator.class);

    @Value("${spring.datasource.username:}")
    private String dbUsername;

    @Value("${spring.datasource.password:}")
    private String dbPassword;

    @Value("${jwt.secret:}")
    private String jwtSecret;

    @PostConstruct
    void validate() {
        List<String> errors = new ArrayList<>();

        if (dbUsername.isBlank()) {
            errors.add("DB_USERNAME is not set. Provide it via .env file or environment variable.");
        }
        if (dbPassword.isBlank()) {
            errors.add("DB_PASSWORD is not set. Provide it via .env file or environment variable.");
        }
        if (jwtSecret.isBlank()) {
            errors.add("JWT_SECRET is not set. Must be >= 32 characters. Generate with: openssl rand -base64 32");
        } else if (jwtSecret.getBytes().length < 32) {
            errors.add("JWT_SECRET is too short (minimum 32 bytes). Current length: " + jwtSecret.getBytes().length);
        }

        if (!errors.isEmpty()) {
            log.error("=== HRMS Startup Validation Failed ===");
            errors.forEach(e -> log.error("  ❌ {}", e));
            log.error("=== Fix the above and restart ===");
            throw new IllegalStateException(
                    "Environment validation failed:\n  - " + String.join("\n  - ", errors));
        }

        log.info("✅ Environment validation passed — all required variables are set.");
    }
}
