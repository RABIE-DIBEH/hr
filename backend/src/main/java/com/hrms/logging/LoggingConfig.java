package com.hrms.logging;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.context.annotation.Configuration;

/**
 * Configuration for structured JSON logging.
 * Provides utility methods for creating structured log entries.
 */
@Configuration
public class LoggingConfig {
    
    /**
     * Utility method to create structured log entries programmatically.
     */
    public static ObjectNode createLogEntry(String level, String message) {
        ObjectMapper mapper = new ObjectMapper();
        ObjectNode entry = mapper.createObjectNode();
        
        entry.put("@timestamp", java.time.Instant.now().toString());
        entry.put("level", level);
        entry.put("message", message);
        entry.put("application", "hrms-backend");
        entry.put("environment", System.getProperty("spring.profiles.active", "default"));
        
        // Add thread information
        entry.put("thread", Thread.currentThread().getName());
        
        // Add correlation ID from MDC if present
        String correlationId = org.slf4j.MDC.get("correlationId");
        if (correlationId != null) {
            entry.put("correlationId", correlationId);
        }
        
        return entry;
    }
    
    /**
     * Log a structured business event (e.g., user login, payroll calculation).
     */
    public static void logBusinessEvent(String eventType, ObjectNode eventData) {
        ObjectNode logEntry = createLogEntry("INFO", "Business event: " + eventType);
        logEntry.put("eventType", eventType);
        logEntry.set("eventData", eventData);
        
        org.slf4j.LoggerFactory.getLogger("BUSINESS_EVENTS").info(logEntry.toString());
    }
    
    /**
     * Log a structured audit event (e.g., security events, data changes).
     */
    public static void logAuditEvent(String action, String resource, String userId, ObjectNode details) {
        ObjectNode logEntry = createLogEntry("INFO", "Audit event: " + action);
        logEntry.put("auditAction", action);
        logEntry.put("auditResource", resource);
        logEntry.put("auditUserId", userId);
        logEntry.put("auditTimestamp", java.time.Instant.now().toString());
        logEntry.set("auditDetails", details);
        
        org.slf4j.LoggerFactory.getLogger("AUDIT_EVENTS").info(logEntry.toString());
    }
    
    /**
     * Log a structured performance event.
     */
    public static void logPerformanceEvent(String operation, long durationMs, ObjectNode metrics) {
        ObjectNode logEntry = createLogEntry("INFO", "Performance event: " + operation);
        logEntry.put("performanceOperation", operation);
        logEntry.put("performanceDurationMs", durationMs);
        logEntry.set("performanceMetrics", metrics);
        
        org.slf4j.LoggerFactory.getLogger("PERFORMANCE_EVENTS").info(logEntry.toString());
    }
}