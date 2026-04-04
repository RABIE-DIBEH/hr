package com.hrms.security;

import com.hrms.core.models.Employee;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

public class EmployeeUserDetails implements UserDetails {

    private final Employee employee;
    private final List<GrantedAuthority> authorities;
    private final String roleName;
    private final String teamName;

    public EmployeeUserDetails(Employee employee, String roleName, String teamName) {
        this.employee = employee;
        this.roleName = roleName;
        this.teamName = teamName;
        this.authorities = List.of(new SimpleGrantedAuthority("ROLE_" + roleName));
    }

    public String getRoleName() {
        return roleName;
    }

    public String getTeamName() {
        return teamName;
    }

    public Long getEmployeeId() {
        return employee.getEmployeeId();
    }

    public Employee getEmployee() {
        return employee;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    @Override
    public String getPassword() {
        return employee.getPasswordHash();
    }

    @Override
    public String getUsername() {
        return employee.getEmail();
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return employee.getStatus() != null && "Active".equalsIgnoreCase(employee.getStatus());
    }
}
