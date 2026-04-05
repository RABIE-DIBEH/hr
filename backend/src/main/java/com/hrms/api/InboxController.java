package com.hrms.api;

import com.hrms.api.dto.*;
import com.hrms.core.models.InboxMessage;
import com.hrms.security.EmployeeUserDetails;
import com.hrms.services.InboxService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

/**
 * Inbox Controller - Role-based and Personal messaging system
 */
@RestController
@RequestMapping("/api/inbox")
public class InboxController {
    
    private final InboxService inboxService;
    
    public InboxController(InboxService inboxService) {
        this.inboxService = inboxService;
    }
    
    /**
     * GET /api/inbox
     * Get all messages for current user (role-based + personal)
     */
    @GetMapping
    public ResponseEntity<ApiResponse<PaginatedResponse<InboxMessageResponse>>> getInbox(
            @AuthenticationPrincipal EmployeeUserDetails principal,
            @PageableDefault(size = 20) Pageable pageable) {
        
        String role = extractRole(principal);
        Long employeeId = principal.getEmployeeId();
        
        Page<InboxMessage> page = inboxService.getInboxForUser(role, employeeId, pageable);
        List<InboxMessageResponse> responses = page.getContent().stream()
                .map(InboxMessageResponse::from)
                .toList();
        
        return ResponseEntity.ok(ApiResponse.success(
                PaginatedResponse.of(responses, page.getTotalElements(), page.getNumber(), page.getSize()),
                "Inbox retrieved successfully"
        ));
    }
    
    /**
     * GET /api/inbox/unread
     * Get unread messages for current user
     */
    @GetMapping("/unread")
    public ResponseEntity<ApiResponse<PaginatedResponse<InboxMessageResponse>>> getUnreadMessages(
            @AuthenticationPrincipal EmployeeUserDetails principal,
            @PageableDefault(size = 20) Pageable pageable) {
        
        String role = extractRole(principal);
        Long employeeId = principal.getEmployeeId();
        
        Page<InboxMessage> page = inboxService.getUnreadMessagesForUser(role, employeeId, pageable);
        List<InboxMessageResponse> responses = page.getContent().stream()
                .map(InboxMessageResponse::from)
                .toList();
        
        return ResponseEntity.ok(ApiResponse.success(
                PaginatedResponse.of(responses, page.getTotalElements(), page.getNumber(), page.getSize()),
                "Unread messages retrieved successfully"
        ));
    }
    
    /**
     * GET /api/inbox/unread-count
     * Get count of unread messages
     */
    @GetMapping("/unread-count")
    public ResponseEntity<ApiResponse<UnreadCountDto>> getUnreadCount(
            @AuthenticationPrincipal EmployeeUserDetails principal) {
        
        String role = extractRole(principal);
        Long employeeId = principal.getEmployeeId();
        int count = inboxService.getUnreadCount(role, employeeId);
        
        return ResponseEntity.ok(ApiResponse.success(
                new UnreadCountDto(count),
                "Unread count retrieved"
        ));
    }
    
    /**
     * GET /api/inbox/high-priority
     * Get high priority messages for current user
     */
    @GetMapping("/high-priority")
    public ResponseEntity<ApiResponse<PaginatedResponse<InboxMessageResponse>>> getHighPriorityMessages(
            @AuthenticationPrincipal EmployeeUserDetails principal,
            @PageableDefault(size = 20) Pageable pageable) {
        
        String role = extractRole(principal);
        Long employeeId = principal.getEmployeeId();
        
        Page<InboxMessage> page = inboxService.getHighPriorityMessages(role, employeeId, pageable);
        List<InboxMessageResponse> responses = page.getContent().stream()
                .map(InboxMessageResponse::from)
                .toList();
        
        return ResponseEntity.ok(ApiResponse.success(
                PaginatedResponse.of(responses, page.getTotalElements(), page.getNumber(), page.getSize()),
                "High priority messages retrieved successfully"
        ));
    }
    
    /**
     * PUT /api/inbox/{messageId}/read
     * Mark a message as read
     */
    @PutMapping("/{messageId}/read")
    public ResponseEntity<ApiResponse<InboxMessageResponse>> markAsRead(
            @PathVariable Long messageId,
            @AuthenticationPrincipal EmployeeUserDetails principal) {
        String role = extractRole(principal);
        Long employeeId = principal.getEmployeeId();

        InboxMessage message;
        try {
            message = inboxService.markAsRead(messageId, role, employeeId);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage());
        }
        
        return ResponseEntity.ok(ApiResponse.success(
                InboxMessageResponse.from(message),
                "Message marked as read"
        ));
    }
    
    /**
     * PUT /api/inbox/read-all
     * Mark all messages as read for current user
     */
    @PutMapping("/read-all")
    public ResponseEntity<ApiResponse<StatusResponseDto>> markAllAsRead(
            @AuthenticationPrincipal EmployeeUserDetails principal) {
        
        String role = extractRole(principal);
        Long employeeId = principal.getEmployeeId();
        inboxService.markAllAsRead(role, employeeId);
        
        return ResponseEntity.ok(ApiResponse.success(
                new StatusResponseDto("all-marked-as-read"),
                "All messages marked as read"
        ));
    }
    
    /**
     * GET /api/inbox/archived
     * Get archived messages for current user
     */
    @GetMapping("/archived")
    public ResponseEntity<ApiResponse<PaginatedResponse<InboxMessageResponse>>> getArchivedMessages(
            @AuthenticationPrincipal EmployeeUserDetails principal,
            @PageableDefault(size = 20) Pageable pageable) {
 
        String role = extractRole(principal);
        Long employeeId = principal.getEmployeeId();
 
        Page<InboxMessage> page = inboxService.getArchivedMessagesForUser(role, employeeId, pageable);
        List<InboxMessageResponse> responses = page.getContent().stream()
                .map(InboxMessageResponse::from)
                .toList();
 
        return ResponseEntity.ok(ApiResponse.success(
                PaginatedResponse.of(responses, page.getTotalElements(), page.getNumber(), page.getSize()),
                "Archived messages retrieved successfully"
        ));
    }

    /**
     * PUT /api/inbox/{messageId}/archive
     * Archive a message
     */
    @PutMapping("/{messageId}/archive")
    public ResponseEntity<ApiResponse<InboxActionResponseDto>> archiveMessage(
            @PathVariable Long messageId,
            @AuthenticationPrincipal EmployeeUserDetails principal) {
        String role = extractRole(principal);
        Long employeeId = principal.getEmployeeId();

        try {
            inboxService.archiveMessage(messageId, role, employeeId);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage());
        }
        
        return ResponseEntity.ok(ApiResponse.success(
                new InboxActionResponseDto("archived", messageId),
                "Message archived successfully"
        ));
    }
    
    /**
     * POST /api/inbox/send
     * Send a message (ADMIN/SUPER_ADMIN only)
     */
    @PostMapping("/send")
    public ResponseEntity<ApiResponse<InboxMessageResponse>> sendMessage(
            @Valid @RequestBody SendInboxMessageDto dto,
            @AuthenticationPrincipal EmployeeUserDetails principal) {
        
        // Check authorization
        if (!hasAnyRole(principal, "ROLE_ADMIN", "ROLE_SUPER_ADMIN")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, 
                    "Only admins can send messages");
        }
        
        InboxMessage message;
        if (dto.targetEmployeeId() != null) {
            message = inboxService.sendPersonalMessage(
                dto.title(),
                dto.message(),
                dto.targetEmployeeId(),
                dto.senderName(),
                dto.priority()
            );
        } else {
            message = inboxService.sendMessage(
                dto.title(),
                dto.message(),
                dto.targetRole(),
                dto.senderName(),
                dto.priority()
            );
        }
        
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(
                InboxMessageResponse.from(message),
                "Message sent successfully"
        ));
    }
    
    /**
     * DELETE /api/inbox/{messageId}
     * Delete a message permanently (any authenticated user can delete their own messages)
     */
    @DeleteMapping("/{messageId}")
    public ResponseEntity<ApiResponse<InboxActionResponseDto>> deleteMessage(
            @PathVariable Long messageId,
            @AuthenticationPrincipal EmployeeUserDetails principal) {
        String role = extractRole(principal);
        Long employeeId = principal.getEmployeeId();

        try {
            inboxService.deleteMessage(messageId, role, employeeId);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage());
        }

        return ResponseEntity.ok(ApiResponse.success(
                new InboxActionResponseDto("deleted", messageId),
                "Message deleted successfully"
        ));
    }

    /**
     * POST /api/inbox/{messageId}/reply
     * Reply to an existing message (threaded reply)
     */
    @PostMapping("/{messageId}/reply")
    public ResponseEntity<ApiResponse<InboxMessageResponse>> replyToMessage(
            @PathVariable Long messageId,
            @Valid @RequestBody ReplyMessageDto dto,
            @AuthenticationPrincipal EmployeeUserDetails principal) {

        Long employeeId = principal.getEmployeeId();
        String senderName = principal.getEmployee().getFullName();

        InboxMessage reply = inboxService.replyToMessage(
                messageId, dto.message(), employeeId, senderName
        );

        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(
                InboxMessageResponse.from(reply),
                "Reply sent successfully"
        ));
    }

    /**
     * GET /api/inbox/{messageId}/thread
     * Get all replies to a message (thread view)
     */
    @GetMapping("/{messageId}/thread")
    public ResponseEntity<ApiResponse<List<InboxMessageResponse>>> getThread(
            @PathVariable Long messageId,
            @AuthenticationPrincipal EmployeeUserDetails principal) {

        String role = extractRole(principal);
        Long employeeId = principal.getEmployeeId();

        // Verify user has access to the parent message
        try {
            inboxService.markAsRead(messageId, role, employeeId);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage());
        }

        List<InboxMessage> replies = inboxService.getReplies(messageId);
        List<InboxMessageResponse> responses = replies.stream()
                .map(InboxMessageResponse::from)
                .toList();

        return ResponseEntity.ok(ApiResponse.success(responses, "Thread retrieved successfully"));
    }

    /**
     * POST /api/inbox/send-to-employee
     * Send a message from one employee to another
     */
    @PostMapping("/send-to-employee")
    public ResponseEntity<ApiResponse<InboxMessageResponse>> sendToEmployee(
            @Valid @RequestBody SendToEmployeeDto dto,
            @AuthenticationPrincipal EmployeeUserDetails principal) {

        Long employeeId = principal.getEmployeeId();
        String senderName = principal.getEmployee().getFullName();

        InboxMessage message = inboxService.sendToEmployee(
                dto.title(), dto.message(), dto.targetEmployeeId(),
                employeeId, senderName, dto.priority()
        );

        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(
                InboxMessageResponse.from(message),
                "Message sent successfully"
        ));
    }

    /**
     * GET /api/inbox/sent
     * Get sent messages for current user
     */
    @GetMapping("/sent")
    public ResponseEntity<ApiResponse<PaginatedResponse<InboxMessageResponse>>> getSentMessages(
            @AuthenticationPrincipal EmployeeUserDetails principal,
            @PageableDefault(size = 20) Pageable pageable) {

        Long employeeId = principal.getEmployeeId();
        Page<InboxMessage> page = inboxService.getSentMessages(employeeId, pageable);
        List<InboxMessageResponse> responses = page.getContent().stream()
                .map(InboxMessageResponse::from)
                .toList();

        return ResponseEntity.ok(ApiResponse.success(
                PaginatedResponse.of(responses, page.getTotalElements(), page.getNumber(), page.getSize()),
                "Sent messages retrieved successfully"
        ));
    }

    /**
     * GET /api/inbox/conversation/{employeeId}
     * Get conversation with a specific employee
     */
    @GetMapping("/conversation/{employeeId}")
    public ResponseEntity<ApiResponse<PaginatedResponse<InboxMessageResponse>>> getConversation(
            @PathVariable Long employeeId,
            @AuthenticationPrincipal EmployeeUserDetails principal,
            @PageableDefault(size = 20) Pageable pageable) {

        Long currentEmployeeId = principal.getEmployeeId();
        Page<InboxMessage> page = inboxService.getConversation(currentEmployeeId, employeeId, pageable);
        List<InboxMessageResponse> responses = page.getContent().stream()
                .map(InboxMessageResponse::from)
                .toList();

        return ResponseEntity.ok(ApiResponse.success(
                PaginatedResponse.of(responses, page.getTotalElements(), page.getNumber(), page.getSize()),
                "Conversation retrieved successfully"
        ));
    }

    // Helper methods
    
    private String extractRole(EmployeeUserDetails principal) {
        return principal.getAuthorities().stream()
                .map(auth -> auth.getAuthority().replace("ROLE_", ""))
                .findFirst()
                .orElse("EMPLOYEE");
    }
    
    private static boolean hasAnyRole(EmployeeUserDetails principal, String... roles) {
        for (String role : roles) {
            if (principal.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals(role))) {
                return true;
            }
        }
        return false;
    }
}
