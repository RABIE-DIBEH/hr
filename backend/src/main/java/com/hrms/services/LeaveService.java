package com.hrms.services;

import com.hrms.core.models.Employee;
import com.hrms.core.models.LeaveRequest;
import com.hrms.core.repositories.EmployeeRepository;
import com.hrms.core.repositories.LeaveRequestRepository;
import com.hrms.security.EmployeeUserDetails;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class LeaveService {

    private final LeaveRequestRepository leaveRequestRepository;
    private final EmployeeRepository employeeRepository;

    public LeaveService(LeaveRequestRepository leaveRequestRepository, EmployeeRepository employeeRepository) {
        this.leaveRequestRepository = leaveRequestRepository;
        this.employeeRepository = employeeRepository;
    }

    @Transactional
    public LeaveRequest submitRequest(Employee employee, LeaveRequest requestData) {
        requestData.setEmployee(employee);
        requestData.setStatus("PENDING_MANAGER");
        return leaveRequestRepository.save(requestData);
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
            return leaveRequestRepository.save(request);
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

    public List<LeaveRequest> getEmployeeRequests(Long employeeId) {
        return leaveRequestRepository.findAllByEmployeeId(employeeId);
    }

    public List<LeaveRequest> getPendingRequestsForManager(Long managerId) {
        return leaveRequestRepository.findPendingRequestsForManager(managerId);
    }

    public List<LeaveRequest> getPendingRequestsForHr() {
        return leaveRequestRepository.findPendingRequestsForHr();
    }
}
