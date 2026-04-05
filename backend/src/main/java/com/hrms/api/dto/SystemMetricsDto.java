package com.hrms.api.dto;

/**
 * Typed DTO for admin system health metrics.
 */
public record SystemMetricsDto(
        String cpu,
        String storage,
        String uptime,
        String uptimeStr,
        String status
) {
}
