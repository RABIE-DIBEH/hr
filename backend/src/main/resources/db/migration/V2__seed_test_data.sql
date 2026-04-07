-- ============================================================
-- HRMS Test Data Seed
-- Run AFTER schema.sql when setting up for development.
-- Roles are already seeded by schema.sql (or DataInitializer).
-- Passwords below are BCrypt hashes of the plain-text shown.
-- The backend auto-migrates plain-text → BCrypt on first login.
-- ============================================================

-- ── Teams (skip if already exist) ──────────────────────────
INSERT INTO Teams (name) VALUES ('Engineering'), ('Marketing'), ('Sales')
ON CONFLICT (name) DO NOTHING;

-- ── Roles reference (skip if already exist) ─────────────────
-- RoleId:  1=ADMIN  2=HR  3=MANAGER  4=EMPLOYEE
-- (Seeded by schema.sql or DataInitializer on first boot)

-- ── Test Employees ──────────────────────────────────────────
-- Passwords are stored as plain-text here so the backend's
-- BCrypt auto-migration kicks in on the very first login.
-- After first login each password is upgraded to BCrypt.

INSERT INTO Employees (full_name, Email, PasswordHash, RoleId, TeamId, ManagerId, BaseSalary, Status)
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
  ('Lina Employee', 'employee@hrms.com', 'Employee@1234', 4, 1, 3, 5000.00, 'Active'),

  -- ┌─────────────────────────────────────────────────────────┐
  -- │  Role: PAYROLL  (RoleId = 6)                            │
  -- │  Email   : payroll@hrms.com                             │
  -- │  Password: Payroll@1234                                 │
  -- └─────────────────────────────────────────────────────────┘
  ('Payroll Specialist', 'payroll@hrms.com', 'Payroll@1234', 6, NULL, NULL, 10000.00, 'Active')

ON CONFLICT (Email) DO NOTHING;

-- ── Sample NFC Card (linked to the test employee) ───────────
-- Insert after employees so the EmployeeId FK is valid.
-- The UID below is what you'd tap to simulate a clock-in.
INSERT INTO NFC_Cards (uid, employee_id, status)
SELECT 'TEST-NFC-UID-0001', e.EmployeeId, 'Active'
FROM   Employees e
WHERE  e.Email = 'employee@hrms.com'
ON CONFLICT (uid) DO NOTHING;

-- ── Sample Inbox Messages ────────────────────────────────────
-- Messages for testing the inbox system
-- Roles: EMPLOYEE, MANAGER, HR, ADMIN, SUPER_ADMIN
INSERT INTO Inbox_Messages (title, message, target_role, sender_name, priority, created_at, read_at, archived)
VALUES
  -- Messages for EMPLOYEE role
  ('مرحباً بك في النظام', 'نرحب بك في نظام إدارة الموارد البشرية. يمكنك الآن الوصول إلى لوحة التحكم الخاصة بك.', 'EMPLOYEE', 'نظام الإدارة', 'LOW', NOW() - INTERVAL 3 DAY, NOW() - INTERVAL 2 DAY, false),
  ('تحديث سياسة الإجازات', 'تم تحديث سياسة الإجازات السنوية. يرجى مراجعة القسم الجديد في نظام الإدارة.', 'EMPLOYEE', 'قسم الموارد البشرية', 'MEDIUM', NOW() - INTERVAL 2 DAY, NULL, false),
  ('تجديد شهادة الأمان والصحة', 'يجب عليك تجديد شهادة الأمان والصحة قبل نهاية الشهر الحالي.', 'EMPLOYEE', 'قسم الموارد البشرية', 'HIGH', NOW() - INTERVAL 1 DAY, NULL, false),
  ('إشعار بتحديث النظام', 'سيتم تحديث النظام غذا الساعة 2:00 صباحاً. قد يحدث انقطاع مؤقت في الخدمة.', 'EMPLOYEE', 'نظام الإدارة', 'MEDIUM', NOW(), NULL, false),

  -- Messages for MANAGER role
  ('تقرير الفريق الأسبوعي', 'يرجى تقديم تقرير الفريق الأسبوعي بحلول يوم الجمعة.', 'MANAGER', 'قسم الموارد البشرية', 'MEDIUM', NOW() - INTERVAL 2 DAY, NOW() - INTERVAL 1 DAY, false),
  ('اجتماع القيادة', 'هناك اجتماع قيادة مهم يوم الثلاثاء في الساعة 10:00 صباحاً.', 'MANAGER', 'نظام الإدارة', 'HIGH', NOW() - INTERVAL 1 DAY, NULL, false),
  ('من فضلك راجع طلبات الإجازة المعلقة', 'هناك عدة طلبات إجازة معلقة بانتظار موافقتك.', 'MANAGER', 'نظام الإدارة', 'HIGH', NOW(), NULL, false),

  -- Messages for HR role
  ('تقرير الموارد البشرية الشهري', 'من فضلك أرسل التقرير الشهري للموارد البشرية في نهاية الشهر.', 'HR', 'قسم الإدارة', 'MEDIUM', NOW() - INTERVAL 2 DAY, NOW() - INTERVAL 1 DAY, false),
  ('معالجة تعويضات الموظفين', 'هناك طلب معالجة تعويضات معلق. يرجى المراجعة والموافقة.', 'HR', 'نظام الإدارة', 'HIGH', NOW() - INTERVAL 1 DAY, NULL, false),
  ('تدريب الموارد البشرية الجديد', 'يتم فتح دورة تدريبية جديدة للموارد البشرية. يرجى التسجيل إذا كنت مهتماً.', 'HR', 'قسم التطوير', 'LOW', NOW(), NULL, false),

  -- Messages for ADMIN role
  ('تقرير الأنظمة', 'قدم تقرير شامل عن حالة جميع الأنظمة.', 'ADMIN', 'نظام المراقبة', 'HIGH', NOW() - INTERVAL 1 DAY, NULL, false),
  ('نسخة احتياطية من قاعدة البيانات', 'تم إكمال النسخة الاحتياطية بنجاح. جميع البيانات آمنة.', 'ADMIN', 'نظام الإدارة', 'LOW', NOW(), NOW(), false),

  -- Messages for ALL roles
  ('إشعار أمني هام', 'تم اكتشاف نشاط مريب. يرجى تحديث كلمات المرور الخاصة بك فوراً.', 'ALL', 'نظام الأمان', 'HIGH', NOW() - INTERVAL 1 DAY, NULL, false);

