package com.hrms.services;

import com.hrms.core.models.Employee;
import com.hrms.core.models.LeaveRequest;
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

    public LeaveService(LeaveRequestRepository leaveRequestRepository) {
        this.leaveRequestRepository = leaveRequestRepository;
    }

    @Transactional
    public LeaveRequest submitRequest(Employee employee, LeaveRequest requestData) {
        requestData.setEmployee(employee);
        requestData.setStatus("Pending");
        return leaveRequestRepository.save(requestData);
    }

    @Transactional
    public Optional<LeaveRequest> processRequest(Long requestId, String status, String note, EmployeeUserDetails principal) {
        return leaveRequestRepository.findById(requestId).map(request -> {
            Employee requester = request.getEmployee();
            if (!canProcessLeave(requester, principal)) {
                throw new AccessDeniedException("Cannot process this leave request");
            }
            request.setStatus(status);
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
}
