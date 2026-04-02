package com.hrms.api;

import com.hrms.core.models.Employee;
import com.hrms.core.models.Payroll;
import com.hrms.core.repositories.EmployeeRepository;
import com.hrms.security.EmployeeUserDetails;
import com.hrms.services.PayrollService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/payroll")
public class PayrollController {

    private final PayrollService payrollService;
    private final EmployeeRepository employeeRepository;

    public PayrollController(PayrollService payrollService, EmployeeRepository employeeRepository) {
        this.payrollService = payrollService;
        this.employeeRepository = employeeRepository;
    }

    @PostMapping("/calculate")
    public ResponseEntity<Payroll> calculatePayroll(
            @RequestParam(required = false) Long employeeId,
            @RequestParam int month,
            @RequestParam int year,
            @AuthenticationPrincipal EmployeeUserDetails principal) {

        boolean privileged = hasAnyRole(principal, "ROLE_HR", "ROLE_ADMIN");
        Long targetId;
        if (privileged) {
            if (employeeId == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "employeeId is required");
            }
            targetId = employeeId;
        } else {
            if (employeeId != null && !employeeId.equals(principal.getEmployeeId())) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cannot calculate payroll for another employee");
            }
            targetId = principal.getEmployeeId();
        }

        Employee employee = employeeRepository.findById(targetId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Employee not found"));

        return ResponseEntity.ok(payrollService.calculateMonthlyPayroll(employee, month, year));
    }

    private static boolean hasAnyRole(EmployeeUserDetails principal, String... roles) {
        for (String role : roles) {
            if (principal.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals(role))) {
                return true;
            }
        }
        return false;
    }
}
