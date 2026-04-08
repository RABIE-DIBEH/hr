-- Phase 9: Add Departments System
-- Migration: Creates Departments table + links employees to departments

-- 1. Create Departments table
CREATE TABLE IF NOT EXISTS Departments (
    department_id SERIAL PRIMARY KEY,
    department_name VARCHAR(100) UNIQUE NOT NULL,
    department_code VARCHAR(20) UNIQUE,
    manager_id INT REFERENCES Employees(employee_id),
    description VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Add department_id column to Employees (nullable initially)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'employees' AND column_name = 'department_id'
    ) THEN
        ALTER TABLE Employees ADD COLUMN department_id INT REFERENCES Departments(department_id);
    END IF;
END $$;

-- 3. Seed default departments (only if table is empty)
INSERT INTO Departments (department_name, department_code, description)
SELECT 'Engineering', 'ENG', 'Software development and technical operations'
WHERE NOT EXISTS (SELECT 1 FROM Departments);

INSERT INTO Departments (department_name, department_code, description)
SELECT 'Human Resources', 'HR', 'People operations and talent management'
WHERE NOT EXISTS (SELECT 1 FROM Departments WHERE department_code = 'HR');

INSERT INTO Departments (department_name, department_code, description)
SELECT 'Finance', 'FIN', 'Financial planning and accounting'
WHERE NOT EXISTS (SELECT 1 FROM Departments WHERE department_code = 'FIN');

INSERT INTO Departments (department_name, department_code, description)
SELECT 'Marketing', 'MKT', 'Brand, communications and growth'
WHERE NOT EXISTS (SELECT 1 FROM Departments WHERE department_code = 'MKT');

INSERT INTO Departments (department_name, department_code, description)
SELECT 'Operations', 'OPS', 'Infrastructure and support operations'
WHERE NOT EXISTS (SELECT 1 FROM Departments WHERE department_code = 'OPS');

INSERT INTO Departments (department_name, department_code, description)
SELECT 'General', 'GEN', 'Default department for existing employees'
WHERE NOT EXISTS (SELECT 1 FROM Departments WHERE department_code = 'GEN');

-- 4. Assign all existing employees without a department to "General"
UPDATE Employees
SET department_id = (SELECT department_id FROM Departments WHERE department_code = 'GEN')
WHERE department_id IS NULL
  AND EXISTS (SELECT 1 FROM Departments WHERE department_code = 'GEN');
