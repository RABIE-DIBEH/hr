-- =============================================================================
-- HRMS Master Seed v1
-- Clean-room seed data for a fresh installation.
-- Run AFTER master_schema_v1.sql.
--
-- This file is IDEMPOTENT — safe to run multiple times.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- TEAMS
-- ---------------------------------------------------------------------------
INSERT INTO Teams (name)
VALUES ('Engineering'), ('Marketing'), ('Sales'), ('HR'), ('Operations')
ON CONFLICT (name) DO NOTHING;

-- ---------------------------------------------------------------------------
-- EMPLOYEES
-- Passwords are stored as plain-text so the backend's BCrypt
-- auto-migration upgrades them on first login.
-- Role IDs:  1=ADMIN  2=HR  3=MANAGER  4=EMPLOYEE  5=SUPER_ADMIN  6=PAYROLL
-- ---------------------------------------------------------------------------
INSERT INTO Employees (full_name, email, password_hash, role_id, team_id, manager_id, base_salary, status, department_id)
VALUES
    -- ┌─────────────────────────────────────────────────────────┐
    -- │  SUPER_ADMIN — full system access                        │
    -- │  Email   : superadmin@hrms.com  Password: SuperAdmin@1   │
    -- └─────────────────────────────────────────────────────────┘
    ('Super Admin',    'superadmin@hrms.com', 'SuperAdmin@1',    5, NULL, NULL, 0.00,      'Active',
     (SELECT department_id FROM Departments WHERE department_code='GEN')),

    -- ┌─────────────────────────────────────────────────────────┐
    -- │  ADMIN                                                   │
    -- │  Email   : admin@hrms.com       Password: Admin@1234     │
    -- └─────────────────────────────────────────────────────────┘
    ('System Admin',   'admin@hrms.com',      'Admin@1234',       1, NULL, NULL, 15000.00,  'Active',
     (SELECT department_id FROM Departments WHERE department_code='GEN')),

    -- ┌─────────────────────────────────────────────────────────┐
    -- │  HR                                                      │
    -- │  Email   : hr@hrms.com          Password: HR@1234        │
    -- └─────────────────────────────────────────────────────────┘
    ('Sara HR',        'hr@hrms.com',          'HR@1234',          2, NULL, NULL, 9000.00,   'Active',
     (SELECT department_id FROM Departments WHERE department_code='HR')),

    -- ┌─────────────────────────────────────────────────────────┐
    -- │  PAYROLL                                                 │
    -- │  Email   : payroll@hrms.com     Password: Payroll@1234   │
    -- └─────────────────────────────────────────────────────────┘
    ('Payroll Officer', 'payroll@hrms.com',    'Payroll@1234',     6, NULL, NULL, 10000.00,  'Active',
     (SELECT department_id FROM Departments WHERE department_code='FIN')),

    -- ┌─────────────────────────────────────────────────────────┐
    -- │  MANAGER                                                 │
    -- │  Email   : manager@hrms.com     Password: Manager@1234   │
    -- └─────────────────────────────────────────────────────────┘
    ('Khalid Manager', 'manager@hrms.com',     'Manager@1234',     3,
     (SELECT team_id FROM Teams WHERE name='Engineering'),
     NULL, 12000.00, 'Active',
     (SELECT department_id FROM Departments WHERE department_code='ENG')),

    -- ┌─────────────────────────────────────────────────────────┐
    -- │  EMPLOYEE                                                │
    -- │  Email   : employee@hrms.com    Password: Employee@1234  │
    -- └─────────────────────────────────────────────────────────┘
    ('Lina Employee',  'employee@hrms.com',    'Employee@1234',    4,
     (SELECT team_id FROM Teams WHERE name='Engineering'),
     (SELECT employee_id FROM Employees WHERE email='manager@hrms.com'),
     5000.00, 'Active',
     (SELECT department_id FROM Departments WHERE department_code='ENG'))

ON CONFLICT (email) DO NOTHING;

-- ---------------------------------------------------------------------------
-- NFC CARD for the test employee
-- ---------------------------------------------------------------------------
INSERT INTO NFC_Cards (uid, employee_id, status)
SELECT 'TEST-NFC-UID-0001', e.employee_id, 'Active'
FROM   Employees e
WHERE  e.email = 'employee@hrms.com'
ON CONFLICT (uid) DO NOTHING;

-- ---------------------------------------------------------------------------
-- INBOX MESSAGES  (bilingual — Arabic titles for demonstration)
-- ---------------------------------------------------------------------------
INSERT INTO Inbox_Messages (title, message, target_role, sender_name, priority, created_at, read_at, archived)
VALUES
    -- EMPLOYEE messages
    ('مرحباً بك في النظام',
     'نرحب بك في نظام إدارة الموارد البشرية. يمكنك الآن الوصول إلى لوحة التحكم الخاصة بك.',
     'EMPLOYEE', 'نظام الإدارة',   'LOW',    NOW() - INTERVAL '3 days', NOW() - INTERVAL '2 days', false),

    ('تحديث سياسة الإجازات',
     'تم تحديث سياسة الإجازات السنوية. يرجى مراجعة القسم الجديد في نظام الإدارة.',
     'EMPLOYEE', 'قسم الموارد البشرية', 'MEDIUM', NOW() - INTERVAL '2 days', NULL, false),

    ('تجديد شهادة الأمان',
     'يجب عليك تجديد شهادة الأمان والصحة قبل نهاية الشهر الحالي.',
     'EMPLOYEE', 'قسم الموارد البشرية', 'HIGH',   NOW() - INTERVAL '1 day',  NULL, false),

    -- MANAGER messages
    ('تقرير الفريق الأسبوعي',
     'يرجى تقديم تقرير الفريق الأسبوعي بحلول يوم الجمعة.',
     'MANAGER',  'قسم الموارد البشرية', 'MEDIUM', NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day', false),

    ('اجتماع القيادة',
     'هناك اجتماع قيادة مهم يوم الثلاثاء في الساعة 10:00 صباحاً.',
     'MANAGER',  'نظام الإدارة',   'HIGH',   NOW() - INTERVAL '1 day',  NULL, false),

    -- HR messages
    ('تقرير الموارد البشرية الشهري',
     'من فضلك أرسل التقرير الشهري للموارد البشرية في نهاية الشهر.',
     'HR',       'قسم الإدارة',    'MEDIUM', NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day', false),

    -- ADMIN messages
    ('تقرير الأنظمة',
     'قدم تقرير شامل عن حالة جميع الأنظمة.',
     'ADMIN',    'نظام المراقبة',  'HIGH',   NOW() - INTERVAL '1 day',  NULL, false),

    -- ALL-roles security alert
    ('إشعار أمني هام',
     'تم اكتشاف نشاط مريب. يرجى تحديث كلمات المرور الخاصة بك فوراً.',
     'ALL',      'نظام الأمان',    'HIGH',   NOW() - INTERVAL '1 day',  NULL, false);

-- ---------------------------------------------------------------------------
-- ATTENDANCE DATA for test employee (April 2026, 20 working days)
-- Matches seed_test_attendance.sql but uses sub-select for employee_id.
-- ---------------------------------------------------------------------------
DO $$
DECLARE
    v_emp_id INT;
BEGIN
    SELECT employee_id INTO v_emp_id FROM Employees WHERE email = 'employee@hrms.com';
    IF v_emp_id IS NOT NULL THEN
        INSERT INTO Attendance_Records
            (employee_id, check_in, check_out, work_hours, status, is_verified_by_manager)
        VALUES
            (v_emp_id, '2026-04-01 08:00', '2026-04-01 16:30', 8.50, 'Normal', true),
            (v_emp_id, '2026-04-02 08:15', '2026-04-02 16:45', 8.50, 'Normal', true),
            (v_emp_id, '2026-04-03 07:50', '2026-04-03 16:00', 8.17, 'Normal', true),
            (v_emp_id, '2026-04-04 08:30', '2026-04-04 17:00', 8.50, 'Normal', true),
            (v_emp_id, '2026-04-05 08:00', '2026-04-05 16:30', 8.50, 'Normal', true),
            (v_emp_id, '2026-04-06 08:10', '2026-04-06 16:40', 8.50, 'Normal', true),
            (v_emp_id, '2026-04-07 08:00', '2026-04-07 17:30', 9.50, 'Normal', true),
            (v_emp_id, '2026-04-08 08:05', '2026-04-08 16:35', 8.50, 'Normal', true),
            (v_emp_id, '2026-04-09 08:00', '2026-04-09 16:00', 8.00, 'Normal', true),
            (v_emp_id, '2026-04-10 08:20', '2026-04-10 16:50', 8.50, 'Normal', true),
            (v_emp_id, '2026-04-11 08:00', '2026-04-11 16:30', 8.50, 'Normal', true),
            (v_emp_id, '2026-04-12 08:00', '2026-04-12 16:30', 8.50, 'Normal', true),
            (v_emp_id, '2026-04-13 08:00', '2026-04-13 18:00', 10.00, 'Normal', true),
            (v_emp_id, '2026-04-14 08:00', '2026-04-14 16:30', 8.50, 'Normal', true),
            (v_emp_id, '2026-04-15 08:00', '2026-04-15 16:30', 8.50, 'Normal', true),
            (v_emp_id, '2026-04-16 08:00', '2026-04-16 16:30', 8.50, 'Normal', true),
            (v_emp_id, '2026-04-17 08:00', '2026-04-17 16:30', 8.50, 'Normal', true),
            (v_emp_id, '2026-04-18 08:00', '2026-04-18 16:30', 8.50, 'Normal', true),
            (v_emp_id, '2026-04-19 08:00', '2026-04-19 16:30', 8.50, 'Normal', true),
            (v_emp_id, '2026-04-20 08:00', '2026-04-20 16:30', 8.50, 'Normal', true)
        ON CONFLICT DO NOTHING;
    END IF;
END $$;
-- Total: ~172.17 hours | base 5000 SAR → net ≈ 5,380 SAR (❄️ locked until May 2026)
