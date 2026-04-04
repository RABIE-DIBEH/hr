package com.hrms.api.dto;

import java.time.LocalDateTime;

/**
 * Standard response wrapper for all API endpoints.
 * All responses should be wrapped in this format for consistency.
 *
 * Usage example:
 *   return ResponseEntity.ok(new ApiResponse<>(
 *       200,
 *       "Success",
 *       data,
 *       LocalDateTime.now()
 *   ));
 *
 * Error example:
 *   throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Resource not found");
 *   // GlobalExceptionHandler will catch and wrap in ApiResponse
 */
public record ApiResponse<T>(
        int status,
        String message,
        T data,
        LocalDateTime timestamp
) {
    /**
     * Create a success response
     */
    public static <T> ApiResponse<T> success(T data, String message) {
        return new ApiResponse<>(200, message, data, LocalDateTime.now());
    }

    /**
     * Create a success response with default message
     */
    public static <T> ApiResponse<T> success(T data) {
        return success(data, "Success");
    }

    /**
     * Create an error response
     */
    public static <T> ApiResponse<T> error(int status, String message) {
        return new ApiResponse<>(status, message, null, LocalDateTime.now());
    }
}
