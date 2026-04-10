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

- [x] Create branch: `git checkout -b stabilization-phase`
- [x] Announce freeze to team: "No new features until stabilization is complete."
- [x] All commits go to `stabilization-phase` only.
- [x] No direct commits to `main` except critical hotfixes.

---

## Phase 1: Documentation & Cleanup (Week 1) [X] Finished

### 1.1 Write Master README.md (Root Level)

- [x] Create a comprehensive `README.md` in the project root with:
  - Project Description
  - Tech Stack
  - Step-by-Step Windows Setup Guide
  - Test Credentials Table
  - Directory Structure
  - Team Division
  - Important Links

### 1.2 Review & Complete Existing Documentation Files

- [x] **DEV_SETUP.md**: Add Windows-specific troubleshooting tips, common issues
- [x] **project structure.md**: Verify against actual structure, update if outdated
- [x] **API_DOCS.md**: Update according to latest endpoint changes, ensure all endpoints are documented
- [x] **NEXT_PHASE_CHECKLIST.md**: Mark completed items, remove outdated tasks
- [x] **PHASE2_CHECKLIST.md**: Mark completed items, remove outdated tasks

### 1.3 Fix Existing Minor Issues

- [x] Convert `Map<String, Object>` requests to typed DTOs (see Phase 1.4 below)
- [x] Fix any obvious response format inconsistencies
- [x] Ensure all controllers return `ResponseEntity<T>` with explicit status codes

### 1.4 Backend DTO Conversion Tasks (from NEXT_PHASE_CHECKLIST.md)

Review and convert these endpoints from `Map<String, Object>` to typed DTOs:

- [x] Recruitment Request endpoints → `RecruitmentRequestDto.java`
- [x] Advance Request endpoints → `AdvanceRequestDto.java`
- [x] Any other Map-based request endpoints found during review

---

## Phase 2: Backend Stability (Week 1-2) ✅ COMPLETED

### 2.1 Endpoint Testing

- [x] Test all existing endpoints manually using Postman or Swagger
- [x] Verify authentication flow (login → JWT → protected endpoints)
- [x] Verify role-based access control (Admin vs HR vs Manager vs Employee)
- [x] Fix any response format inconsistencies
- [x] Document any bugs found

### 2.2 Security Fixes

- [x] Change `JWT_SECRET` to a very strong, long passphrase (at least 64 characters)
- [x] Verify `.env` is in `.gitignore`
- [x] Verify `backend/.env` is NOT committed
- [x] Review CORS configuration
- [x] Ensure all password hashes use BCrypt (check if legacy plaintext passwords exist)

### 2.3 Validation

- [x] Add `@Valid` + Bean Validation annotations to all DTOs if missing
- [x] Ensure request bodies are validated on all POST/PUT endpoints
- [x] Add email format validation, required field checks, date range validation

### 2.4 Code Quality

- [x] Replace any `System.out.println()` with SLF4J logging
- [x] Ensure constructor injection only (no `@Autowired` field injection)
- [x] Add `@Transactional` to all write operations
- [x] Verify all repositories use `@Query` with JPQL for complex queries

**Assigned to**: Person 1 (Backend + DB + Testing + Docker)

---

## Phase 3: Frontend Stability (Week 2-3) ✅ COMPLETED

### 3.1 React Query Migration

- [x] Complete migration of all API calls to React Query
- [x] Remove manual `useEffect` data fetching patterns
- [x] Implement proper caching and refetching strategies
- [x] Add error handling in React Query hooks

### 3.2 Unified Error Handling

- [x] Centralize error handling in one place (interceptors + error boundaries)
- [x] Ensure consistent error messages from backend are displayed
- [x] Add proper loading states and skeleton loaders
- [x] Handle 401, 403, 404, 500 errors gracefully

### 3.3 UI Consistency

- [x] Review and unify UI for: Login, Dashboard, Inbox, Leave Requests, Attendance, Payroll
- [x] Ensure consistent color themes (dark luxury vs light slate)
- [x] Verify responsive design works on common screen sizes
- [x] Fix any visual inconsistencies or broken layouts

### 3.4 Build Verification

- [x] Run `npm run build` and ensure zero errors
- [x] Run `npm run lint` and fix all warnings
- [x] Run `npx tsc --noEmit` and fix all TypeScript errors

**Assigned to**: Person 2 (Frontend + Mobile + Docs + UI)

---

## Phase 4: Basic Testing (Week 3-4) ✅ COMPLETED

### 4.1 Backend Tests

- [x] **Authentication Tests**:
  - [x] Login with valid credentials
  - [x] Login with invalid credentials
  - [x] JWT token generation and validation
  - [x] Role-based access checks
- [x] **Payroll Tests**:
  - [x] Salary calculation logic
  - [x] Attendance hours calculation
  - [x] Deduction and bonus handling
- [x] **Role-based Access Tests**:
  - [x] Admin can access all endpoints
  - [x] HR can access HR-specific endpoints
  - [x] Manager can access team data
  - [x] Employee can only access personal data

**Target**: 30-40% coverage on critical parts only ✅ ACHIEVED (86 backend tests, 23 frontend tests)

**Tools**: JUnit 5 + Mockito + MockMvc

### 4.2 Frontend Tests

- [x] **Login Component Tests**:
  - [x] Form validation
  - [x] Successful login flow
  - [x] Failed login handling
- [x] **Protected Route Tests**:
  - [x] Redirect to login if not authenticated
  - [x] Role-based route access
- [x] **Form Component Tests**:
  - [x] Leave request form validation
  - [x] Advance request form validation

**Target**: 30-40% coverage on critical parts only

**Tools**: Vitest + React Testing Library

---

## Phase 5: Docker + CI/CD + Clean Environment (Week 4-5) ✅ COMPLETED

### 5.1 Docker

- [x] Fix and test `docker-compose.yml`
- [x] Ensure backend container starts successfully
- [x] Ensure frontend container builds and serves correctly
- [x] Ensure PostgreSQL container initializes with schema
- [x] Test full stack integration via Docker

### 5.2 GitHub Actions

- [x] Review workflows in `.github/workflows/`
- [x] Run GitHub Actions locally or push to test
- [x] Fix any CI/CD pipeline errors
- [x] Ensure builds pass on `stabilization-phase` branch

### 5.3 Staging Environment

- [x] Set up simple staging environment (local machine or cheap service like Railway/Render)
- [x] Deploy `stabilization-phase` branch to staging
- [x] Verify all endpoints work in staging
- [x] Test with production-like data

---

## Phase 6: Final Review & Merge (Week 5-6) ✅ IN PROGRESS

### 6.1 Code Review

- [x] Person 1 reviews Person 2's code
- [x] Person 2 reviews Person 1's code
- [x] Fix any issues found during review
- [x] Ensure coding standards are followed

### 6.2 Merge

- [ ] Merge `stabilization-phase` → `main`
- [ ] Create release tag: `git tag v0.8-stable`
- [ ] Push tags: `git push origin v0.8-stable`

### 6.3 Update Checklists

- [x] Mark all completed items with ✅ in this document
- [x] Update NEXT_PHASE_CHECKLIST.md
- [x] Update PHASE2_CHECKLIST.md
- [x] Document any remaining TODOs for future work

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
**Status**: Phases 0-5 ✅ COMPLETE | Phase 6 🔄 IN PROGRESS (Ready for merge to main)  
**Next Step**: Merge `stabilization-phase` → `main` and create v0.8-stable tag
