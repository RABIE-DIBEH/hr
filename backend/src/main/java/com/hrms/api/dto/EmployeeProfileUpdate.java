package com.hrms.api.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record EmployeeProfileUpdate(
        @NotBlank(message = "الاسم الكامل مطلوب")
        String fullName,

        @NotBlank(message = "البريد الإلكتروني مطلوب")
        @Email(message = "صيغة البريد الإلكتروني غير صحيحة")
        String email,

        @Pattern(regexp = "^05\\d{8}$", message = "رقم الجوال يجب أن يبدأ بـ 05 ويتكون من 10 أرقام")
        String mobileNumber,

        String address,

        @Pattern(regexp = "^\\d{10}$", message = "رقم الهوية يجب أن يكون 10 أرقام")
        String nationalId
) {}
