# AGENTS.md - HRMS Project Guidelines

## Project Overview
Human Resources Management System (HRMS) with NFC-based attendance tracking.
- **Backend**: Java 21, Spring Boot 3.2.0, Maven, PostgreSQL
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4
- **Mobile**: Flutter (planned, minimal scaffolding)

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
mvn test                    # Run all tests (none currently exist)
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
- **No test framework is currently configured** in either backend or frontend.
- `spring-boot-starter-test` is in `pom.xml` but `src/test/` does not exist.
- Frontend has no testing libraries (Vitest, Jest, or RTL not installed).
- To add tests: use JUnit 5 + Mockito for backend; Vitest + React Testing Library for frontend.

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
- No-arg constructor (required by JPA) + all-args constructor
- Use `@PrePersist` for auto-setting timestamps
- Manual builder inner classes (no Lombok)
- JPA annotations: `@Entity`, `@Table`, `@Column`, `@ManyToOne`, `@OneToOne`
- Use `GenerationType.IDENTITY` for auto-generated IDs

**Error Handling**
- Currently: inline `ResponseEntity.badRequest()` / `.notFound()`
- **Add `@ControllerAdvice`** for centralized exception handling
- Create custom exception classes and `ErrorResponse` DTOs

**Validation**
- Add `@Valid` + Bean Validation annotations (`@NotBlank`, `@NotNull`, etc.) to DTOs
- Currently no input validation exists

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

## Key Patterns to Follow

### Backend
- Create DTOs for request/response bodies instead of raw `Map<String, String>`
- Add `@ControllerAdvice` for centralized error handling
- Add `@Valid` + Bean Validation annotations
- Consider using Lombok to reduce boilerplate (builder, getters, setters)
- Add pagination for list endpoints

### Frontend
- Define TypeScript interfaces for all API payloads
- Use `clsx`/`tailwind-merge` for conditional className strings
- Add error boundaries around pages
- Consider adding React Query/SWR for data fetching
- Add tests before implementing new features

## Security Notes (Current Gaps)
- All endpoints are `permitAll()` - no actual authentication enforcement
- JWT secret is hardcoded in code; DB password in `application.properties`
- No JWT validation filter in Spring Security chain
- Password comparison is plaintext (BCrypt bean defined but unused)
- **Recommendations**: Use environment variables for secrets, implement JWT filter, add role-based access control

## Future Improvements
1. Add test directories (`src/test/java/`, `src/`) with proper test framework
2. Implement centralized error handling (`@ControllerAdvice`)
3. Add DTOs and input validation
4. Fix security configuration (JWT filter, BCrypt, env vars)
5. Add TypeScript interfaces to frontend
6. Configure path aliases in Vite/TypeScript
7. Add error boundaries and API interceptors on frontend
