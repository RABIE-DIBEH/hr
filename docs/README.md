# HRMS Documentation

## Overview
This directory contains comprehensive documentation for the HRMS (Human Resources Management System) project. The documentation covers architecture, API specifications, development guidelines, deployment procedures, and historical project information.

## 📁 Documentation Structure

```
docs/
├── API_DOCS.md                    # Complete API documentation
├── DEV_SETUP.md                   # Development environment setup
├── AGENTS.md                      # Coding guidelines and patterns
├── STABILIZATION_PLAN.md          # Current stabilization roadmap
├── project structure.md           # Detailed project architecture
├── assets/                        # Images and diagrams
│   ├── dashboard.png              # Dashboard preview
│   └── architecture-diagram.png   # System architecture
└── history/                       # Historical project documents
    ├── PHASE_1_PLAN.md            # Initial project planning
    ├── PHASE_2_IMPLEMENTATION.md  # Core implementation phase
    ├── PHASE_3_TESTING.md         # Testing and validation
    ├── PHASE_4_DEPLOYMENT.md      # Deployment procedures
    ├── PHASE_5_MOBILE.md          # Mobile app development
    ├── PHASE_6_SECURITY.md        # Security hardening
    ├── PHASE_7_PERFORMANCE.md     # Performance optimization
    ├── PHASE_8_MONITORING.md      # Monitoring and logging
    └── PHASE_9_LOCKDOWN.md        # Structural lockdown (current)
```

## 📚 Core Documentation

### 1. API Documentation (`API_DOCS.md`)
**Purpose**: Complete reference for all REST API endpoints.

**Contents**:
- Authentication & Authorization endpoints
- Employee management APIs
- Department operations
- Attendance & NFC tracking
- Leave management (including Phase 9 balance-report)
- Payroll processing
- Recruitment workflow
- Advance requests
- Admin & system management
- Inbox & notifications
- NFC card management
- Reporting endpoints (PDF/Excel exports)
- Error handling and response formats
- Role-based access control matrix

**Key Phase 9 Additions**:
- `GET /api/leaves/balance-report` - Leave quota report for HR/Admin
- `GET /api/system/logs` - System audit logs
- `GET /api/system/logs/recent` - Recent audit logs

### 2. Development Setup (`DEV_SETUP.md`)
**Purpose**: Cross-platform setup guide for developers.

**Contents**:
- Prerequisites installation (Windows/Linux/macOS)
- Database setup (PostgreSQL)
- Backend configuration (Spring Boot)
- Frontend setup (React/TypeScript)
- Mobile app development (Flutter)
- Docker container setup
- Testing environment configuration
- Troubleshooting common issues

### 3. Coding Guidelines (`AGENTS.md`)
**Purpose**: Standards and patterns for consistent code quality.

**Contents**:
- Backend Java/Spring Boot standards
- Frontend React/TypeScript patterns
- Database schema conventions
- API design principles
- Testing strategies
- Git workflow and commit conventions
- Code review checklist
- Performance optimization guidelines

### 4. Stabilization Plan (`STABILIZATION_PLAN.md`)
**Purpose**: Current roadmap for achieving production readiness.

**Contents**:
- Phase completion status
- Current focus areas
- Quality gates and acceptance criteria
- Performance benchmarks
- Security requirements
- Deployment checklist
- Rollback procedures
- Monitoring and alerting setup

### 5. Project Structure (`project structure.md`)
**Purpose**: Detailed architecture and component relationships.

**Contents**:
- High-level system architecture
- Component interaction diagrams
- Database schema overview
- API layer design
- Security architecture
- Deployment topology
- Monitoring infrastructure
- Backup and recovery strategy

## 🎯 Phase 9 Documentation

### Structural & Operational Lockdown
**Status**: COMPLETE (April 2026)

**Objectives**:
1. **Leave Quota Engine**: Non-financial leave tracking with balance validation
2. **NFC Mobile Feedback Loop**: Professional UX with offline support
3. **DevOps & Security Hardening**: Production-ready infrastructure
4. **System Audit Logs**: Security oversight and compliance

**Completed Tasks**:
- ✅ Leave balance validation and deduction logic
- ✅ Leave Balance Report API and frontend page
- ✅ NFC mobile app with full-screen animations and vibration
- ✅ Anti-double-tap scanning logic
- ✅ Offline caching for network resilience
- ✅ Docker multi-stage builds optimization
- ✅ Nginx security headers (CSP, HSTS, X-Content-Type-Options)
- ✅ Database backup/restore script
- ✅ System audit logging for sensitive changes

## 📊 API Reference Quick Links

### Authentication
- `POST /api/auth/login` - User authentication
- `POST /api/auth/change-password` - Password change

### Employee Management
- `GET /api/employees/me` - Current user profile
- `GET /api/employees` - List employees (role-scoped)
- `POST /api/employees/{id}/archive` - Archive employee

### Departments
- `GET /api/departments/my` - Current user's department
- `GET /api/departments` - Department list (role-scoped)

### Attendance
- `POST /api/attendance/nfc-clock` - NFC attendance
- `PUT /api/attendance/manual-correction/{id}` - Manual correction

### Leave Management (Phase 9)
- `POST /api/leaves/request` - Submit leave (with balance validation)
- `GET /api/leaves/balance-report` - Leave quota report (HR/Admin)
- `PUT /api/leaves/process/{id}` - Approve/reject (deducts balance)

### System Management (Phase 9)
- `GET /api/system/logs` - Audit logs (Admin/SuperAdmin)
- `GET /api/system/logs/recent` - Recent logs

### Reports
- `GET /api/reports/attendance/pdf` - Attendance PDF export
- `GET /api/reports/attendance/excel` - Attendance Excel export
- `GET /api/reports/payroll/pdf` - Payroll PDF export
- `GET /api/reports/leave/pdf` - Leave PDF export

## 🔧 Development Workflow

### 1. Environment Setup
```bash
# Clone repository
git clone <repository-url>
cd hrms

# Setup backend
cd backend
cp .env.example .env
# Edit .env with your credentials
mvn spring-boot:run

# Setup frontend
cd frontend
npm install
npm run dev

# Setup database
psql -U postgres -d hrms_db -f database/master_schema_v1.sql
psql -U postgres -d hrms_db -f database/master_seed_v1.sql
```

### 2. Testing
```bash
# Backend tests
cd backend
mvn test

# Frontend tests
cd frontend
npm run test:run

# Integration tests
./scripts/run-tests.sh integration
```

### 3. Building
```bash
# Backend build
cd backend
mvn clean package

# Frontend build
cd frontend
npm run build

# Docker build
docker-compose build
```

## 🐳 Docker Deployment

### Development
```bash
# Start all services
docker-compose up

# Start specific services
docker-compose up backend frontend postgres

# View logs
docker-compose logs -f
```

### Production
```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Deploy
docker-compose -f docker-compose.prod.yml up -d

# Scale services
docker-compose -f docker-compose.prod.yml up -d --scale backend=3
```

## 📈 Monitoring & Logging

### Application Logs
- **Backend**: Spring Boot logs (console and file)
- **Frontend**: Browser console and error tracking
- **Database**: PostgreSQL query logs
- **Nginx**: Access and error logs

### Health Checks
- Backend: `http://localhost:8080/actuator/health`
- Frontend: `http://localhost:5173`
- Database: `psql -U postgres -d hrms_db -c "SELECT 1"`

### Performance Metrics
- API response times
- Database query performance
- Memory and CPU usage
- Network latency

## 🔒 Security Documentation

### Authentication & Authorization
- JWT token-based authentication
- Role-based access control (6 roles)
- Password hashing with BCrypt
- Token expiration and refresh

### API Security
- Input validation and sanitization
- SQL injection prevention
- XSS protection
- CORS configuration
- Rate limiting

### Infrastructure Security
- Docker security best practices
- Network segmentation
- Secret management
- Regular security updates

## 📋 Compliance & Auditing

### Audit Requirements (Phase 9)
1. **Salary Changes**: Log all salary modifications
2. **Role Changes**: Track permission updates
3. **Attendance Corrections**: Record manual adjustments
4. **Employee Archives**: Document deletion reasons

### Audit Log Structure
```json
{
  "timestamp": "2026-04-10T10:30:00",
  "actorId": 1,
  "targetId": 5,
  "actionType": "SALARY_CHANGE",
  "oldValue": "5000.00",
  "newValue": "5500.00",
  "details": "Annual salary adjustment"
}
```

### Retention Policy
- Audit logs: 7 years
- Application logs: 1 year
- Backup files: 30 days (rotating)
- Performance metrics: 90 days

## 🚀 Deployment Checklist

### Pre-Deployment
- [ ] All tests passing
- [ ] Code review completed
- [ ] Documentation updated
- [ ] Backup current production
- [ ] Notify stakeholders

### Deployment
- [ ] Build production artifacts
- [ ] Deploy to staging
- [ ] Run smoke tests
- [ ] Deploy to production
- [ ] Verify health checks

### Post-Deployment
- [ ] Monitor error rates
- [ ] Check performance metrics
- [ ] Validate backup procedures
- [ ] Update deployment documentation

## 📞 Support & Troubleshooting

### Common Issues

#### Database Connection
```bash
# Check PostgreSQL service
systemctl status postgresql

# Test connection
psql -U postgres -d hrms_db -c "SELECT 1"

# Check logs
tail -f /var/log/postgresql/postgresql-15-main.log
```

#### Backend Startup
```bash
# Check Java version
java -version

# Check Maven
mvn --version

# Check environment variables
cat backend/.env
```

#### Frontend Build
```bash
# Clear node_modules
rm -rf node_modules package-lock.json
npm install

# Check TypeScript
npx tsc --noEmit

# Check build
npm run build
```

### Getting Help
1. **Check Documentation**: Review relevant docs files
2. **Search Issues**: Look for similar problems
3. **Check Logs**: Examine application and system logs
4. **Contact Team**: Reach out to development team

## 📄 Version History

### Current Version: 1.0.0-stable
**Release Date**: April 2026  
**Status**: Phase 9 Lockdown Complete

### Previous Versions
- **v0.9.0**: Phase 8 - Monitoring & Logging
- **v0.8.0**: Phase 7 - Performance Optimization
- **v0.7.0**: Phase 6 - Security Hardening
- **v0.6.0**: Phase 5 - Mobile App
- **v0.5.0**: Phase 4 - Deployment
- **v0.4.0**: Phase 3 - Testing
- **v0.3.0**: Phase 2 - Implementation
- **v0.2.0**: Phase 1 - Planning
- **v0.1.0**: Initial prototype

## 🔄 Update Procedures

### Documentation Updates
1. Update relevant markdown files
2. Update version numbers
3. Update changelog
4. Review with team
5. Commit with descriptive message

### API Documentation Updates
1. Update `API_DOCS.md`
2. Verify Swagger UI reflects changes
3. Test endpoints
4. Update frontend API client if needed

### Deployment Documentation
1. Update procedures based on changes
2. Test deployment steps
3. Update troubleshooting section
4. Review with operations team

## 📊 Metrics & Reporting

### System Metrics
- Uptime percentage
- Response time percentiles
- Error rates by endpoint
- User activity patterns
- Resource utilization

### Business Metrics
- Employee count by department
- Attendance compliance rates
- Leave utilization patterns
- Payroll processing times
- Recruitment funnel metrics

### Audit Metrics
- Security events count
- Compliance violations
- Access pattern anomalies
- Data modification frequency

## 🤝 Contributing to Documentation

### Guidelines
1. **Clarity**: Write clear, concise documentation
2. **Accuracy**: Ensure information is correct and up-to-date
3. **Completeness**: Cover all relevant aspects
4. **Consistency**: Follow existing style and format
5. **Examples**: Include practical examples

### Process
1. Create documentation update branch
2. Make changes with clear commit messages
3. Review with team members
4. Merge to main branch
5. Announce updates to stakeholders

## 📄 License
Proprietary software. All rights reserved.

---

*Last Updated: April 2026*  
*Version: 1.0.0-stable*  
*Phase 9: Structural & Operational Lockdown - COMPLETE*