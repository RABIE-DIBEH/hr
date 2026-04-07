# HRMS Integration Test Plan - Phase 4

## Overview
Comprehensive integration testing of the complete HRMS stack after stabilization phases 1-3.

## Test Environment
- **Docker Compose**: `make up-dev`
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8080
- **Database**: PostgreSQL on localhost:5432
- **Swagger UI**: http://localhost:8080/swagger-ui.html

## Test Accounts
Use seeded test users from DataInitializer:

### Admin User
- **Email**: admin@hrms.com
- **Password**: admin123
- **Role**: SUPER_ADMIN
- **Access**: Full system access

### HR User
- **Email**: hr@hrms.com  
- **Password**: hr123
- **Role**: HR
- **Access**: Employee management, recruitment, payroll

### Manager User
- **Email**: manager@hrms.com
- **Password**: manager123
- **Role**: MANAGER
- **Access**: Team management, leave approvals

### Employee User
- **Email**: employee@hrms.com
- **Password**: employee123
- **Role**: EMPLOYEE
- **Access**: Personal dashboard, leave requests

## Test Categories

### 1. Authentication & Authorization
- [ ] **Login Flow**: All roles can log in successfully
- [ ] **JWT Validation**: Tokens are issued and validated
- [ ] **Role-Based Access**: Each role sees appropriate dashboard
- [ ] **Protected Routes**: Unauthorized access blocked
- [ ] **Logout**: Session properly terminated

### 2. Dashboard Functionality
- [ ] **Admin Dashboard**: Shows system metrics, all modules
- [ ] **HR Dashboard**: Employee management, recruitment, payroll
- [ ] **Manager Dashboard**: Team overview, pending approvals
- [ ] **Employee Dashboard**: Personal info, attendance, leave balance
- [ ] **Skeleton Loaders**: Show during data fetching
- [ ] **Error States**: Handle API failures gracefully

### 3. Core HR Features
#### Employee Management
- [ ] View employee list (HR/Admin)
- [ ] View employee profile (all roles)
- [ ] Update profile information
- [ ] Reset employee password (HR/Admin)
- [ ] Terminate employee (soft delete)

#### Attendance Tracking
- [ ] NFC clock in/out simulation
- [ ] View attendance records
- [ ] Manual attendance correction (HR)
- [ ] Attendance reports

#### Leave Management
- [ ] Submit leave request (Employee)
- [ ] View own leave requests
- [ ] Approve/reject leave (Manager)
- [ ] HR final approval
- [ ] Leave balance calculation

#### Payroll
- [ ] Generate payroll (HR/Admin)
- [ ] View payroll history
- [ ] Download payroll PDF
- [ ] Payroll reports

#### Recruitment
- [ ] Create recruitment request (HR)
- [ ] View pending requests (Manager)
- [ ] Process recruitment request
- [ ] Recruitment workflow

### 4. API Integration Tests
#### Authentication API
- [ ] `POST /api/auth/login` - Returns JWT token
- [ ] `POST /api/auth/change-password` - Password change works

#### Employee API
- [ ] `GET /api/employees/me` - Returns current user profile
- [ ] `PUT /api/employees/me` - Profile update works
- [ ] `GET /api/employees` - List employees (authorized roles)
- [ ] `DELETE /api/employees/{id}` - Soft delete employee

#### Attendance API
- [ ] `POST /api/attendance/clock` - NFC clock simulation
- [ ] `GET /api/attendance/my-records` - Personal attendance
- [ ] `GET /api/attendance/team/{teamId}` - Team attendance (Manager)

#### Leave API
- [ ] `POST /api/leave/request` - Submit leave request
- [ ] `GET /api/leave/my-requests` - Personal leave requests
- [ ] `GET /api/leave/pending` - Pending approvals (Manager/HR)
- [ ] `PUT /api/leave/process/{id}` - Process leave request

#### Payroll API
- [ ] `POST /api/payroll/generate` - Generate payroll
- [ ] `GET /api/payroll/history` - Payroll history
- [ ] `GET /api/payroll/employee/{id}` - Employee payroll

### 5. Frontend-Specific Tests
#### React Query Functionality
- [ ] Data fetching with loading states
- [ ] Mutation operations (create/update/delete)
- [ ] Query invalidation on mutations
- [ ] Optimistic updates
- [ ] Error handling and retries

#### UI/UX
- [ ] Responsive design (mobile, tablet, desktop)
- [ ] Form validation
- [ ] Toast notifications
- [ ] Loading indicators
- [ ] Error boundaries

#### Performance
- [ ] Page load times
- [ ] Bundle size analysis
- [ ] Memory usage
- [ ] Network request optimization

### 6. Docker & Infrastructure
- [ ] All containers start successfully
- [ ] Database persistence
- [ ] Health checks pass
- [ ] Logs are accessible
- [ ] Resource usage monitoring
- [ ] Backup/restore functionality

### 7. Security Tests
- [ ] SQL injection prevention
- [ ] XSS protection
- [ ] CSRF protection
- [ ] JWT token security
- [ ] Role-based access control
- [ ] Input validation
- [ ] Rate limiting

## Test Execution Steps

### Step 1: Environment Setup
```bash
# Clone and setup
git clone <repository>
cd hr
cp .env.example .env

# Start development environment
make up-dev

# Verify services
make status
make health
```

### Step 2: Automated Tests
```bash
# Run backend tests
make test

# Run frontend tests  
make test-frontend

# Run Docker validation
./validate-docker.sh
```

### Step 3: Manual Testing
1. **Authentication Test**: Login with each role
2. **Dashboard Test**: Verify each dashboard loads correctly
3. **Feature Test**: Execute core workflows for each role
4. **API Test**: Verify all endpoints with Postman/curl
5. **UI Test**: Test responsive design and user interactions

### Step 4: Performance Testing
1. **Load Test**: Simulate multiple concurrent users
2. **Stress Test**: High volume data operations
3. **Endurance Test**: Long-running operations

### Step 5: Security Testing
1. **Penetration Test**: Attempt unauthorized access
2. **Data Validation**: Test input boundaries
3. **Session Management**: Test token expiration

## Test Data

### Pre-seeded Data
The system includes test data for:
- 4 roles (SUPER_ADMIN, HR, MANAGER, EMPLOYEE)
- Multiple employees with different roles
- Team structures with managers
- Sample attendance records
- Leave requests in various states
- Payroll records

### Test Data Creation
```sql
-- Example: Create additional test data
INSERT INTO employees (full_name, email, password_hash, role_id, status)
VALUES ('Test User', 'test@hrms.com', 'hashed_password', 4, 'Active');
```

## Success Criteria

### Must Have (Blocking Issues)
- [ ] All automated tests pass
- [ ] No critical security vulnerabilities
- [ ] Core features work for all roles
- [ ] No data loss or corruption
- [ ] Application starts within 30 seconds

### Should Have (Important)
- [ ] Performance meets requirements (<2s page load)
- [ ] Responsive design works on all screen sizes
- [ ] Error messages are user-friendly
- [ ] Logs contain sufficient debugging information

### Nice to Have
- [ ] Advanced features (reports, exports)
- [ ] Performance optimizations
- [ ] Additional test coverage
- [ ] Documentation updates

## Issue Tracking

### Severity Levels
1. **Critical**: System crash, data loss, security breach
2. **High**: Core feature broken, workaround unavailable
3. **Medium**: Feature partially broken, workaround available
4. **Low**: Cosmetic issue, minor inconvenience

### Issue Template
```
## Issue Description
[Brief description of the issue]

## Steps to Reproduce
1. [Step 1]
2. [Step 2]
3. [Step 3]

## Expected Behavior
[What should happen]

## Actual Behavior  
[What actually happens]

## Environment
- OS: [e.g., Windows 10]
- Browser: [e.g., Chrome 120]
- Docker Version: [e.g., 20.10]
- Commit Hash: [e.g., abc123]

## Screenshots/Logs
[Attach relevant screenshots or log excerpts]

## Severity
[Critical/High/Medium/Low]
```

## Test Reporting

### Daily Status Report
```
Date: [Date]
Tester: [Name]
Environment: [Docker/Local]

Tests Executed: [Number]
Tests Passed: [Number]
Tests Failed: [Number]
Blocking Issues: [List]

Key Findings:
- [Finding 1]
- [Finding 2]

Next Steps:
- [Action 1]
- [Action 2]
```

### Final Test Report
```
Project: HRMS Stabilization
Test Period: [Start Date] - [End Date]
Test Environment: Docker Development

Summary:
- Total Test Cases: [Number]
- Passed: [Number] ([Percentage]%)
- Failed: [Number] ([Percentage]%)
- Blocking Issues: [Number]

Key Metrics:
- Average Page Load Time: [Time]
- API Response Time: [Time]
- Test Coverage: [Percentage]

Issues Found:
1. [Critical Issue 1] - Status: [Resolved/Open]
2. [High Issue 1] - Status: [Resolved/Open]

Recommendations:
1. [Recommendation 1]
2. [Recommendation 2]

Sign-off: [Tester Name/Date]
```

## Exit Criteria
The integration testing phase is complete when:
1. All critical and high-severity issues are resolved
2. All automated tests pass consistently
3. Core features work for all user roles
4. Performance meets acceptance criteria
5. Security review is complete
6. Documentation is updated

## Rollback Plan
If critical issues are found:
1. Stop testing immediately
2. Document the issue with steps to reproduce
3. Revert to previous stable commit if necessary
4. Notify all stakeholders
5. Create fix plan and timeline