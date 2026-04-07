# HRMS PRO - Human Resources Management System

![HRMS Banner](https://img.shields.io/badge/HRMS-PRO-blue)
![Java](https://img.shields.io/badge/Java-21-orange)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.2.0-brightgreen)
![React](https://img.shields.io/badge/React-19-61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791)

A modern Human Resources Management System with NFC-based attendance tracking, multi-role dashboards, and comprehensive HR workflows.

## 🚀 Quick Start (Windows Setup)

### 1. Prerequisites Installation
Install the following software:
- **Java 21** - [Download from adoptium.net](https://adoptium.net)
- **Node.js 18+** - [Download from nodejs.org](https://nodejs.org)
- **PostgreSQL 12+** - [Download from postgresql.org](https://www.postgresql.org/download/windows/)
- **Maven 3.6+** - [Download from maven.apache.org](https://maven.apache.org)
- **Git** - [Download from git-scm.com](https://git-scm.com)

### 2. Database Setup
```sql
-- Open PostgreSQL (pgAdmin or psql)
CREATE DATABASE hrms_db;

-- Run from command line (adjust paths as needed)
psql -U postgres -d hrms_db -f database\schema.sql
psql -U postgres -d hrms_db -f database\seed_test_data.sql
```

### 3. Backend Setup
```cmd
cd backend
copy .env.example .env
```

Edit `backend/.env` with your credentials:
```env
DB_USERNAME=postgres
DB_PASSWORD=admin123
JWT_SECRET=your-very-long-secret-key-at-least-32-characters
```

Start the backend:
```cmd
mvn spring-boot:run
```
Backend runs at: **http://localhost:8080**

### 4. Frontend Setup
```cmd
cd frontend
npm install
npm run dev
```
Frontend runs at: **http://localhost:5173**

### 5. Docker (Alternative - All-in-one)
```bash
docker-compose up
```
Access at: **http://localhost:80** (frontend), **http://localhost:8080** (backend API)

## 👥 Test Credentials

| Role | Email | Password | Dashboard |
|------|-------|----------|-----------|
| **ADMIN** | `admin@hrms.com` | `Admin@1234` | `/admin` |
| **HR** | `hr@hrms.com` | `HR@1234` | `/hr` |
| **MANAGER** | `manager@hrms.com` | `Manager@1234` | `/manager` |
| **EMPLOYEE** | `employee@hrms.com` | `Employee@1234` | `/dashboard` |

**Note**: Passwords are automatically upgraded from plaintext to BCrypt on first login.

## 📁 Project Structure

```
hrms-pro/
├── backend/                 # Spring Boot backend (Java 21)
│   ├── src/main/java/com/hrms/
│   │   ├── api/            # Controllers + Security
│   │   ├── core/           # Entities + Repositories
│   │   ├── services/       # Business logic
│   │   └── security/       # JWT authentication
│   ├── .env                # Local environment (not in git)
│   └── pom.xml             # Maven dependencies
├── frontend/               # React/TypeScript frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Route-level pages
│   │   ├── services/       # API integration
│   │   └── utils/          # Helper functions
│   └── package.json        # Node.js dependencies
├── mobile/                 # Flutter mobile app
│   ├── lib/                # Dart source code
│   ├── build scripts/      # setup-mobile.sh, build-apk.sh
│   └── Platform generation required (see mobile/README.md)
├── database/               # SQL schema and seed data
├── docker-compose.yml      # Multi-service container setup
└── README.md               # This file
```

## 👨‍💻 Team Responsibilities

| Team Member | Responsibilities |
|-------------|------------------|
| **Abdulkarim** | Backend + Database + Testing + Docker |
| **Rabie** | Frontend + Mobile + Documentation + UI |

## 🔧 Key Features

### Core HR Functions
- **Employee Management** - CRUD operations, role assignment
- **Attendance Tracking** - NFC-based clock in/out, manual adjustments
- **Leave Management** - Request, approval, balance tracking
- **Payroll Processing** - Salary calculation, deductions, reporting
- **Recruitment Workflow** - Candidate to employee conversion

### Role-Based Dashboards
- **Admin Dashboard** - System monitoring, user management, backups
- **HR Dashboard** - Employee records, recruitment, payroll
- **Manager Dashboard** - Team attendance, leave approvals
- **Employee Dashboard** - Personal records, leave requests

### Security & Authentication
- JWT-based authentication
- Role-based access control (RBAC)
- Password upgrade on first login
- Secure API endpoints

## 🛠️ Development Commands

### Backend (from `backend/` directory)
```bash
mvn clean compile           # Compile Java sources
mvn spring-boot:run        # Start dev server (port 8080)
mvn test                   # Run backend tests
mvn clean package          # Build JAR file
```

### Frontend (from `frontend/` directory)
```bash
npm run dev                # Start Vite dev server (port 5173)
npm run build              # Type-check + production build
npm run lint               # Run ESLint
npm run preview            # Preview production build
npm run test:run         # Run frontend tests
```

### Database
```bash
# Connect to PostgreSQL
psql -U postgres -d hrms_db

# Useful queries
SELECT * FROM Employees;
SELECT * FROM Attendance_Records ORDER BY check_in DESC LIMIT 10;
SELECT * FROM Leave_Requests WHERE status = 'Pending';
```

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| [DEV_SETUP.md](./DEV_SETUP.md) | Detailed cross-platform setup guide |
| [API_DOCS.md](./API_DOCS.md) | API endpoint documentation |
| [AGENTS.md](./AGENTS.md) | Coding guidelines and patterns |
| [STABILIZATION_PLAN.md](./STABILIZATION_PLAN.md) | Current stabilization roadmap |
| [project structure.md](./project%20structure.md) | Detailed project structure |

## 🐛 Troubleshooting

### Common Issues

**Backend won't start:**
- Check PostgreSQL is running: `pg_isready -U postgres`
- Verify `.env` file exists in `backend/` with correct credentials
- Ensure JWT_SECRET is at least 32 characters

**Frontend build errors:**
- Run `npm install` to ensure all dependencies
- Check TypeScript errors: `npx tsc --noEmit`
- Fix ESLint warnings: `npm run lint -- --fix`

**Database connection issues:**
- Verify database exists: `psql -U postgres -l`
- Check credentials in `backend/.env`
- Ensure schema is loaded: run `database/schema.sql`

**Docker issues:**
- Check logs: `docker-compose logs [service]`
- Rebuild containers: `docker-compose up --build`
- Check volume permissions

### Debugging Tips

1. **Backend Logs**: Check console output or `backend/target/logs/`
2. **Frontend DevTools**: Use browser DevTools (F12) for network requests and console errors
3. **API Testing**: Use Postman or curl to test endpoints directly
4. **Database**: Connect directly with `psql` to verify data

## 🔗 API Documentation

The backend provides Swagger UI for API documentation:
- **Swagger UI**: http://localhost:8080/swagger-ui.html
- **OpenAPI Spec**: http://localhost:8080/v3/api-docs

Key API endpoints:
- `POST /api/auth/login` - User authentication
- `POST /api/attendance/nfc-clock` - NFC attendance tracking
- `POST /api/leaves/request` - Leave request submission
- `POST /api/payroll/calculate` - Payroll calculation
- `GET /api/employees` - Employee directory

## 📊 Technology Stack

| Component | Technology |
|-----------|------------|
| **Backend** | Java 21, Spring Boot 3.2.0, Spring Security, JPA/Hibernate |
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS v4 |
| **Database** | PostgreSQL 15, manual SQL migrations |
| **Authentication** | JWT, BCrypt password hashing |
| **Containerization** | Docker, Docker Compose |
| **Testing** | JUnit 5, Mockito, Vitest, React Testing Library |
| **API Documentation** | SpringDoc OpenAPI (Swagger) |

## 🤝 Contributing

1. **Branch Strategy**: Create feature branches from `main`
2. **Code Standards**: Follow patterns in [AGENTS.md](./AGENTS.md)
3. **Testing**: Write tests for new functionality
4. **Documentation**: Update relevant docs with changes
5. **Pull Requests**: Submit PRs for review before merging

## 📞 Support

For issues and questions:
1. Check the troubleshooting section above
2. Review existing documentation
3. Contact the development team

## 📄 License

This project is proprietary software. All rights reserved.

---

*Last Updated: April 2026*  
*Project Status: Active Development - Stabilization Phase*
