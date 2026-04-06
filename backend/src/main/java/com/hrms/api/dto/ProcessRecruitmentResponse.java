package com.hrms.api.dto;

/**
 * Response DTO for processing (approve/reject) a recruitment request.
 * When a request reaches final approval, generated credentials are included.
 */
public record ProcessRecruitmentResponse(
        RecruitmentRequestResponse request,
        String username,
        String password,
        String employeeId
) {
    /**
     * Create a response for a rejection or intermediate approval (no credentials yet).
     */
    public static ProcessRecruitmentResponse withoutCredentials(RecruitmentRequestResponse request) {
        return new ProcessRecruitmentResponse(request, null, null, null);
    }

    /**
     * Create a response with generated employee credentials (final approval).
     */
    public static ProcessRecruitmentResponse withCredentials(
            RecruitmentRequestResponse request, String username, String password, String employeeId) {
        return new ProcessRecruitmentResponse(request, username, password, employeeId);
    }
}
