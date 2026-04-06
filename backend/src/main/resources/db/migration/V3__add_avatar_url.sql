-- Migration: Add avatar_url to Employees
-- Date: 2026-04-05

ALTER TABLE Employees ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(500);
