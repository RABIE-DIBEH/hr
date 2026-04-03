# HRMS PRO — Session Init Snapshot

## Tech Stack
| Layer | Tech |
|---|---|
| **Backend** | Java 21, Spring Boot 3.2.0, Maven, PostgreSQL, JWT (jjwt 0.11.5) |
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS v4, framer-motion, lucide-react |
| **Mobile** | Flutter (scaffolded, minimal) |

---

## Backend (Spring Boot — port 8080)

### Controllers (`backend/src/main/java/com/hrms/api/`)
| File | Responsibility |
|---|---|
| `AuthController` | POST `/api/auth/login` → returns JWT |
| `AttendanceController` | NFC clock-in/out, fraud reporting |
| `LeaveController` | Submit requests, list own requests, approve/reject (manager) |
| `EmployeeController` | Profile, full list (HR/Admin), team list (Manager) |
| `PayrollController` | Calculate monthly salary, list payroll records |
| `RecruitmentRequestController` | Full CRUD for job requests |
| `GlobalExceptionHandler` | Centralized error responses (`@ControllerAdvice`) ✅ |
| `SecurityConfig` | Spring Security + JWT filter chain |

### Services (`services/`)
`AttendanceService`, `AuthService`, `EmployeeDirectoryService`, `JwtService`, `LeaveService`, `PayrollService`, `RecruitmentRequestService`

### JPA Entities (`core/models/`)
`Employee`, `UsersRole`, `Team`, `NFCCard`, `AttendanceRecord`, `LeaveRequest`, `Payroll`, `RecruitmentRequest`

### DTOs (`api/dto/`)
`EmployeeProfileResponse`, `EmployeeSummaryResponse`, `RecruitmentRequestResponse`
> ⚠️ Most controllers still use `Map<String, String>` — DTOs are only partially implemented

---

## Frontend (React + Vite — port 5173)

### Routes (`App.tsx`)
| Route | Page |
|---|---|
| `/` | `Home` — landing/marketing page |
| `/login` | `Login` |
| `/dashboard` | `EmployeeDashboard` |
| `/manager` | `ManagerDashboard` |
| `/hr` | `HRDashboard` |
| `/admin` | `AdminDashboard` |
| `/finance` | `Expenses` (luxury fintech view) |
| `/goals` | `Goals` |
| `/attendance` | `AttendanceLogs` |
| `/clock` | `NFCClock` |

### Components
- `Sidebar.tsx` — desktop navigation
- `BottomNav.tsx` — mobile navigation
- `RecruitmentRequestForm.tsx` — large form component (22 KB)

### Key Libraries
`axios`, `framer-motion`, `lucide-react`, `clsx`, `tailwind-merge`, `react-router-dom v7`

---

## Known Gaps / TODOs

### Security
- [ ] JWT secret in `application.properties` → use env vars before prod
- [x] BCrypt hashing implemented (auto-migrates plaintext on login)

### Backend Code Quality
- [ ] Most controllers use `Map<String, String>` for bodies — migrate to DTOs
- [ ] No `@Valid` / Bean Validation on inputs
- [ ] No pagination on list endpoints
- [x] `GlobalExceptionHandler` implemented

### Testing
- [ ] No `src/test/java/` directory — zero backend test coverage
- [ ] No Vitest/Jest on frontend

### Frontend
- [ ] No route guards / auth protection (all routes open)
- [ ] No error boundaries
- [ ] API interceptors missing (token not auto-injected yet in `api.ts`)
- [ ] No React Query / SWR — plain `useEffect` fetches

---

## Next Priorities (suggested)
1. Add JWT auth interceptor to `frontend/src/services/api.ts`
2. Protect routes (redirect to `/login` if no token)
3. Migrate controller request bodies to DTOs with `@Valid`
4. Add `src/test/java/` and at least happy-path tests for `AuthService`
5. NFC native integration in mobile Flutter app
