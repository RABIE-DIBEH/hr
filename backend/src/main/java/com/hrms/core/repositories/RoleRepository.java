package com.hrms.core.repositories;

import com.hrms.core.models.UsersRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface RoleRepository extends JpaRepository<UsersRole, Long> {
    Optional<UsersRole> findByRoleName(String roleName);
}
