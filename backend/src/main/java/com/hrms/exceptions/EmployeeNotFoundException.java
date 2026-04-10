package com.hrms.exceptions;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.NOT_FOUND)
public class EmployeeNotFoundException extends RuntimeException {
    public EmployeeNotFoundException(Long employeeId) {
        super("Employee not found with ID: " + employeeId);
    }

    public EmployeeNotFoundException(String email) {
        super("Employee not found with email: " + email);
    }

    public EmployeeNotFoundException(String message, Throwable cause) {
        super(message, cause);
    }
}