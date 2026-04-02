package com.hrms.services;

import com.hrms.core.models.Employee;
import com.hrms.core.repositories.EmployeeRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Service
public class AuthService {

    private final EmployeeRepository employeeRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(EmployeeRepository employeeRepository, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.employeeRepository = employeeRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    public Optional<String> login(String email, String password) {
        return employeeRepository.findByEmail(email)
                .filter(employee -> password.equals(employee.getPasswordHash())) // Simplified for now, should use passwordEncoder.matches
                .map(employee -> {
                    Map<String, Object> claims = new HashMap<>();
                    claims.put("role", employee.getRoleId());
                    return jwtService.generateToken(employee.getEmail(), claims);
                });
    }
}
