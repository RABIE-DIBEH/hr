package com.hrms.core.models;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "system_logs")
public class SystemLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long logId;

    @Column(nullable = false)
    private LocalDateTime timestamp;

    @Column(name = "actor_id")
    private Long actorId;

    @Column(name = "target_id")
    private Long targetId;

    @Column(name = "action", nullable = false)
    private String actionType;

    @Column(name = "old_value", length = 2000)
    private String oldValue;

    @Column(name = "new_value", length = 2000)
    private String newValue;

    public SystemLog() {
        this.timestamp = LocalDateTime.now();
    }

    public SystemLog(Long actorId, Long targetId, String actionType, String oldValue, String newValue) {
        this.timestamp = LocalDateTime.now();
        this.actorId = actorId;
        this.targetId = targetId;
        this.actionType = actionType;
        this.oldValue = oldValue;
        this.newValue = newValue;
    }

    public Long getLogId() {
        return logId;
    }

    public void setLogId(Long logId) {
        this.logId = logId;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }

    public Long getActorId() {
        return actorId;
    }

    public void setActorId(Long actorId) {
        this.actorId = actorId;
    }

    public Long getTargetId() {
        return targetId;
    }

    public void setTargetId(Long targetId) {
        this.targetId = targetId;
    }

    public String getActionType() {
        return actionType;
    }

    public void setActionType(String actionType) {
        this.actionType = actionType;
    }

    public String getOldValue() {
        return oldValue;
    }

    public void setOldValue(String oldValue) {
        this.oldValue = oldValue;
    }

    public String getNewValue() {
        return newValue;
    }

    public void setNewValue(String newValue) {
        this.newValue = newValue;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private Long actorId;
        private Long targetId;
        private String actionType;
        private String oldValue;
        private String newValue;
        private LocalDateTime timestamp = LocalDateTime.now();

        public Builder actorId(Long actorId) {
            this.actorId = actorId;
            return this;
        }

        public Builder targetId(Long targetId) {
            this.targetId = targetId;
            return this;
        }

        public Builder actionType(String actionType) {
            this.actionType = actionType;
            return this;
        }

        public Builder oldValue(String oldValue) {
            this.oldValue = oldValue;
            return this;
        }

        public Builder newValue(String newValue) {
            this.newValue = newValue;
            return this;
        }

        public Builder timestamp(LocalDateTime timestamp) {
            this.timestamp = timestamp;
            return this;
        }

        public SystemLog build() {
            SystemLog log = new SystemLog(actorId, targetId, actionType, oldValue, newValue);
            if (timestamp != null) {
                log.setTimestamp(timestamp);
            }
            return log;
        }
    }
}
