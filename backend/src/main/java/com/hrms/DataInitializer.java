package com.hrms;

import com.hrms.core.models.Employee;
import com.hrms.core.models.Team;
import com.hrms.core.models.UsersRole;
import com.hrms.core.repositories.EmployeeRepository;
import com.hrms.core.repositories.RoleRepository;
import com.hrms.core.repositories.TeamRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final RoleRepository roleRepository;
    private final TeamRepository teamRepository;
    private final EmployeeRepository employeeRepository;

    public DataInitializer(RoleRepository roleRepository,
                           TeamRepository teamRepository,
                           EmployeeRepository employeeRepository) {
        this.roleRepository = roleRepository;
        this.teamRepository = teamRepository;
        this.employeeRepository = employeeRepository;
    }

    @Override
    public void run(String... args) {
        // ── Seed roles ────────────────────────────────────────────────────────
        seedRoles();

        // ── Seed teams ────────────────────────────────────────────────────────
        seedTeams();

        // ── Seed test employees (dev only) ────────────────────────────────────
        seedEmployees();
    }

    private void seedRoles() {
        String[] roles = {"ADMIN", "HR", "MANAGER", "PAYROLL", "EMPLOYEE", "SUPER_ADMIN"};
        for (String roleName : roles) {
            if (roleRepository.findByRoleName(roleName).isEmpty()) {
                roleRepository.save(new UsersRole(roleName));
                log.info("Role seeded: {}", roleName);
            }
        }
    }

    private void seedTeams() {
        String[] teams = {"Engineering", "Marketing", "Sales", "Finance"};
        for (String teamName : teams) {
            if (teamRepository.findAll().stream().noneMatch(t -> t.getName().equalsIgnoreCase(teamName))) {
                teamRepository.save(new Team(null, teamName));
                log.info("Team seeded: {}", teamName);
            }
        }
    }

    private void seedEmployees() {
        // Resolve role IDs by name so order doesn't matter
        Long superAdminRoleId = roleRepository.findByRoleName("SUPER_ADMIN")
                .map(UsersRole::getRoleId).orElse(null);
        Long adminRoleId = roleRepository.findByRoleName("ADMIN")
                .map(UsersRole::getRoleId).orElse(null);
        Long hrRoleId = roleRepository.findByRoleName("HR")
                .map(UsersRole::getRoleId).orElse(null);
        Long managerRoleId = roleRepository.findByRoleName("MANAGER")
                .map(UsersRole::getRoleId).orElse(null);
        Long payrollRoleId = roleRepository.findByRoleName("PAYROLL")
                .map(UsersRole::getRoleId).orElse(null);
        Long employeeRoleId = roleRepository.findByRoleName("EMPLOYEE")
                .map(UsersRole::getRoleId).orElse(null);

        // SUPER_ADMIN — email: dev@hrms.com        password: Dev@1234
        seedUser("Dev Super Admin", "dev@hrms.com", "Dev@1234", superAdminRoleId, new BigDecimal("25000.00"), null);

        // Admin — email: admin@hrms.com            password: Admin@1234
        seedUser("System Admin", "admin@hrms.com", "Admin@1234", adminRoleId, new BigDecimal("15000.00"), null);

        // HR — email: hr@hrms.com                  password: HR@1234
        seedUser("Sara HR", "hr@hrms.com", "HR@1234", hrRoleId, new BigDecimal("9000.00"), null);

        // Manager — email: manager@hrms.com        password: Manager@1234
        Employee manager = seedUser("Khalid Manager", "manager@hrms.com", "Manager@1234", managerRoleId, new BigDecimal("12000.00"), null);

        // Payroll — email: payroll@hrms.com        password: Payroll@1234
        seedUser("Ahmad Payroll", "payroll@hrms.com", "Payroll@1234", payrollRoleId, new BigDecimal("8500.00"), null);

        // Employee — email: employee@hrms.com      password: Employee@1234
        seedUser("Lina Employee", "employee@hrms.com", "Employee@1234", employeeRoleId, new BigDecimal("5000.00"), manager != null ? manager.getEmployeeId() : null);
    }

    private Employee seedUser(String fullName, String email, String password, Long roleId, BigDecimal salary, Long managerId) {
        if (employeeRepository.findByEmail(email).isEmpty()) {
            Employee employee = Employee.builder()
                    .fullName(fullName)
                    .email(email)
                    .passwordHash(password)
                    .roleId(roleId)
                    .managerId(managerId)
                    .baseSalary(salary)
                    .status("Active")
                    .build();
            Employee saved = employeeRepository.save(employee);
            log.info("User seeded: {} ({})", fullName, email);
            return saved;
        }
        return employeeRepository.findByEmail(email).orElse(null);
    }
}
