package com.hrms.api.dto;

public record FraudReportRequest(
        String note
) {
    /** Returns the note or a default if blank. */
    public String noteOrDefault() {
        return (note != null && !note.isBlank()) ? note : "Suspicious activity reported by manager";
    }
}
