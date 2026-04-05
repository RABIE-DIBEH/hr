package com.hrms.core.models;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Represents a message in the system inbox.
 * Messages can target specific roles or all users.
 * Each role (EMPLOYEE, MANAGER, HR, ADMIN, SUPER_ADMIN) can see relevant messages.
 */
@Entity
@Table(name = "inbox_messages", indexes = {
    @Index(name = "idx_target_role", columnList = "targetRole"),
    @Index(name = "idx_target_employee", columnList = "targetEmployeeId"),
    @Index(name = "idx_created_at", columnList = "createdAt")
})
public class InboxMessage {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long messageId;
    
    @Column(nullable = false)
    private String title;
    
    @Column(nullable = false, columnDefinition = "TEXT")
    private String message;
    
    /**
     * Target role: EMPLOYEE, MANAGER, HR, ADMIN, SUPER_ADMIN, ALL, NONE
     * NONE means only visible if targetEmployeeId is set
     */
    @Column(nullable = false)
    private String targetRole;
    
    /**
     * Target specific employee: null if message is role-based
     */
    @Column(name = "target_employee_id")
    private Long targetEmployeeId;
    
    @Column(nullable = false)
    private String senderName; // "System", "HR Department", etc.

    /**
     * The employee ID of the sender (for user-to-user messaging).
     * Null for system-generated messages.
     */
    @Column(name = "sender_employee_id")
    private Long senderEmployeeId;

    @Column(nullable = false)
    private String priority; // LOW, MEDIUM, HIGH

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime readAt; // null if unread

    @Column(nullable = false)
    private Boolean archived = false;

    /**
     * Parent message ID for reply/threading support.
     * Null for top-level messages.
     */
    @Column(name = "reply_to")
    private Long replyTo;

    // Constructors
    public InboxMessage() {}

    public InboxMessage(String title, String message, String targetRole, String senderName, String priority) {
        this.title = title;
        this.message = message;
        this.targetRole = targetRole;
        this.senderName = senderName;
        this.priority = priority;
        this.createdAt = LocalDateTime.now();
    }

    public InboxMessage(String title, String message, String targetRole, Long targetEmployeeId, String senderName, String priority) {
        this.title = title;
        this.message = message;
        this.targetRole = targetRole;
        this.targetEmployeeId = targetEmployeeId;
        this.senderName = senderName;
        this.priority = priority;
        this.createdAt = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getMessageId() { return messageId; }
    public void setMessageId(Long messageId) { this.messageId = messageId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public String getTargetRole() { return targetRole; }
    public void setTargetRole(String targetRole) { this.targetRole = targetRole; }

    public Long getTargetEmployeeId() { return targetEmployeeId; }
    public void setTargetEmployeeId(Long targetEmployeeId) { this.targetEmployeeId = targetEmployeeId; }

    public String getSenderName() { return senderName; }
    public void setSenderName(String senderName) { this.senderName = senderName; }

    public Long getSenderEmployeeId() { return senderEmployeeId; }
    public void setSenderEmployeeId(Long senderEmployeeId) { this.senderEmployeeId = senderEmployeeId; }

    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getReadAt() { return readAt; }
    public void setReadAt(LocalDateTime readAt) { this.readAt = readAt; }

    public Boolean getArchived() { return archived; }
    public void setArchived(Boolean archived) { this.archived = archived; }

    public Long getReplyTo() { return replyTo; }
    public void setReplyTo(Long replyTo) { this.replyTo = replyTo; }

    // Builder pattern
    public static class InboxMessageBuilder {
        private String title;
        private String message;
        private String targetRole = "NONE";
        private Long targetEmployeeId;
        private String senderName;
        private Long senderEmployeeId;
        private String priority = "MEDIUM";
        private Long replyTo;

        public InboxMessageBuilder title(String title) {
            this.title = title;
            return this;
        }

        public InboxMessageBuilder message(String message) {
            this.message = message;
            return this;
        }

        public InboxMessageBuilder targetRole(String targetRole) {
            this.targetRole = targetRole;
            return this;
        }

        public InboxMessageBuilder targetEmployeeId(Long targetEmployeeId) {
            this.targetEmployeeId = targetEmployeeId;
            return this;
        }

        public InboxMessageBuilder senderName(String senderName) {
            this.senderName = senderName;
            return this;
        }

        public InboxMessageBuilder senderEmployeeId(Long senderEmployeeId) {
            this.senderEmployeeId = senderEmployeeId;
            return this;
        }

        public InboxMessageBuilder priority(String priority) {
            this.priority = priority;
            return this;
        }

        public InboxMessageBuilder replyTo(Long replyTo) {
            this.replyTo = replyTo;
            return this;
        }

        public InboxMessage build() {
            InboxMessage msg = new InboxMessage();
            msg.title = this.title;
            msg.message = this.message;
            msg.targetRole = this.targetRole;
            msg.targetEmployeeId = this.targetEmployeeId;
            msg.senderName = this.senderName;
            msg.senderEmployeeId = this.senderEmployeeId;
            msg.priority = this.priority;
            msg.replyTo = this.replyTo;
            msg.createdAt = LocalDateTime.now();
            return msg;
        }
    }
}
