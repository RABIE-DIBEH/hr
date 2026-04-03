package com.hrms.services;

import com.hrms.core.models.Employee;
import com.hrms.core.repositories.EmployeeRepository;
import com.hrms.core.repositories.RoleRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Service
public class AuthService {

    private final EmployeeRepository employeeRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(
            EmployeeRepository employeeRepository,
            RoleRepository roleRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService) {
        this.employeeRepository = employeeRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    /**
     * Authenticates with BCrypt. If the stored value is a legacy plain-text password (not a BCrypt hash),
     * a successful match is migrated to BCrypt on the fly.
     */
    @Transactional
    public Optional<String> login(String email, String password) {
        if (!StringUtils.hasText(email) || password == null || password.isEmpty()) {
            System.out.println("[AUTH] Login rejected: blank email or password");
            return Optional.empty();
        }

        String trimmedEmail = email.trim();
        Optional<Employee> employeeOpt = employeeRepository.findByEmailIgnoreCase(trimmedEmail);
        if (employeeOpt.isEmpty()) {
            System.out.println("[AUTH] Login failed: no employee found for email=" + trimmedEmail);
            return Optional.empty();
        }

        Employee employee = employeeOpt.get();
        System.out.println("[AUTH] Found employee: id=" + employee.getEmployeeId()
                + " roleId=" + employee.getRoleId()
                + " status=" + employee.getStatus());

        if (!isLoginAllowed(employee)) {
            System.out.println("[AUTH] Login rejected: roleId is null or status is not Active");
            return Optional.empty();
        }

        String storedHash = employee.getPasswordHash();
        if (!StringUtils.hasText(storedHash)) {
            System.out.println("[AUTH] Login rejected: password hash is blank");
            return Optional.empty();
        }

        // Try BCrypt match first
        boolean bcryptMatch = false;
        try {
            bcryptMatch = passwordEncoder.matches(password, storedHash);
        } catch (Exception e) {
            System.out.println("[AUTH] BCrypt match threw exception (stored value is probably plain-text): " + e.getMessage());
        }

        if (bcryptMatch) {
            System.out.println("[AUTH] BCrypt match success");
            return buildToken(employee);
        }

        // Plain-text fallback (for dev seed data — migrates to BCrypt on success)
        if (!isBcryptHash(storedHash) && storedHash.equals(password)) {
            System.out.println("[AUTH] Plain-text match success — upgrading to BCrypt");
            employee.setPasswordHash(passwordEncoder.encode(password));
            employeeRepository.save(employee);
            return buildToken(employee);
        }

        System.out.println("[AUTH] Login failed: password does not match (bcrypt=" + bcryptMatch
                + ", isHash=" + isBcryptHash(storedHash) + ")");
        return Optional.empty();
    }

    private boolean isLoginAllowed(Employee employee) {
        return employee.getRoleId() != null
                && employee.getStatus() != null
                && "Active".equalsIgnoreCase(employee.getStatus());
    }

    private static boolean isBcryptHash(String value) {
        return value.startsWith("$2a$")
                || value.startsWith("$2b$")
                || value.startsWith("$2y$");
    }

    private Optional<String> buildToken(Employee employee) {
        return roleRepository.findById(employee.getRoleId())
                .map(role -> {
                    System.out.println("[AUTH] Building token for role=" + role.getRoleName());
                    Map<String, Object> claims = new HashMap<>();
                    claims.put("role", role.getRoleName());
                    claims.put("employeeId", employee.getEmployeeId());
                    return jwtService.generateToken(employee.getEmail(), claims);
                })
                .or(() -> {
                    System.out.println("[AUTH] Token build failed: role not found for roleId=" + employee.getRoleId());
                    return Optional.empty();
                });
    }
}
