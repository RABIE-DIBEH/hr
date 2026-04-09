-- Rollback Script: Department System Migration
-- Use this to revert the department system if critical issues are found.
-- Prerequisite: Restore from backup first if data loss is a concern.
--   psql -U postgres -d hrms_db < backups/backup_pre_migration_20260409.sql

-- WARNING: This will delete ALL department data and remove department_id from Employees.
-- Only run this if you are certain you want to revert.

BEGIN;

-- 1. Remove department_id column from Employees (cascade drops the FK constraint)
ALTER TABLE Employees DROP COLUMN IF EXISTS department_id CASCADE;

-- 2. Drop the Departments table (cascade drops any dependent objects)
DROP TABLE IF EXISTS Departments CASCADE;

COMMIT;
