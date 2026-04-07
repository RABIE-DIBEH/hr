package com.hrms.api.dto;

/**
 * Typed DTO for login response containing JWT token.
 */
public record LoginResponse(
        String token
) {
    public static LoginResponse from(String token) {
        return new LoginResponse(token);
    }
}