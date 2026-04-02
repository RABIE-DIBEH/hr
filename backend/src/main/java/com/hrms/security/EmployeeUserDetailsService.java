package com.hrms.security;

import com.hrms.core.models.Employee;
import com.hrms.core.models.UsersRole;
import com.hrms.core.repositories.EmployeeRepository;
import com.hrms.core.repositories.RoleRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class EmployeeUserDetailsService implements UserDetailsService {

    private final EmployeeRepository employeeRepository;
    private final RoleRepository roleRepository;

    public EmployeeUserDetailsService(EmployeeRepository employeeRepository, RoleRepository roleRepository) {
        this.employeeRepository = employeeRepository;
        this.roleRepository = roleRepository;
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

        return new EmployeeUserDetails(employee, role.getRoleName());
    }
}
