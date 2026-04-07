# HRMS Stabilization Plan

**Status**: Active | **Branch**: `stabilization-phase` | **No New Features Until Complete**

---

## Core Principle (Priority Order)

1. **Stability**
2. **Maintainability**
3. **Documentation**
4. **Testing**
5. **Then** add new features

**Rule**: *No new features* until all stabilization tasks are complete.

---

## Phase 0: Freeze (1-2 Days)

- [ ] Create branch: `git checkout -b stabilization-phase`
- [ ] Announce freeze to team: "No new features until stabilization is complete."
- [ ] All commits go to `stabilization-phase` only.
- [ ] No direct commits to `main` except critical hotfixes.

---

## Phase 1: Documentation & Cleanup (Week 1) – **Highest Priority**

### 1.1 Write Master README.md (Root Level)

Create a comprehensive `README.md` in the project root with:

- **Project Description**: Brief overview (HRMS with NFC-based attendance tracking)
- **Tech Stack**: Backend (Java 21, Spring Boot 3.2.0, PostgreSQL), Frontend (React 19, TypeScript, Vite, Tailwind CSS v4), Mobile (Flutter)
- **Step-by-Step Windows Setup Guide**:
  1. Install prerequisites (Java 21, Node.js 18+, PostgreSQL 12+, Maven)
  2. Database setup (`CREATE DATABASE hrms_db;` + run `schema.sql` + `seed_test_data.sql`)
  3. Backend setup (`backend/.env` configuration + `mvn spring-boot:run`)
  4. Frontend setup (`npm install` + `npm run dev`)
  5. Default test credentials table
- **Test Credentials Table**:

| Role | Email | Password | Dashboard |
|------|-------|----------|-----------|
| ADMIN | `admin@hrms.com` | `Admin@1234` | `/admin` |
| HR | `hr@hrms.com` | `HR@1234` | `/hr` |
| MANAGER | `manager@hrms.com` | `Manager@1234` | `/manager` |
| EMPLOYEE | `employee@hrms.com` | `Employee@1234` | `/dashboard` |

- **Directory Structure**: Visual tree of major folders
- **Team分工**: Who works on what (Person 1: Backend + DB + Testing + Docker | Person 2: Frontend + Mobile + Docs + UI)
- **Important Links**: DEV_SETUP.md, API_DOCS.md, project structure.md

### 1.2 Review & Complete Existing Documentation Files

- [ ] **DEV_SETUP.md**: Add Windows-specific troubleshooting tips, common issues
- [ ] **project structure.md**: Verify against actual structure, update if outdated
- [ ] **API_DOCS.md**: Update according to latest endpoint changes, ensure all endpoints are documented
- [ ] **NEXT_PHASE_CHECKLIST.md**: Mark completed items, remove outdated tasks
- [ ] **PHASE2_CHECKLIST.md**: Mark completed items, remove outdated tasks

### 1.3 Fix Existing Minor Issues

- [ ] Convert `Map<String, Object>` requests to typed DTOs (see Phase 1.4 below)
- [ ] Fix any obvious response format inconsistencies
- [ ] Ensure all controllers return `ResponseEntity<T>` with explicit status codes

### 1.4 Backend DTO Conversion Tasks (from NEXT_PHASE_CHECKLIST.md)

Review and convert these endpoints from `Map<String, Object>` to typed DTOs:

- [ ] Recruitment Request endpoints → `RecruitmentRequestDto.java`
- [ ] Advance Request endpoints → `AdvanceRequestDto.java`
- [ ] Any other Map-based request endpoints found during review

---

## Phase 2: Backend Stability (Week 1-2)

### 2.1 Endpoint Testing

- [ ] Test all existing endpoints manually using Postman or Swagger
- [ ] Verify authentication flow (login → JWT → protected endpoints)
- [ ] Verify role-based access control (Admin vs HR vs Manager vs Employee)
- [ ] Fix any response format inconsistencies
- [ ] Document any bugs found

### 2.2 Security Fixes

- [ ] Change `JWT_SECRET` to a very strong, long passphrase (at least 64 characters)
- [ ] Verify `.env` is in `.gitignore`
- [ ] Verify `backend/.env` is NOT committed
- [ ] Review CORS configuration
- [ ] Ensure all password hashes use BCrypt (check if legacy plaintext passwords exist)

### 2.3 Validation

- [ ] Add `@Valid` + Bean Validation annotations to all DTOs if missing
- [ ] Ensure request bodies are validated on all POST/PUT endpoints
- [ ] Add email format validation, required field checks, date range validation

### 2.4 Code Quality

- [ ] Replace any `System.out.println()` with SLF4J logging
- [ ] Ensure constructor injection only (no `@Autowired` field injection)
- [ ] Add `@Transactional` to all write operations
- [ ] Verify all repositories use `@Query` with JPQL for complex queries

**Assigned to**: Person 1 (Backend + DB + Testing + Docker)

---

## Phase 3: Frontend Stability (Week 2-3)

### 3.1 React Query Migration

- [ ] Complete migration of all API calls to React Query
- [ ] Remove manual `useEffect` data fetching patterns
- [ ] Implement proper caching and refetching strategies
- [ ] Add error handling in React Query hooks

### 3.2 Unified Error Handling

- [ ] Centralize error handling in one place (interceptors + error boundaries)
- [ ] Ensure consistent error messages from backend are displayed
- [ ] Add proper loading states and skeleton loaders
- [ ] Handle 401, 403, 404, 500 errors gracefully

### 3.3 UI Consistency

- [ ] Review and unify UI for: Login, Dashboard, Inbox, Leave Requests, Attendance, Payroll
- [ ] Ensure consistent color themes (dark luxury vs light slate)
- [ ] Verify responsive design works on common screen sizes
- [ ] Fix any visual inconsistencies or broken layouts

### 3.4 Build Verification

- [ ] Run `npm run build` and ensure zero errors
- [ ] Run `npm run lint` and fix all warnings
- [ ] Run `npx tsc --noEmit` and fix all TypeScript errors

**Assigned to**: Person 2 (Frontend + Mobile + Docs + UI)

---

## Phase 4: Basic Testing (Week 3-4)

### 4.1 Backend Tests

- [ ] **Authentication Tests**:
  - [ ] Login with valid credentials
  - [ ] Login with invalid credentials
  - [ ] JWT token generation and validation
  - [ ] Role-based access checks
- [ ] **Payroll Tests**:
  - [ ] Salary calculation logic
  - [ ] Attendance hours calculation
  - [ ] Deduction and bonus handling
- [ ] **Role-based Access Tests**:
  - [ ] Admin can access all endpoints
  - [ ] HR can access HR-specific endpoints
  - [ ] Manager can access team data
  - [ ] Employee can only access personal data

**Target**: 30-40% coverage on critical parts only

**Tools**: JUnit 5 + Mockito + MockMvc

### 4.2 Frontend Tests

- [ ] **Login Component Tests**:
  - [ ] Form validation
  - [ ] Successful login flow
  - [ ] Failed login handling
- [ ] **Protected Route Tests**:
  - [ ] Redirect to login if not authenticated
  - [ ] Role-based route access
- [ ] **Form Component Tests**:
  - [ ] Leave request form validation
  - [ ] Advance request form validation

**Target**: 30-40% coverage on critical parts only

**Tools**: Vitest + React Testing Library

---

## Phase 5: Docker + CI/CD + Clean Environment (Week 4-5)

### 5.1 Docker

- [ ] Fix and test `docker-compose.yml`
- [ ] Ensure backend container starts successfully
- [ ] Ensure frontend container builds and serves correctly
- [ ] Ensure PostgreSQL container initializes with schema
- [ ] Test full stack integration via Docker

### 5.2 GitHub Actions

- [ ] Review workflows in `.github/workflows/`
- [ ] Run GitHub Actions locally or push to test
- [ ] Fix any CI/CD pipeline errors
- [ ] Ensure builds pass on `stabilization-phase` branch

### 5.3 Staging Environment

- [ ] Set up simple staging environment (local machine or cheap service like Railway/Render)
- [ ] Deploy `stabilization-phase` branch to staging
- [ ] Verify all endpoints work in staging
- [ ] Test with production-like data

---

## Phase 6: Final Review & Merge (Week 5-6)

### 6.1 Code Review

- [ ] Person 1 reviews Person 2's code
- [ ] Person 2 reviews Person 1's code
- [ ] Fix any issues found during review
- [ ] Ensure coding standards are followed

### 6.2 Merge

- [ ] Merge `stabilization-phase` → `main`
- [ ] Create release tag: `git tag v0.8-stable`
- [ ] Push tags: `git push origin v0.8-stable`

### 6.3 Update Checklists

- [ ] Mark all completed items with ✅ in this document
- [ ] Update NEXT_PHASE_CHECKLIST.md
- [ ] Update PHASE2_CHECKLIST.md
- [ ] Document any remaining TODOs for future work

---

## Daily Routine (2-Person Team)

### Daily Standup (10-15 minutes at start of day)

1. What did I do yesterday?
2. What will I do today?
3. Any blockers?

### Work Division

| Person | Responsibilities |
|--------|------------------|
| **Person 1** | Backend + Database + Testing + Docker |
| **Person 2** | Frontend + Mobile + Documentation + UI |

### AI Usage

- Use AI (Grok, Claude, Cursor, Qwen) to help write tests and refactoring
- **Always review AI-generated code manually before committing**

### Cleanup Day

- Every 2 weeks: One full "Cleanup Day" with **no new code**
- Focus only on: refactoring, fixing, documenting, testing

---

## Success Criteria

After completing this plan, you should have:

- ✅ Clean, documented, and stable codebase
- ✅ All endpoints working correctly with proper authentication
- ✅ 30-40% test coverage on critical parts
- ✅ Docker setup that works out of the box
- ✅ CI/CD pipeline passing
- ✅ Comprehensive documentation (README, DEV_SETUP, API_DOCS)
- ✅ Ready to add new features quickly without breaking the project

---

## Post-Stabilization: Feature Development

Once stabilization is complete:

1. Create feature branches from `main`
2. Use PR reviews for all merges
3. Maintain test coverage above 30%
4. Update documentation with every new feature
5. Continue daily standups and bi-weekly cleanup days

---

**Last Updated**: April 7, 2026  
**Next Review**: After Phase 1 completion
