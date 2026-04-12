-- =============================================================================
-- HRMS Master Schema v1
-- Single-file clean-room installation script.
-- Run this ONCE on a fresh/empty database to create all tables and indexes.
-- After this completes, run master_seed_v1.sql for seed data.
--
-- Supersedes (do NOT re-run separately):
--   schema.sql, add_departments_schema.sql, add_employee_soft_delete.sql,
--   add_avatar_url_to_employees.sql, add_employee_id_to_recruitment.sql,
--   fix_recruitment_national_id_constraint.sql
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. ROLES TABLE
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS Users_Roles (
    role_id   SERIAL PRIMARY KEY,
    role_name VARCHAR(50) UNIQUE NOT NULL
);

-- ---------------------------------------------------------------------------
-- 2. TEAMS TABLE
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS Teams (
    team_id    SERIAL PRIMARY KEY,
    name       VARCHAR(100) UNIQUE NOT NULL,
    manager_id INT
);

-- ---------------------------------------------------------------------------
-- 3. DEPARTMENTS TABLE
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS Departments (
    department_id   SERIAL PRIMARY KEY,
    department_name VARCHAR(100) UNIQUE NOT NULL,
    department_code VARCHAR(20) UNIQUE,
    manager_id      INT, -- FK added after Employees table is created
    description     VARCHAR(500),
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------------
-- 4. EMPLOYEES TABLE (all columns merged from all patches)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS Employees (
    employee_id             SERIAL PRIMARY KEY,
    full_name               VARCHAR(255) NOT NULL,
    email                   VARCHAR(150) UNIQUE NOT NULL,
    password_hash           TEXT NOT NULL,
    team_id                 INT REFERENCES Teams(team_id),
    role_id                 INT REFERENCES Users_Roles(role_id),
    manager_id              INT REFERENCES Employees(employee_id),
    department_id           INT REFERENCES Departments(department_id),
    base_salary             DECIMAL(12, 2) DEFAULT 0.00,
    status                  VARCHAR(20)    DEFAULT 'Active',
    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    leave_balance_days      DOUBLE PRECISION DEFAULT 21.0,
    overtime_balance_hours  DOUBLE PRECISION DEFAULT 0.0,
    mobile_number           VARCHAR(20),
    address                 VARCHAR(500),
    national_id             VARCHAR(20),
    avatar_url              VARCHAR(500),
    deleted                 BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at              TIMESTAMP
);

-- Set the Departments.manager_id FK now that Employees exists
ALTER TABLE Departments
    ADD CONSTRAINT fk_dept_manager
    FOREIGN KEY (manager_id) REFERENCES Employees(employee_id);

-- ---------------------------------------------------------------------------
-- 5. EMPLOYEE ARCHIVE AUDIT LOG
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS employee_deletion_logs (
    id                          BIGSERIAL PRIMARY KEY,
    employee_id                 BIGINT NOT NULL,
    performed_by_employee_id    BIGINT NOT NULL,
    reason                      VARCHAR(2000) NOT NULL,
    deleted_at                  TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_employee_deletion_logs_employee_id
    ON employee_deletion_logs (employee_id);

-- ---------------------------------------------------------------------------
-- 6. NFC CARDS TABLE
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS NFC_Cards (
    card_id     SERIAL PRIMARY KEY,
    uid         VARCHAR(50) UNIQUE NOT NULL,
    employee_id INT REFERENCES Employees(employee_id) ON DELETE CASCADE,
    status      VARCHAR(20)  DEFAULT 'Active',
    issued_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------------
-- 7. ATTENDANCE RECORDS TABLE
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS Attendance_Records (
    record_id               SERIAL PRIMARY KEY,
    employee_id             INT REFERENCES Employees(employee_id),
    check_in                TIMESTAMP,
    check_out               TIMESTAMP,
    work_hours              DECIMAL(5, 2),
    status                  VARCHAR(50)    DEFAULT 'Normal',
    is_verified_by_manager  BOOLEAN        DEFAULT FALSE,
    verified_at             TIMESTAMP,
    manager_notes           TEXT,
    review_status           VARCHAR(50)    DEFAULT 'PENDING_REVIEW',
    payroll_status          VARCHAR(50)    DEFAULT 'PENDING_APPROVAL',
    manually_adjusted       BOOLEAN        DEFAULT FALSE,
    manually_adjusted_at    TIMESTAMP,
    manually_adjusted_by    BIGINT,
    manual_adjustment_reason TEXT
);

-- ---------------------------------------------------------------------------
-- 8. LEAVE REQUESTS TABLE
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS Leave_Requests (
    request_id   SERIAL PRIMARY KEY,
    employee_id  INT REFERENCES Employees(employee_id),
    leave_type   VARCHAR(50)  NOT NULL,
    start_date   DATE NOT NULL,
    end_date     DATE NOT NULL,
    duration     INT,
    reason       TEXT,
    status       VARCHAR(20)  DEFAULT 'Pending',
    manager_note TEXT,
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP
);

-- ---------------------------------------------------------------------------
-- 9. PAYROLL TABLE
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS Payroll (
    payroll_id          SERIAL PRIMARY KEY,
    employee_id         INT REFERENCES Employees(employee_id),
    month               INT NOT NULL,
    year                INT NOT NULL,
    total_work_hours    DECIMAL(10, 2),
    overtime_hours      DECIMAL(10, 2),
    advance_deductions  DECIMAL(12, 2),
    deductions          DECIMAL(10, 2),
    net_salary          DECIMAL(12, 2),
    paid                BOOLEAN   DEFAULT FALSE,
    paid_at             TIMESTAMP,
    generated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------------
-- 10. RECRUITMENT REQUESTS TABLE
--     Notes:
--       - national_id intentionally has NO unique constraint (service-level check
--         prevents active duplicates; allows re-submitting rejected requests).
--       - employee_id and auto_generate_employee_id added in Apr 2026 patch.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS Recruitment_Requests (
    request_id              SERIAL PRIMARY KEY,
    full_name               VARCHAR(200) NOT NULL,
    email                   VARCHAR(150) NOT NULL,
    national_id             VARCHAR(50)  NOT NULL,        -- NO UNIQUE — service enforces this
    address                 VARCHAR(500) NOT NULL,
    job_description         VARCHAR(300) NOT NULL,
    department              VARCHAR(100) NOT NULL,
    age                     INT NOT NULL,
    insurance_number        VARCHAR(50),
    health_number           VARCHAR(50),
    military_service_status VARCHAR(50)  NOT NULL,
    marital_status          VARCHAR(20)  NOT NULL,
    number_of_children      INT,
    mobile_number           VARCHAR(20)  NOT NULL,
    expected_salary         DECIMAL(12, 2) NOT NULL,
    requested_by            INT NOT NULL REFERENCES Employees(employee_id),
    status                  VARCHAR(20)  DEFAULT 'Pending',
    manager_note            VARCHAR(500),
    requested_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at            TIMESTAMP,
    approved_by             INT REFERENCES Employees(employee_id),
    employee_id             BIGINT,
    auto_generate_employee_id BOOLEAN DEFAULT FALSE
);

-- ---------------------------------------------------------------------------
-- 11. ADVANCE REQUESTS TABLE
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS Advance_Requests (
    advance_id   SERIAL PRIMARY KEY,
    employee_id  INT NOT NULL REFERENCES Employees(employee_id),
    amount       DECIMAL(12, 2) NOT NULL,
    reason       VARCHAR(500),
    status       VARCHAR(20)  DEFAULT 'Pending',
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP,
    processed_by INT REFERENCES Employees(employee_id),
    hr_note      VARCHAR(500),
    paid         BOOLEAN DEFAULT FALSE,
    paid_at      TIMESTAMP,
    deducted     BOOLEAN DEFAULT FALSE
);

-- ---------------------------------------------------------------------------
-- 12. INBOX MESSAGES TABLE
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS Inbox_Messages (
    message_id          SERIAL PRIMARY KEY,
    title               VARCHAR(255) NOT NULL,
    message             TEXT NOT NULL,
    target_role         VARCHAR(50)  NOT NULL,
    target_employee_id  INT REFERENCES Employees(employee_id),
    sender_employee_id  BIGINT,
    sender_name         VARCHAR(255) NOT NULL,
    priority            VARCHAR(20)  DEFAULT 'MEDIUM',
    parent_message_id   BIGINT,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at             TIMESTAMP,
    archived            BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_inbox_target_role
    ON Inbox_Messages(target_role);
CREATE INDEX IF NOT EXISTS idx_inbox_target_employee
    ON Inbox_Messages(target_employee_id);
CREATE INDEX IF NOT EXISTS idx_inbox_created_at
    ON Inbox_Messages(created_at DESC);

-- ---------------------------------------------------------------------------
-- 13. SYSTEM AUDIT LOGS TABLE
--     Tracks sensitive changes: salary edits, role changes, manual attendance.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS system_logs (
    log_id      BIGSERIAL PRIMARY KEY,
    timestamp   TIMESTAMP NOT NULL,
    actor_id    BIGINT,
    target_id   BIGINT,
    action_type VARCHAR(255) NOT NULL,
    old_value   VARCHAR(2000),
    new_value   VARCHAR(2000)
);

CREATE INDEX IF NOT EXISTS idx_system_logs_actor_id
    ON system_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_system_logs_action_type
    ON system_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_system_logs_timestamp
    ON system_logs(timestamp DESC);

-- ---------------------------------------------------------------------------
-- 14. NFC DEVICES TABLE
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS nfc_devices (
    device_id   VARCHAR(100) PRIMARY KEY,
    name        VARCHAR(255) NOT NULL,
    status      VARCHAR(50)  NOT NULL,
    system_load VARCHAR(50)
);

-- =============================================================================
-- INITIAL ROLE SEEDS (idempotent)
-- =============================================================================
INSERT INTO Users_Roles (role_name)
VALUES ('ADMIN'), ('HR'), ('MANAGER'), ('EMPLOYEE'), ('SUPER_ADMIN'), ('PAYROLL')
ON CONFLICT (role_name) DO NOTHING;

-- =============================================================================
-- DEFAULT DEPARTMENTS (idempotent)
-- =============================================================================
INSERT INTO Departments (department_name, department_code, description)
VALUES
    ('Engineering',       'ENG', 'Software development and technical operations'),
    ('Human Resources',   'HR',  'People operations and talent management'),
    ('Finance',           'FIN', 'Financial planning and accounting'),
    ('Marketing',         'MKT', 'Brand, communications and growth'),
    ('Operations',        'OPS', 'Infrastructure and support operations'),
    ('General',           'GEN', 'Default department for existing employees')
ON CONFLICT (department_code) DO NOTHING;
