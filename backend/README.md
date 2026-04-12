# HRMS Backend - Spring Boot Application

## Overview
The HRMS backend is a Java 21 Spring Boot application providing RESTful APIs for the Human Resources Management System. It handles authentication, business logic, data persistence, and integrates with PostgreSQL database.

## 🏗️ Architecture

```
backend/
├── src/main/java/com/hrms/
│   ├── api/                    # REST Controllers
│   │   ├── AdminController.java          # System administration
│   │   ├── AttendanceController.java     # Attendance operations
│   │   ├── AuthController.java           # Authentication endpoints
│   │   ├── DepartmentController.java     # Department management
│   │   ├── EmployeeController.java       # Employee CRUD operations
│   │   ├── InboxController.java          # Messaging system
│   │   ├── LeaveController.java          # Leave management (including balance-report)
│   │   ├── NfcController.java            # NFC card operations
│   │   ├── PayrollController.java        # Payroll calculations
│   │   ├── RecruitmentController.java    # Recruitment workflow
│   │   ├── ReportController.java         # PDF/Excel exports
│   │   ├── SystemLogController.java      # Audit logs (Phase 9)
│   │   └── SecurityConfig.java           # Security configuration
│   ├── core/                   # Domain Models & Repositories
│   │   ├── models/             # JPA Entities
│   │   │   ├── AttendanceRecord.java
│   │   │   ├── Department.java
│   │   │   ├── Employee.java           # Includes leave_balance_days (Phase 9)
│   │   │   ├── LeaveRequest.java
│   │   │   ├── Payroll.java
│   │   │   ├── RecruitmentRequest.java
│   │   │   └── SystemLog.java          # Audit logging (Phase 9)
│   │   └── repositories/       # Spring Data JPA Repositories
│   ├── services/               # Business Logic Layer
│   │   ├── AdminService.java
│   │   ├── AttendanceService.java
│   │   ├── AuthService.java
│   │   ├── DepartmentService.java
│   │   ├── EmployeeDirectoryService.java
│   │   ├── LeaveService.java           # Leave quota engine (Phase 9)
│   │   ├── NfcCardManagementService.java
│   │   ├── PayrollService.java
│   │   └── RecruitmentService.java
│   ├── security/               # Security Components
│   │   ├── EmployeeUserDetails.java
│   │   ├── JwtAuthenticationFilter.java
│   │   └── JwtTokenProvider.java
│   └── api/dto/               # Data Transfer Objects
│       ├── ApiResponse.java           # Standard API response wrapper
│       ├── EmployeeProfileResponse.java
│       ├── LeaveBalanceReportResponse.java  # Phase 9 DTO
│       └── ... (other DTOs)
├── src/test/java/com/hrms/    # Unit & Integration Tests
├── .env                        # Environment variables (local)
├── Dockerfile                  # Multi-stage production build
├── Dockerfile.dev              # Development Dockerfile
└── pom.xml                     # Maven dependencies
```

## 🔑 Key Features

### Phase 9 Enhancements (Completed)
1. **Leave Quota Engine**
   - `leave_balance_days` field in Employee entity (default: 21.0)
   - Automatic deduction when HR approves leave requests
   - Validation prevents requesting more days than available balance
   - BusinessException with INSUFFICIENT_LEAVE_BALANCE error code

2. **Audit Logging System**
   - `SystemLog` entity tracks sensitive changes
   - Automatic logging for:
     - Salary modifications (SALARY_CHANGE)
     - Role/permission changes (ROLE_CHANGE) 
     - Attendance manual corrections (ATTENDANCE_CORRECTION)
   - Endpoints: `/api/system/logs` and `/api/system/logs/recent`

3. **Leave Balance Report**
   - Endpoint: `GET /api/leaves/balance-report` (HR/Admin only)
   - Returns all employees with remaining leave days
   - DTO: `LeaveBalanceReportResponse`

### Core Business Logic
- **Role-Based Access Control**: 6 roles (EMPLOYEE, MANAGER, HR, PAYROLL, ADMIN, SUPER_ADMIN)
- **Department Scoping**: Managers see only departments they manage
- **NFC Attendance**: Card-based clock in/out with validation
- **Leave Management**: Request, approval, and balance tracking
- **Payroll Processing**: Salary calculations with deductions
- **Recruitment Workflow**: Candidate to employee conversion
- **Reporting**: PDF/Excel exports for attendance, payroll, leave

## 🚀 Getting Started

### Prerequisites
- Java 21 JDK
- Maven 3.6+
- PostgreSQL 15+

### Local Development
1. **Setup Environment**
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env with your database credentials
   ```

2. **Database Setup**
   ```sql
   CREATE DATABASE hrms_db;
   psql -U postgres -d hrms_db -f ../database/master_schema_v1.sql
   psql -U postgres -d hrms_db -f ../database/master_seed_v1.sql
   ```

3. **Run Application**
   ```bash
   mvn spring-boot:run
   # Server starts at http://localhost:8080
   ```

### Docker
```bash
# Build and run with Docker Compose
docker-compose up backend

# Or build standalone
docker build -t hrms-backend .
docker run -p 8080:8080 hrms-backend
```

## 📊 API Documentation

### Swagger UI
- **Local**: http://localhost:8080/swagger-ui.html
- **OpenAPI Spec**: http://localhost:8080/v3/api-docs

### Key Endpoints (Phase 9)
| Endpoint | Method | Description | Required Role |
|----------|--------|-------------|---------------|
| `/api/leaves/balance-report` | GET | Get leave balance report for all employees | HR, ADMIN, SUPER_ADMIN |
| `/api/system/logs` | GET | Get paginated system audit logs | ADMIN, SUPER_ADMIN |
| `/api/system/logs/recent` | GET | Get 50 most recent system logs | ADMIN, SUPER_ADMIN |
| `/api/leaves/request` | POST | Submit leave request (with balance validation) | Any authenticated |
| `/api/leaves/process/{id}` | PUT | Approve/reject leave (deducts balance) | MANAGER, HR, ADMIN |

### Authentication
All endpoints (except `/api/auth/login`) require JWT token:
```
Authorization: Bearer <token>
```

## 🧪 Testing

### Run Tests
```bash
# Run all tests
mvn test

# Run specific test class
mvn test -Dtest=LeaveServiceTest

# Run with coverage report
mvn test jacoco:report
```

### Test Structure
- **Unit Tests**: Individual service methods
- **Integration Tests**: Controller endpoints with mocked dependencies
- **Test Data**: Located in test resources with consistent test data

### Test Coverage (Phase 9)
- 131 tests passing (100% success rate)
- Key test files:
  - `LeaveServiceTest` - Leave balance validation
  - `AttendanceServiceTest` - Audit logging for corrections
  - `EmployeeDirectoryServiceTest` - Salary change logging

## 🔧 Configuration

### Environment Variables (.env)
```env
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_URL=jdbc:postgresql://localhost:5432/hrms_db
JWT_SECRET=your-32-character-secret-key-here
JWT_EXPIRATION=86400000  # 24 hours in milliseconds
SERVER_PORT=8080
```

### Application Properties
- **Database**: PostgreSQL with connection pooling
- **JPA**: Hibernate with automatic DDL validation
- **Security**: JWT-based stateless authentication
- **CORS**: Configured for frontend development
- **Logging**: SLF4J with Logback

## 🐳 Docker Configuration

### Multi-Stage Build (Production)
```dockerfile
# Build stage: Maven + Java 21
FROM maven:3.9.9-eclipse-temurin-21 AS build
# ... build steps

# Runtime stage: Alpine JRE
FROM eclipse-temurin:21-jre-alpine
# ... runtime configuration
```

### Development Dockerfile
- Includes hot reload capabilities
- Mounts local source code
- Suitable for development workflow

## 📈 Monitoring & Logging

### Log Levels
- **DEBUG**: Detailed development information
- **INFO**: Application lifecycle events
- **WARN**: Potential issues
- **ERROR**: Application errors

### Audit Logging
System automatically logs:
- **Timestamp**: When the change occurred
- **Actor ID**: Who made the change
- **Target ID**: Which entity was changed
- **Action Type**: SALARY_CHANGE, ROLE_CHANGE, ATTENDANCE_CORRECTION
- **Old/New Values**: Before and after state

## 🔒 Security

### Implemented Security Features
1. **JWT Authentication**: Stateless token-based auth
2. **BCrypt Password Hashing**: Secure password storage
3. **Role-Based Access Control**: Fine-grained permissions
4. **CORS Configuration**: Restrict cross-origin requests
5. **SQL Injection Prevention**: Parameterized queries via JPA
6. **XSS Protection**: Input validation and output encoding

### Security Headers (via Frontend Nginx)
- Content-Security-Policy (CSP)
- Strict-Transport-Security (HSTS)
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block

## 🚨 Error Handling

### Standard Error Response
```json
{
  "status": 400,
  "message": "Validation failed",
  "data": {
    "error": "INSUFFICIENT_LEAVE_BALANCE",
    "fieldErrors": {
      "duration": "Requested days exceed available balance"
    }
  },
  "timestamp": "2026-04-10T10:30:00"
}
```

### Business Exceptions
- `BusinessException`: Domain-specific errors with error codes
- `ResourceNotFoundException`: Entity not found
- `ValidationException`: Input validation failures

## 📦 Dependencies

### Key Dependencies
- **Spring Boot 3.2.0**: Core framework
- **Spring Security**: Authentication & authorization
- **Spring Data JPA**: Database access
- **PostgreSQL Driver**: Database connectivity
- **JJWT**: JWT token handling
- **SpringDoc OpenAPI**: API documentation
- **Lombok**: Reduced boilerplate code
- **JUnit 5**: Testing framework
- **Mockito**: Mocking framework

### Build Tools
- **Maven**: Dependency management and build
- **Jacoco**: Code coverage reporting
- **Spotless**: Code formatting

## 🔄 Deployment

### Production Build
```bash
mvn clean package -DskipTests
# Output: target/hrms-backend-1.0.0.jar
```

### Docker Deployment
```bash
# Build image
docker build -t hrms-backend:latest .

# Run container
docker run -d \
  -p 8080:8080 \
  -e DB_USERNAME=postgres \
  -e DB_PASSWORD=secret \
  --name hrms-backend \
  hrms-backend:latest
```

### Health Check
- **Actuator Endpoint**: `/actuator/health`
- **Database Connectivity**: Verified on startup
- **JWT Secret**: Validated configuration

## 🛠️ Development Guidelines

### Code Standards
1. **Package Structure**: Follow existing package organization
2. **Naming Conventions**: 
   - Controllers: `*Controller.java`
   - Services: `*Service.java`
   - Entities: `*.java` (singular nouns)
   - DTOs: `*Response.java`, `*Request.java`
3. **Documentation**: Javadoc for public methods
4. **Testing**: Write tests for new functionality

### Branch Strategy
- `main`: Production-ready code
- `develop`: Integration branch
- `feature/*`: New features
- `bugfix/*`: Bug fixes

### Commit Messages
Follow conventional commits:
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `test:` Test additions/modifications
- `refactor:` Code refactoring
- `chore:` Maintenance tasks

## 📞 Support & Troubleshooting

### Common Issues
1. **Database Connection Failed**
   - Check PostgreSQL is running
   - Verify credentials in `.env`
   - Ensure database exists

2. **JWT Errors**
   - Verify JWT_SECRET is 32+ characters
   - Check token expiration
   - Validate token format

3. **Build Failures**
   - Clear Maven cache: `mvn clean`
   - Update dependencies: `mvn versions:update-properties`
   - Check Java version: `java -version`

### Logs Location
- **Console**: Application startup and runtime logs
- **File Logs**: Configured via logback-spring.xml
- **Docker Logs**: `docker logs hrms-backend`

## 📄 License
Proprietary software. All rights reserved.

---

*Last Updated: April 2026*  
*Version: 1.0.0-stable*  
*Phase 9: Structural & Operational Lockdown - COMPLETE*