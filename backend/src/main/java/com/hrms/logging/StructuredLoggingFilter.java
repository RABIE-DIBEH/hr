package com.hrms.logging;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.util.ContentCachingRequestWrapper;
import org.springframework.web.util.ContentCachingResponseWrapper;

import java.io.IOException;
import java.io.UnsupportedEncodingException;
import java.time.Duration;
import java.time.Instant;
import java.util.*;

/**
 * Structured logging filter that logs HTTP requests and responses in JSON format.
 * Includes request/response details, timing, and correlation IDs.
 */
@Component
public class StructuredLoggingFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(StructuredLoggingFilter.class);
    private static final ObjectMapper objectMapper = new ObjectMapper();
    
    // Paths to exclude from logging (health checks, static resources, etc.)
    private static final List<String> EXCLUDED_PATHS = Arrays.asList(
        "/api/health",
        "/actuator/health",
        "/actuator/prometheus",
        "/swagger-ui",
        "/v3/api-docs",
        "/favicon.ico"
    );
    
    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        
        String requestPath = request.getRequestURI();
        
        // Skip logging for excluded paths
        if (EXCLUDED_PATHS.stream().anyMatch(requestPath::startsWith)) {
            filterChain.doFilter(request, response);
            return;
        }
        
        // Generate correlation ID
        String correlationId = generateCorrelationId();
        MDC.put("correlationId", correlationId);
        
        // Wrap request/response to capture content
        ContentCachingRequestWrapper wrappedRequest = new ContentCachingRequestWrapper(request);
        ContentCachingResponseWrapper wrappedResponse = new ContentCachingResponseWrapper(response);
        
        Instant startTime = Instant.now();
        
        try {
            // Log request
            logRequest(wrappedRequest, correlationId);
            
            // Process request
            filterChain.doFilter(wrappedRequest, wrappedResponse);
            
        } finally {
            // Log response
            Duration duration = Duration.between(startTime, Instant.now());
            logResponse(wrappedRequest, wrappedResponse, correlationId, duration);
            
            // Copy response content to original response
            wrappedResponse.copyBodyToResponse();
            
            // Clear MDC
            MDC.clear();
        }
    }
    
    private void logRequest(ContentCachingRequestWrapper request, String correlationId) {
        try {
            ObjectNode logEntry = objectMapper.createObjectNode();
            
            // Basic request info
            logEntry.put("type", "request");
            logEntry.put("correlationId", correlationId);
            logEntry.put("timestamp", Instant.now().toString());
            logEntry.put("method", request.getMethod());
            logEntry.put("uri", request.getRequestURI());
            logEntry.put("query", request.getQueryString() != null ? request.getQueryString() : "");
            
            // Headers (sanitized)
            ObjectNode headers = objectMapper.createObjectNode();
            Enumeration<String> headerNames = request.getHeaderNames();
            while (headerNames.hasMoreElements()) {
                String headerName = headerNames.nextElement();
                String headerValue = request.getHeader(headerName);
                
                // Sanitize sensitive headers
                if (headerName.toLowerCase().contains("authorization")) {
                    headers.put(headerName, "***");
                } else if (headerName.toLowerCase().contains("cookie")) {
                    headers.put(headerName, "***");
                } else {
                    headers.put(headerName, headerValue);
                }
            }
            logEntry.set("headers", headers);
            
            // Request body (if present and not too large)
            byte[] content = request.getContentAsByteArray();
            if (content.length > 0 && content.length < 10000) { // Limit to 10KB
                String body = getContentAsString(content, request.getCharacterEncoding());
                if (isJsonContent(request)) {
                    try {
                        // Try to parse as JSON for structured logging
                        logEntry.set("body", objectMapper.readTree(body));
                    } catch (JsonProcessingException e) {
                        // If not valid JSON, log as string
                        logEntry.put("body", sanitizeBody(body));
                    }
                } else {
                    logEntry.put("body", sanitizeBody(body));
                }
            }
            
            // Log as JSON
            log.info("HTTP Request: {}", logEntry.toString());
            
        } catch (Exception e) {
            log.warn("Failed to log request: {}", e.getMessage());
        }
    }
    
    private void logResponse(ContentCachingRequestWrapper request, ContentCachingResponseWrapper response, 
                            String correlationId, Duration duration) {
        try {
            ObjectNode logEntry = objectMapper.createObjectNode();
            
            // Basic response info
            logEntry.put("type", "response");
            logEntry.put("correlationId", correlationId);
            logEntry.put("timestamp", Instant.now().toString());
            logEntry.put("method", request.getMethod());
            logEntry.put("uri", request.getRequestURI());
            logEntry.put("status", response.getStatus());
            logEntry.put("durationMs", duration.toMillis());
            
            // Headers
            ObjectNode headers = objectMapper.createObjectNode();
            Collection<String> headerNames = response.getHeaderNames();
            for (String headerName : headerNames) {
                String headerValue = response.getHeader(headerName);
                headers.put(headerName, headerValue);
            }
            logEntry.set("headers", headers);
            
            // Response body (if present and not too large)
            byte[] content = response.getContentAsByteArray();
            if (content.length > 0 && content.length < 10000) { // Limit to 10KB
                String body = getContentAsString(content, response.getCharacterEncoding());
                if (isJsonContent(response)) {
                    try {
                        // Try to parse as JSON for structured logging
                        logEntry.set("body", objectMapper.readTree(body));
                    } catch (JsonProcessingException e) {
                        // If not valid JSON, log as string
                        logEntry.put("body", sanitizeBody(body));
                    }
                } else {
                    logEntry.put("body", sanitizeBody(body));
                }
            }
            
            // Log as JSON
            if (response.getStatus() >= 400) {
                log.error("HTTP Response Error: {}", logEntry.toString());
            } else {
                log.info("HTTP Response: {}", logEntry.toString());
            }
            
        } catch (Exception e) {
            log.warn("Failed to log response: {}", e.getMessage());
        }
    }
    
    private String generateCorrelationId() {
        return UUID.randomUUID().toString();
    }
    
    private String getContentAsString(byte[] content, String charsetName) {
        try {
            return new String(content, charsetName != null ? charsetName : "UTF-8");
        } catch (UnsupportedEncodingException e) {
            return new String(content);
        }
    }
    
    private boolean isJsonContent(HttpServletRequest request) {
        String contentType = request.getContentType();
        return contentType != null && contentType.contains("application/json");
    }
    
    private boolean isJsonContent(HttpServletResponse response) {
        String contentType = response.getContentType();
        return contentType != null && contentType.contains("application/json");
    }
    
    private String sanitizeBody(String body) {
        // Sanitize sensitive data in request/response bodies
        if (body == null || body.isEmpty()) {
            return body;
        }
        
        // Remove passwords, tokens, etc. from JSON bodies
        String sanitized = body;
        
        // Pattern for password fields in JSON
        sanitized = sanitized.replaceAll("\"password\"\\s*:\\s*\"[^\"]*\"", "\"password\":\"***\"");
        sanitized = sanitized.replaceAll("\"token\"\\s*:\\s*\"[^\"]*\"", "\"token\":\"***\"");
        sanitized = sanitized.replaceAll("\"jwt\"\\s*:\\s*\"[^\"]*\"", "\"jwt\":\"***\"");
        sanitized = sanitized.replaceAll("\"secret\"\\s*:\\s*\"[^\"]*\"", "\"secret\":\"***\"");
        sanitized = sanitized.replaceAll("\"authorization\"\\s*:\\s*\"[^\"]*\"", "\"authorization\":\"***\"");
        
        return sanitized;
    }
    
    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return EXCLUDED_PATHS.stream().anyMatch(path::startsWith);
    }
}