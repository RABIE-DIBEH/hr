package com.hrms.services;

import com.hrms.core.models.InboxMessage;
import com.hrms.core.repositories.InboxMessageRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Objects;

/**
 * Service for managing inbox messages across all roles
 */
@Service
public class InboxService {
    
    private final InboxMessageRepository inboxMessageRepository;
    
    public InboxService(InboxMessageRepository inboxMessageRepository) {
        this.inboxMessageRepository = inboxMessageRepository;
    }
    
    /**
     * Get all inbox messages for a specific role and employee
     */
    public Page<InboxMessage> getInboxForUser(String role, Long employeeId, Pageable pageable) {
        return inboxMessageRepository.findByTargetRoleOrEmployee(role, employeeId, pageable);
    }
    
    /**
     * Get unread messages for a specific role and employee
     */
    public Page<InboxMessage> getUnreadMessagesForUser(String role, Long employeeId, Pageable pageable) {
        return inboxMessageRepository.findUnreadByTargetRoleOrEmployee(role, employeeId, pageable);
    }
    
    /**
     * Get count of unread messages for a specific role and employee (useful for UI badges)
     */
    public int getUnreadCount(String role, Long employeeId) {
        return inboxMessageRepository.countUnreadByTargetRoleOrEmployee(role, employeeId);
    }
    
    /**
     * Get high priority messages for a specific role and employee
     */
    public Page<InboxMessage> getHighPriorityMessages(String role, Long employeeId, Pageable pageable) {
        return inboxMessageRepository.findHighPriorityByTargetRoleOrEmployee(role, employeeId, pageable);
    }
    
    /**
     * Send a message to a role
     */
    @Transactional
    public InboxMessage sendMessage(String title, String message, String targetRole, 
                                   String senderName, String priority) {
        String finalPriority = (priority != null && !priority.isBlank()) ? priority : "MEDIUM";
        
        InboxMessage msg = new InboxMessage.InboxMessageBuilder()
                .title(title)
                .message(message)
                .targetRole(targetRole)
                .senderName(senderName)
                .priority(finalPriority)
                .build();
        
        return inboxMessageRepository.save(msg);
    }

    /**
     * Send a message to a specific employee
     */
    @Transactional
    public InboxMessage sendPersonalMessage(String title, String message, Long targetEmployeeId, 
                                           String senderName, String priority) {
        String finalPriority = (priority != null && !priority.isBlank()) ? priority : "MEDIUM";
        
        InboxMessage msg = new InboxMessage.InboxMessageBuilder()
                .title(title)
                .message(message)
                .targetEmployeeId(targetEmployeeId)
                .senderName(senderName)
                .priority(finalPriority)
                .build();
        
        return inboxMessageRepository.save(msg);
    }
    
    /**
     * Mark a message as read
     */
    @Transactional
    public InboxMessage markAsRead(Long messageId, String role, Long employeeId) {
        InboxMessage message = getAccessibleMessage(messageId, role, employeeId);
        message.setReadAt(LocalDateTime.now());
        return inboxMessageRepository.save(message);
    }
    
    /**
     * Mark all messages as read for a specific role and employee
     */
    @Transactional
    public void markAllAsRead(String role, Long employeeId) {
        // We fetch a large number of unread messages to mark them all as read. 
        // In a real production system, this should probably be a bulk update query in the repository.
        Page<InboxMessage> unreadPage = inboxMessageRepository.findUnreadByTargetRoleOrEmployee(role, employeeId, Pageable.ofSize(1000));
        unreadPage.getContent().forEach(msg -> msg.setReadAt(LocalDateTime.now()));
        inboxMessageRepository.saveAll(unreadPage.getContent());
    }
    
    /**
     * Get archived messages for a specific role and employee
     */
    public Page<InboxMessage> getArchivedMessagesForUser(String role, Long employeeId, Pageable pageable) {
        return inboxMessageRepository.findArchivedByTargetRoleOrEmployee(role, employeeId, pageable);
    }

    /**
     * Archive a message
     */
    @Transactional
    public InboxMessage archiveMessage(Long messageId, String role, Long employeeId) {
        InboxMessage message = getAccessibleMessage(messageId, role, employeeId);
        message.setArchived(true);
        return inboxMessageRepository.save(message);
    }
    
    /**
     * Delete a message (admin only)
     */
    @Transactional
    public void deleteMessage(Long messageId, String role, Long employeeId) {
        InboxMessage message = getAccessibleMessage(messageId, role, employeeId);
        inboxMessageRepository.delete(message);
    }

    private InboxMessage getAccessibleMessage(Long messageId, String role, Long employeeId) {
        InboxMessage message = inboxMessageRepository.findById(Objects.requireNonNull(messageId))
                .orElseThrow(() -> new IllegalArgumentException("Message not found"));

        boolean visibleToEmployee = message.getTargetEmployeeId() != null && message.getTargetEmployeeId().equals(employeeId);
        boolean visibleToRole = role != null && role.equals(message.getTargetRole());
        boolean visibleToAll = "ALL".equals(message.getTargetRole());

        if (!visibleToEmployee && !visibleToRole && !visibleToAll) {
            throw new AccessDeniedException("Access denied");
        }

        return message;
    }
}
