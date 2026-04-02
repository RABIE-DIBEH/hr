package com.hrms;

import com.hrms.core.models.Team;
import com.hrms.core.models.UsersRole;
import com.hrms.core.repositories.RoleRepository;
import com.hrms.core.repositories.TeamRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    private final RoleRepository roleRepository;
    private final TeamRepository teamRepository;

    public DataInitializer(RoleRepository roleRepository, TeamRepository teamRepository) {
        this.roleRepository = roleRepository;
        this.teamRepository = teamRepository;
    }

    @Override
    public void run(String... args) {
        if (roleRepository.count() == 0) {
            roleRepository.save(new UsersRole("ADMIN"));
            roleRepository.save(new UsersRole("HR"));
            roleRepository.save(new UsersRole("MANAGER"));
            roleRepository.save(new UsersRole("EMPLOYEE"));

            teamRepository.save(new Team(null, "التسويق"));
            teamRepository.save(new Team(null, "المبيعات"));

            System.out.println(">>> Reference data seeded: roles and teams (add employees via HR or SQL)");
        }
    }
}
