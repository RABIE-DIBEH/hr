-- Migration: Add employee_id and auto_generate_employee_id to Recruitment_Requests
-- Date: 2026-04-05
-- Description: Allows HR to specify employee ID manually or auto-generate it

-- Add employee_id column (nullable, so existing records are not affected)
ALTER TABLE Recruitment_Requests ADD COLUMN IF NOT EXISTS employee_id BIGINT;

-- Add auto_generate_employee_id flag (default false for existing records)
ALTER TABLE Recruitment_Requests ADD COLUMN IF NOT EXISTS auto_generate_employee_id BOOLEAN DEFAULT FALSE;
