# Agent Task Division - Stabilization Plan

**Branch**: `stabilization-phase`  
**Date**: April 7, 2026  
**Conflict Strategy**: Agent A works on `backend/` only, Agent B works on `frontend/` only

---

## Agent A: Backend Specialist (Person 1)

### **Scope**: `backend/src/` + `database/` + Docker + Tests

### Phase 1: Backend Cleanup (Week 1)

#### 1.1 DTO Conversions (Section 1.4)
- [ ] Review all controllers for remaining `Map<String, Object>` usage
- [ ] Convert any Map-based requests to typed DTOs
- [ ] Ensure all controller methods return `ResponseEntity<DTO>`

#### 1.2 Code Quality (Section 2.4)
- [ ] Search for `System.out.println()` → Replace with SLF4J
  ```bash
  grep -r "System.out.println" backend/src/
  ```
- [ ] Verify constructor injection only (no `@Autowired` fields)
  ```bash
  grep -r "@Autowired" backend/src/
  ```
- [ ] Ensure `@Transactional` on all write operations
- [ ] Verify repository `@Query` annotations use JPQL

#### 1.3 Validation (Section 2.3)
- [ ] Add `@Valid` to all `@RequestBody` parameters in controllers
- [ ] Ensure DTOs have Bean Validation annotations:
  - `@NotBlank` on required strings
  - `@Email` on email fields
  - `@NotNull` on required numbers/dates
  - `@Size(min, max)` where applicable
- [ ] Test validation errors return 400 with field errors

#### 1.4 Security Fixes (Section 2.2)
- [ ] Generate strong JWT_SECRET:
  ```bash
  openssl rand -base64 48
  ```
- [ ] Update `.env.example` with new secret placeholder
- [ ] Verify `.env` is in `.gitignore`
- [ ] Review CORS config in `SecurityConfig.java`
- [ ] Check BCrypt password upgrade on first login (AuthService.java)

### Phase 2: Backend Testing (Week 3-4)

#### 2.1 Controller Tests (Track A3 - 11 tests)
Create tests under `backend/src/test/java/com/hrms/api/`:

| Test Class | Tests to Add | Priority |
|------------|-------------|----------|
| `EmployeeControllerTest.java` | `deleteEmployee_Allowed_ReturnsTypedResponse()` | 🔴 High |
| `EmployeeControllerTest.java` | `deleteEmployee_SelfDeletion_Returns400()` | 🔴 High |
| `EmployeeControllerTest.java` | `deleteEmployee_NonAdmin_Returns403()` | 🔴 High |
| `EmployeeControllerTest.java` | `resetPassword_Allowed_ReturnsTypedResponse()` | 🔴 High |
| `EmployeeControllerTest.java` | `resetPassword_NonManager_Returns403()` | 🔴 High |
| `PayrollControllerTest.java` | `calculateAllPayroll_Allowed_ReturnsTypedResponse()` | 🔴 High |
| `PayrollControllerTest.java` | `calculateAllPayroll_NonHr_Returns403()` | 🔴 High |
| `AdminControllerTest.java` | `deleteDevice_ReturnsTypedResponse()` | 🟡 Medium |
| `RecruitmentRequestControllerTest.java` *(new)* | `processRequest_Approve_CreatesEmployee_ReturnsCredentials()` | 🔴 High |
| `RecruitmentRequestControllerTest.java` *(new)* | `processRequest_Reject_ReturnsRejectedStatus()` | 🔴 High |
| `RecruitmentRequestControllerTest.java` *(new)* | `processRequest_NonAuthorized_Returns403()` | 🔴 High |

**Pattern to follow**:
```java
@Test
void deleteEmployee_Allowed_ReturnsTypedResponse() throws Exception {
    // Given: Admin user, valid employee ID
    // When: DELETE /api/employees/{id}
    // Then: 200 OK, EmployeeDeletionResponse DTO
}
```

#### 2.2 Security Tests (Track C1 - 6 tests)
| Test | File | Description |
|------|------|-------------|
| Employee endpoint role checks | `EmployeeControllerTest.java` | Test ADMIN/HR can access, EMPLOYEE cannot |
| Admin endpoint role checks | `AdminControllerTest.java` | Test only ADMIN/SUPER_ADMIN can access |
| Payroll endpoint role checks | `PayrollControllerTest.java` | Test PAYROLL/ADMIN can access, others cannot |
| Recruitment endpoint role checks | `RecruitmentRequestControllerTest.java` | Test HR/MANAGER can access |
| SecurityConfig review | `SecurityConfig.java` | Manual review of all `.requestMatchers()` rules |
| Full security chain integration test | `SecurityIntegrationTest.java` *(new)* | `@SpringBootTest` + `MockMvc` end-to-end auth |

#### 2.3 Service Layer Tests (Phase 4.1)
| Service | Tests | Priority |
|---------|-------|----------|
| `AuthServiceTest.java` | Login valid/invalid, JWT generation, BCrypt upgrade | 🔴 High |
| `PayrollServiceTest.java` | Salary calculation, overtime, deductions | 🔴 High |
| `AttendanceServiceTest.java` | Clock in/out logic, work hours calculation | 🟡 Medium |
| `LeaveRequestServiceTest.java` | Duration calculation, balance checks | 🟡 Medium |

### Phase 3: Docker & CI/CD (Week 4-5)

#### 3.1 Docker Setup
- [ ] Test `docker-compose.yml`:
  ```bash
  docker-compose down -v
  docker-compose up --build
  ```
- [ ] Verify PostgreSQL container initializes with schema
- [ ] Verify backend container connects to database
- [ ] Verify frontend container builds and serves correctly
- [ ] Test full stack: login via browser → API calls work

#### 3.2 GitHub Actions
- [ ] Review `.github/workflows/*.yml`
- [ ] Push to `stabilization-phase` branch to trigger CI
- [ ] Fix any pipeline errors
- [ ] Ensure both backend and frontend builds pass

### Agent A: Files Modified
```
backend/src/main/java/com/hrms/
├── api/                    # Controllers (DTO returns, @Valid)
├── services/               # @Transactional, SLF4J, BCrypt checks
├── core/models/            # Entity validation annotations
└── security/               # SecurityConfig review

backend/src/test/java/com/hrms/api/
├── EmployeeControllerTest.java
├── PayrollControllerTest.java
├── AdminControllerTest.java
├── RecruitmentRequestControllerTest.java  (new)
├── AuthServiceTest.java                   (new)
├── PayrollServiceTest.java                (new)
└── SecurityIntegrationTest.java           (new)

database/                   # Schema fixes if needed
docker-compose.yml          # Docker setup
.env.example                # JWT_SECRET update
```

---

## Agent B: Frontend Specialist (Person 2)

### **Scope**: `frontend/src/` + Documentation + Mobile

### Phase 1: Frontend Cleanup (Week 1) ✅ **COMPLETE**

#### 1.1 React Query Migration ✅ **DONE**
- [x] DeviceManagement.tsx - 3 mutations
- [x] TeamAttendance.tsx - 2 mutations
- [x] UserManagement.tsx - 3 mutations + fixed hook ordering
- [x] PayrollDashboard.tsx - 7 mutations, 6 queries
- [x] NFCClock.tsx - Search query
- [x] HRAttendanceGrid.tsx - Manual correction mutation
- [x] Expenses.tsx - Payroll calculation mutation

#### 1.2 Unified Error Handling ✅ **DONE**
- [x] `utils/errorHandler.ts` exists with `extractApiError()`
- [x] Used in all 7 migrated pages
- [x] Consistent error display with toasts

#### 1.3 TypeScript Interfaces ✅ **DONE**
- [x] All backend DTOs have TypeScript interfaces in `api.ts`
- [x] Zero `any` types in migrated files
- [x] Proper response types for all API functions

#### 1.4 Query Keys ✅ **DONE**
- [x] Standardized query key factory in `services/queryKeys.ts`
- [x] 12+ new keys added for all major entities
- [x] Consistent naming conventions

### Phase 2: Frontend Polish (Week 2-3)

#### 2.1 UI Consistency (Section 3.3)
- [ ] Review Login page - consistent styling
- [ ] Review all Dashboard pages (Employee, Manager, HR, Admin, CEO)
  - Check color themes (dark luxury vs light slate)
  - Unify card styles, button styles, spacing
- [ ] Review Inbox page - message threading UI
- [ ] Review Leave Request forms - validation feedback
- [ ] Review Attendance pages - table styling consistency
- [ ] Review Payroll pages - number formatting, currency display

#### 2.2 Loading States & Skeletons
- [ ] Add skeleton loaders for all dashboard pages
- [ ] Replace "Loading..." text with proper spinners/skeletons
- [ ] Add optimistic updates where appropriate (e.g., mark message read)
- [ ] Ensure loading states disable buttons during mutations

#### 2.3 Responsive Design
- [ ] Test all pages on common breakpoints:
  - Mobile: 375px, 768px
  - Tablet: 1024px
  - Desktop: 1440px
- [ ] Fix any horizontal scrolling issues
- [ ] Ensure tables are scrollable on mobile
- [ ] Test Sidebar/BottomNav responsiveness

#### 2.4 Build Verification (Section 3.4)
- [ ] Fix remaining lint errors (17 pre-existing):
  ```bash
  npm run lint 2>&1 | grep "error"
  ```
  - ProfileEditModal.tsx:1 - `any` type
  - CEODashboard.tsx:5 - useMemo dependency warnings
  - Test files: `any` types
- [ ] Run `npm run build` - ensure zero errors ✅ **Already passes**
- [ ] Run `npx tsc --noEmit` - ensure zero TypeScript errors ✅ **Already passes**
- [ ] Run `npm run lint -- --fix` - auto-fix what's possible

### Phase 3: Frontend Testing (Week 3-4)

#### 3.1 Component Tests (Phase 4.2)
Create tests under `frontend/src/__tests__/`:

| Component | Tests | Priority |
|-----------|-------|----------|
| `Login.test.tsx` *(update)* | Form validation, successful login, failed login | 🔴 High |
| `ProtectedRoute.test.tsx` *(update)* | Redirect to login, role-based access | 🔴 High |
| `LeaveRequestForm.test.tsx` *(update)* | Validation, submission, error handling | 🟡 Medium |
| `AdvanceRequestForm.test.tsx` *(update)* | Validation, submission, error handling | 🟡 Medium |
| `Sidebar.test.tsx` *(update)* | Role-based menu filtering | 🟡 Medium |

**Pattern to follow** (existing tests already present):
```typescript
test('shows error on invalid credentials', async () => {
  // Given: Mock API returns 401
  // When: User submits form
  // Then: Error message displayed, no redirect
});
```

#### 3.2 Integration Tests
- [ ] Test full login flow: Login → JWT stored → Redirect to dashboard
- [ ] Test protected route: No token → Redirect to /login
- [ ] Test role-based access: Employee tries to access /admin → Redirect
- [ ] Test form submission: Leave request → API called → Success toast

### Phase 4: Documentation (Week 1-2)

#### 4.1 Update Checklists
- [ ] Mark completed items in `NEXT_PHASE_CHECKLIST.md`
  - Agent B tracks (B1, B2, B3, B4) - mark all ✅
- [ ] Mark completed items in `PHASE2_CHECKLIST.md`
  - Agent B tracks (B1, B2, B3, B4) - mark all ✅
- [ ] Update `AGENTS.md`:
  - "Known Inconsistencies & Gaps" - mark resolved items
  - "Frontend: Actual Working Patterns" - add React Query patterns

#### 4.2 Mobile App (if time permits)
- [ ] Review `mobile/` folder structure
- [ ] Ensure Flutter scaffold is up-to-date
- [ ] Add basic login screen (optional)
- [ ] Add NFC clock simulation (optional)

### Agent B: Files Modified
```
frontend/src/
├── pages/                   # UI consistency, loading states
├── components/              # Skeleton loaders, responsive fixes
├── services/
│   ├── api.ts              # Already complete
│   ├── queryKeys.ts        # Already updated
│   └── auth.ts             # Review if needed
├── utils/
│   └── errorHandler.ts     # Already exists
├── __tests__/              # Component tests
└── main.tsx                # React Query config (already done)

Documentation:
├── NEXT_PHASE_CHECKLIST.md
├── PHASE2_CHECKLIST.md
├── AGENTS.md               # Frontend patterns section
└── PHASE1_PROGRESS.md      # Already created
```

---

## Conflict Avoidance Matrix

| Area | Agent A (Backend) | Agent B (Frontend) | Conflict Risk |
|------|-------------------|-------------------|---------------|
| `backend/src/main/java/` | ✅ Full access | ❌ No touch | **ZERO** |
| `backend/src/test/java/` | ✅ Full access | ❌ No touch | **ZERO** |
| `frontend/src/pages/` | ❌ No touch | ✅ Full access | **ZERO** |
| `frontend/src/components/` | ❌ No touch | ✅ Full access | **ZERO** |
| `frontend/src/services/api.ts` | ❌ No touch | ✅ Full access | **ZERO** |
| `frontend/src/services/queryKeys.ts` | ❌ No touch | ✅ Full access | **ZERO** |
| `database/` | ✅ Full access | ❌ No touch | **ZERO** |
| `docker-compose.yml` | ✅ Primary | ⚠️ Review only | **LOW** |
| Documentation files | ⚠️ Review | ✅ Primary | **LOW** |
| `.env.example` | ✅ Updates JWT_SECRET | ❌ No touch | **ZERO** |
| `AGENTS.md` | ✅ Backend section | ✅ Frontend section | **LOW** (different sections) |

---

## Merge Strategy

### Daily Workflow
1. **Agent A** works on `backend/` → commits to `stabilization-phase`
2. **Agent B** works on `frontend/` → commits to `stabilization-phase`
3. **Both** pull latest before starting work:
   ```bash
   git pull origin stabilization-phase
   ```
4. **No force pushes** allowed
5. **Commit often, push daily**

### Conflict Resolution (if any)
- If conflict occurs on documentation files:
  - Agent A updates backend-related docs
  - Agent B updates frontend-related docs
  - Use `git diff` to review before merging
- If conflict on shared configs (`docker-compose.yml`, `package.json`):
  - Discuss and agree on changes
  - One person makes the edit

### Pre-Merge Checklist
- [ ] All Agent A tests pass: `mvn test`
- [ ] All Agent B tests pass: `npm test`
- [ ] Backend builds: `mvn clean package`
- [ ] Frontend builds: `npm run build`
- [ ] Docker starts: `docker-compose up -d`
- [ ] Manual smoke test: Login as each role, verify dashboards

---

## Communication Protocol

### Daily Standup (10-15 min)
**Time**: Start of each workday

**Format**:
1. What did I do yesterday?
2. What will I do today?
3. Any blockers?

**Example**:
```
Agent A: "Yesterday I finished DTO conversions. Today I'm writing controller tests. No blockers."
Agent B: "Yesterday I migrated all pages to React Query. Today I'm fixing UI inconsistencies. No blockers."
```

### Weekly Sync (30 min)
**Time**: End of week (Friday)

**Agenda**:
1. Review progress against STABILIZATION_PLAN.md
2. Demo completed work
3. Plan next week's tasks
4. Address any technical debt

---

## Priority Order (Both Agents)

### Week 1 (Current)
- **Agent A**: DTO conversions, code quality, validation, security fixes
- **Agent B**: ✅ React Query migration done, now UI consistency + lint fixes

### Week 2
- **Agent A**: Start controller tests (Track A3)
- **Agent B**: Component tests + responsive design fixes

### Week 3
- **Agent A**: Security tests (Track C1) + service layer tests
- **Agent B**: Integration tests + documentation updates

### Week 4
- **Agent A**: Docker setup + CI/CD pipeline
- **Agent B**: Mobile app scaffold + final UI polish

### Week 5-6
- **Both**: Code review each other's work
- **Both**: Merge to main, create v0.8-stable tag
- **Both**: Update all checklists with ✅

---

## Success Metrics

### Agent A (Backend)
- ✅ 17+ backend tests passing
- ✅ Zero `Map<String, Object>` in controllers
- ✅ All DTOs have `@Valid` validation
- ✅ JWT_SECRET is 64+ characters
- ✅ Docker compose starts successfully
- ✅ CI/CD pipeline passes

### Agent B (Frontend)
- ✅ Zero `useEffect` data fetching (all React Query)
- ✅ Zero lint errors
- ✅ All dashboards load with proper skeletons
- ✅ Responsive on mobile/tablet
- ✅ 5+ component tests passing
- ✅ Documentation updated

---

**Start Date**: April 7, 2026  
**Target Completion**: May 19, 2026 (6 weeks)  
**Branch**: `stabilization-phase`  
**Rule**: NO NEW FEATURES until Phase 6 complete
