package com.hrms.exceptions;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.BAD_REQUEST)
public class InvalidNfcCardException extends RuntimeException {
    public InvalidNfcCardException(String message) {
        super(message);
    }

    public InvalidNfcCardException(String message, Throwable cause) {
        super(message, cause);
    }
}