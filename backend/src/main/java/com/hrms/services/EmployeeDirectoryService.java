package com.hrms.services;

import com.hrms.api.dto.EmployeeProfileResponse;
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
                employee.getStatus()
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
