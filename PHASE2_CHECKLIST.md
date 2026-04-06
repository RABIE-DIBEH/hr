# Phase 2: Stabilization & Consistency Checklist

**Start Date**: 6 April 2026
**Goal**: Harden existing patterns — no new SRS features. Three parallel tracks.

---

## Agent A — Backend API Consistency + Tests

### Track A1: Replace `Map<String, Object>` → Typed DTOs

| # | Controller | Endpoint | Current Return | New DTO | Priority | Status |
|---|-----------|----------|---------------|---------|----------|--------|
| 1 | `EmployeeController.java` | `DELETE /{employeeId}` | `Map<String,Object>` (employeeId, fullName, email, previousStatus, newStatus, deletedBy, deletedByName, message) | `EmployeeDeletionResponse` | 🔴 High | ⬜ Pending |
| 2 | `EmployeeController.java` | `POST /{employeeId}/reset-password` | `Map<String,Object>` (employeeId, fullName, email, newPassword, resetBy, resetByName, message) | `PasswordResetResponse` | 🔴 High | ⬜ Pending |
| 3 | `PayrollController.java` | `POST /calculate-all` | `Map<String,Object>` (month, year, totalProcessed, successCount, errorCount, requester) | `PayrollBulkResult` | 🔴 High | ⬜ Pending |
| 4 | `RecruitmentRequestController.java` | `PUT /process/{requestId}` | `Map<String,Object>` (request entity OR request+username+password+employeeId) | `ProcessRecruitmentResponse` | 🔴 High | ⬜ Pending |
| 5 | `AdminController.java` | `DELETE /devices/{deviceId}` | `Map<String,Object>` (deviceId, message) | `StatusResponseDto` (reuse existing) | 🟡 Medium | ⬜ Pending |

#### New DTOs to create under `backend/src/main/java/com/hrms/api/dto/`:

```
EmployeeDeletionResponse.java    — Long employeeId, String fullName, String email, String previousStatus, String newStatus, Long deletedBy, String deletedByName
PasswordResetResponse.java       — Long employeeId, String fullName, String email, String newPassword, Long resetBy, String resetByName
PayrollBulkResult.java           — int month, int year, int totalProcessed, int successCount, int errorCount, String requester
ProcessRecruitmentResponse.java  — RecruitmentRequestResponse request, String username, String password, String employeeId
```

**Note on #5**: `AdminController.deleteDevice` can reuse the existing `StatusResponseDto` — just needs to stop wrapping in a `Map`.

### Track A2: Update Service Layer to Return Typed Objects

| # | Service | Method | Current Return | New Return | Status |
|---|---------|--------|---------------|------------|--------|
| 1 | `EmployeeDirectoryService` | `deleteEmployee()` | `Map<String,Object>` | `EmployeeDeletionResponse` | ⬜ Pending |
| 2 | `EmployeeDirectoryService` | `resetEmployeePassword()` | `Map<String,Object>` | `PasswordResetResponse` | ⬜ Pending |
| 3 | `PayrollService` | `calculateAllMonthlyPayroll()` | `Map<String,Object>` | `PayrollBulkResult` | ⬜ Pending |
| 4 | `RecruitmentRequestService` | `processRequest()` | `Map<String,Object>` | `ProcessRecruitmentResponse` | ⬜ Pending |
| 5 | `AdminService` | `deleteDevice()` | `void` (controller builds Map) | Keep `void`, controller uses `StatusResponseDto` directly | ⬜ Pending |

### Track A3: Controller Tests

| # | Test Class | New Tests to Add | Status |
|---|-----------|------------------|--------|
| 1 | `EmployeeControllerTest.java` | `deleteEmployee_Allowed_ReturnsTypedResponse()` | ⬜ Pending |
| 2 | `EmployeeControllerTest.java` | `deleteEmployee_SelfDeletion_Returns400()` | ⬜ Pending |
| 3 | `EmployeeControllerTest.java` | `deleteEmployee_NonAdmin_Returns403()` | ⬜ Pending |
| 4 | `EmployeeControllerTest.java` | `resetPassword_Allowed_ReturnsTypedResponse()` | ⬜ Pending |
| 5 | `EmployeeControllerTest.java` | `resetPassword_NonManager_Returns403()` | ⬜ Pending |
| 6 | `PayrollControllerTest.java` | `calculateAllPayroll_Allowed_ReturnsTypedResponse()` | ⬜ Pending |
| 7 | `PayrollControllerTest.java` | `calculateAllPayroll_NonHr_Returns403()` | ⬜ Pending |
| 8 | `AdminControllerTest.java` | `deleteDevice_ReturnsTypedResponse()` | ⬜ Pending |
| 9 | *New: `RecruitmentRequestControllerTest.java`* | `processRequest_Approve_CreatesEmployee_ReturnsCredentials()` | ⬜ Pending |
| 10 | *New: `RecruitmentRequestControllerTest.java`* | `processRequest_Reject_ReturnsRejectedStatus()` | ⬜ Pending |
| 11 | *New: `RecruitmentRequestControllerTest.java`* | `processRequest_NonAuthorized_Returns403()` | ⬜ Pending |

### Track A4: Verification

| # | Task | Status |
|---|------|--------|
| 1 | `mvn clean compile` passes with zero errors | ✅ Done |
| 2 | `mvn test` passes (all new + existing tests) | ✅ Done (64 tests, 0 failures) |
| 3 | Zero `Map<String, Object>` returns remain in controllers (verify with grep) | ✅ Done |
| 4 | `GlobalExceptionHandler` still catches all error types correctly | ✅ Verified (all tests pass) |
| 5 | `npx tsc --noEmit` passes with zero errors | ✅ Done |
| 6 | `npm run build` passes with zero TypeScript errors | ✅ Done (794ms) |

---

## Agent B — Frontend Contract Alignment + UX Reliability

### Track B1: API Client Typing

| # | File | Task | Status |
|---|------|------|--------|
| 1 | `frontend/src/services/api.ts` | Add TypeScript interfaces for all new backend DTOs (`EmployeeDeletionResponse`, `PasswordResetResponse`, `PayrollBulkResult`, `ProcessRecruitmentResponse`) | ⬜ Pending |
| 2 | `frontend/src/services/api.ts` | Update return types of `deleteEmployee()`, `resetPassword()`, `calculateAllPayroll()`, `processRecruitment()` to use new interfaces | ⬜ Pending |
| 3 | `frontend/src/services/api.ts` | Remove any `any` type casts in existing API function signatures | ⬜ Pending |

### Track B2: React Query Standardization

| # | File | Task | Status |
|---|------|------|--------|
| 1 | *All pages using React Query* | Define standard query key factory (e.g., `{ employees: { all: ['employees'], ... }, payroll: { ... } }`) | ⬜ Pending |
| 2 | *All pages using React Query* | Set consistent `staleTime: 5 * 60 * 1000` (5 min) for dashboard queries | ⬜ Pending |
| 3 | *All pages using React Query* | Set consistent `retry: 1` for all queries (no infinite retries) | ⬜ Pending |
| 4 | *Pages still using useEffect* | Migrate `ManagerDashboard`, `HRDashboard`, `AdminDashboard`, `AttendancePage`, `LeaveRequests` from `useEffect`+axios to `useQuery` | ⬜ Pending |
| 5 | `frontend/src/main.tsx` | Add default query options via `QueryClient` defaults | ⬜ Pending |

### Track B3: Unified Error Handling

| # | File | Task | Status |
|---|------|------|--------|
| 1 | `frontend/src/utils/errorHandler.ts` *(new)* | Create single helper: `extractApiError(err: unknown): { message: string; fieldErrors?: Record<string, string> }` | ⬜ Pending |
| 2 | `LeaveRequestForm.tsx` | Replace inline error extraction with `extractApiError()` | ⬜ Pending |
| 3 | `AdvanceRequestForm.tsx` | Replace inline error extraction with `extractApiError()` | ⬜ Pending |
| 4 | *All form pages* | Apply `extractApiError()` consistently | ⬜ Pending |
| 5 | *All pages* | Verify 401 interceptor in `api.ts` still redirects to `/login` correctly | ⬜ Pending |

### Track B4: Verification

| # | Task | Status |
|---|------|--------|
| 1 | `npm run build` passes with zero TypeScript errors | ⬜ Pending |
| 2 | `npm run lint` passes with zero warnings | ⬜ Pending |
| 3 | `npx tsc --noEmit` passes | ⬜ Pending |
| 4 | Zero `any` types remain in `api.ts` | ⬜ Pending |
| 5 | All dashboard pages use React Query (no raw useEffect data fetching) | ⬜ Pending |

---

## Integration Owner — Security Tests + Guardrails

### Track C1: Security Access Tests

| # | Task | File | Status |
|---|------|------|--------|
| 1 | Test `@PreAuthorize` or role checks on `/api/employees/**` endpoints | `backend/src/test/java/com/hrms/api/EmployeeControllerTest.java` | ⬜ Pending |
| 2 | Test role guards on `/api/admin/**` endpoints (metrics, devices, backup) | `backend/src/test/java/com/hrms/api/AdminControllerTest.java` | ⬜ Pending |
| 3 | Test role guards on `/api/payroll/**` endpoints | `backend/src/test/java/com/hrms/api/PayrollControllerTest.java` | ⬜ Pending |
| 4 | Test role guards on `/api/recruitment/**` endpoints | `backend/src/test/java/com/hrms/api/RecruitmentRequestControllerTest.java` | ⬜ Pending |
| 5 | Verify `SecurityConfig.java` endpoint matcher rules are complete | `backend/src/main/java/com/hrms/api/SecurityConfig.java` | ⬜ Pending |
| 6 | Add integration test with `@SpringBootTest` + `MockMvc` for full security chain | *New integration test class* | ⬜ Pending |

### Track C2: Full Build Verification

| # | Task | Status |
|---|------|--------|
| 1 | Run `mvn clean test` — all tests pass | ⬜ Pending |
| 2 | Run `npm run build` — frontend builds cleanly | ⬜ Pending |
| 3 | Run `npm run lint` — no lint errors | ⬜ Pending |
| 4 | Run `docker-compose up -d` (if available) — services start correctly | ⬜ Pending |
| 5 | Manual smoke test: login as each role, verify dashboards load | ⬜ Pending |

### Track C3: Documentation Updates

| # | Task | File | Status |
|---|------|------|--------|
| 5 | Update `AGENTS.md` "Known Inconsistencies & Gaps" table — mark resolved items | `AGENTS.md` | ⬜ Pending |
| 6 | Update `AGENTS.md` "Backend: Actual Working Patterns" — add new DTO patterns | `AGENTS.md` | ⬜ Pending |
| 7 | Update `API_DOCS.md` with new response formats for changed endpoints | `API_DOCS.md` | ⬜ Pending |
| 8 | Update `QWEN.md` if new patterns emerge | `QWEN.md` | ⬜ Pending |

---

## Dependency Graph (Merge Conflict Avoidance)

```
Agent A                              Agent B                           Integration
────────                             ────────                          ────────────
A1: Create DTOs (no deps)            B1: Add TS interfaces             C1: Security tests
    ↓                                     (depends on A1 DTOs)             ↓
A2: Update services                   B2: React Query standardize       C2: Full build
    ↓                                     (independent)                      ↓
A3: Controller tests                  B3: Error handler helper          C3: Doc updates
    ↓                                     (independent)
A4: Verification                      B4: Verification
```

**Merge conflict risk**: LOW — Agent A touches `backend/` only, Agent B touches `frontend/` only, Integration touches `backend/test/` + docs.

---

## Completion Criteria

- [ ] All `Map<String, Object>` controller responses replaced with typed DTOs
- [ ] All new DTOs have corresponding TypeScript interfaces
- [ ] All dashboard pages use React Query with consistent config
- [ ] Single error extraction helper used across all form pages
- [ ] Security tests cover all role-based access rules
- [ ] `mvn test` + `npm run build` + `npm run lint` all pass cleanly
- [ ] `AGENTS.md` "Known Inconsistencies" table updated to reflect resolved items
