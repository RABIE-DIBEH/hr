package com.hrms;

import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

/**
 * Base class for all repository integration tests.
 * Starts a real PostgreSQL container via Testcontainers and configures
 * Spring Data JPA to use it instead of an in-memory database.
 *
 * The container is started once and shared across all tests in the suite
 * (static @Container + @Testcontainers lifecycle).
 */
@Testcontainers
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@ExtendWith(SpringExtension.class)
public abstract class AbstractContainerBaseTest {

    @Container
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("hrms_test")
            .withUsername("test")
            .withPassword("test");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
        // Disable schema.sql / data.sql for integration tests — we manage test data ourselves
        registry.add("spring.sql.init.mode", () -> "never");
        // Don't let the EnvironmentValidator fail (it runs @PostConstruct)
        registry.add("jwt.secret", () -> "TestSecretKeyForIntegrationTestsMustBe32Chars!!");
    }
}
