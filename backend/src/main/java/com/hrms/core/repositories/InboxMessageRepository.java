package com.hrms.core.repositories;

import com.hrms.core.models.InboxMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InboxMessageRepository extends JpaRepository<InboxMessage, Long> {
    
    /**
     * Find all messages for a specific role or specifically for a client (unarchived, ordered by date desc)
     */
    @Query("SELECT m FROM InboxMessage m WHERE (m.targetRole = :role OR m.targetRole = 'ALL' OR m.targetEmployeeId = :employeeId) " +
           "AND m.archived = false ORDER BY m.createdAt DESC")
    List<InboxMessage> findByTargetRoleOrEmployee(@Param("role") String role, @Param("employeeId") Long employeeId);
    
    /**
     * Find unread messages for a specific role or specifically for a client
     */
    @Query("SELECT m FROM InboxMessage m WHERE (m.targetRole = :role OR m.targetRole = 'ALL' OR m.targetEmployeeId = :employeeId) " +
           "AND m.readAt IS NULL AND m.archived = false ORDER BY m.priority DESC, m.createdAt DESC")
    List<InboxMessage> findUnreadByTargetRoleOrEmployee(@Param("role") String role, @Param("employeeId") Long employeeId);
    
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
    List<InboxMessage> findHighPriorityByTargetRoleOrEmployee(@Param("role") String role, @Param("employeeId") Long employeeId);
}
