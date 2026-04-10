package com.hrms.services;

import com.hrms.api.dto.EmployeeAdminUpdate;
import com.hrms.api.dto.EmployeeDeletionResponse;
import com.hrms.api.dto.EmployeeProfileResponse;
import com.hrms.api.dto.EmployeeProfileUpdate;
import com.hrms.api.dto.EmployeeSummaryResponse;
import com.hrms.api.dto.PasswordResetResponse;
import com.hrms.api.exception.BusinessException;
import com.hrms.api.exception.ErrorCode;
import com.hrms.core.models.Department;
import com.hrms.core.models.Employee;
import com.hrms.core.models.EmployeeDeletionLog;
import com.hrms.core.models.SystemLog;
import com.hrms.core.models.Team;
import com.hrms.core.models.UsersRole;
import com.hrms.core.repositories.DepartmentRepository;
import com.hrms.core.repositories.EmployeeDeletionLogRepository;
import com.hrms.core.repositories.EmployeeRepository;
import com.hrms.core.repositories.NFCCardRepository;
import com.hrms.core.repositories.RoleRepository;
import com.hrms.core.repositories.SystemLogRepository;
import com.hrms.core.repositories.TeamRepository;
import com.hrms.security.EmployeeUserDetails;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class EmployeeDirectoryService {

    private final EmployeeRepository employeeRepository;
    private final TeamRepository teamRepository;
    private final RoleRepository roleRepository;
    private final DepartmentRepository departmentRepository;
    private final NFCCardRepository nfcCardRepository;
    private final EmployeeDeletionLogRepository employeeDeletionLogRepository;
    private final com.hrms.core.repositories.SystemLogRepository systemLogRepository;
    private final PasswordEncoder passwordEncoder;

    public EmployeeDirectoryService(
            EmployeeRepository employeeRepository,
            TeamRepository teamRepository,
            RoleRepository roleRepository,
            DepartmentRepository departmentRepository,
            NFCCardRepository nfcCardRepository,
            EmployeeDeletionLogRepository employeeDeletionLogRepository,
            com.hrms.core.repositories.SystemLogRepository systemLogRepository,
            PasswordEncoder passwordEncoder) {
        this.employeeRepository = employeeRepository;
        this.teamRepository = teamRepository;
        this.roleRepository = roleRepository;
        this.departmentRepository = departmentRepository;
        this.nfcCardRepository = nfcCardRepository;
        this.employeeDeletionLogRepository = employeeDeletionLogRepository;
        this.systemLogRepository = systemLogRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public EmployeeProfileResponse getProfile(Long employeeId) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new BusinessException(ErrorCode.EMPLOYEE_NOT_FOUND, "Employee not found"));

        String teamName = resolveTeamName(employee.getTeamId());
        String roleName = resolveRoleName(employee.getRoleId());
        String departmentName = resolveDepartmentName(employee.getDepartmentId());

        return new EmployeeProfileResponse(
                employee.getEmployeeId(),
                employee.getFullName(),
                employee.getEmail(),
                employee.getTeamId(),
                teamName,
                employee.getDepartmentId(),
                departmentName,
                employee.getRoleId(),
                roleName,
                employee.getManagerId(),
                employee.getBaseSalary(),
                employee.getStatus(),
                employee.getMobileNumber(),
                employee.getAddress(),
                employee.getNationalId(),
                employee.getAvatarUrl(),
                employee.getLeaveBalanceDays()
        );
    }

    public Page<EmployeeSummaryResponse> listAllSummaries(Pageable pageable, EmployeeUserDetails principal) {
        // Check if manager has a department assigned
        if (principal != null && principal.getAuthorities().stream().anyMatch(a -> "ROLE_MANAGER".equals(a.getAuthority()))
                && principal.getDepartmentId() != null) {
            // Filter by department for managers
            return employeeRepository.findByDepartmentId(principal.getDepartmentId(), pageable)
                    .map(this::toSummary);
        }

        // For HR/Admin/SuperAdmin or managers without department, return all
        return employeeRepository.findAll(pageable)
                .map(this::toSummary);
    }

    public Page<EmployeeSummaryResponse> listDirectReports(Long managerEmployeeId, Pageable pageable, EmployeeUserDetails principal) {
        // Check if manager has a department assigned
        if (principal != null && principal.getAuthorities().stream().anyMatch(a -> "ROLE_MANAGER".equals(a.getAuthority()))
                && principal.getDepartmentId() != null) {
            // Use the efficient repository method
            return employeeRepository.findAllByManagerIdAndDepartmentId(
                    managerEmployeeId, principal.getDepartmentId(), pageable)
                    .map(this::toSummary);
        }

        return employeeRepository.findAllByManagerId(managerEmployeeId, pageable)
                .map(this::toSummary);
    }

    @Transactional
    public EmployeeProfileResponse updateProfile(Long employeeId, EmployeeProfileUpdate update) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new BusinessException(ErrorCode.EMPLOYEE_NOT_FOUND, "Employee not found"));

        // Ensure email uniqueness (exclude current employee)
        employeeRepository.findByEmailIgnoreCase(update.email())
                .filter(existing -> !existing.getEmployeeId().equals(employeeId))
                .ifPresent(existing -> {
                    throw new BusinessException(ErrorCode.EMAIL_CONFLICT, "البريد الإلكتروني مستخدم بالفعل");
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
        String departmentName = resolveDepartmentName(employee.getDepartmentId());
        return nfcCardRepository.findByEmployee_EmployeeId(employee.getEmployeeId())
                .map(card -> new EmployeeSummaryResponse(
                        employee.getEmployeeId(),
                        employee.getFullName(),
                        employee.getEmail(),
                        employee.getTeamId(),
                        teamName,
                        employee.getDepartmentId(),
                        departmentName,
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
                        employee.getDepartmentId(),
                        departmentName,
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

    private String resolveRoleNameById(Long roleId) {
        if (roleId == null) return "None";
        return roleRepository.findById(roleId).map(UsersRole::getRoleName).orElse("Unknown");
    }

    private String resolveDepartmentName(Long departmentId) {
        if (departmentId == null) {
            return null;
        }
        return departmentRepository.findById(departmentId).map(Department::getDepartmentName).orElse(null);
    }

    /**
     * Update an employee's profile by an admin/HR user.
     * Allows modification of basic profile fields plus admin-only fields (role, team, salary, status).
     */
    @Transactional
    public EmployeeProfileResponse updateEmployeeByAdmin(Long employeeId, EmployeeAdminUpdate update, Long updatedBy) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new BusinessException(ErrorCode.EMPLOYEE_NOT_FOUND, "Employee not found"));

        // Ensure email uniqueness (exclude current employee)
        employeeRepository.findByEmailIgnoreCase(update.email())
                .filter(existing -> !existing.getEmployeeId().equals(employeeId))
                .ifPresent(existing -> {
                    throw new BusinessException(ErrorCode.EMAIL_CONFLICT, "البريد الإلكتروني مستخدم بالفعل");
                });

        // Track changes for logging
        String oldRole = resolveRoleNameById(employee.getRoleId());
        java.math.BigDecimal oldSalary = employee.getBaseSalary();

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
        if (update.departmentId() != null) {
            employee.setDepartmentId(update.departmentId());
        }
        
        boolean roleChanged = false;
        if (update.roleId() != null && !update.roleId().equals(employee.getRoleId())) {
            employee.setRoleId(update.roleId());
            roleChanged = true;
        }
        
        if (update.managerId() != null) {
            employee.setManagerId(update.managerId());
        }
        
        boolean salaryChanged = false;
        if (update.baseSalary() != null && (oldSalary == null || oldSalary.compareTo(update.baseSalary()) != 0)) {
            employee.setBaseSalary(update.baseSalary());
            salaryChanged = true;
        }
        
        if (update.employmentStatus() != null && !update.employmentStatus().isBlank()) {
            employee.setStatus(update.employmentStatus());
        }

        employeeRepository.save(employee);

        // Audit Logs
        if (roleChanged) {
            String newRole = resolveRoleNameById(employee.getRoleId());
            systemLogRepository.save(com.hrms.core.models.SystemLog.builder()
                .actorId(updatedBy)
                .targetId(employeeId)
                .actionType("ROLE_CHANGE")
                .oldValue(oldRole)
                .newValue(newRole)
                .build());
        }
        if (salaryChanged) {
            systemLogRepository.save(com.hrms.core.models.SystemLog.builder()
                .actorId(updatedBy)
                .targetId(employeeId)
                .actionType("SALARY_CHANGE")
                .oldValue(oldSalary != null ? oldSalary.toString() : "0")
                .newValue(update.baseSalary().toString())
                .build());
        }

        return getProfile(employeeId);
    }

    /**
     * Archive (soft-delete) an employee: sets deleted flag, termination status, audit log, and deactivates NFC cards.
     */
    @Transactional
    public EmployeeDeletionResponse archiveEmployee(Long employeeId, Long archivedBy, String reason) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new BusinessException(ErrorCode.EMPLOYEE_NOT_FOUND, "Employee not found"));

        if (employee.isDeleted() || "Terminated".equalsIgnoreCase(employee.getStatus())) {
            throw new BusinessException(ErrorCode.EMPLOYEE_ALREADY_ARCHIVED, "Employee is already archived");
        }

        String previousStatus = employee.getStatus();
        String archivedByName = employeeRepository.findById(archivedBy)
                .map(Employee::getFullName)
                .orElse("Unknown");

        LocalDateTime archivedAt = LocalDateTime.now();
        employee.setStatus("Terminated");
        employee.setDeleted(true);
        employee.setDeletedAt(archivedAt);
        employeeRepository.save(employee);

        employeeDeletionLogRepository.save(new EmployeeDeletionLog(
                employee.getEmployeeId(),
                archivedBy,
                reason.trim(),
                archivedAt
        ));

        nfcCardRepository.findByEmployee_EmployeeId(employeeId)
                .ifPresent(card -> {
                    card.setStatus("Inactive");
                    nfcCardRepository.save(card);
                });

        return new EmployeeDeletionResponse(
                employee.getEmployeeId(),
                employee.getFullName(),
                employee.getEmail(),
                previousStatus,
                "Terminated",
                archivedBy,
                archivedByName,
                reason.trim(),
                archivedAt
        );
    }

    /**
     * Reset an employee's password to a new secure random password.
     * Returns the plain-text password so HR/Admin can share it with the employee.
     */
    @Transactional
    public PasswordResetResponse resetEmployeePassword(Long employeeId, Long resetBy) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new BusinessException(ErrorCode.EMPLOYEE_NOT_FOUND, "Employee not found"));

        // Generate secure random password
        String newPassword = generateSecurePassword();

        // Store BCrypt hash
        employee.setPasswordHash(passwordEncoder.encode(newPassword));
        employeeRepository.save(employee);

        String resetByName = employeeRepository.findById(resetBy)
                .map(Employee::getFullName)
                .orElse("Unknown");

        return new PasswordResetResponse(
                employee.getEmployeeId(),
                employee.getFullName(),
                employee.getEmail(),
                newPassword,
                resetBy,
                resetByName
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
