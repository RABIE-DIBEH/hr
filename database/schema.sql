-- 1. Roles Table
CREATE TABLE Users_Roles (
    RoleId SERIAL PRIMARY KEY,
    RoleName VARCHAR(50) UNIQUE NOT NULL
);

-- 2. Teams Table
CREATE TABLE Teams (
    TeamId SERIAL PRIMARY KEY,
    Name VARCHAR(100) UNIQUE NOT NULL,
    ManagerId INT
);

-- 3. Employees Table
CREATE TABLE Employees (
    EmployeeId SERIAL PRIMARY KEY,
    FullName VARCHAR(255) NOT NULL,
    Email VARCHAR(150) UNIQUE NOT NULL,
    PasswordHash TEXT NOT NULL,
    TeamId INT REFERENCES Teams(TeamId),
    RoleId INT REFERENCES Users_Roles(RoleId),
    ManagerId INT REFERENCES Employees(EmployeeId),
    BaseSalary DECIMAL(12, 2) DEFAULT 0.00,
    Status VARCHAR(20) DEFAULT 'Active',
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. NFC Cards Table
CREATE TABLE NFC_Cards (
    CardId SERIAL PRIMARY KEY,
    Uid VARCHAR(50) UNIQUE NOT NULL,
    EmployeeId INT REFERENCES Employees(EmployeeId) ON DELETE CASCADE,
    Status VARCHAR(20) DEFAULT 'Active',
    IssuedDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Attendance Records Table
CREATE TABLE Attendance_Records (
    RecordId SERIAL PRIMARY KEY,
    EmployeeId INT REFERENCES Employees(EmployeeId),
    CheckIn TIMESTAMP,
    CheckOut TIMESTAMP,
    WorkHours DECIMAL(5, 2),
    Status VARCHAR(50) DEFAULT 'Normal', -- Normal, Late, Fraud
    IsVerifiedByManager BOOLEAN DEFAULT FALSE,
    VerifiedAt TIMESTAMP,
    ManagerNotes TEXT
);

-- 6. Leave Requests Table
CREATE TABLE Leave_Requests (
    RequestId SERIAL PRIMARY KEY,
    EmployeeId INT REFERENCES Employees(EmployeeId),
    LeaveType VARCHAR(50) NOT NULL,
    StartDate DATE NOT NULL,
    EndDate DATE NOT NULL,
    Status VARCHAR(20) DEFAULT 'Pending',
    ManagerNote TEXT,
    RequestedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ProcessedAt TIMESTAMP
);

-- 7. Payroll Table
CREATE TABLE Payroll (
    PayrollId SERIAL PRIMARY KEY,
    EmployeeId INT REFERENCES Employees(EmployeeId),
    Month INT NOT NULL,
    Year INT NOT NULL,
    TotalWorkHours DECIMAL(10, 2),
    OvertimeHours DECIMAL(10, 2),
    Deductions DECIMAL(10, 2),
    NetSalary DECIMAL(12, 2),
    GeneratedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. Recruitment Requests Table
CREATE TABLE Recruitment_Requests (
    RequestId SERIAL PRIMARY KEY,
    FullName VARCHAR(200) NOT NULL,
    NationalId VARCHAR(50) UNIQUE NOT NULL,
    Address VARCHAR(500) NOT NULL,
    JobDescription VARCHAR(300) NOT NULL,
    Department VARCHAR(100) NOT NULL,
    Age INT NOT NULL,
    InsuranceNumber VARCHAR(50),
    HealthNumber VARCHAR(50),
    MilitaryServiceStatus VARCHAR(50) NOT NULL,
    MaritalStatus VARCHAR(20) NOT NULL,
    NumberOfChildren INT,
    MobileNumber VARCHAR(20) NOT NULL,
    ExpectedSalary DECIMAL(12, 2) NOT NULL,
    RequestedBy INT NOT NULL REFERENCES Employees(EmployeeId),
    Status VARCHAR(20) DEFAULT 'Pending',
    ManagerNote VARCHAR(500),
    RequestedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ProcessedAt TIMESTAMP,
    ApprovedBy INT REFERENCES Employees(EmployeeId)
);

-- 9. Advance Requests Table
CREATE TABLE Advance_Requests (
    AdvanceId SERIAL PRIMARY KEY,
    EmployeeId INT NOT NULL REFERENCES Employees(EmployeeId),
    Amount DECIMAL(12, 2) NOT NULL,
    Reason VARCHAR(500),
    Status VARCHAR(20) DEFAULT 'Pending',
    RequestedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ProcessedAt TIMESTAMP,
    ProcessedBy INT REFERENCES Employees(EmployeeId),
    HrNote VARCHAR(500)
);

-- 10. Inbox Messages Table
CREATE TABLE Inbox_Messages (
    MessageId SERIAL PRIMARY KEY,
    Title VARCHAR(255) NOT NULL,
    Message TEXT NOT NULL,
    TargetRole VARCHAR(50) NOT NULL,
    SenderName VARCHAR(255) NOT NULL,
    Priority VARCHAR(20) DEFAULT 'MEDIUM',
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ReadAt TIMESTAMP,
    Archived BOOLEAN DEFAULT FALSE
);

-- Create index on TargetRole for faster role-based queries
CREATE INDEX idx_inbox_target_role ON Inbox_Messages(TargetRole);
CREATE INDEX idx_inbox_created_at ON Inbox_Messages(CreatedAt DESC);

-- Seed Initial Roles
INSERT INTO Users_Roles (RoleName) VALUES ('ADMIN'), ('HR'), ('MANAGER'), ('EMPLOYEE');
