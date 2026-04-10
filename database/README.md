# HRMS Database - PostgreSQL Schema & Data

## Overview
This directory contains the PostgreSQL database schema, seed data, and migration scripts for the HRMS application. The database is designed to support all HR operations including employee management, attendance tracking, leave management, payroll, and audit logging.

## 📁 Directory Structure

```
database/
├── schema.sql                # Main database schema (tables, indexes, constraints)
├── seed_test_data.sql        # Test data for development and testing
├── migrations/               # Database migration scripts (if needed)
│   ├── 001_initial_schema.sql
│   ├── 002_add_leave_balance.sql    # Phase 9: leave_balance_days column
│   ├── 003_add_system_logs.sql      # Phase 9: system_logs table
│   └── ... (other migrations)
└── backups/                  # Database backup files (generated)
```

## 🗄️ Database Schema

### Core Tables

#### 1. Employees Table
```sql
CREATE TABLE Employees (
    employee_id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    department_id INTEGER REFERENCES Departments(department_id),
    role_id INTEGER REFERENCES Roles(role_id),
    base_salary DECIMAL(10,2),
    leave_balance_days DECIMAL(5,2) DEFAULT 21.0,  -- Phase 9 addition
    status VARCHAR(50) DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 2. Departments Table
```sql
CREATE TABLE Departments (
    department_id SERIAL PRIMARY KEY,
    department_name VARCHAR(255) UNIQUE NOT NULL,
    manager_id INTEGER REFERENCES Employees(employee_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 3. Attendance Records Table
```sql
CREATE TABLE Attendance_Records (
    record_id SERIAL PRIMARY KEY,
    employee_id INTEGER REFERENCES Employees(employee_id) NOT NULL,
    check_in TIMESTAMP NOT NULL,
    check_out TIMESTAMP,
    work_hours DECIMAL(5,2),
    status VARCHAR(50) DEFAULT 'Present',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    corrected_by INTEGER REFERENCES Employees(employee_id),
    correction_reason TEXT
);
```

#### 4. Leave Requests Table
```sql
CREATE TABLE Leave_Requests (
    request_id SERIAL PRIMARY KEY,
    employee_id INTEGER REFERENCES Employees(employee_id) NOT NULL,
    leave_type VARCHAR(50) NOT NULL,  -- 'Daily' or 'Hourly'
    start_date DATE NOT NULL,
    duration DECIMAL(5,2) NOT NULL,   -- Days or hours
    reason TEXT,
    status VARCHAR(50) DEFAULT 'PENDING_MANAGER',
    approved_by INTEGER REFERENCES Employees(employee_id),
    rejected_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 5. System Logs Table (Phase 9)
```sql
CREATE TABLE System_Logs (
    log_id SERIAL PRIMARY KEY,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actor_id INTEGER REFERENCES Employees(employee_id) NOT NULL,
    target_id INTEGER,  -- Can reference various entities
    action_type VARCHAR(50) NOT NULL,  -- 'SALARY_CHANGE', 'ROLE_CHANGE', 'ATTENDANCE_CORRECTION'
    old_value TEXT,
    new_value TEXT,
    details TEXT
);
```

#### 6. Other Tables
- **Roles**: User roles and permissions
- **Payroll**: Salary calculations and payments
- **Advance_Requests**: Salary advance requests
- **Recruitment_Requests**: Hiring workflow
- **NFC_Cards**: NFC card assignments
- **Inbox_Messages**: Internal messaging
- **Employee_Deletion_Logs**: Audit trail for deletions

## 🔑 Key Relationships

### 1. Employee Relationships
```
Employees (1) ──┐
                ├── (1:N) Attendance_Records
                ├── (1:N) Leave_Requests
                ├── (1:N) Advance_Requests
                └── (1:1) Departments (via department_id)
```

### 2. Department Hierarchy
```
Departments (1) ──┐
                  ├── (1:1) Employees (manager_id)
                  └── (1:N) Employees (department_id)
```

### 3. Audit Trail (Phase 9)
```
System_Logs ──┐
              ├── (N:1) Employees (actor_id)
              └── (N:1) Various Entities (target_id)
```

## 📊 Phase 9 Schema Enhancements

### 1. Leave Balance Tracking
```sql
-- Added to Employees table
ALTER TABLE Employees ADD COLUMN leave_balance_days DECIMAL(5,2) DEFAULT 21.0;

-- Index for performance
CREATE INDEX idx_employees_leave_balance ON Employees(leave_balance_days);
```

### 2. System Audit Logging
```sql
-- System Logs table (Phase 9)
CREATE TABLE System_Logs (
    log_id SERIAL PRIMARY KEY,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actor_id INTEGER NOT NULL REFERENCES Employees(employee_id),
    target_id INTEGER,
    action_type VARCHAR(50) NOT NULL,
    old_value TEXT,
    new_value TEXT,
    details TEXT
);

-- Indexes for query performance
CREATE INDEX idx_system_logs_timestamp ON System_Logs(timestamp DESC);
CREATE INDEX idx_system_logs_actor ON System_Logs(actor_id);
CREATE INDEX idx_system_logs_action ON System_Logs(action_type);
```

## 🚀 Database Setup

### Initial Setup
```bash
# 1. Create database
createdb -U postgres hrms_db

# 2. Load schema
psql -U postgres -d hrms_db -f schema.sql

# 3. Load test data (optional)
psql -U postgres -d hrms_db -f seed_test_data.sql
```

### Docker Setup
```bash
# Using docker-compose (from project root)
docker-compose up postgres

# Connect to PostgreSQL container
docker exec -it hrms-postgres psql -U hrms_user -d hrms
```

### Manual Connection
```bash
# Connect to PostgreSQL
psql -U postgres -d hrms_db

# Common commands
\dt                     # List tables
\d+ table_name          # Describe table
\q                      # Quit
```

## 📈 Test Data

### Seed Data Includes
1. **Roles**: 6 predefined roles (EMPLOYEE, MANAGER, HR, PAYROLL, ADMIN, SUPER_ADMIN)
2. **Departments**: Sample departments (IT, HR, Finance, Sales, Operations)
3. **Employees**: Test users for each role with realistic data
4. **Attendance Records**: Sample attendance data for testing
5. **Leave Requests**: Various leave scenarios for testing
6. **NFC Cards**: Test NFC card assignments

### Test Credentials
| Role | Email | Password | Initial Leave Balance |
|------|-------|----------|----------------------|
| ADMIN | admin@hrms.com | Admin@1234 | 21.0 days |
| HR | hr@hrms.com | HR@1234 | 21.0 days |
| MANAGER | manager@hrms.com | Manager@1234 | 21.0 days |
| EMPLOYEE | employee@hrms.com | Employee@1234 | 21.0 days |

**Note**: Passwords are automatically upgraded to BCrypt on first login.

## 🔄 Database Operations

### Backup Database
```bash
# Using the backup script (Phase 9)
./scripts/db-backup.sh backup

# Manual backup
pg_dump -U postgres hrms_db > hrms_backup_$(date +%Y%m%d_%H%M%S).sql
```

### Restore Database
```bash
# Using the restore script (Phase 9)
./scripts/db-backup.sh restore backups/hrms_backup_20260410_103000.sql

# Manual restore
psql -U postgres -d hrms_db < backup_file.sql
```

### List Backups
```bash
./scripts/db-backup.sh list
```

### Common Maintenance Queries
```sql
-- Check database size
SELECT pg_size_pretty(pg_database_size('hrms_db'));

-- Check table sizes
SELECT 
    table_name,
    pg_size_pretty(pg_total_relation_size(quote_ident(table_name))) as size
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY pg_total_relation_size(quote_ident(table_name)) DESC;

-- Count records per table
SELECT 
    table_name,
    (xpath('/row/cnt/text()', query_to_xml(format('SELECT count(*) as cnt FROM %I', table_name), false, true, '')))[1]::text::int as row_count
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY row_count DESC;
```

## 🧪 Testing Queries

### Phase 9: Leave Balance Testing
```sql
-- Check employee leave balances
SELECT employee_id, full_name, leave_balance_days 
FROM Employees 
WHERE leave_balance_days < 5 
ORDER BY leave_balance_days ASC;

-- Test leave deduction (simulate approval)
UPDATE Employees 
SET leave_balance_days = leave_balance_days - 3 
WHERE employee_id = 1 
RETURNING full_name, leave_balance_days;

-- Check system logs for salary changes
SELECT * FROM System_Logs 
WHERE action_type = 'SALARY_CHANGE' 
ORDER BY timestamp DESC 
LIMIT 10;
```

### Attendance Analysis
```sql
-- Monthly attendance summary
SELECT 
    DATE_TRUNC('month', check_in) as month,
    COUNT(*) as total_records,
    COUNT(DISTINCT employee_id) as unique_employees,
    AVG(work_hours) as avg_hours
FROM Attendance_Records 
WHERE check_out IS NOT NULL
GROUP BY DATE_TRUNC('month', check_in)
ORDER BY month DESC;
```

### Department Statistics
```sql
-- Department leave usage
SELECT 
    d.department_name,
    COUNT(DISTINCT e.employee_id) as employee_count,
    AVG(e.leave_balance_days) as avg_leave_balance,
    SUM(CASE WHEN lr.status = 'APPROVED' THEN lr.duration ELSE 0 END) as total_leave_days
FROM Departments d
LEFT JOIN Employees e ON d.department_id = e.department_id
LEFT JOIN Leave_Requests lr ON e.employee_id = lr.employee_id
GROUP BY d.department_id, d.department_name
ORDER BY d.department_name;
```

## 🔒 Security Considerations

### Database Security
1. **Role-Based Access**: Application uses different database users for different operations
2. **Password Hashing**: BCrypt hashing for passwords (upgraded from plaintext)
3. **SQL Injection Prevention**: Parameterized queries via JPA/Hibernate
4. **Audit Logging**: All sensitive changes logged to System_Logs table

### Backup Security
1. **Encryption**: Backup files should be encrypted in production
2. **Access Control**: Limit access to backup files
3. **Offsite Storage**: Store backups in secure, offsite location
4. **Retention Policy**: Define backup retention period

## 📊 Performance Optimization

### Indexes
```sql
-- Critical indexes for performance
CREATE INDEX idx_attendance_employee_date ON Attendance_Records(employee_id, check_in);
CREATE INDEX idx_leaves_employee_status ON Leave_Requests(employee_id, status);
CREATE INDEX idx_employees_department_status ON Employees(department_id, status);
CREATE INDEX idx_system_logs_timestamp_action ON System_Logs(timestamp, action_type);
```

### Query Optimization Tips
1. **Use EXPLAIN**: Analyze query plans with `EXPLAIN ANALYZE`
2. **Limit Results**: Use `LIMIT` for large result sets
3. **Avoid SELECT ***: Specify only needed columns
4. **Use JOINs Wisely**: Prefer INNER JOIN over OUTER JOIN when possible
5. **Batch Operations**: Use batch inserts/updates for bulk operations

## 🚨 Troubleshooting

### Common Issues

1. **Connection Refused**
   ```bash
   # Check PostgreSQL service
   sudo systemctl status postgresql
   
   # Check port listening
   netstat -tlnp | grep 5432
   
   # Check pg_hba.conf
   cat /etc/postgresql/*/main/pg_hba.conf
   ```

2. **Permission Denied**
   ```sql
   -- Grant permissions
   GRANT ALL PRIVILEGES ON DATABASE hrms_db TO hrms_user;
   GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO hrms_user;
   GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO hrms_user;
   ```

3. **Performance Issues**
   ```sql
   -- Check slow queries
   SELECT query, calls, total_time, mean_time
   FROM pg_stat_statements
   ORDER BY mean_time DESC
   LIMIT 10;
   
   -- Check table bloat
   SELECT schemaname, tablename, n_dead_tup, n_live_tup
   FROM pg_stat_user_tables
   WHERE n_dead_tup > 1000;
   ```

### Maintenance Tasks
```sql
-- Regular vacuum (automatic in modern PostgreSQL)
VACUUM ANALYZE;

-- Reindex large tables
REINDEX TABLE Attendance_Records;

-- Update statistics
ANALYZE;
```

## 🔄 Migration Strategy

### Version Control
1. **Schema Changes**: All changes go through migration scripts
2. **Backward Compatibility**: Maintain compatibility with existing data
3. **Rollback Plan**: Always have rollback migration ready
4. **Testing**: Test migrations on staging before production

### Migration Example
```sql
-- migration/002_add_leave_balance.sql
BEGIN;

-- Add leave balance column
ALTER TABLE Employees ADD COLUMN leave_balance_days DECIMAL(5,2);

-- Set default value for existing records
UPDATE Employees SET leave_balance_days = 21.0 WHERE leave_balance_days IS NULL;

-- Make column NOT NULL after setting defaults
ALTER TABLE Employees ALTER COLUMN leave_balance_days SET NOT NULL;
ALTER TABLE Employees ALTER COLUMN leave_balance_days SET DEFAULT 21.0;

COMMIT;
```

## 📄 License
Proprietary software. All rights reserved.

---

*Last Updated: April 2026*  
*Version: 1.0.0-stable*  
*Phase 9: Structural & Operational Lockdown - COMPLETE*