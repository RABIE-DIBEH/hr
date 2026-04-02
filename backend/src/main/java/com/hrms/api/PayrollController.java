package com.hrms.api;

import com.hrms.core.models.Employee;
import com.hrms.core.models.Payroll;
import com.hrms.services.PayrollService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/payroll")
public class PayrollController {

    private final PayrollService payrollService;

    public PayrollController(PayrollService payrollService) {
        this.payrollService = payrollService;
    }

    @PostMapping("/calculate")
    public ResponseEntity<Payroll> calculatePayroll(
            @RequestParam Long employeeId,
            @RequestParam int month,
            @RequestParam int year) {
        
        Employee mockEmployee = Employee.builder()
                .employeeId(employeeId)
                .baseSalary(new java.math.BigDecimal("3000.00"))
                .build();
                
        return ResponseEntity.ok(payrollService.calculateMonthlyPayroll(mockEmployee, month, year));
    }
}
