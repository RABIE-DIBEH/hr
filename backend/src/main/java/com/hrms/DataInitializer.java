package com.hrms;

import com.hrms.core.models.*;
import com.hrms.core.repositories.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import java.math.BigDecimal;

@Component
public class DataInitializer implements CommandLineRunner {

    private final RoleRepository roleRepository;
    private final TeamRepository teamRepository;
    private final EmployeeRepository employeeRepository;
    private final NFCCardRepository nfcCardRepository;

    public DataInitializer(RoleRepository roleRepository, TeamRepository teamRepository, 
                           EmployeeRepository employeeRepository, NFCCardRepository nfcCardRepository) {
        this.roleRepository = roleRepository;
        this.teamRepository = teamRepository;
        this.employeeRepository = employeeRepository;
        this.nfcCardRepository = nfcCardRepository;
    }

    @Override
    public void run(String... args) {
        if (roleRepository.count() == 0) {
            // 1. Seed Roles
            UsersRole adminRole = roleRepository.save(new UsersRole("ADMIN"));
            UsersRole hrRole = roleRepository.save(new UsersRole("HR"));
            UsersRole managerRole = roleRepository.save(new UsersRole("MANAGER"));
            UsersRole employeeRole = roleRepository.save(new UsersRole("EMPLOYEE"));

            // 2. Seed Teams
            Team marketingTeam = teamRepository.save(new Team(null, "التسويق"));
            Team salesTeam = teamRepository.save(new Team(null, "المبيعات"));

            // 3. Seed Initial Employee (Admin/Ahmad)
            if (employeeRepository.findByEmail("ahmad@company.com").isEmpty()) {
                Employee ahmad = Employee.builder()
                        .fullName("أحمد خالد")
                        .email("ahmad@company.com")
                        .passwordHash("password123") // Should be BCrypt in production
                        .baseSalary(new BigDecimal("5000.00"))
                        .teamId(marketingTeam.getTeamId())
                        .roleId(adminRole.getRoleId())
                        .status("Active")
                        .build();
                
                ahmad = employeeRepository.save(ahmad);

                // 4. Bind NFC Card to Ahmad
                NFCCard card = new NFCCard();
                card.setUid("04:23:1A:FF");
                card.setEmployee(ahmad);
                card.setStatus("Active");
                nfcCardRepository.save(card);
                
                System.out.println(">>> Data Seeding Complete: Employee Ahmad Created with Card 04:23:1A:FF");
            }
        }
    }
}
