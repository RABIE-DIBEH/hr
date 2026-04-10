package com.hrms.api;

import com.hrms.security.JwtAuthenticationFilter;
import com.hrms.logging.StructuredLoggingFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import java.util.List;

/**
 * Dev profile security config — allows H2 Console access.
 * Only the security filter chain is overridden; shared beans
 * (passwordEncoder, jwtFilter, etc.) come from SecurityConfig.
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@Profile("dev")
public class SecurityConfigDev {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final StructuredLoggingFilter structuredLoggingFilter;

    public SecurityConfigDev(JwtAuthenticationFilter jwtAuthenticationFilter,
                             StructuredLoggingFilter structuredLoggingFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.structuredLoggingFilter = structuredLoggingFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf
                        .ignoringRequestMatchers("/h2-console/**")
                )
                .headers(headers -> headers
                        .frameOptions(frameOptions -> frameOptions.disable())
                )
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // Public endpoints
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers("/h2-console/**").permitAll()
                        .requestMatchers("/api/auth/login").permitAll()
                        .requestMatchers("/swagger-ui/**", "/v3/api-docs/**", "/swagger-ui.html").permitAll()
                        .requestMatchers("/api/health").permitAll()

                        // Employee endpoints
                        .requestMatchers(HttpMethod.GET, "/api/employees/me").authenticated()
                        .requestMatchers(HttpMethod.PUT, "/api/employees/me").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/employees/team").hasAnyRole("MANAGER", "SUPER_ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/employees/search").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/employees").hasAnyRole("HR", "ADMIN", "SUPER_ADMIN", "PAYROLL")
                        .requestMatchers(HttpMethod.POST, "/api/employees/*/archive").hasAnyRole("HR", "ADMIN", "SUPER_ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/employees/*/reset-password").hasAnyRole("HR", "ADMIN", "SUPER_ADMIN", "EMPLOYEE", "MANAGER")

                        // Leave endpoints
                        .requestMatchers(HttpMethod.POST, "/api/leaves/request").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/leaves/my-requests").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/leaves/calendar").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/leaves/pending").hasAnyRole("MANAGER", "HR", "ADMIN", "SUPER_ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/leaves/all").hasAnyRole("HR", "ADMIN", "SUPER_ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/leaves/process/**").hasAnyRole("MANAGER", "HR", "ADMIN", "SUPER_ADMIN")

                        // Attendance endpoints
                        .requestMatchers(HttpMethod.POST, "/api/attendance/nfc-clock").authenticated()
                        .requestMatchers(HttpMethod.POST, "/api/attendance/clock").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/attendance/my").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/attendance/my-records").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/attendance/manager/today").hasAnyRole("MANAGER", "HR", "ADMIN", "SUPER_ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/attendance/**").hasAnyRole("HR", "ADMIN", "SUPER_ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/attendance/logs").authenticated()
                        .requestMatchers(HttpMethod.PUT, "/api/attendance/report-fraud/**").hasAnyRole("MANAGER", "HR", "ADMIN", "SUPER_ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/attendance/verify/**").hasAnyRole("MANAGER", "HR", "ADMIN", "SUPER_ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/attendance/manual-correct/**").hasAnyRole("HR", "ADMIN", "SUPER_ADMIN")

                        // Advance request endpoints
                        .requestMatchers(HttpMethod.POST, "/api/advances/request").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/advances/my-requests").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/advances/pending").hasAnyRole("MANAGER", "PAYROLL", "SUPER_ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/advances/process/**").hasAnyRole("MANAGER", "PAYROLL", "SUPER_ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/advances/approved-awaiting-delivery").hasAnyRole("PAYROLL", "SUPER_ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/advances/delivered").hasAnyRole("PAYROLL", "SUPER_ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/advances/report").hasAnyRole("PAYROLL", "SUPER_ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/advances/deliver/**").hasAnyRole("PAYROLL", "SUPER_ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/advances/deliver-all").hasAnyRole("PAYROLL", "SUPER_ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/advances/all").hasAnyRole("HR", "ADMIN", "PAYROLL", "SUPER_ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/advances/**").authenticated()

                        // NFC card management
                        .requestMatchers(HttpMethod.GET, "/api/nfc-cards/**").hasAnyRole("HR", "ADMIN", "SUPER_ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/nfc-cards/**").hasAnyRole("HR", "ADMIN", "SUPER_ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/nfc-cards/**").hasAnyRole("HR", "ADMIN", "SUPER_ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/nfc-cards/**").hasAnyRole("HR", "ADMIN", "SUPER_ADMIN")

                        // Recruitment request endpoints
                        .requestMatchers(HttpMethod.POST, "/api/recruitment/request").hasAnyRole("HR", "ADMIN", "SUPER_ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/recruitment/my-requests").hasAnyRole("HR", "ADMIN", "SUPER_ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/recruitment/**").hasAnyRole("MANAGER", "HR", "ADMIN", "SUPER_ADMIN", "PAYROLL")
                        .requestMatchers(HttpMethod.PUT, "/api/recruitment/process/**").hasAnyRole("MANAGER", "HR", "ADMIN", "SUPER_ADMIN", "PAYROLL")

                        // Payroll endpoints
                        .requestMatchers(HttpMethod.GET, "/api/payroll/my-slips").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/payroll/history").hasAnyRole("HR", "ADMIN", "SUPER_ADMIN", "PAYROLL")
                        .requestMatchers(HttpMethod.GET, "/api/payroll/monthly").hasAnyRole("PAYROLL", "SUPER_ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/payroll/summary").hasAnyRole("PAYROLL", "SUPER_ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/payroll").hasAnyRole("HR", "ADMIN", "SUPER_ADMIN", "PAYROLL")
                        .requestMatchers(HttpMethod.POST, "/api/payroll/calculate").hasAnyRole("PAYROLL", "SUPER_ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/payroll/calculate-all").hasAnyRole("PAYROLL", "SUPER_ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/payroll/pay").hasAnyRole("PAYROLL", "SUPER_ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/payroll/pay-all").hasAnyRole("PAYROLL", "SUPER_ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/payroll/**").hasAnyRole("HR", "ADMIN", "SUPER_ADMIN", "PAYROLL")

                        // Department endpoints
                        .requestMatchers(HttpMethod.GET, "/api/departments/my").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/departments").hasAnyRole("HR", "ADMIN", "SUPER_ADMIN", "MANAGER")
                        .requestMatchers(HttpMethod.GET, "/api/departments/**").hasAnyRole("HR", "ADMIN", "SUPER_ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/departments").hasAnyRole("HR", "ADMIN", "SUPER_ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/departments/**").hasAnyRole("HR", "ADMIN", "SUPER_ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/departments/**").hasAnyRole("HR", "ADMIN", "SUPER_ADMIN")

                        // Admin endpoints
                        .requestMatchers("/api/admin/**").hasAnyRole("ADMIN", "SUPER_ADMIN")

                        // Inbox endpoints
                        .requestMatchers(HttpMethod.GET, "/api/inbox").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/inbox/unread").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/inbox/unread-count").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/inbox/high-priority").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/inbox/archived").authenticated()
                        .requestMatchers(HttpMethod.PUT, "/api/inbox/*/read").authenticated()
                        .requestMatchers(HttpMethod.PUT, "/api/inbox/read-all").authenticated()
                        .requestMatchers(HttpMethod.PUT, "/api/inbox/*/archive").authenticated()
                        .requestMatchers(HttpMethod.DELETE, "/api/inbox/**").authenticated()
                        .requestMatchers(HttpMethod.POST, "/api/inbox/send").hasAnyRole("ADMIN", "SUPER_ADMIN")

                        // Reports
                        .requestMatchers(HttpMethod.GET, "/api/reports/**").authenticated()

                        // Default: all other /api/** require authentication
                        .requestMatchers("/api/**").authenticated()
                )
                .addFilterBefore(structuredLoggingFilter, UsernamePasswordAuthenticationFilter.class)
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
