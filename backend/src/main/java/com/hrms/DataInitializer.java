package com.hrms;

import com.hrms.core.models.Employee;
import com.hrms.core.models.Team;
import com.hrms.core.models.UsersRole;
import com.hrms.core.repositories.EmployeeRepository;
import com.hrms.core.repositories.RoleRepository;
import com.hrms.core.repositories.TeamRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
public class DataInitializer implements CommandLineRunner {

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
        if (roleRepository.count() == 0) {
            roleRepository.save(new UsersRole("ADMIN"));
            roleRepository.save(new UsersRole("HR"));
            roleRepository.save(new UsersRole("MANAGER"));
            roleRepository.save(new UsersRole("PAYROLL"));
            roleRepository.save(new UsersRole("EMPLOYEE"));
            roleRepository.save(new UsersRole("SUPER_ADMIN"));
            System.out.println(">>> Roles seeded: ADMIN, HR, MANAGER, PAYROLL, EMPLOYEE, SUPER_ADMIN");
        }

        // ── Seed teams ────────────────────────────────────────────────────────
        if (teamRepository.count() == 0) {
            teamRepository.save(new Team(null, "Engineering"));
            teamRepository.save(new Team(null, "Marketing"));
            teamRepository.save(new Team(null, "Sales"));
            teamRepository.save(new Team(null, "Finance"));
            System.out.println(">>> Teams seeded: Engineering, Marketing, Sales, Finance");
        }

        // ── Seed test employees (dev only) ────────────────────────────────────
        // Passwords are stored as plain-text here.
        // AuthService auto-upgrades them to BCrypt on the first successful login.
        if (employeeRepository.count() == 0) {
            // Resolve role IDs by name so order doesn't matter
            Long adminRoleId = roleRepository.findByRoleName("ADMIN")
                    .map(r -> r.getRoleId()).orElse(1L);
            Long hrRoleId = roleRepository.findByRoleName("HR")
                    .map(r -> r.getRoleId()).orElse(2L);
            Long managerRoleId = roleRepository.findByRoleName("MANAGER")
                    .map(r -> r.getRoleId()).orElse(3L);
            Long payrollRoleId = roleRepository.findByRoleName("PAYROLL")
                    .map(r -> r.getRoleId()).orElse(4L);
            Long employeeRoleId = roleRepository.findByRoleName("EMPLOYEE")
                    .map(r -> r.getRoleId()).orElse(5L);

            // Admin  — email: admin@hrms.com     password: Admin@1234
            employeeRepository.save(Employee.builder()
                    .fullName("System Admin")
                    .email("admin@hrms.com")
                    .passwordHash("Admin@1234")
                    .roleId(adminRoleId)
                    .baseSalary(new BigDecimal("15000.00"))
                    .status("Active")
                    .build());

            // HR     — email: hr@hrms.com         password: HR@1234
            employeeRepository.save(Employee.builder()
                    .fullName("Sara HR")
                    .email("hr@hrms.com")
                    .passwordHash("HR@1234")
                    .roleId(hrRoleId)
                    .baseSalary(new BigDecimal("9000.00"))
                    .status("Active")
                    .build());

            // Manager — email: manager@hrms.com   password: Manager@1234
            Employee manager = employeeRepository.save(Employee.builder()
                    .fullName("Khalid Manager")
                    .email("manager@hrms.com")
                    .passwordHash("Manager@1234")
                    .roleId(managerRoleId)
                    .baseSalary(new BigDecimal("12000.00"))
                    .status("Active")
                    .build());

            // Payroll — email: payroll@hrms.com   password: Payroll@1234
            employeeRepository.save(Employee.builder()
                    .fullName("Ahmad Payroll")
                    .email("payroll@hrms.com")
                    .passwordHash("Payroll@1234")
                    .roleId(payrollRoleId)
                    .baseSalary(new BigDecimal("8500.00"))
                    .status("Active")
                    .build());

            // Employee — email: employee@hrms.com  password: Employee@1234
            employeeRepository.save(Employee.builder()
                    .fullName("Lina Employee")
                    .email("employee@hrms.com")
                    .passwordHash("Employee@1234")
                    .roleId(employeeRoleId)
                    .managerId(manager.getEmployeeId())
                    .baseSalary(new BigDecimal("5000.00"))
                    .status("Active")
                    .build());

            System.out.println(">>> Test employees seeded:");
            System.out.println("    ADMIN    -> admin@hrms.com    / Admin@1234");
            System.out.println("    HR       -> hr@hrms.com       / HR@1234");
            System.out.println("    MANAGER  -> manager@hrms.com  / Manager@1234");
            System.out.println("    PAYROLL  -> payroll@hrms.com  / Payroll@1234");
            System.out.println("    EMPLOYEE -> employee@hrms.com / Employee@1234");
        }
    }
}
