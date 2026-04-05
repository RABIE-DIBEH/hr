package com.hrms.services;

import com.hrms.core.models.Employee;
import com.hrms.core.models.LeaveRequest;
import com.hrms.core.repositories.EmployeeRepository;
import com.hrms.core.repositories.LeaveRequestRepository;
import com.hrms.security.EmployeeUserDetails;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class LeaveService {

    private final LeaveRequestRepository leaveRequestRepository;
    private final EmployeeRepository employeeRepository;
    private final InboxService inboxService;
    private final EmailService emailService;

    public LeaveService(LeaveRequestRepository leaveRequestRepository,
                        EmployeeRepository employeeRepository,
                        InboxService inboxService,
                        EmailService emailService) {
        this.leaveRequestRepository = leaveRequestRepository;
        this.employeeRepository = employeeRepository;
        this.inboxService = inboxService;
        this.emailService = emailService;
    }

    @Transactional
    public LeaveRequest submitRequest(Employee employee, LeaveRequest requestData) {
        requestData.setEmployee(employee);
        requestData.setStatus("PENDING_MANAGER");
        LeaveRequest saved = leaveRequestRepository.save(requestData);

        // Notify specific manager if exists, otherwise notify general MANAGER role
        if (employee.getManagerId() != null) {
            inboxService.sendPersonalMessage(
                "New Leave Request",
                "Employee " + employee.getFullName() + " has submitted a leave request for " + saved.getLeaveType() + ".",
                employee.getManagerId(),
                "System",
                "MEDIUM"
            );
        } else {
            inboxService.sendMessage(
                "New Leave Request",
                "Employee " + employee.getFullName() + " has submitted a leave request for " + saved.getLeaveType() + ".",
                "MANAGER",
                "System",
                "MEDIUM"
            );
        }

        return saved;
    }

    @Transactional
    public Optional<LeaveRequest> processRequest(Long requestId, String status, String note, EmployeeUserDetails principal) {
        return leaveRequestRepository.findById(requestId).map(request -> {
            Employee requester = request.getEmployee();
            if (!canProcessLeave(requester, principal)) {
                throw new AccessDeniedException("Cannot process this leave request");
            }

            boolean isManager = principal.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_MANAGER"));
            boolean isHrOrAdmin = principal.getAuthorities().stream().anyMatch(a -> 
                a.getAuthority().equals("ROLE_HR") || a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ROLE_SUPER_ADMIN"));

            String oldStatus = request.getStatus();
            if ("REJECTED".equalsIgnoreCase(status)) {
                request.setStatus("REJECTED");
            } else if ("APPROVED".equalsIgnoreCase(status)) {
                if (isManager && "PENDING_MANAGER".equals(request.getStatus()) && !isHrOrAdmin) {
                    request.setStatus("PENDING_HR");
                } else if (isHrOrAdmin) {
                    request.setStatus("APPROVED");
                    
                    // Deduct balance
                    if ("HOURLY".equalsIgnoreCase(request.getLeaveType()) || "ساعية".equals(request.getLeaveType())) {
                        double current = requester.getOvertimeBalanceHours() != null ? requester.getOvertimeBalanceHours() : 0.0;
                        requester.setOvertimeBalanceHours(current - request.getDuration());
                    } else {
                        double current = requester.getLeaveBalanceDays() != null ? requester.getLeaveBalanceDays() : 0.0;
                        requester.setLeaveBalanceDays(current - request.getDuration());
                    }
                    employeeRepository.save(requester);
                } else {
                    request.setStatus("APPROVED");
                }
            } else {
                request.setStatus(status);
            }
            
            request.setManagerNote(note);
            request.setProcessedAt(LocalDateTime.now());
            LeaveRequest saved = leaveRequestRepository.save(request);

            // Notify Employee if status changed to a final state or PENDING_HR
            if (!saved.getStatus().equals(oldStatus)) {
                String title = "Leave Request Update";
                String message = "Your leave request for " + saved.getLeaveType() + " is now " + saved.getStatus().replace("_", " ") + ".";
                if (note != null && !note.isBlank()) {
                    message += " Note: " + note;
                }
                
                inboxService.sendPersonalMessage(
                    title,
                    message,
                    requester.getEmployeeId(),
                    "HR/Manager",
                    saved.getStatus().equals("REJECTED") ? "HIGH" : "MEDIUM"
                );

                // Send email notification
                try {
                    String emailSubject = "Leave Request " + saved.getStatus().replace("_", " ");
                    String emailBody = String.format(
                        "Dear %s,\n\nYour leave request for %s from %s to %s has been %s.\n%s\n\nBest regards,\nHRMS Team",
                        requester.getFullName(),
                        saved.getLeaveType(),
                        saved.getStartDate(),
                        saved.getEndDate(),
                        saved.getStatus().replace("_", " ").toLowerCase(),
                        note != null && !note.isBlank() ? "Manager Note: " + note : ""
                    );
                    emailService.sendEmail(requester.getEmail(), emailSubject, emailBody);
                } catch (Exception e) {
                    // Email failure is non-critical; log but don't fail the transaction
                }

                // If it moved to PENDING_HR, notify HR role
                if ("PENDING_HR".equals(saved.getStatus())) {
                    inboxService.sendMessage(
                        "Leave Request Awaiting HR Approval",
                        "A leave request from " + requester.getFullName() + " has been approved by their manager and is now awaiting HR final review.",
                        "HR",
                        "System",
                        "MEDIUM"
                    );
                }
            }

            return saved;
        });
    }

    private boolean canProcessLeave(Employee requester, EmployeeUserDetails principal) {
        for (var a : principal.getAuthorities()) {
            if ("ROLE_ADMIN".equals(a.getAuthority()) || "ROLE_HR".equals(a.getAuthority())) {
                return true;
            }
            if ("ROLE_MANAGER".equals(a.getAuthority())) {
                return requester.getManagerId() != null && requester.getManagerId().equals(principal.getEmployeeId());
            }
        }
        return false;
    }

    public Page<LeaveRequest> getEmployeeRequests(Long employeeId, Pageable pageable) {
        return leaveRequestRepository.findAllByEmployeeId(employeeId, pageable);
    }

    public Page<LeaveRequest> getPendingRequestsForManager(Long managerId, Pageable pageable) {
        return leaveRequestRepository.findPendingRequestsForManager(managerId, pageable);
    }

    public Page<LeaveRequest> getPendingRequestsForHr(Pageable pageable) {
        return leaveRequestRepository.findPendingRequestsForHr(pageable);
    }

    /**
     * Get all leaves (Approved/Pending) within a date range for the calendar view.
     */
    public java.util.List<LeaveRequest> getAllLeavesInRange(java.time.LocalDate start, java.time.LocalDate end) {
        return leaveRequestRepository.findAllInRange(start, end);
    }
}
