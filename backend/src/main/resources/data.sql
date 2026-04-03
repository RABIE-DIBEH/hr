-- =============================================================
-- data.sql — auto-runs on every backend startup
-- All inserts use ON CONFLICT DO NOTHING so they're safe
-- to run repeatedly without creating duplicates.
-- =============================================================

-- ── Roles ────────────────────────────────────────────────────
INSERT INTO users_roles (role_name) VALUES ('ADMIN')    ON CONFLICT (role_name) DO NOTHING;
INSERT INTO users_roles (role_name) VALUES ('HR')       ON CONFLICT (role_name) DO NOTHING;
INSERT INTO users_roles (role_name) VALUES ('MANAGER')  ON CONFLICT (role_name) DO NOTHING;
INSERT INTO users_roles (role_name) VALUES ('EMPLOYEE') ON CONFLICT (role_name) DO NOTHING;
INSERT INTO users_roles (role_name) VALUES ('SUPER_ADMIN') ON CONFLICT (role_name) DO NOTHING;

-- ── Teams ────────────────────────────────────────────────────
INSERT INTO teams (name) VALUES ('Engineering') ON CONFLICT (name) DO NOTHING;
INSERT INTO teams (name) VALUES ('Marketing')   ON CONFLICT (name) DO NOTHING;
INSERT INTO teams (name) VALUES ('Sales')       ON CONFLICT (name) DO NOTHING;

-- ── Test Employees ───────────────────────────────────────────
-- Passwords are plain-text here; backend upgrades to BCrypt on first login.
--
--  SUPER_ADMIN → dev@hrms.com       / Dev@1234       (full access to everything)
--  ADMIN       → admin@hrms.com     / Admin@1234
--  HR          → hr@hrms.com        / HR@1234
--  MANAGER     → manager@hrms.com   / Manager@1234
--  EMPLOYEE    → employee@hrms.com  / Employee@1234
--
INSERT INTO employees (full_name, email, password_hash, role_id, team_id, manager_id, base_salary, status)
SELECT 'Dev Super Admin', 'dev@hrms.com', 'Dev@1234',
       (SELECT role_id FROM users_roles WHERE role_name = 'SUPER_ADMIN'),
       NULL, NULL, 20000.00, 'Active'
WHERE NOT EXISTS (SELECT 1 FROM employees WHERE email = 'dev@hrms.com');

INSERT INTO employees (full_name, email, password_hash, role_id, team_id, manager_id, base_salary, status)
SELECT 'System Admin', 'admin@hrms.com', 'Admin@1234',
       (SELECT role_id FROM users_roles WHERE role_name = 'ADMIN'),
       NULL, NULL, 15000.00, 'Active'
WHERE NOT EXISTS (SELECT 1 FROM employees WHERE email = 'admin@hrms.com');

INSERT INTO employees (full_name, email, password_hash, role_id, team_id, manager_id, base_salary, status)
SELECT 'Sara HR', 'hr@hrms.com', 'HR@1234',
       (SELECT role_id FROM users_roles WHERE role_name = 'HR'),
       NULL, NULL, 9000.00, 'Active'
WHERE NOT EXISTS (SELECT 1 FROM employees WHERE email = 'hr@hrms.com');

INSERT INTO employees (full_name, email, password_hash, role_id, team_id, manager_id, base_salary, status)
SELECT 'Khalid Manager', 'manager@hrms.com', 'Manager@1234',
       (SELECT role_id FROM users_roles WHERE role_name = 'MANAGER'),
       (SELECT team_id FROM teams WHERE name = 'Engineering'),
       NULL, 12000.00, 'Active'
WHERE NOT EXISTS (SELECT 1 FROM employees WHERE email = 'manager@hrms.com');

INSERT INTO employees (full_name, email, password_hash, role_id, team_id, manager_id, base_salary, status)
SELECT 'Lina Employee', 'employee@hrms.com', 'Employee@1234',
       (SELECT role_id FROM users_roles WHERE role_name = 'EMPLOYEE'),
       (SELECT team_id FROM teams WHERE name = 'Engineering'),
       (SELECT employee_id FROM employees WHERE email = 'manager@hrms.com'),
       5000.00, 'Active'
WHERE NOT EXISTS (SELECT 1 FROM employees WHERE email = 'employee@hrms.com');

-- ── Sample NFC Card ──────────────────────────────────────────
-- UID: TEST-NFC-UID-0001 → linked to employee@hrms.com
INSERT INTO nfc_cards (uid, employee_id, status)
SELECT 'TEST-NFC-UID-0001',
       (SELECT employee_id FROM employees WHERE email = 'employee@hrms.com'),
       'Active'
WHERE NOT EXISTS (SELECT 1 FROM nfc_cards WHERE uid = 'TEST-NFC-UID-0001');
