package com.hrms.api.dto;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * Standard error response returned by all endpoints.
 * Gives the client a consistent JSON shape for every error.
 */
public record ErrorResponse(
        int status,
        String message,
        Map<String, String> errors,
        LocalDateTime timestamp
) {
    /** Convenience factory for single-message errors. */
    public static ErrorResponse of(int status, String message) {
        return new ErrorResponse(status, message, null, LocalDateTime.now());
    }

    /** Convenience factory for validation errors (field → message map). */
    public static ErrorResponse ofValidation(int status, String message, Map<String, String> errors) {
        return new ErrorResponse(status, message, errors, LocalDateTime.now());
    }
}
