package com.hrms.api.dto;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;

/**
 * DTO for creating a new recruitment request.
 * All required fields are validated via Bean Validation annotations.
 * Pattern exemplar: LoginRequest.java
 */
public record RecruitmentRequestDto(
        @NotBlank(message = "Full name is required")
        String fullName,

        @NotBlank(message = "National ID is required")
        String nationalId,

        @NotBlank(message = "Address is required")
        String address,

        @NotBlank(message = "Job description is required")
        String jobDescription,

        @NotBlank(message = "Department is required")
        String department,

        @NotBlank(message = "Military service status is required")
        String militaryServiceStatus,

        @NotBlank(message = "Marital status is required")
        String maritalStatus,

        @NotBlank(message = "Mobile number is required")
        @Pattern(regexp = "^[0-9+\\-() ]{10,}$", message = "Mobile number format is invalid")
        String mobileNumber,

        @NotNull(message = "Age is required")
        @Min(value = 18, message = "Age must be at least 18")
        @Max(value = 70, message = "Age must not exceed 70")
        Integer age,

        @NotNull(message = "Expected salary is required")
        @DecimalMin(value = "0.01", message = "Expected salary must be greater than zero")
        BigDecimal expectedSalary,

        // Optional fields
        String insuranceNumber,
        String healthNumber,
        Integer numberOfChildren
) {}
