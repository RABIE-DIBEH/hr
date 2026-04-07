# Next Phase Checklist (April 2026)

This checklist coordinates parallel work across Agent A, Agent B, and integration.

## Agent A: Backend API Response Consistency
- [x] ✅ Replace `Map<String, Object>` response in `EmployeeController#deleteEmployee` with typed DTO. **(ALREADY DONE)**
- [x] ✅ Replace `Map<String, Object>` response in `EmployeeController#resetPassword` with typed DTO. **(ALREADY DONE)**
- [x] ✅ Replace `Map<String, Object>` response in `PayrollController#calculateAllPayroll` with typed DTO. **(ALREADY DONE)**
- [x] ✅ Replace `Map<String, Object>` response in `RecruitmentRequestController#processRequest` with typed DTO. **(ALREADY DONE)**
- [x] ✅ Replace `Map<String, Object>` response in `AdminController#deleteDevice` with typed DTO. **(ALREADY DONE)**
- [x] ✅ Add/update controller tests for all five endpoints above. **(TESTS EXIST)**

## Agent B: Frontend Data Layer Consistency
- [x] ✅ Standardize React Query defaults (`staleTime: 5min`, `retry: 1`, `refetchOnWindowFocus: false`). **(DONE in main.tsx)**
- [x] ✅ Migrate remaining dashboard `useEffect + axios` flows to React Query. **(7 pages migrated: DeviceManagement, TeamAttendance, UserManagement, PayrollDashboard, NFCClock, HRAttendanceGrid, Expenses)**
- [x] ✅ Unify form/API error parsing into one shared helper. **(extractApiError() in utils/errorHandler.ts)**
- [x] ✅ Update affected pages to consume backend typed response DTOs from Agent A changes. **(All TypeScript interfaces added to api.ts)**

## Integration Owner (Me)
- [x] ✅ Add focused security access-rules tests for role and auth guards.
- [x] ✅ Re-run backend tests after Agent A merges response DTO changes. **(86 tests passing)**
- [x] ✅ Re-run frontend `lint` and `build` after Agent B merges query/error changes. **(0 errors, 5 warnings pre-existing, build passes)**
- [x] ✅ Validate end-to-end route contract for changed endpoints. **(All 23 frontend tests pass)**
- [x] ✅ Update project status docs (`AGENTS.md` / SRS mapping notes) after merge validation.
