package com.hrms.exceptions;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.NOT_FOUND)
public class DepartmentNotFoundException extends RuntimeException {
    public DepartmentNotFoundException(Long departmentId) {
        super("Department not found with ID: " + departmentId);
    }

    public DepartmentNotFoundException(String message, Throwable cause) {
        super(message, cause);
    }
}