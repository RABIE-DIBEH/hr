package com.hrms;

import com.hrms.core.models.Department;
import com.hrms.core.models.Employee;
import com.hrms.core.models.Team;
import com.hrms.core.models.UsersRole;
import com.hrms.core.repositories.DepartmentRepository;
import com.hrms.core.repositories.EmployeeRepository;
import com.hrms.core.repositories.RoleRepository;
import com.hrms.core.repositories.TeamRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final RoleRepository roleRepository;
    private final TeamRepository teamRepository;
    private final EmployeeRepository employeeRepository;
    private final DepartmentRepository departmentRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(RoleRepository roleRepository,
                           TeamRepository teamRepository,
                           EmployeeRepository employeeRepository,
                           DepartmentRepository departmentRepository,
                           PasswordEncoder passwordEncoder) {
        this.roleRepository = roleRepository;
        this.teamRepository = teamRepository;
        this.employeeRepository = employeeRepository;
        this.departmentRepository = departmentRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        // ── Seed roles ────────────────────────────────────────────────────────
        seedRoles();

        // ── Seed departments ──────────────────────────────────────────────────
        seedDepartments();

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

    private void seedDepartments() {
        // Seed default departments similar to the migration script
        String[][] departments = {
            {"Engineering", "ENG", "Software development and technical operations"},
            {"Human Resources", "HR", "People operations and talent management"},
            {"Finance", "FIN", "Financial planning and accounting"},
            {"Marketing", "MKT", "Brand, communications and growth"},
            {"Operations", "OPS", "Infrastructure and support operations"},
            {"General", "GEN", "Default department for existing employees"}
        };
        
        for (String[] dept : departments) {
            String name = dept[0];
            String code = dept[1];
            String description = dept[2];
            
            if (departmentRepository.findByDepartmentName(name).isEmpty()) {
                Department department = new Department();
                department.setDepartmentName(name);
                department.setDepartmentCode(code);
                department.setDescription(description);
                departmentRepository.save(department);
                log.info("Department seeded: {} ({})", name, code);
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

        // Get department IDs
        Long engineeringDeptId = departmentRepository.findByDepartmentCode("ENG")
                .map(Department::getDepartmentId).orElse(null);
        Long hrDeptId = departmentRepository.findByDepartmentCode("HR")
                .map(Department::getDepartmentId).orElse(null);
        Long financeDeptId = departmentRepository.findByDepartmentCode("FIN")
                .map(Department::getDepartmentId).orElse(null);
        Long generalDeptId = departmentRepository.findByDepartmentCode("GEN")
                .map(Department::getDepartmentId).orElse(null);

        // SUPER_ADMIN — email: dev@hrms.com        password: Dev@1234
        seedUser("Dev Super Admin", "dev@hrms.com", "Dev@1234", superAdminRoleId, new BigDecimal("25000.00"), null, engineeringDeptId);

        // Admin — email: admin@hrms.com            password: Admin@1234
        seedUser("System Admin", "admin@hrms.com", "Admin@1234", adminRoleId, new BigDecimal("15000.00"), null, engineeringDeptId);

        // HR — email: hr@hrms.com                  password: HR@1234
        seedUser("Sara HR", "hr@hrms.com", "HR@1234", hrRoleId, new BigDecimal("9000.00"), null, hrDeptId);

        // Manager — email: manager@hrms.com        password: Manager@1234
        Employee manager = seedUser("Khalid Manager", "manager@hrms.com", "Manager@1234", managerRoleId, new BigDecimal("12000.00"), null, engineeringDeptId);

        // Payroll — email: payroll@hrms.com        password: Payroll@1234
        seedUser("Ahmad Payroll", "payroll@hrms.com", "Payroll@1234", payrollRoleId, new BigDecimal("8500.00"), null, financeDeptId);

        // Employee — email: employee@hrms.com      password: Employee@1234
        seedUser("Lina Employee", "employee@hrms.com", "Employee@1234", employeeRoleId, new BigDecimal("5000.00"), manager != null ? manager.getEmployeeId() : null, engineeringDeptId);

        // Assign all existing employees without a department to "General" department
        assignGeneralDepartmentToExistingEmployees(generalDeptId);
    }

    private Employee seedUser(String fullName, String email, String password, Long roleId, BigDecimal salary, Long managerId, Long departmentId) {
        if (employeeRepository.findByEmail(email).isEmpty()) {
            // Hash the password before saving
            String passwordHash = passwordEncoder.encode(password);
            Employee employee = Employee.builder()
                    .fullName(fullName)
                    .email(email)
                    .passwordHash(passwordHash)
                    .roleId(roleId)
                    .managerId(managerId)
                    .departmentId(departmentId)
                    .baseSalary(salary)
                    .status("Active")
                    .build();
            Employee saved = employeeRepository.save(employee);
            log.info("User seeded: {} ({})", fullName, email);
            return saved;
        }
        // Update existing user with department if not set
        Employee existing = employeeRepository.findByEmail(email).orElse(null);
        if (existing != null && existing.getDepartmentId() == null && departmentId != null) {
            existing.setDepartmentId(departmentId);
            employeeRepository.save(existing);
            log.info("Updated existing user {} with department ID {}", email, departmentId);
        }
        return existing;
    }

    private void assignGeneralDepartmentToExistingEmployees(Long generalDeptId) {
        if (generalDeptId == null) {
            log.warn("General department not found, cannot assign departments to existing employees");
            return;
        }
        
        // Find all employees without a department - use a more efficient query
        List<Employee> employeesWithoutDept = employeeRepository.findByDepartmentIdIsNull();
        
        if (!employeesWithoutDept.isEmpty()) {
            for (Employee emp : employeesWithoutDept) {
                emp.setDepartmentId(generalDeptId);
            }
            employeeRepository.saveAll(employeesWithoutDept);
            log.info("Assigned {} existing employees to General department", employeesWithoutDept.size());
        }
    }
}
