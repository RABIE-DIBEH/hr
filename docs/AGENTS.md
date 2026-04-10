# AGENTS.md - HRMS Project Guidelines

**Last Updated**: April 2026 | **Status**: Active project guidance, partially updated

## Project Overview
Human Resources Management System (HRMS) with NFC-based attendance tracking and multi-role dashboard system.
- **Backend**: Java 21, Spring Boot 3.2.0, Maven, PostgreSQL
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4
- **Mobile**: Flutter (planned, minimal scaffolding)
- **Authentication**: JWT + Spring Security with role-based access control
- **Database**: PostgreSQL with JPA/Hibernate ORM

## Directory Structure
```
backend/src/main/java/com/hrms/
├── api/                    # Controllers + SecurityConfig
├── core/models/             # JPA entities
├── core/repositories/      # Spring Data JPA interfaces
└── services/               # Business logic

frontend/src/
├── components/             # Reusable UI (Sidebar, BottomNav)
├── pages/                  # Route-level page components
└── services/api.ts         # Axios instance + API functions
```

## Build / Lint / Test Commands

### Backend (run from `backend/`)
```bash
mvn clean compile           # Compile Java sources
mvn spring-boot:run        # Start dev server (port 8080)
mvn clean package            # Build JAR
mvn test                    # Run backend tests
mvn test -Dtest=ClassName   # Run single test class
mvn test -Dtest=ClassName#methodName  # Run single test method
```

### Frontend (run from `frontend/`)
```bash
npm run dev                 # Start Vite dev server (port 5173)
npm run build               # Type-check + production build
npm run lint                # Run ESLint
npm run preview             # Preview production build
```

### Notes
- Backend tests exist under `backend/src/test/` and use JUnit 5 + Mockito + MockMvc.
- Frontend has no testing libraries (Vitest, Jest, or RTL not installed).
- To add tests: use JUnit 5 + Mockito for backend; Vitest + React Testing Library for frontend.
- Backend local secrets are loaded from `backend/.env` via Spring config import. Commit `.env.example`, not `.env`.

## Code Style Conventions

### Backend (Java/Spring Boot)

**Naming**
- Classes: PascalCase (`AuthController`, `AttendanceService`)
- Methods/Fields: camelCase (`findByEmail`, `clockByNfcUid`)
- Constants: UPPER_SNAKE_CASE (`SECRET_KEY`)
- Repository interfaces: EntityName + "Repository" (`EmployeeRepository`)

**Dependency Injection**
- Constructor injection only (use `final` fields)
- No `@Autowired` field injection
```java
@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService authService;
    public AuthController(AuthService authService) { this.authService = authService; }
}
```

**Controllers**
- Use `@RestController` with `@RequestMapping("/api/{domain}")` at class level
- Return `ResponseEntity<T>` with explicit status codes
- Request bodies: prefer dedicated DTOs over `Map<String, String>`

**Services**
- Annotate with `@Service`
- Use `@Transactional` on write operations
- Constructor injection with `final` fields

**Repositories**
- Extend `JpaRepository<Entity, Long>`
- Use `@Query` with JPQL for complex queries
- Use Spring Data derived queries for simple lookups

**Entities**
- No-arg constructor (required by JPA) + all-args constructor with builder inner class
- Use `@PrePersist` for auto-setting `createdAt` timestamp (see `Employee.java`)
- Manual builder pattern (no Lombok to reduce external dependencies)
- JPA annotations: `@Entity`, `@Table`, `@Column`, `@ManyToOne`, `@OneToOne`, `@Predicate`
- Use `GenerationType.IDENTITY` for auto-generated IDs
- Foreign key relationships: Use `@ManyToOne(fetch=FetchType.LAZY)` to avoid N+1 queries
- Example: `Employee.java` has `managerId` (FK), `teamId` (FK), `departmentId` (FK)

**Error Handling**
- ✅ **Already implemented**: `GlobalExceptionHandler.java` with `@ControllerAdvice` handles:
  - `ValidationException` → 400 with field errors
  - `ResponseStatusException` → explicit HTTP status from service logic
  - `AccessDeniedException` → 403 (security check failures)
- **Current gap**: Inconsistent response formats (some controllers return `Map<String, Object>`, others use DTOs)
- **Roadmap**: Create standardized `ApiResponse<T>` wrapper for all endpoints (see below)

**Validation**
- ✅ **Already in place**: `@Valid` + Bean Validation annotations on DTOs (`@NotBlank`, `@NotNull`, `@Email`)
- Examples: `LoginRequest.java`, `LeaveRequestDto.java`, `NfcClockRequest.java`
- **Current gap**: Some endpoints (RecruitmentRequest, AdvanceRequest) still accept `Map<String, Object>` instead of DTOs
- **Roadmap**: Migrate all Map-based requests to typed DTOs

**Security & Authentication**
- ✅ JWT filter implemented: `JwtAuthenticationFilter.java` (OncePerRequestFilter)
- ✅ Password upgrade on first login: Plaintext → BCrypt migration in `AuthService.java`
- ✅ Role-based access: Pattern is `@AuthenticationPrincipal EmployeeUserDetails principal` + `hasAnyRole(principal, "ROLE_X")`
- ✅ Stateless sessions: `SecurityConfig.java` uses `SessionCreationPolicy.STATELESS`
- ✅ CORS configured for localhost:5173
- ✅ JWT secret + DB credentials now come from environment-backed config (`backend/.env` locally)
- ✅ Security config enforces authenticated and role-based endpoint access across `/api/**`
- ⚠️ **Remaining gap**: local dev seed users still use predictable dev passwords until first login upgrade or explicit replacement

### Backend: Actual Working Patterns

These patterns are **actively used and verified** across the codebase. Reference these files when implementing similar features:

| Pattern | Example File | Key Lines |
|---------|--------------|-----------|
| **DTO with Validation** | `LoginRequest.java` | Uses records with `@Email`, `@NotBlank` annotations |
| **Service Layer** | `AuthService.java` | Shows @Transactional, password upgrade, BCrypt usage |
| **Controllers** | `EmployeeController.java` | Response DTOs, role checks, clean response structure |
| **Exception Handling** | `GlobalExceptionHandler.java` | @ControllerAdvice catches and formats errors |
| **Entity Modeling** | `Employee.java` | No-arg/all-args constructors, builder pattern, @PrePersist, foreign keys |
| **JWT Security** | `JwtAuthenticationFilter.java` | OncePerRequestFilter with proper Spring Security integration |
| **Local Env Loading** | `application.properties` + `backend/.env.example` | Spring imports local `.env` automatically |
| **Repositories** | Various in `core/repositories/` | Spring Data derived queries; custom @Query for complex lookups |

### Frontend (TypeScript/React)

**Naming**
- Component files: PascalCase (`EmployeeDashboard.tsx`, `BottomNav.tsx`)
- Component functions: PascalCase (`const EmployeeDashboard = () => { }`)
- Default exports only

**Imports**
- Relative paths only (no `@/` alias configured)
- Example: `import Sidebar from '../components/Sidebar';`
- Use named imports from libraries: `import { motion } from 'framer-motion';`

**TypeScript**
- Strict mode enabled (`tsconfig.app.json`)
- Define interfaces/types for all API request/response shapes
- Avoid `any` type - use proper typing in catch blocks
```typescript
// Good
} catch (err: unknown) {
  const message = err instanceof Error ? err.message : 'Unknown error';
}
// Avoid
} catch (err: any) { }
```

**Components**
- Plain functions: `const ComponentName = () => { ... }`
- No `React.FC` type annotation needed with React 19
- Use local `useState` for component state
- No global state management (no Redux, Zustand, Context)

**Styling**
- Tailwind CSS utility classes inline
- Custom theme variables in `index.css` (`--color-luxury-*`)
- Use `clsx` and `tailwind-merge` (already installed) for conditional classes:
```typescript
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}
```

**Two visual themes coexist** - dark luxury (fintech pages) and light slate (HRMS dashboards). Maintain consistency when adding new features.

**API Layer**
- Add request/response interceptors for auth token injection
- Add error interceptors for centralized error handling

### Frontend: Actual Working Patterns

These patterns are **actively used and verified** across the codebase. Reference these files when implementing similar features:

| Pattern | Example File | Key Implementation |
|---------|--------------|-------------------|
| **API Types & Interceptors** | `api.ts` | Comprehensive type interfaces + request interceptor auto-injects JWT + response interceptor handles 401 |
| **Auth Module** | `auth.ts` | JWT decode with expiry validation, role checking helpers |
| **Protected Routes** | `ProtectedRoute.tsx` | Role-based access control with redirect to intended route |
| **Form Components** | `LeaveRequestForm.tsx`, `AdvanceRequestForm.tsx` | Validation, loading state, error handling, submission |
| **Role-based Navigation** | `Sidebar.tsx` | Filters menu items by role; SUPER_ADMIN sees entire menu |
| **Error Boundary** | `ErrorBoundary.tsx` | Class component with error UI and recovery |
| **Page Components** | `EmployeeDashboard.tsx`, `HRDashboard.tsx` | useEffect data fetching, composition of smaller components |

**API Layer Implementation Details**
- ✅ Request interceptor adds `Authorization: Bearer <token>` header
- ✅ Response interceptor catches 401 and redirects to `/login`
- ✅ All API payloads have TypeScript interfaces (no `any` types)
- ⚠️ **Current gaps**: Plain axios with useEffect (no React Query/SWR → possible duplicate requests, no caching); form validation duplicated on frontend (same rules exist on backend)

## Key Patterns to Follow

### Backend Best Practices (Reference Implementations)

**When writing a new controller:**
1. Use DTOs for request/response bodies (see `LoginRequest.java` pattern)
2. Apply `@Valid` on `@RequestBody` parameter
3. Return `ResponseEntity<DTO>` with explicit status codes
4. For errors, throw `ResponseStatusException` (GlobalExceptionHandler catches it)
5. Inject dependencies via constructor with `final` fields

**When writing a new service:**
1. Annotate class with `@Service`
2. Add `@Transactional` on write operations (create, update, delete)
3. Use constructor injection with `final` fields
4. Example: `AuthService` shows password upgrade + BCrypt usage pattern

**When creating a new entity:**
1. Require no-arg constructor for JPA
2. Create all-args constructor + builder inner class
3. Use `@PrePersist` for auto-set timestamps (like `Employee.java`)
4. Use `@ManyToOne(fetch=FetchType.LAZY)` for foreign keys to avoid N+1 queries

**When working with repositories:**
1. Use Spring Data derived queries for simple lookups: `findById()`, `findByEmail()`
2. Use `@Query` with JPQL for complex queries requiring joins or custom logic
3. Always include pagination support for list endpoints

### Frontend Best Practices (Reference Implementations)

**When fetching data:**
1. Call API functions from `services/api.ts` (has interceptors pre-configured)
2. Define TypeScript interfaces for all payloads (no `any` types)
3. Handle errors with proper type checking: `err instanceof Error ? err.message : 'Unknown'`
4. Example: Use `EmployeeProfile`, `AttendanceRecord` interfaces from `api.ts`

**When creating protected components:**
1. Wrap routes with `ProtectedRoute.tsx`
2. Filter UI elements by role using `getRole()` from `auth.ts`
3. Allow SUPER_ADMIN to access all sections (reference: `Sidebar.tsx`)

**When building forms:**
1. Use `useState` for loading + error state
2. Validate on submit (backend validation is authoritative)
3. Show errors from backend response (field-level validation from GlobalExceptionHandler)
4. Reference: `LeaveRequestForm.tsx` or `AdvanceRequestForm.tsx`

**When styling:**
1. Use Tailwind CSS v4 utility classes
2. Use `clsx` + `tailwind-merge` for conditional classes (already installed)
3. Maintain both dark luxury theme (fintech) and light slate theme (HRMS dashboards)

### Validation Strategy (Split Frontend/Backend)

- **Frontend validation**: For immediate user feedback (required fields, email format, date ranges)
- **Backend validation**: @Valid + Bean Validation annotations (security boundary—never trust client)
- **Keep them in sync**: Document validation rules in both frontend and backend consistently

### Response Format Strategy (Under Development)

Currently inconsistent—some endpoints return `Map<String, Object>`, others use DTOs. **Roadmap: standardize all responses to use:**
```java
record ApiResponse<T>(
    int status,
    String message,
    T data,
    LocalDateTime timestamp
) {}
```

### Pagination Strategy (Under Development)

List endpoints should support pagination—currently return unlimited results. **Recommended pattern:**
```java
record PaginationRequest(int page, int pageSize) {}
record PaginatedResponse<T>(List<T> items, int total, int page, int pageSize) {}
```

### Logging Pattern

- Use SLF4J (not `System.out.println()`): `private static final Logger log = LoggerFactory.getLogger(...);`
- Log at appropriate levels: DEBUG for flow, INFO for significant events, ERROR for failures

## Known Inconsistencies & Gaps

| Category | Issue | Severity | Affected Files | Recommended Fix |
|----------|-------|----------|-----------------|-----------------|
| **Request Format** | Some legacy notes are outdated; current recruitment and advance endpoints use DTOs | 🟡 | Review docs before assuming gaps | Keep docs aligned with code |
| **Response Format** | Mixed return types (Map vs DTO vs Entity) | 🔴 | Various controllers | Standardize to ApiResponse<T> wrapper |
| **Pagination** | No pagination on list endpoints | 🟡 | All `/api/**` list endpoints | Add PageRequest/PageResponse pattern |
| **Logging** | Some legacy notes mention `System.out.println`, but AuthService/DataInitializer are already on SLF4J | 🟡 | Review remaining services opportunistically | Keep logging consistent |
| **Data Fetching** | No React Query/SWR (potential duplicate requests) | 🟡 | api.ts | Consider adding React Query |
| **Secrets** | Secrets must now be supplied via env or local `.env` | 🟡 | `backend/.env` local only | Keep `.env` out of git |
| **Endpoint Security** | Legacy note was outdated; role-based guards are already configured | 🟡 | SecurityConfig.java | Add coverage tests when changing rules |
| **Form Validation Sync** | Rules duplicated frontend/backend | 🟡 | LeaveRequestForm, etc. | Document sync strategy |
| **Error Boundaries** | No error boundaries on all pages | 🟡 | Dashboard pages | Wrap pages in ErrorBoundary |

## Backend
- ✅ Constructor injection consistently applied
- ✅ DTOs + @Valid pattern in place (LoginRequest exemplar)
- ✅ GlobalExceptionHandler working
- ✅ JWT authentication functional
- ✅ @Transactional on write operations
- ⚠️ Some endpoints bypass DTOs (Map-based requests need fixing)
- ⚠️ Responses not standardized

## Frontend
- ✅ Strict TypeScript enabled
- ✅ API interceptors working (JWT injection, 401 handling)
- ✅ Role-based access control in UI
- ✅ Protected routes functional
- ✅ Error boundaries implemented
- ⚠️ No data fetching library (React Query recommended)
- ⚠️ Form validation duplicated from backend

## Security Notes (Current Gaps)
- JWT filter is in the security chain
- Endpoint access rules are enforced in `SecurityConfig.java`
- Local secrets now come from `backend/.env` or environment variables
- Dev seed users still start from predictable local passwords, so treat them as dev-only credentials
- **Recommendations**: rotate local secrets when sharing environments, keep `.env` out of git, add more security-rule tests as access rules evolve

## Future Improvements (Roadmap)
1. ✅ **Done**: GlobalExceptionHandler, JWT auth, `@Valid` validation, constructor injection pattern
2. ✅ **Done**: secrets moved to env-backed config and endpoint security enforced
3. ⚠️ **In Progress**: standardize response DTOs and remaining pagination consistency
4. 📋 **Medium Priority**: expand backend tests and add frontend test tooling
5. 📋 **Medium Priority**: implement React Query/SWR for data fetching, add centralized form error handler
6. 🎯 **Future**: DB migrations (Liquibase/Flyway), request/response logging, type-safe validation sharing
