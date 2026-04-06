package com.hrms.services;

import com.hrms.api.dto.EmployeeAdminUpdate;
import com.hrms.api.dto.EmployeeProfileResponse;
import com.hrms.api.dto.EmployeeProfileUpdate;
import com.hrms.api.dto.EmployeeSummaryResponse;
import com.hrms.core.models.Employee;
import com.hrms.core.models.Team;
import com.hrms.core.models.UsersRole;
import com.hrms.core.repositories.EmployeeRepository;
import com.hrms.core.repositories.NFCCardRepository;
import com.hrms.core.repositories.RoleRepository;
import com.hrms.core.repositories.TeamRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.security.SecureRandom;
import java.util.Map;

@Service
public class EmployeeDirectoryService {

    private final EmployeeRepository employeeRepository;
    private final TeamRepository teamRepository;
    private final RoleRepository roleRepository;
    private final NFCCardRepository nfcCardRepository;
    private final PasswordEncoder passwordEncoder;

    public EmployeeDirectoryService(
            EmployeeRepository employeeRepository,
            TeamRepository teamRepository,
            RoleRepository roleRepository,
            NFCCardRepository nfcCardRepository,
            PasswordEncoder passwordEncoder) {
        this.employeeRepository = employeeRepository;
        this.teamRepository = teamRepository;
        this.roleRepository = roleRepository;
        this.nfcCardRepository = nfcCardRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public EmployeeProfileResponse getProfile(Long employeeId) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Employee not found"));

        String teamName = resolveTeamName(employee.getTeamId());
        String roleName = resolveRoleName(employee.getRoleId());

        return new EmployeeProfileResponse(
                employee.getEmployeeId(),
                employee.getFullName(),
                employee.getEmail(),
                employee.getTeamId(),
                teamName,
                employee.getRoleId(),
                roleName,
                employee.getManagerId(),
                employee.getBaseSalary(),
                employee.getStatus(),
                employee.getMobileNumber(),
                employee.getAddress(),
                employee.getNationalId(),
                employee.getAvatarUrl()
        );
    }

    public Page<EmployeeSummaryResponse> listAllSummaries(Pageable pageable) {
        return employeeRepository.findAll(pageable)
                .map(this::toSummary);
    }

    public Page<EmployeeSummaryResponse> listDirectReports(Long managerEmployeeId, Pageable pageable) {
        return employeeRepository.findAllByManagerId(managerEmployeeId, pageable)
                .map(this::toSummary)
                ;
    }

    @Transactional
    public EmployeeProfileResponse updateProfile(Long employeeId, EmployeeProfileUpdate update) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Employee not found"));

        // Ensure email uniqueness (exclude current employee)
        employeeRepository.findByEmailIgnoreCase(update.email())
                .filter(existing -> !existing.getEmployeeId().equals(employeeId))
                .ifPresent(existing -> {
                    throw new ResponseStatusException(HttpStatus.CONFLICT, "البريد الإلكتروني مستخدم بالفعل");
                });

        employee.setFullName(update.fullName());
        employee.setEmail(update.email());

        // Optional fields: null means "clear the value", non-null means "set it"
        employee.setMobileNumber(update.mobileNumber());
        employee.setAddress(update.address());
        employee.setNationalId(update.nationalId());
        employee.setAvatarUrl(update.avatarUrl());

        employeeRepository.save(employee);
        return getProfile(employeeId);
    }

    private EmployeeSummaryResponse toSummary(Employee employee) {
        String teamName = resolveTeamName(employee.getTeamId());
        String roleName = resolveRoleName(employee.getRoleId());
        return nfcCardRepository.findByEmployee_EmployeeId(employee.getEmployeeId())
                .map(card -> new EmployeeSummaryResponse(
                        employee.getEmployeeId(),
                        employee.getFullName(),
                        employee.getEmail(),
                        employee.getTeamId(),
                        teamName,
                        card.getUid(),
                        true,
                        card.getStatus(),
                        employee.getBaseSalary(),
                        employee.getStatus(),
                        employee.getRoleId(),
                        roleName,
                        employee.getMobileNumber(),
                        employee.getAddress(),
                        employee.getNationalId()
                ))
                .orElseGet(() -> new EmployeeSummaryResponse(
                        employee.getEmployeeId(),
                        employee.getFullName(),
                        employee.getEmail(),
                        employee.getTeamId(),
                        teamName,
                        null,
                        false,
                        null,
                        employee.getBaseSalary(),
                        employee.getStatus(),
                        employee.getRoleId(),
                        roleName,
                        employee.getMobileNumber(),
                        employee.getAddress(),
                        employee.getNationalId()
                ));
    }

    private String resolveTeamName(Long teamId) {
        if (teamId == null) {
            return null;
        }
        return teamRepository.findById(teamId).map(Team::getName).orElse(null);
    }

    private String resolveRoleName(Long roleId) {
        if (roleId == null) {
            return "";
        }
        return roleRepository.findById(roleId).map(UsersRole::getRoleName).orElse("");
    }

    /**
     * Update an employee's profile by an admin/HR user.
     * Allows modification of basic profile fields plus admin-only fields (role, team, salary, status).
     */
    @Transactional
    public EmployeeProfileResponse updateEmployeeByAdmin(Long employeeId, EmployeeAdminUpdate update, Long updatedBy) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Employee not found"));

        // Ensure email uniqueness (exclude current employee)
        employeeRepository.findByEmailIgnoreCase(update.email())
                .filter(existing -> !existing.getEmployeeId().equals(employeeId))
                .ifPresent(existing -> {
                    throw new ResponseStatusException(HttpStatus.CONFLICT, "البريد الإلكتروني مستخدم بالفعل");
                });

        // Basic profile fields
        employee.setFullName(update.fullName());
        employee.setEmail(update.email());
        employee.setMobileNumber(update.mobileNumber());
        employee.setAddress(update.address());
        employee.setNationalId(update.nationalId());
        employee.setAvatarUrl(update.avatarUrl());

        // Admin-only fields
        if (update.teamId() != null) {
            employee.setTeamId(update.teamId());
        }
        if (update.roleId() != null) {
            employee.setRoleId(update.roleId());
        }
        if (update.managerId() != null) {
            employee.setManagerId(update.managerId());
        }
        if (update.baseSalary() != null) {
            employee.setBaseSalary(update.baseSalary());
        }
        if (update.employmentStatus() != null && !update.employmentStatus().isBlank()) {
            employee.setStatus(update.employmentStatus());
        }

        employeeRepository.save(employee);
        return getProfile(employeeId);
    }

    /**
     * Soft-delete an employee by setting status to "Terminated".
     * This preserves audit trail (attendance records, payroll, etc.).
     * Also deactivates any linked NFC cards.
     */
    @Transactional
    public Map<String, Object> deleteEmployee(Long employeeId, Long deletedBy) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Employee not found"));

        if ("Terminated".equalsIgnoreCase(employee.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Employee is already terminated");
        }

        String previousStatus = employee.getStatus();
        String deletedByName = employeeRepository.findById(deletedBy)
                .map(Employee::getFullName)
                .orElse("Unknown");

        // Soft-delete: change status to Terminated
        employee.setStatus("Terminated");
        employeeRepository.save(employee);

        // Deactivate linked NFC cards
        nfcCardRepository.findByEmployee_EmployeeId(employeeId)
                .ifPresent(card -> {
                    card.setStatus("Inactive");
                    nfcCardRepository.save(card);
                });

        return Map.of(
            "employeeId", employee.getEmployeeId(),
            "fullName", employee.getFullName(),
            "email", employee.getEmail(),
            "previousStatus", previousStatus,
            "newStatus", "Terminated",
            "deletedBy", deletedBy,
            "deletedByName", deletedByName,
            "message", "Employee '" + employee.getFullName() + "' has been terminated successfully"
        );
    }

    /**
     * Reset an employee's password to a new secure random password.
     * Returns the plain-text password so HR/Admin can share it with the employee.
     */
    @Transactional
    public Map<String, Object> resetEmployeePassword(Long employeeId, Long resetBy) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Employee not found"));

        // Generate secure random password
        String newPassword = generateSecurePassword();

        // Store BCrypt hash
        employee.setPasswordHash(passwordEncoder.encode(newPassword));
        employeeRepository.save(employee);

        String resetByName = employeeRepository.findById(resetBy)
                .map(Employee::getFullName)
                .orElse("Unknown");

        return Map.of(
            "employeeId", employee.getEmployeeId(),
            "fullName", employee.getFullName(),
            "email", employee.getEmail(),
            "newPassword", newPassword,
            "resetBy", resetBy,
            "resetByName", resetByName,
            "message", "Password reset for '" + employee.getFullName() + "' — share the new password with the employee"
        );
    }

    /**
     * Generate a secure random password (10 chars, mixed case + digits + symbols).
     */
    private String generateSecurePassword() {
        String upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        String lower = "abcdefghijklmnopqrstuvwxyz";
        String digits = "0123456789";
        String symbols = "!@#$%^&*";
        String all = upper + lower + digits + symbols;

        SecureRandom random = new SecureRandom();
        StringBuilder password = new StringBuilder();

        // Guarantee at least one of each type
        password.append(upper.charAt(random.nextInt(upper.length())));
        password.append(lower.charAt(random.nextInt(lower.length())));
        password.append(digits.charAt(random.nextInt(digits.length())));
        password.append(symbols.charAt(random.nextInt(symbols.length())));

        // Fill remaining with random chars
        for (int i = 4; i < 10; i++) {
            password.append(all.charAt(random.nextInt(all.length())));
        }

        // Shuffle the result
        char[] chars = password.toString().toCharArray();
        for (int i = chars.length - 1; i > 0; i--) {
            int j = random.nextInt(i + 1);
            char temp = chars[i];
            chars[i] = chars[j];
            chars[j] = temp;
        }

        return new String(chars);
    }
}
