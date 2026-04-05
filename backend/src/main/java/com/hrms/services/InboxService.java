package com.hrms.services;

import com.hrms.core.models.InboxMessage;
import com.hrms.core.repositories.InboxMessageRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

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
    public List<InboxMessage> getInboxForUser(String role, Long employeeId) {
        return inboxMessageRepository.findByTargetRoleOrEmployee(role, employeeId);
    }
    
    /**
     * Get unread messages for a specific role and employee
     */
    public List<InboxMessage> getUnreadMessagesForUser(String role, Long employeeId) {
        return inboxMessageRepository.findUnreadByTargetRoleOrEmployee(role, employeeId);
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
    public List<InboxMessage> getHighPriorityMessages(String role, Long employeeId) {
        return inboxMessageRepository.findHighPriorityByTargetRoleOrEmployee(role, employeeId);
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
    public InboxMessage markAsRead(Long messageId) {
        Optional<InboxMessage> msg = inboxMessageRepository.findById(messageId);
        if (msg.isPresent()) {
            InboxMessage message = msg.get();
            message.setReadAt(LocalDateTime.now());
            return inboxMessageRepository.save(message);
        }
        return null;
    }
    
    /**
     * Mark all messages as read for a specific role and employee
     */
    @Transactional
    public void markAllAsRead(String role, Long employeeId) {
        List<InboxMessage> unread = inboxMessageRepository.findUnreadByTargetRoleOrEmployee(role, employeeId);
        unread.forEach(msg -> msg.setReadAt(LocalDateTime.now()));
        inboxMessageRepository.saveAll(unread);
    }
    
    /**
     * Get archived messages for a specific role and employee
     */
    public List<InboxMessage> getArchivedMessagesForUser(String role, Long employeeId) {
        return inboxMessageRepository.findArchivedByTargetRoleOrEmployee(role, employeeId);
    }

    /**
     * Archive a message
     */
    @Transactional
    public InboxMessage archiveMessage(Long messageId) {
        Optional<InboxMessage> msg = inboxMessageRepository.findById(messageId);
        if (msg.isPresent()) {
            InboxMessage message = msg.get();
            message.setArchived(true);
            return inboxMessageRepository.save(message);
        }
        return null;
    }
    
    /**
     * Delete a message (admin only)
     */
    @Transactional
    public void deleteMessage(Long messageId) {
        inboxMessageRepository.deleteById(messageId);
    }
}
