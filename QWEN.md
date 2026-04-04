# HRMS PRO - Project Context

## Project Overview

**HRMS PRO** is a comprehensive Human Resources Management System with NFC-based attendance tracking. The system automates employee attendance, leave management, payroll calculation, and team monitoring.

### Tech Stack

| Layer | Technology |
|-------|------------|
| **Backend** | Java 21, Spring Boot 3.2.0, Maven, PostgreSQL |
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS v4 |
| **Mobile** | Flutter (scaffolded, minimal implementation) |
| **Security** | Spring Security, JWT (jjwt 0.11.5), BCrypt |
| **ORM** | JPA/Hibernate with Spring Data JPA |

### Core Features

1. **NFC Attendance** - Clock in/out via NFC cards with fraud detection
2. **Leave Management** - Employee self-service leave requests with manager approval
3. **Payroll** - Automated salary calculation based on attendance hours
4. **Role-Based Dashboards** - Separate views for Employee, Manager, HR, and Admin
5. **Team Monitoring** - Managers can verify team attendance and report fraud
6. **Recruitment Requests** - HR-managed hiring requests workflow
7. **Advance Requests** - Employee salary advance requests
8. **Inbox Messaging** - Role-targeted internal announcements

---

## Directory Structure

```
project-root/
├── backend/                    # Spring Boot application
│   ├── src/main/java/com/hrms/
│   │   ├── api/               # REST controllers + SecurityConfig + DTOs
│   │   ├── core/
│   │   │   ├── models/        # JPA entities
│   │   │   └── repositories/  # Spring Data JPA interfaces
│   │   ├── services/          # Business logic
│   │   ├── security/          # JWT filter, auth configuration
│   │   ├── DataInitializer.java
│   │   └── HrmsApplication.java
│   ├── pom.xml
│   └── src/main/resources/
│       └── application.properties
├── frontend/                   # React + TypeScript SPA
│   ├── src/
│   │   ├── components/        # Reusable UI (Sidebar, BottomNav)
│   │   ├── pages/             # Route-level components
│   │   ├── services/          # API client (axios)
│   │   └── App.tsx
│   ├── package.json
│   └── vite.config.ts
├── mobile/                     # Flutter app (scaffolded)
├── database/
│   ├── schema.sql             # PostgreSQL DDL
│   └── seed_test_data.sql     # Test data with default users
└── docs/
    ├── AGENTS.md              # Development guidelines
    ├── API_DOCS.md            # API endpoint reference
    └── project structure.md   # SRS document (German/Arabic)
```

---

## Building and Running

### Prerequisites

- **Java 21+** installed and `JAVA_HOME` set
- **Maven 3.6+**
- **Node.js 18+** and npm
- **PostgreSQL 12+** running locally

### Database Setup

1. Create PostgreSQL database:
```sql
CREATE DATABASE hrms_db;
```

2. Run the schema:
```bash
psql -U postgres -d hrms_db -f database/schema.sql
```

3. Seed test data (optional, for development):
```bash
psql -U postgres -d hrms_db -f database/seed_test_data.sql
```

4. Configure `backend/.env.local` (copy from `.env.example`):
```env
DB_USERNAME=postgres
DB_PASSWORD=admin123
JWT_SECRET=ChangeThisToAVeryLongSecretKeyAtLeast32CharsForHS256!!
ENVIRONMENT=development
```

### Backend

```bash
cd backend

# Compile
mvn clean compile

# Run development server (port 8080)
mvn spring-boot:run

# Build JAR
mvn clean package

# Run tests (none configured yet)
mvn test
```

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start dev server (port 5173)
npm run dev

# Production build
npm run build

# Lint
npm run lint

# Preview production build
npm run preview
```

### Default Test Credentials

After running the seed data, use these accounts:

| Role | Email | Password | Dashboard |
|------|-------|----------|-----------|
| **ADMIN** | `admin@hrms.com` | `Admin@1234` | `/admin` |
| **HR** | `hr@hrms.com` | `HR@1234` | `/hr` |
| **MANAGER** | `manager@hrms.com` | `Manager@1234` | `/manager` |
| **EMPLOYEE** | `employee@hrms.com` | `Employee@1234` | `/dashboard` |

> **Note:** Passwords are stored as plain-text in the seed file. The backend automatically upgrades them to BCrypt on the **first successful login**.

### Sample NFC Card
- **Card UID:** `TEST-NFC-UID-0001`
- Use this UID in the `/clock` page for testing

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/login` | Login with email/password, returns JWT |
| `POST` | `/api/attendance/nfc-clock` | Clock in/out via NFC card UID |
| `PUT` | `/api/attendance/report-fraud/{recordId}` | Flag attendance as fraud |
| `POST` | `/api/leaves/request` | Submit leave request |
| `GET` | `/api/leaves/my-requests` | Get employee's leave requests |
| `POST` | `/api/payroll/calculate?month=5&year=2024` | Calculate monthly salary |
| `GET` | `/api/employees/me` | Get current employee profile |
| `GET` | `/api/employees` | List all employees (HR/Admin) |
| `GET` | `/api/employees/team` | List manager's team |

**Authentication**: All endpoints (except `/api/auth/login`) require `Authorization: Bearer {JWT}` header.

---

## Development Conventions

### Backend (Java/Spring Boot)

**Naming**
- Classes: PascalCase (`AuthController`, `AttendanceService`)
- Methods/Fields: camelCase (`findByEmail`, `clockByNfcUid`)
- Constants: UPPER_SNAKE_CASE (`SECRET_KEY`)
- Repositories: `EntityName + Repository` (`EmployeeRepository`)

**Dependency Injection**
- Constructor injection only (use `final` fields)
- No `@Autowired` field injection

```java
@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService authService;
    
    public AuthController(AuthService authService) {
        this.authService = authService;
    }
}
```

**Controllers**
- Use `@RestController` with `@RequestMapping("/api/{domain}")` at class level
- Return `ResponseEntity<T>` with explicit status codes
- Prefer dedicated DTOs over `Map<String, String>` (work in progress)

**Services**
- Annotate with `@Service`
- Use `@Transactional` on write operations
- Constructor injection with `final` fields

**Entities**
- No-arg constructor (JPA requirement) + all-args constructor
- Use `@PrePersist` for auto-setting timestamps
- Manual builder inner classes (no Lombok)
- Use `GenerationType.IDENTITY` for auto-generated IDs

```java
@Entity
@Table(name = "Employees")
public class Employee {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long employeeId;
    
    // ... fields, constructors, builder
}
```

**Error Handling**
- `GlobalExceptionHandler.java` with `@ControllerAdvice` handles:
  - `ValidationException` → 400 with field errors
  - `ResponseStatusException` → explicit HTTP status from service logic
  - `AccessDeniedException` → 403 (security check failures)

**Validation**
- `@Valid` + Bean Validation annotations on DTOs (`@NotBlank`, `@NotNull`, `@Email`)
- Examples: `LoginRequest.java`, `LeaveRequestDto.java`, `NfcClockRequest.java`

### Frontend (TypeScript/React)

**Naming**
- Component files: PascalCase (`EmployeeDashboard.tsx`)
- Component functions: PascalCase (`const EmployeeDashboard = () => { }`)
- Default exports only

**Imports**
- Relative paths only (no `@/` alias configured)
- Named imports from libraries: `import { motion } from 'framer-motion';`

**TypeScript**
- Strict mode enabled
- Define interfaces for all API payloads
- Avoid `any` type

```typescript
// Good
} catch (err: unknown) {
  const message = err instanceof Error ? err.message : 'Unknown error';
}
```

**Components**
- Plain functions: `const ComponentName = () => { }`
- No `React.FC` type annotation (React 19)
- Local `useState` for component state (no global state management)

**Styling**
- Tailwind CSS utility classes inline
- Use `clsx` and `tailwind-merge` for conditional classes:

```typescript
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}
```

---

## Architecture Notes

### Backend Layers

```
Controller (api/) 
    ↓
Service (services/) 
    ↓
Repository (core/repositories/) 
    ↓
Entity (core/models/)
```

### Key Entity Relationships

- **Employee** → **Team** (Many-to-One via `teamId`)
- **Employee** → **Role** (Many-to-One via `roleId`)
- **Employee** → **NFC_Cards** (One-to-Many)
- **Employee** → **Attendance_Records** (One-to-Many)
- **Employee** → **Leave_Requests** (One-to-Many)
- **Employee** → **Payroll** (One-to-Many)

### Security Flow

1. User submits credentials to `/api/auth/login`
2. `AuthService` validates against BCrypt hash (with legacy plaintext fallback)
3. `JwtService` generates JWT with claims (email, role, employeeId)
4. Frontend stores JWT in localStorage
5. Subsequent requests include `Authorization: Bearer {token}`
6. Spring Security validates JWT (configuration in `SecurityConfig`)

---

## Known Gaps and TODOs

### Security
- [ ] JWT secret in `application.properties` - consider using environment variables in production
- [ ] BCrypt migration for legacy plain-text passwords is automatic on first successful login

### Testing
- [ ] No test directories exist (`src/test/java/`, `src/test/`)
- [ ] Add JUnit 5 + Mockito for backend
- [ ] Add Vitest + React Testing Library for frontend

### Code Quality
- [ ] No DTOs for request/response bodies (using `Map<String, String>`)
- [ ] No input validation (`@Valid` + Bean Validation annotations)
- [ ] No pagination for list endpoints
- [x] Centralized error handling implemented (`GlobalExceptionHandler`)

### Frontend
- [ ] No error boundaries around pages
- [ ] Consider React Query/SWR for data fetching

---

## User Roles

| Role | Description | Access Level |
|------|-------------|--------------|
| **ADMIN** | System administrator | Full access to all features, device management, user permissions |
| **HR** | Human Resources staff | All employee data, payroll processing, attendance management |
| **MANAGER** | Department head | View/edit team attendance, approve leave requests |
| **EMPLOYEE** | Regular employee | Personal dashboard, view own attendance, request leave |

---

## Useful Commands

### Backend Debugging
```bash
# Run with debug profile
mvn spring-boot:run -Dspring-boot.run.jvmArguments="-Xdebug -Xrunjdwp:transport=dt_socket,server=y,suspend=n,address=5005"

# Show dependency tree
mvn dependency:tree

# Check for plugin updates
mvn versions:display-plugin-updates
```

### Frontend Debugging
```bash
# Type-check without building
npx tsc --noEmit

# Clear cache and reinstall
rm -rf node_modules package-lock.json && npm install
```

### Database
```bash
# Connect to PostgreSQL
psql -U postgres -d hrms_db

# View all employees
SELECT * FROM Employees;

# View attendance records
SELECT * FROM Attendance_Records ORDER BY CheckIn DESC;
```

---

## File Reference

| File | Purpose |
|------|---------|
| `backend/src/main/java/com/hrms/api/SecurityConfig.java` | Spring Security configuration |
| `backend/src/main/java/com/hrms/services/JwtService.java` | JWT token generation/validation |
| `backend/src/main/java/com/hrms/services/AuthService.java` | Authentication logic with BCrypt |
| `backend/src/main/java/com/hrms/core/models/` | JPA entity classes |
| `backend/src/main/java/com/hrms/core/repositories/` | Spring Data JPA interfaces |
| `frontend/src/services/api.ts` | Axios instance + API functions |
| `frontend/src/App.tsx` | React Router configuration |
| `database/schema.sql` | PostgreSQL DDL statements |
