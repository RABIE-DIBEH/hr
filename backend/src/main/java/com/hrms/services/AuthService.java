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
            return Optional.empty();
        }

        String trimmedEmail = email.trim();
        Optional<Employee> employeeOpt = employeeRepository.findByEmailIgnoreCase(trimmedEmail);
        if (employeeOpt.isEmpty()) {
            return Optional.empty();
        }

        Employee employee = employeeOpt.get();
        if (!isLoginAllowed(employee)) {
            return Optional.empty();
        }

        String storedHash = employee.getPasswordHash();
        if (!StringUtils.hasText(storedHash)) {
            return Optional.empty();
        }

        if (passwordEncoder.matches(password, storedHash)) {
            return buildToken(employee);
        }

        if (!isBcryptHash(storedHash) && storedHash.equals(password)) {
            employee.setPasswordHash(passwordEncoder.encode(password));
            employeeRepository.save(employee);
            return buildToken(employee);
        }

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
                    Map<String, Object> claims = new HashMap<>();
                    claims.put("role", role.getRoleName());
                    claims.put("employeeId", employee.getEmployeeId());
                    return jwtService.generateToken(employee.getEmail(), claims);
                });
    }
}
