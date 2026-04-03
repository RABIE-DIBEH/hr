-- ============================================================
-- HRMS Test Data Seed
-- Run AFTER schema.sql when setting up for development.
-- Roles are already seeded by schema.sql (or DataInitializer).
-- Passwords below are BCrypt hashes of the plain-text shown.
-- The backend auto-migrates plain-text → BCrypt on first login.
-- ============================================================

-- ── Teams (skip if already exist) ──────────────────────────
INSERT INTO Teams (Name) VALUES ('Engineering'), ('Marketing'), ('Sales')
ON CONFLICT (Name) DO NOTHING;

-- ── Roles reference (skip if already exist) ─────────────────
-- RoleId:  1=ADMIN  2=HR  3=MANAGER  4=EMPLOYEE
-- (Seeded by schema.sql or DataInitializer on first boot)

-- ── Test Employees ──────────────────────────────────────────
-- Passwords are stored as plain-text here so the backend's
-- BCrypt auto-migration kicks in on the very first login.
-- After first login each password is upgraded to BCrypt.

INSERT INTO Employees (FullName, Email, PasswordHash, RoleId, TeamId, ManagerId, BaseSalary, Status)
VALUES
  -- ┌─────────────────────────────────────────────────────────┐
  -- │  Role: ADMIN  (RoleId = 1)                              │
  -- │  Email   : admin@hrms.com                               │
  -- │  Password: Admin@1234                                   │
  -- └─────────────────────────────────────────────────────────┘
  ('System Admin', 'admin@hrms.com', 'Admin@1234', 1, NULL, NULL, 15000.00, 'Active'),

  -- ┌─────────────────────────────────────────────────────────┐
  -- │  Role: HR  (RoleId = 2)                                 │
  -- │  Email   : hr@hrms.com                                  │
  -- │  Password: HR@1234                                      │
  -- └─────────────────────────────────────────────────────────┘
  ('Sara HR', 'hr@hrms.com', 'HR@1234', 2, NULL, NULL, 9000.00, 'Active'),

  -- ┌─────────────────────────────────────────────────────────┐
  -- │  Role: MANAGER  (RoleId = 3)                            │
  -- │  Email   : manager@hrms.com                             │
  -- │  Password: Manager@1234                                 │
  -- └─────────────────────────────────────────────────────────┘
  ('Khalid Manager', 'manager@hrms.com', 'Manager@1234', 3, 1, NULL, 12000.00, 'Active'),

  -- ┌─────────────────────────────────────────────────────────┐
  -- │  Role: EMPLOYEE  (RoleId = 4)                           │
  -- │  Email   : employee@hrms.com                            │
  -- │  Password: Employee@1234                                │
  -- └─────────────────────────────────────────────────────────┘
  ('Lina Employee', 'employee@hrms.com', 'Employee@1234', 4, 1, 3, 5000.00, 'Active')

ON CONFLICT (Email) DO NOTHING;

-- ── Sample NFC Card (linked to the test employee) ───────────
-- Insert after employees so the EmployeeId FK is valid.
-- The UID below is what you'd tap to simulate a clock-in.
INSERT INTO NFC_Cards (Uid, EmployeeId, Status)
SELECT 'TEST-NFC-UID-0001', e.EmployeeId, 'Active'
FROM   Employees e
WHERE  e.Email = 'employee@hrms.com'
ON CONFLICT (Uid) DO NOTHING;
