package com.hrms.core.repositories;

import com.hrms.core.models.EmployeeDeletionLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface EmployeeDeletionLogRepository extends JpaRepository<EmployeeDeletionLog, Long> {
}
