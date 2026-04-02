package com.hrms.core.repositories;

import com.hrms.core.models.NFCCard;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface NFCCardRepository extends JpaRepository<NFCCard, Long> {
    Optional<NFCCard> findByUid(String uid);

    Optional<NFCCard> findByEmployee_EmployeeId(Long employeeId);
}
