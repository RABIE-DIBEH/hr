package com.hrms.api.exception;

import org.springframework.http.HttpStatus;

/**
 * Stable machine-readable codes returned in {@link com.hrms.api.dto.ErrorResponse#errorCode}.
 */
public enum ErrorCode {
    EMPLOYEE_NOT_FOUND(HttpStatus.NOT_FOUND),
    EMPLOYEE_ALREADY_ARCHIVED(HttpStatus.BAD_REQUEST),
    EMAIL_CONFLICT(HttpStatus.CONFLICT),
    FORBIDDEN_OPERATION(HttpStatus.FORBIDDEN),
    INVALID_NFC_CARD(HttpStatus.BAD_REQUEST),
    ATTENDANCE_VALIDATION_ERROR(HttpStatus.BAD_REQUEST),
    DEPARTMENT_NOT_FOUND(HttpStatus.NOT_FOUND),
    VALIDATION_ERROR(HttpStatus.BAD_REQUEST),
    INSUFFICIENT_LEAVE_BALANCE(HttpStatus.BAD_REQUEST),

    // Advance Requests
    ADVANCE_NOT_FOUND(HttpStatus.NOT_FOUND),
    ADVANCE_INVALID_STATE(HttpStatus.BAD_REQUEST),

    // Recruitment Requests
    RECRUITMENT_NOT_FOUND(HttpStatus.NOT_FOUND),
    RECRUITMENT_INVALID_STATE(HttpStatus.BAD_REQUEST),

    // Inbox
    INBOX_NOT_FOUND(HttpStatus.NOT_FOUND),
    INBOX_FORBIDDEN(HttpStatus.FORBIDDEN),

    // NFC Cards
    NFC_CARD_NOT_FOUND(HttpStatus.NOT_FOUND),

    // Payroll Engine
    PAYROLL_LOCKED(HttpStatus.LOCKED);

    private final HttpStatus httpStatus;

    ErrorCode(HttpStatus httpStatus) {
        this.httpStatus = httpStatus;
    }

    public HttpStatus getHttpStatus() {
        return httpStatus;
    }
}
