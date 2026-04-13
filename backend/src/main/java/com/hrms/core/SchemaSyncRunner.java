package com.hrms.core;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * A one-time runner to synchronize database column lengths.
 * Hibernate's ddl-auto=update does not increase column lengths in existing PostgreSQL tables.
 */
@Component
public class SchemaSyncRunner implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(SchemaSyncRunner.class);
    private final JdbcTemplate jdbcTemplate;

    public SchemaSyncRunner(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(String... args) {
        logger.info("🚀 Starting Database Schema Synchronization...");
        
        try {
            // Increase column lengths for Employee address and avatarUrl
            // We use ALTER TABLE ... TYPE VARCHAR(2000)
            // PostgreSQL handles this safely for VARCHAR
            
            logger.info("Increasing address column length to TEXT...");
            jdbcTemplate.execute("ALTER TABLE employees ALTER COLUMN address TYPE TEXT");
            
            logger.info("Increasing avatar_url column length to TEXT...");
            jdbcTemplate.execute("ALTER TABLE employees ALTER COLUMN avatar_url TYPE TEXT");
            
            logger.info("✅ Database Schema Synchronization completed successfully.");
        } catch (Exception e) {
            logger.warn("⚠️ Database Schema Synchronization encountered an issue (it may have already been applied): {}", e.getMessage());
        }
    }
}
