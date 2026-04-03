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
    private String action;

    @Column(nullable = false)
    private String originUser;

    @Column(nullable = false)
    private LocalDateTime timestamp;

    @Column(nullable = false)
    private String status;

    public SystemLog() {
    }

    public SystemLog(String action, String originUser, LocalDateTime timestamp, String status) {
        this.action = action;
        this.originUser = originUser;
        this.timestamp = timestamp;
        this.status = status;
    }

    public Long getLogId() {
        return logId;
    }

    public void setLogId(Long logId) {
        this.logId = logId;
    }

    public String getAction() {
        return action;
    }

    public void setAction(String action) {
        this.action = action;
    }

    public String getOriginUser() {
        return originUser;
    }

    public void setOriginUser(String originUser) {
        this.originUser = originUser;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private String action;
        private String originUser;
        private LocalDateTime timestamp;
        private String status;

        public Builder action(String action) {
            this.action = action;
            return this;
        }

        public Builder originUser(String originUser) {
            this.originUser = originUser;
            return this;
        }

        public Builder timestamp(LocalDateTime timestamp) {
            this.timestamp = timestamp;
            return this;
        }

        public Builder status(String status) {
            this.status = status;
            return this;
        }

        public SystemLog build() {
            return new SystemLog(action, originUser, timestamp, status);
        }
    }
}
