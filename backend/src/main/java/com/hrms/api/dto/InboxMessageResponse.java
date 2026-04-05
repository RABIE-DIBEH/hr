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
        Long senderEmployeeId,
        String priority,
        Boolean isRead,
        LocalDateTime createdAt,
        LocalDateTime readAt,
        Long replyTo,
        Integer replyCount
) {
    public static InboxMessageResponse from(com.hrms.core.models.InboxMessage msg) {
        return new InboxMessageResponse(
                msg.getMessageId(),
                msg.getTitle(),
                msg.getMessage(),
                msg.getSenderName(),
                msg.getSenderEmployeeId(),
                msg.getPriority(),
                msg.getReadAt() != null,
                msg.getCreatedAt(),
                msg.getReadAt(),
                msg.getReplyTo(),
                0 // replyCount is populated separately when loading threads
        );
    }

    public static InboxMessageResponse from(com.hrms.core.models.InboxMessage msg, int replyCount) {
        return new InboxMessageResponse(
                msg.getMessageId(),
                msg.getTitle(),
                msg.getMessage(),
                msg.getSenderName(),
                msg.getSenderEmployeeId(),
                msg.getPriority(),
                msg.getReadAt() != null,
                msg.getCreatedAt(),
                msg.getReadAt(),
                msg.getReplyTo(),
                replyCount
        );
    }
}
