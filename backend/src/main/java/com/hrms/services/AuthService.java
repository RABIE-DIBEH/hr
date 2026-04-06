package com.hrms.services;

import com.hrms.core.models.Employee;
import com.hrms.core.repositories.EmployeeRepository;
import com.hrms.core.repositories.RoleRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

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
            log.warn("Login rejected: blank email or password");
            return Optional.empty();
        }

        String trimmedEmail = email.trim();
        Optional<Employee> employeeOpt = employeeRepository.findByEmailIgnoreCase(trimmedEmail);
        if (employeeOpt.isEmpty()) {
            log.warn("Login failed: no employee found for email={}", trimmedEmail);
            return Optional.empty();
        }

        Employee employee = employeeOpt.get();
        log.debug("Found employee: id={} roleId={} status={}",
                employee.getEmployeeId(),
                employee.getRoleId(),
                employee.getStatus());

        if (!isLoginAllowed(employee)) {
            log.warn("Login rejected: roleId is null or status is not Active for employeeId={}", employee.getEmployeeId());
            return Optional.empty();
        }

        String storedHash = employee.getPasswordHash();
        if (!StringUtils.hasText(storedHash)) {
            log.warn("Login rejected: password hash is blank for employeeId={}", employee.getEmployeeId());
            return Optional.empty();
        }

        // Try BCrypt match first
        boolean bcryptMatch = false;
        try {
            bcryptMatch = passwordEncoder.matches(password, storedHash);
        } catch (Exception e) {
            log.debug("BCrypt match threw exception (stored value is probably plain-text): {}", e.getMessage());
        }

        if (bcryptMatch) {
            log.debug("BCrypt match success for employeeId={}", employee.getEmployeeId());
            return buildToken(employee);
        }

        // Plain-text fallback (for dev seed data — migrates to BCrypt on success)
        if (!isBcryptHash(storedHash) && storedHash.equals(password)) {
            log.info("Plain-text match success; upgrading password hash for employeeId={}", employee.getEmployeeId());
            employee.setPasswordHash(passwordEncoder.encode(password));
            employeeRepository.save(employee);
            return buildToken(employee);
        }

        log.warn("Login failed: password does not match for employeeId={} (bcrypt={}, isHash={})",
                employee.getEmployeeId(),
                bcryptMatch,
                isBcryptHash(storedHash));
        return Optional.empty();
    }

    /**
     * Updates an employee's password.
     * @param employeeId The ID of the employee changing their password.
     * @param currentPassword The current plain-text password to verify.
     * @param newPassword The new plain-text password to set.
     * @return true if updated successfully, false if current password doesn't match.
     */
    @Transactional
    public boolean changePassword(Long employeeId, String currentPassword, String newPassword) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND, "Employee not found"));

        if (!passwordEncoder.matches(currentPassword, employee.getPasswordHash())) {
            return false;
        }

        employee.setPasswordHash(passwordEncoder.encode(newPassword));
        employeeRepository.save(employee);
        log.info("Password updated successfully for employeeId={}", employeeId);
        return true;
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
                    log.debug("Building token for role={} employeeId={}", role.getRoleName(), employee.getEmployeeId());
                    Map<String, Object> claims = new HashMap<>();
                    claims.put("role", role.getRoleName());
                    claims.put("employeeId", employee.getEmployeeId());
                    return jwtService.generateToken(employee.getEmail(), claims);
                })
                .or(() -> {
                    log.error("Token build failed: role not found for roleId={}", employee.getRoleId());
                    return Optional.empty();
                });
    }
}
