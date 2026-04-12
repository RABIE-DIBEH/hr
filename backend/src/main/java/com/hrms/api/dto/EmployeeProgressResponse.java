package com.hrms.api.dto;

import java.math.BigDecimal;

public record EmployeeProgressResponse(
        int month,
        int year,
        java.math.BigDecimal workedHours,
        java.math.BigDecimal targetHours,
        java.math.BigDecimal lastMonthWorkedHours,
        java.math.BigDecimal yearlyWorkedHours,
        java.math.BigDecimal yearlyTargetHours,
        Integer monthlyRank,
        Integer yearlyRank,
        Integer totalEmployees
) {}
