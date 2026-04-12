package com.hrms.api.dto;

import java.math.BigDecimal;

public record EmployeeProgressResponse(
        int month,
        int year,
        BigDecimal workedHours,
        BigDecimal targetHours,
        BigDecimal lastMonthWorkedHours
) {}
