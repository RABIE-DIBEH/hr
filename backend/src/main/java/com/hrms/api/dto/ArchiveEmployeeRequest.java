package com.hrms.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Request body for archiving (soft-deleting) an employee.
 */
public record ArchiveEmployeeRequest(
        @NotBlank(message = "Reason is required")
        @Size(min = 3, max = 2000, message = "Reason must be between 3 and 2000 characters")
        String reason
) {}
