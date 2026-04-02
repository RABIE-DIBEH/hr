package com.hrms.services;

import com.hrms.core.models.Employee;
import com.hrms.core.models.LeaveRequest;
import com.hrms.core.repositories.LeaveRequestRepository;
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
    public Optional<LeaveRequest> processRequest(Long requestId, String status, String note) {
        return leaveRequestRepository.findById(requestId).map(request -> {
            request.setStatus(status);
            request.setManagerNote(note);
            request.setProcessedAt(LocalDateTime.now());
            return leaveRequestRepository.save(request);
        });
    }

    public List<LeaveRequest> getEmployeeRequests(Long employeeId) {
        return leaveRequestRepository.findAllByEmployeeId(employeeId);
    }

    public List<LeaveRequest> getPendingRequestsForManager(Long managerId) {
        return leaveRequestRepository.findPendingRequestsForManager(managerId);
    }
}
