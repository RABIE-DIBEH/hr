package com.hrms.api.dto;

/**
 * DTO for the response after marking an advance as delivered.
 */
public record AdvanceDeliveryResponseDto(
        String status,
        String paidAt
) {
}
