-- 1. Roles Table
CREATE TABLE Users_Roles (
    role_id SERIAL PRIMARY KEY,
    role_name VARCHAR(50) UNIQUE NOT NULL
);

-- 2. Teams Table
CREATE TABLE Teams (
    team_id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    manager_id INT
);

-- 3. Employees Table
CREATE TABLE Employees (
    employee_id SERIAL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    team_id INT REFERENCES Teams(team_id),
    role_id INT REFERENCES Users_Roles(role_id),
    manager_id INT REFERENCES Employees(employee_id),
    base_salary DECIMAL(12, 2) DEFAULT 0.00,
    status VARCHAR(20) DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    leave_balance_days DOUBLE PRECISION DEFAULT 21.0,
    overtime_balance_hours DOUBLE PRECISION DEFAULT 0.0,
    mobile_number VARCHAR(20),
    address VARCHAR(500),
    national_id VARCHAR(20)
);

-- 4. NFC Cards Table
CREATE TABLE NFC_Cards (
    card_id SERIAL PRIMARY KEY,
    uid VARCHAR(50) UNIQUE NOT NULL,
    employee_id INT REFERENCES Employees(employee_id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'Active',
    issued_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Attendance Records Table
CREATE TABLE Attendance_Records (
    record_id SERIAL PRIMARY KEY,
    employee_id INT REFERENCES Employees(employee_id),
    check_in TIMESTAMP,
    check_out TIMESTAMP,
    work_hours DECIMAL(5, 2),
    status VARCHAR(50) DEFAULT 'Normal',
    is_verified_by_manager BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMP,
    manager_notes TEXT,
    review_status VARCHAR(50) DEFAULT 'PENDING_REVIEW',
    payroll_status VARCHAR(50) DEFAULT 'PENDING_APPROVAL',
    manually_adjusted BOOLEAN DEFAULT FALSE,
    manually_adjusted_at TIMESTAMP,
    manually_adjusted_by BIGINT,
    manual_adjustment_reason TEXT
);

-- 6. Leave Requests Table
CREATE TABLE Leave_Requests (
    request_id SERIAL PRIMARY KEY,
    employee_id INT REFERENCES Employees(employee_id),
    leave_type VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    duration INT,
    reason TEXT,
    status VARCHAR(20) DEFAULT 'Pending',
    manager_note TEXT,
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP
);

-- 7. Payroll Table
CREATE TABLE Payroll (
    payroll_id SERIAL PRIMARY KEY,
    employee_id INT REFERENCES Employees(employee_id),
    month INT NOT NULL,
    year INT NOT NULL,
    total_work_hours DECIMAL(10, 2),
    overtime_hours DECIMAL(10, 2),
    advance_deductions DECIMAL(12, 2),
    deductions DECIMAL(10, 2),
    net_salary DECIMAL(12, 2),
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. Recruitment Requests Table
CREATE TABLE Recruitment_Requests (
    request_id SERIAL PRIMARY KEY,
    full_name VARCHAR(200) NOT NULL,
    email VARCHAR(150) NOT NULL,
    national_id VARCHAR(50) NOT NULL,
    address VARCHAR(500) NOT NULL,
    job_description VARCHAR(300) NOT NULL,
    department VARCHAR(100) NOT NULL,
    age INT NOT NULL,
    insurance_number VARCHAR(50),
    health_number VARCHAR(50),
    military_service_status VARCHAR(50) NOT NULL,
    marital_status VARCHAR(20) NOT NULL,
    number_of_children INT,
    mobile_number VARCHAR(20) NOT NULL,
    expected_salary DECIMAL(12, 2) NOT NULL,
    requested_by INT NOT NULL REFERENCES Employees(employee_id),
    status VARCHAR(20) DEFAULT 'Pending',
    manager_note VARCHAR(500),
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP,
    approved_by INT REFERENCES Employees(employee_id)
);

-- 9. Advance Requests Table
CREATE TABLE Advance_Requests (
    advance_id SERIAL PRIMARY KEY,
    employee_id INT NOT NULL REFERENCES Employees(employee_id),
    amount DECIMAL(12, 2) NOT NULL,
    reason VARCHAR(500),
    status VARCHAR(20) DEFAULT 'Pending',
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP,
    processed_by INT REFERENCES Employees(employee_id),
    hr_note VARCHAR(500),
    paid BOOLEAN DEFAULT FALSE,
    paid_at TIMESTAMP,
    deducted BOOLEAN DEFAULT FALSE
);

-- 10. Inbox Messages Table
CREATE TABLE Inbox_Messages (
    message_id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    target_role VARCHAR(50) NOT NULL,
    target_employee_id INT REFERENCES Employees(employee_id),
    sender_name VARCHAR(255) NOT NULL,
    priority VARCHAR(20) DEFAULT 'MEDIUM',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP,
    archived BOOLEAN DEFAULT FALSE
);

-- Create index on target_role and target_employee_id for faster role-based queries
CREATE INDEX idx_inbox_target_role ON Inbox_Messages(target_role);
CREATE INDEX idx_inbox_target_employee ON Inbox_Messages(target_employee_id);
CREATE INDEX idx_inbox_created_at ON Inbox_Messages(created_at DESC);

-- 11. System Logs Table
CREATE TABLE system_logs (
    log_id SERIAL PRIMARY KEY,
    action VARCHAR(255) NOT NULL,
    origin_user VARCHAR(255) NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    status VARCHAR(50) NOT NULL
);

-- 12. NFC Devices Table
CREATE TABLE nfc_devices (
    device_id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL,
    system_load VARCHAR(50)
);

-- Seed Initial Roles
INSERT INTO Users_Roles (role_name) VALUES ('ADMIN'), ('HR'), ('MANAGER'), ('EMPLOYEE');
