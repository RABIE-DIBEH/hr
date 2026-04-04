package com.hrms.api.dto;

import java.time.LocalDateTime;

/**
 * DTO for displaying inbox messages to users
 */
public record InboxMessageResponse(
        Long messageId,
        String title,
        String message,
        String senderName,
        String priority,
        Boolean isRead,
        LocalDateTime createdAt,
        LocalDateTime readAt
) {
    public static InboxMessageResponse from(com.hrms.core.models.InboxMessage msg) {
        return new InboxMessageResponse(
                msg.getMessageId(),
                msg.getTitle(),
                msg.getMessage(),
                msg.getSenderName(),
                msg.getPriority(),
                msg.getReadAt() != null,
                msg.getCreatedAt(),
                msg.getReadAt()
        );
    }
}
