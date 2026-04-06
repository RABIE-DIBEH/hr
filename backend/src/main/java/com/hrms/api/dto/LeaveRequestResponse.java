package com.hrms.api.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * DTO for serializing LeaveRequest responses to the frontend.
 * Avoids lazy-loading issues with the Employee relationship.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record LeaveRequestResponse(
        Long requestId,
        Long employeeId,
        String employeeName,
        String leaveType,
        LocalDate startDate,
        LocalDate endDate,
        Double duration,
        String reason,
        String status,
        String managerNote,
        LocalDateTime requestedAt,
        LocalDateTime processedAt
) {
    public static LeaveRequestResponse from(com.hrms.core.models.LeaveRequest lr) {
        return new LeaveRequestResponse(
                lr.getRequestId(),
                lr.getEmployee() != null ? lr.getEmployee().getEmployeeId() : null,
                lr.getEmployee() != null ? lr.getEmployee().getFullName() : null,
                lr.getLeaveType(),
                lr.getStartDate(),
                lr.getEndDate(),
                lr.getDuration(),
                lr.getReason(),
                lr.getStatus(),
                lr.getManagerNote(),
                lr.getRequestedAt(),
                lr.getProcessedAt()
        );
    }
}
