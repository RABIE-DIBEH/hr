package com.hrms.api.dto;

import com.hrms.core.models.RecruitmentRequest;

/**
 * Internal result of processing a recruitment request.
 * Contains the updated entity and optional generated credentials.
 */
public record ProcessRecruitmentResult(
        RecruitmentRequest request,
        String username,
        String password,
        String employeeId
) {
    public static ProcessRecruitmentResult withoutCredentials(RecruitmentRequest request) {
        return new ProcessRecruitmentResult(request, null, null, null);
    }

    public static ProcessRecruitmentResult withCredentials(
            RecruitmentRequest request, String username, String password, String employeeId) {
        return new ProcessRecruitmentResult(request, username, password, employeeId);
    }
}
