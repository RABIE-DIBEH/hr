package com.hrms.core.repositories;

import com.hrms.core.models.InboxMessage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface InboxMessageRepository extends JpaRepository<InboxMessage, Long> {
    
    /**
     * Find all messages for a specific role or specifically for a client (unarchived, ordered by date desc)
     * Includes: role-targeted messages, ALL messages, personal messages, AND replies the user sent.
     */
    @Query("SELECT m FROM InboxMessage m WHERE m.archived = false " +
           "AND (m.targetRole = :role OR m.targetRole = 'ALL' " +
           "    OR m.targetEmployeeId = :employeeId " +
           "    OR m.senderEmployeeId = :employeeId) " +
           "ORDER BY m.createdAt DESC")
    Page<InboxMessage> findByTargetRoleOrEmployee(@Param("role") String role, @Param("employeeId") Long employeeId, Pageable pageable);

    /**
     * Find unread messages for a specific role or specifically for a client
     * Excludes sent messages (senderEmployeeId IS NULL) so only received messages count as unread.
     */
    @Query("SELECT m FROM InboxMessage m WHERE (m.targetRole = :role OR m.targetRole = 'ALL' OR m.targetEmployeeId = :employeeId) " +
           "AND m.readAt IS NULL AND m.archived = false AND m.senderEmployeeId IS NULL ORDER BY m.priority DESC, m.createdAt DESC")
    Page<InboxMessage> findUnreadByTargetRoleOrEmployee(@Param("role") String role, @Param("employeeId") Long employeeId, Pageable pageable);

    /**
     * Count unread messages for a specific role or specifically for a client
     */
    @Query("SELECT COUNT(m) FROM InboxMessage m WHERE (m.targetRole = :role OR m.targetRole = 'ALL' OR m.targetEmployeeId = :employeeId) " +
           "AND m.readAt IS NULL AND m.archived = false")
    int countUnreadByTargetRoleOrEmployee(@Param("role") String role, @Param("employeeId") Long employeeId);
    
    /**
     * Find high priority messages for a specific role or specifically for a client
     */
    @Query("SELECT m FROM InboxMessage m WHERE (m.targetRole = :role OR m.targetRole = 'ALL' OR m.targetEmployeeId = :employeeId) " +
           "AND m.priority = 'HIGH' AND m.archived = false ORDER BY m.createdAt DESC")
    Page<InboxMessage> findHighPriorityByTargetRoleOrEmployee(@Param("role") String role, @Param("employeeId") Long employeeId, Pageable pageable);

    /**
     * Find archived messages for a specific role or specifically for a client
     */
    @Query("SELECT m FROM InboxMessage m WHERE (m.targetRole = :role OR m.targetRole = 'ALL' OR m.targetEmployeeId = :employeeId) " +
           "AND m.archived = true ORDER BY m.createdAt DESC")
    Page<InboxMessage> findArchivedByTargetRoleOrEmployee(@Param("role") String role, @Param("employeeId") Long employeeId, Pageable pageable);

    /**
     * Find all replies to a specific message (ordered by creation time)
     */
    @Query("SELECT m FROM InboxMessage m WHERE m.replyTo = :parentMessageId ORDER BY m.createdAt ASC")
    java.util.List<InboxMessage> findRepliesToMessage(@Param("parentMessageId") Long parentMessageId);

    /**
     * Find top-level messages (not replies) sent between two employees
     */
    @Query("SELECT m FROM InboxMessage m WHERE m.replyTo IS NULL AND m.archived = false " +
           "AND ((m.senderEmployeeId = :emp1 AND m.targetEmployeeId = :emp2) " +
           "OR (m.senderEmployeeId = :emp2 AND m.targetEmployeeId = :emp1)) " +
           "ORDER BY m.createdAt DESC")
    Page<InboxMessage> findConversationBetweenEmployees(@Param("emp1") Long emp1, @Param("emp2") Long emp2, Pageable pageable);

    /**
     * Find all messages sent by a specific employee (for "Sent" folder)
     */
    @Query("SELECT m FROM InboxMessage m WHERE m.senderEmployeeId = :employeeId AND m.archived = false ORDER BY m.createdAt DESC")
    Page<InboxMessage> findBySenderEmployeeId(@Param("employeeId") Long employeeId, Pageable pageable);
}

