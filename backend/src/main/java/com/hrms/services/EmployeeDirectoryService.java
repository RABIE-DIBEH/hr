package com.hrms.services;

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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class EmployeeDirectoryService {

    private final EmployeeRepository employeeRepository;
    private final TeamRepository teamRepository;
    private final RoleRepository roleRepository;
    private final NFCCardRepository nfcCardRepository;

    public EmployeeDirectoryService(
            EmployeeRepository employeeRepository,
            TeamRepository teamRepository,
            RoleRepository roleRepository,
            NFCCardRepository nfcCardRepository) {
        this.employeeRepository = employeeRepository;
        this.teamRepository = teamRepository;
        this.roleRepository = roleRepository;
        this.nfcCardRepository = nfcCardRepository;
    }

    public EmployeeProfileResponse getProfile(Long employeeId) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Employee not found"));

        String teamName = resolveTeamName(employee.getTeamId());
        String roleName = roleRepository.findById(employee.getRoleId())
                .map(UsersRole::getRoleName)
                .orElse("");

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
                        employee.getStatus()
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
                        employee.getStatus()
                ));
    }

    private String resolveTeamName(Long teamId) {
        if (teamId == null) {
            return null;
        }
        return teamRepository.findById(teamId).map(Team::getName).orElse(null);
    }
}
