package com.hrms.services;

import com.hrms.core.models.Employee;
import com.hrms.core.models.RecruitmentRequest;
import com.hrms.core.models.Team;
import com.hrms.core.models.UsersRole;
import com.hrms.core.repositories.EmployeeRepository;
import com.hrms.core.repositories.RecruitmentRequestRepository;
import com.hrms.core.repositories.RoleRepository;
import com.hrms.core.repositories.TeamRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Map;
import java.util.Optional;

@Service
public class RecruitmentRequestService {

    private final RecruitmentRequestRepository recruitmentRequestRepository;
    private final EmployeeRepository employeeRepository;
    private final RoleRepository roleRepository;
    private final TeamRepository teamRepository;
    private final PasswordEncoder passwordEncoder;
    private final InboxService inboxService;
    private final EmailService emailService;

    public RecruitmentRequestService(RecruitmentRequestRepository recruitmentRequestRepository,
                                   EmployeeRepository employeeRepository,
                                   RoleRepository roleRepository,
                                   TeamRepository teamRepository,
                                   PasswordEncoder passwordEncoder,
                                   InboxService inboxService,
                                   EmailService emailService) {
        this.recruitmentRequestRepository = recruitmentRequestRepository;
        this.employeeRepository = employeeRepository;
        this.roleRepository = roleRepository;
        this.teamRepository = teamRepository;
        this.passwordEncoder = passwordEncoder;
        this.inboxService = inboxService;
        this.emailService = emailService;
    }

    /**
     * Returns the next available auto-generated employee ID.
     * Returns null if no auto-generated IDs have been set yet, meaning
     * the HR manager needs to provide a starting number on the first request.
     */
    public Long generateNextEmployeeId() {
        Long maxId = recruitmentRequestRepository.findMaxEmployeeId();
        if (maxId == null) {
            return null; // No starting number set yet — HR must provide one
        }
        return maxId + 1;
    }

    /**
     * Submit a new recruitment request (Stage 1)
     */
    @Transactional
    public RecruitmentRequest submitRequest(RecruitmentRequest request) {
        // Check for duplicate national ID in active requests
        if (recruitmentRequestRepository.existsActiveByNationalId(request.getNationalId())) {
            throw new IllegalArgumentException("An active request or employee with this national ID already exists");
        }
        
        // Check for duplicate email
        if (employeeRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new IllegalArgumentException("An employee with this email already exists");
        }

        request.setStatus(RecruitmentRequest.STATUS_PENDING_MANAGER);
        request.setRequestedAt(LocalDateTime.now());
        RecruitmentRequest saved;
        try {
            saved = recruitmentRequestRepository.save(request);
        } catch (DataIntegrityViolationException e) {
            throw new IllegalArgumentException("رقم الهوية هذا موجود بالفعل في النظام. لا يمكن إنشاء طلب مكرر.");
        }

        // Notify HR role about new recruitment request
        inboxService.sendMessage(
            "New Recruitment Request",
            "A new recruitment request for " + saved.getJobDescription() + " has been submitted and is pending review.",
            "HR",
            "System",
            null,
            "MEDIUM"
        );

        return saved;
    }

    /**
     * Process a recruitment request (Stage 2 & 3)
     * Returns a map with generated credentials when employee is created (status = Approved).
     */
    @Transactional
    public Map<String, Object> processRequest(Long requestId, String action, String note, BigDecimal adjustedSalary, Long processorId, String processorRole) {
        Optional<RecruitmentRequest> optional = recruitmentRequestRepository.findById(requestId);
        if (optional.isEmpty()) {
            throw new IllegalArgumentException("Recruitment request not found");
        }

        RecruitmentRequest request = optional.get();
        String currentStatus = request.getStatus();

        if (RecruitmentRequest.STATUS_APPROVED.equals(currentStatus) || RecruitmentRequest.STATUS_REJECTED.equals(currentStatus)) {
            throw new IllegalStateException("Request has already been finalized");
        }

        if ("Rejected".equalsIgnoreCase(action)) {
            request.setStatus(RecruitmentRequest.STATUS_REJECTED);
            request.setManagerNote(note);
            request.setProcessedAt(LocalDateTime.now());
            request.setApprovedBy(processorId);

            RecruitmentRequest saved = recruitmentRequestRepository.save(request);

            // Notify the original requester about rejection
            if (saved.getRequestedBy() != null) {
                inboxService.sendPersonalMessage(
                    "Recruitment Request Rejected",
                    "Your recruitment request for " + saved.getJobDescription() + " has been rejected.",
                    saved.getRequestedBy(),
                    "System",
                    null,
                    "HIGH"
                );
            }

            return Map.of("request", saved);
        }

        // Action is "Approved"
        String oldStatus = request.getStatus();
        Map<String, String> credentials = null;

        if (RecruitmentRequest.STATUS_PENDING_MANAGER.equals(currentStatus)) {
            // Manager Approval -> Move to Payroll
            request.setStatus(RecruitmentRequest.STATUS_PENDING_PAYROLL);
            if (adjustedSalary != null) {
                request.setExpectedSalary(adjustedSalary);
            }
        } else if (RecruitmentRequest.STATUS_PENDING_PAYROLL.equals(currentStatus)) {
            // Payroll Approval -> Move to Final Approved and Create Employee
            request.setStatus(RecruitmentRequest.STATUS_APPROVED);
            if (adjustedSalary != null) {
                request.setExpectedSalary(adjustedSalary);
            }
            credentials = createEmployeeFromRequest(request);
        }

        request.setManagerNote(note);
        request.setProcessedAt(LocalDateTime.now());
        request.setApprovedBy(processorId);

        RecruitmentRequest saved = recruitmentRequestRepository.save(request);

        // Notify the original requester about status change
        if (saved.getRequestedBy() != null && !saved.getStatus().equals(oldStatus)) {
            inboxService.sendPersonalMessage(
                "Recruitment Request Updated",
                "Your recruitment request for " + saved.getJobDescription() + " is now " + saved.getStatus().replace("_", " ") + ".",
                saved.getRequestedBy(),
                "System",
                null,
                "MEDIUM"
            );

            // Send email notification for final approval
            if (RecruitmentRequest.STATUS_APPROVED.equals(saved.getStatus())) {
                try {
                    Optional<Employee> requesterOpt = employeeRepository.findById(saved.getRequestedBy());
                    if (requesterOpt.isPresent()) {
                        Employee requester = requesterOpt.get();
                        String emailSubject = "Recruitment Request Approved - " + saved.getFullName();
                        String emailBody = String.format(
                            "Dear %s,\n\nThe recruitment request for %s (%s) has been fully approved.\n" +
                            "Department: %s\nPosition: %s\nApproved Salary: %s\n\n" +
                            "The employee record has been created.\n\nBest regards,\nHRMS Team",
                            requester.getFullName(),
                            saved.getFullName(),
                            saved.getEmail(),
                            saved.getDepartment(),
                            saved.getJobDescription(),
                            saved.getExpectedSalary()
                        );
                        emailService.sendEmail(requester.getEmail(), emailSubject, emailBody);
                    }
                } catch (Exception e) {
                    // Email failure is non-critical
                }
            }
        }

        // Return credentials when employee was created
        if (credentials != null) {
            return Map.of(
                "request", saved,
                "username", credentials.get("username"),
                "password", credentials.get("password"),
                "employeeId", credentials.get("employeeId")
            );
        }

        return Map.of("request", saved);
    }

    /**
     * Create an employee from an approved recruitment request.
     * Generates a unique username and secure random password.
     * Returns a map with the generated credentials.
     */
    private Map<String, String> createEmployeeFromRequest(RecruitmentRequest request) {
        // Find default role and team based on department
        Long roleId = roleRepository.findByRoleName("EMPLOYEE")
                .map(UsersRole::getRoleId).orElse(null);

        Long teamId = teamRepository.findAll().stream()
                .filter(t -> t.getName().equalsIgnoreCase(request.getDepartment()))
                .map(Team::getTeamId)
                .findFirst().orElse(null);

        // Determine the employee ID to use
        Long employeeId = request.getEmployeeId();

        if (Boolean.TRUE.equals(request.getAutoGenerateEmployeeId())) {
            if (employeeId == null) {
                // Auto-generate: find max previous auto-generated ID + 1
                Long maxAutoId = recruitmentRequestRepository.findMaxEmployeeId();
                if (maxAutoId == null) {
                    throw new IllegalStateException(
                        "No starting employee ID has been set yet. " +
                        "Please provide a starting number on the first recruitment request."
                    );
                }
                employeeId = maxAutoId + 1;
            }
            // If employeeId is provided, use it as the starting number (first time or reset)
        }

        // Generate username from full name (e.g., "Ahmad Khalil" -> "ahmad.khalil")
        String username = generateUsername(request.getFullName());

        // Generate secure random password (e.g., "Xk9#mP2qR")
        String password = generateSecurePassword();

        // Create new employee record
        Employee.EmployeeBuilder builder = Employee.builder()
                .fullName(request.getFullName())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(password))
                .roleId(roleId)
                .teamId(teamId)
                .baseSalary(request.getExpectedSalary())
                .status("Active");

        if (employeeId != null) {
            builder.employeeId(employeeId);
        }

        employeeRepository.save(builder.build());

        // Return generated credentials
        return Map.of(
            "username", username,
            "password", password,
            "employeeId", employeeId != null ? employeeId.toString() : "auto-assigned"
        );
    }

    /**
     * Generate a unique username from full name.
     * E.g., "Ahmad Khalil" -> "ahmad.khalil" or "ahmad.khalil2" if taken.
     */
    private String generateUsername(String fullName) {
        String base = fullName.toLowerCase()
                .replaceAll("[^a-z\\s]", "")
                .trim()
                .replaceAll("\\s+", ".");

        // Try base username first, add suffix if email already exists
        String candidate = base;
        int suffix = 1;

        while (employeeRepository.findByEmail(candidate + "@hrms.com").isPresent()) {
            candidate = base + suffix;
            suffix++;
            if (suffix > 100) {
                // Fallback: append random suffix
                candidate = base + System.currentTimeMillis() % 1000;
                break;
            }
        }

        return candidate;
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

    /**
     * Get pending requests for the current user based on their role
     */
    public Page<RecruitmentRequest> getPendingRequestsForRole(String roleName, String department, Pageable pageable) {
        if ("MANAGER".equals(roleName)) {
            // Managers see ALL requests pending manager review (not filtered by department)
            return recruitmentRequestRepository.findByStatus(RecruitmentRequest.STATUS_PENDING_MANAGER, pageable);
        } else if ("PAYROLL".equals(roleName)) {
            // Payroll sees all requests pending payroll review
            return recruitmentRequestRepository.findByStatus(RecruitmentRequest.STATUS_PENDING_PAYROLL, pageable);
        } else if ("HR".equals(roleName) || "ADMIN".equals(roleName) || "SUPER_ADMIN".equals(roleName)) {
            // HR/Admin see everything pending
            return recruitmentRequestRepository.findAllByStatuses(Arrays.asList(
                    RecruitmentRequest.STATUS_PENDING_MANAGER,
                    RecruitmentRequest.STATUS_PENDING_PAYROLL
            ), pageable);
        }
        return Page.empty();
    }

    public Page<RecruitmentRequest> getPendingRequests(Pageable pageable) {
        return recruitmentRequestRepository.findAllByStatuses(Arrays.asList(
                RecruitmentRequest.STATUS_PENDING_MANAGER,
                RecruitmentRequest.STATUS_PENDING_PAYROLL
        ), pageable);
    }

    public Page<RecruitmentRequest> getPendingRequestsByDepartment(String department, Pageable pageable) {
        return recruitmentRequestRepository.findByDepartmentAndStatuses(department, Arrays.asList(
                RecruitmentRequest.STATUS_PENDING_MANAGER,
                RecruitmentRequest.STATUS_PENDING_PAYROLL
        ), pageable);
    }

    public Page<RecruitmentRequest> getUserRequests(Long userId, Pageable pageable) {
        return recruitmentRequestRepository.findByRequestedBy(userId, pageable);
    }

    public Page<RecruitmentRequest> getRequestsByStatus(String status, Pageable pageable) {
        return recruitmentRequestRepository.findByStatus(status, pageable);
    }

    /**
     * Get all recruitment requests regardless of status
     */
    public Page<RecruitmentRequest> getAllRequests(Pageable pageable) {
        return recruitmentRequestRepository.findAllRequests(pageable);
    }

    public Optional<RecruitmentRequest> getRequestById(Long requestId) {
        return recruitmentRequestRepository.findById(requestId);
    }
}
