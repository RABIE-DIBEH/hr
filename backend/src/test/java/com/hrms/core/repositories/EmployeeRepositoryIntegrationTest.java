package com.hrms.core.repositories;

import com.hrms.AbstractContainerBaseTest;
import com.hrms.core.models.Employee;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

class EmployeeRepositoryIntegrationTest extends AbstractContainerBaseTest {

    @Autowired
    private EmployeeRepository repository;

    @BeforeEach
    void setUp() {
        repository.deleteAll();
    }

    @Test
    void saveAndFindByEmail() {
        Employee emp = Employee.builder()
                .fullName("Alice Smith")
                .email("alice@hrms.com")
                .passwordHash("hashed")
                .baseSalary(new BigDecimal("5000"))
                .build();
        repository.save(emp);

        Optional<Employee> found = repository.findByEmail("alice@hrms.com");
        assertThat(found).isPresent();
        assertThat(found.get().getFullName()).isEqualTo("Alice Smith");
    }

    @Test
    void findByEmailIgnoreCase() {
        Employee emp = Employee.builder()
                .fullName("Bob Jones")
                .email("bob@hrms.com")
                .passwordHash("hashed")
                .build();
        repository.save(emp);

        Optional<Employee> found = repository.findByEmailIgnoreCase("BOB@HRMS.COM");
        assertThat(found).isPresent();
        assertThat(found.get().getEmail()).isEqualTo("bob@hrms.com");
    }

    @Test
    void findAllByManagerId_Pagination() {
        Long managerId = 100L;
        // Create 5 employees under this manager
        for (int i = 0; i < 5; i++) {
            repository.save(Employee.builder()
                    .fullName("Report " + i)
                    .email("report" + i + "@hrms.com")
                    .passwordHash("hashed")
                    .managerId(managerId)
                    .build());
        }
        // Create 2 employees under a different manager
        for (int i = 0; i < 2; i++) {
            repository.save(Employee.builder()
                    .fullName("Other " + i)
                    .email("other" + i + "@hrms.com")
                    .passwordHash("hashed")
                    .managerId(200L)
                    .build());
        }

        Page<Employee> page = repository.findAllByManagerId(managerId, PageRequest.of(0, 3));
        assertThat(page.getTotalElements()).isEqualTo(5);
        assertThat(page.getContent()).hasSize(3);
        assertThat(page.getTotalPages()).isEqualTo(2);
        assertThat(page.hasNext()).isTrue();

        Page<Employee> page2 = repository.findAllByManagerId(managerId, PageRequest.of(1, 3));
        assertThat(page2.getContent()).hasSize(2);
        assertThat(page2.hasNext()).isFalse();
    }

    @Test
    void searchByQuery_FindsByName() {
        repository.save(Employee.builder()
                .fullName("John Doe")
                .email("john@hrms.com")
                .passwordHash("hashed")
                .build());
        repository.save(Employee.builder()
                .fullName("Jane Smith")
                .email("jane@hrms.com")
                .passwordHash("hashed")
                .build());

        List<Employee> results = repository.searchByQuery("john");
        assertThat(results).hasSize(1);
        assertThat(results.get(0).getFullName()).isEqualTo("John Doe");
    }

    @Test
    void searchByQuery_FindsByEmail() {
        repository.save(Employee.builder()
                .fullName("Alice Wonder")
                .email("alice.wonder@hrms.com")
                .passwordHash("hashed")
                .build());

        List<Employee> results = repository.searchByQuery("alice.wonder");
        assertThat(results).hasSize(1);
    }

    @Test
    void searchByQuery_CaseInsensitive() {
        repository.save(Employee.builder()
                .fullName("Test User")
                .email("test@hrms.com")
                .passwordHash("hashed")
                .build());

        List<Employee> results = repository.searchByQuery("TEST");
        assertThat(results).hasSize(1);
    }

    @Test
    void findAll_PaginationAndSorting() {
        for (int i = 0; i < 10; i++) {
            repository.save(Employee.builder()
                    .fullName("Employee " + i)
                    .email("emp" + i + "@hrms.com")
                    .passwordHash("hashed")
                    .build());
        }

        Page<Employee> page = repository.findAll(
                PageRequest.of(0, 5, Sort.by("fullName").ascending()));

        assertThat(page.getTotalElements()).isEqualTo(10);
        assertThat(page.getContent()).hasSize(5);
        assertThat(page.hasNext()).isTrue();
        // Verify sorting
        assertThat(page.getContent().get(0).getFullName())
                .isEqualTo("Employee 0");
    }
}
