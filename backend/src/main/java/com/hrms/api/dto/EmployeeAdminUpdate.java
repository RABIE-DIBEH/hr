package com.hrms.api.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

import java.math.BigDecimal;

/**
 * DTO for admin/HR to update another employee's profile.
 * Extends basic profile update with role, department/team, and salary fields.
 */
public record EmployeeAdminUpdate(
        @NotBlank(message = "الاسم الكامل مطلوب")
        String fullName,

        @NotBlank(message = "البريد الإلكتروني مطلوب")
        @Email(message = "صيغة البريد الإلكتروني غير صحيحة")
        String email,

        @Pattern(regexp = "^05\\d{8}$", message = "رقم الجوال يجب أن يبدأ بـ 05 ويتكون من 10 أرقام")
        String mobileNumber,

        String address,

        @Pattern(regexp = "^\\d{10}$", message = "رقم الهوية يجب أن يكون 10 أرقام")
        String nationalId,

        String avatarUrl,

        Long teamId,
        Long roleId,
        Long managerId,
        BigDecimal baseSalary,
        String employmentStatus
) {
    public EmployeeAdminUpdate {
        // Normalize blank strings to null so validation @Pattern is ignored for empty optional fields
        if (mobileNumber != null && mobileNumber.trim().isEmpty()) mobileNumber = null;
        if (address != null && address.trim().isEmpty()) address = null;
        if (nationalId != null && nationalId.trim().isEmpty()) nationalId = null;
    }
}
