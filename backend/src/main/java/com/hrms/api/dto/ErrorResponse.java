package com.hrms.api.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.LocalDateTime;
import java.util.Map;

/**
 * Standard error response returned by all endpoints.
 * Gives the client a consistent JSON shape for every error.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ErrorResponse(
        int status,
        String message,
        Map<String, String> errors,
        LocalDateTime timestamp,
        /** Machine-readable code (e.g. EMPLOYEE_NOT_FOUND) when applicable */
        String error
) {
    /** Convenience factory for single-message errors. */
    public static ErrorResponse of(int status, String message) {
        return new ErrorResponse(status, message, null, LocalDateTime.now(), null);
    }

    public static ErrorResponse of(int status, String message, String errorCode) {
        return new ErrorResponse(status, message, null, LocalDateTime.now(), errorCode);
    }

    /** Convenience factory for validation errors (field → message map). */
    public static ErrorResponse ofValidation(int status, String message, Map<String, String> errors) {
        return new ErrorResponse(status, message, errors, LocalDateTime.now(), null);
    }
}
