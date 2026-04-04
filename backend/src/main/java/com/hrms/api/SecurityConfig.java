package com.hrms.api;

import com.hrms.security.JwtAuthenticationFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(ex -> ex.authenticationEntryPoint((request, response, authException) -> {
                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    response.setContentType("application/json");
                    response.getWriter().write("{\"message\":\"Unauthorized\"}");
                }))
                .authorizeHttpRequests(auth -> auth
                        // Public endpoints
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers("/api/auth/login").permitAll()
                        
                        // Employee endpoints
                        .requestMatchers(HttpMethod.GET, "/api/employees/me").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/employees/team").hasAnyRole("MANAGER", "SUPER_ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/employees").hasAnyRole("HR", "ADMIN", "SUPER_ADMIN")
                        
                        // Leave endpoints - employees can request/view own, managers/HR process
                        .requestMatchers(HttpMethod.POST, "/api/leaves/request").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/leaves/my-requests").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/leaves/pending").hasAnyRole("MANAGER", "HR", "ADMIN", "SUPER_ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/leaves/all").hasAnyRole("HR", "ADMIN", "SUPER_ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/leaves/process/**").hasAnyRole("MANAGER", "HR", "ADMIN", "SUPER_ADMIN")
                        
                        // Attendance endpoints
                        .requestMatchers(HttpMethod.POST, "/api/attendance/clock").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/attendance").hasAnyRole("HR", "ADMIN", "SUPER_ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/attendance/logs").authenticated()
                        .requestMatchers(HttpMethod.PUT, "/api/attendance/report-fraud/**").hasAnyRole("MANAGER", "HR", "ADMIN", "SUPER_ADMIN")
                        
                        // Advance request endpoints - employees can request/view own, HR/ADMIN process
                        .requestMatchers(HttpMethod.POST, "/api/advances/request").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/advances/my-requests").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/advances/pending").hasAnyRole("HR", "ADMIN", "SUPER_ADMIN", "PAYROLL")
                        .requestMatchers(HttpMethod.GET, "/api/advances/all").hasAnyRole("HR", "ADMIN", "SUPER_ADMIN", "PAYROLL")
                        .requestMatchers(HttpMethod.PUT, "/api/advances/process/**").hasAnyRole("HR", "ADMIN", "SUPER_ADMIN", "PAYROLL")
                        
                        // Recruitment request endpoints - HR/ADMIN can request, managers can view, HR/ADMIN process
                        .requestMatchers(HttpMethod.POST, "/api/recruitment/request").hasAnyRole("HR", "ADMIN", "SUPER_ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/recruitment/pending").hasAnyRole("MANAGER", "HR", "ADMIN", "SUPER_ADMIN", "PAYROLL")
                        .requestMatchers(HttpMethod.GET, "/api/recruitment/my-requests").hasAnyRole("HR", "ADMIN", "SUPER_ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/recruitment/all").hasAnyRole("HR", "ADMIN", "SUPER_ADMIN", "PAYROLL")
                        .requestMatchers(HttpMethod.PUT, "/api/recruitment/process/**").hasAnyRole("MANAGER", "HR", "ADMIN", "SUPER_ADMIN", "PAYROLL")
                        
                        // Payroll endpoints
                        .requestMatchers(HttpMethod.GET, "/api/payroll").hasAnyRole("HR", "ADMIN", "SUPER_ADMIN", "PAYROLL")
                        .requestMatchers(HttpMethod.POST, "/api/payroll/calculate").hasAnyRole("HR", "ADMIN", "SUPER_ADMIN", "PAYROLL")
                        .requestMatchers(HttpMethod.GET, "/api/payroll/**").hasAnyRole("HR", "ADMIN", "SUPER_ADMIN", "PAYROLL")
                        
                        // Admin endpoints - ADMIN/SUPER_ADMIN only
                        .requestMatchers("/api/admin/**").hasAnyRole("ADMIN", "SUPER_ADMIN")
                        
                        // Inbox endpoints - authenticated users can view/manage own inbox
                        .requestMatchers(HttpMethod.GET, "/api/inbox").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/inbox/unread").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/inbox/unread-count").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/inbox/high-priority").authenticated()
                        .requestMatchers(HttpMethod.PUT, "/api/inbox/*/read").authenticated()
                        .requestMatchers(HttpMethod.PUT, "/api/inbox/read-all").authenticated()
                        .requestMatchers(HttpMethod.PUT, "/api/inbox/*/archive").authenticated()
                        .requestMatchers(HttpMethod.POST, "/api/inbox/send").hasAnyRole("ADMIN", "SUPER_ADMIN") // Only admins send messages
                        .requestMatchers(HttpMethod.DELETE, "/api/inbox/**").hasAnyRole("ADMIN", "SUPER_ADMIN") // Only admins delete
                        
                        // Default: all other /api/** require authentication
                        .requestMatchers("/api/**").authenticated()
                )
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of("http://localhost:5173"));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("Authorization", "Content-Type"));
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
