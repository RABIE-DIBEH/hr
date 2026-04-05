package com.hrms.api.dto;

import com.hrms.core.models.NFCCard;

public record NfcCardResponseDto(
        Long cardId,
        String uid,
        Long employeeId,
        String employeeName,
        String status,
        String issuedDate
) {
    public static NfcCardResponseDto from(NFCCard card) {
        return new NfcCardResponseDto(
                card.getCardId(),
                card.getUid(),
                card.getEmployee().getEmployeeId(),
                card.getEmployee().getFullName(),
                card.getStatus(),
                card.getIssuedDate() != null ? card.getIssuedDate().toString() : null
        );
    }
}
