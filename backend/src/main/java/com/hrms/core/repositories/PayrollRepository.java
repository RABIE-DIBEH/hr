package com.hrms.core.repositories;

import com.hrms.core.models.Payroll;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PayrollRepository extends JpaRepository<Payroll, Long> {
    Optional<Payroll> findByEmployeeEmployeeIdAndMonthAndYear(Long employeeId, int month, int year);
}
