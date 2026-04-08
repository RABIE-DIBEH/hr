package com.hrms.security;

import com.hrms.core.models.Department;
import com.hrms.core.models.Employee;
import com.hrms.core.models.Team;
import com.hrms.core.models.UsersRole;
import com.hrms.core.repositories.DepartmentRepository;
import com.hrms.core.repositories.EmployeeRepository;
import com.hrms.core.repositories.RoleRepository;
import com.hrms.core.repositories.TeamRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class EmployeeUserDetailsService implements UserDetailsService {

    private final EmployeeRepository employeeRepository;
    private final RoleRepository roleRepository;
    private final TeamRepository teamRepository;
    private final DepartmentRepository departmentRepository;

    public EmployeeUserDetailsService(EmployeeRepository employeeRepository,
                                    RoleRepository roleRepository,
                                    TeamRepository teamRepository,
                                    DepartmentRepository departmentRepository) {
        this.employeeRepository = employeeRepository;
        this.roleRepository = roleRepository;
        this.teamRepository = teamRepository;
        this.departmentRepository = departmentRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String email) {
        Employee employee = employeeRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + email));

        if (employee.getRoleId() == null) {
            throw new UsernameNotFoundException("User has no role assigned");
        }

        UsersRole role = roleRepository.findById(employee.getRoleId())
                .orElseThrow(() -> new UsernameNotFoundException("Role not found for user"));

        String teamName = null;
        if (employee.getTeamId() != null) {
            teamName = teamRepository.findById(employee.getTeamId())
                    .map(Team::getName)
                    .orElse(null);
        }

        String departmentName = null;
        if (employee.getDepartmentId() != null) {
            departmentName = departmentRepository.findById(employee.getDepartmentId())
                    .map(Department::getDepartmentName)
                    .orElse(null);
        }

        return new EmployeeUserDetails(employee, role.getRoleName(), teamName, departmentName);
    }
}
