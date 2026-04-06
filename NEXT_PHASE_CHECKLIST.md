# Next Phase Checklist (April 2026)

This checklist coordinates parallel work across Agent A, Agent B, and integration.

## Agent A: Backend API Response Consistency
- [ ] Replace `Map<String, Object>` response in `EmployeeController#deleteEmployee` with typed DTO.
- [ ] Replace `Map<String, Object>` response in `EmployeeController#resetPassword` with typed DTO.
- [ ] Replace `Map<String, Object>` response in `PayrollController#calculateAllPayroll` with typed DTO.
- [ ] Replace `Map<String, Object>` response in `RecruitmentRequestController#processRequest` with typed DTO.
- [ ] Replace `Map<String, Object>` response in `AdminController#deleteDevice` with typed DTO.
- [ ] Add/update controller tests for all five endpoints above.

## Agent B: Frontend Data Layer Consistency
- [ ] Standardize React Query defaults (`staleTime`, retry policy, key conventions).
- [ ] Migrate remaining dashboard `useEffect + axios` flows to React Query.
- [ ] Unify form/API error parsing into one shared helper.
- [ ] Update affected pages to consume backend typed response DTOs from Agent A changes.

## Integration Owner (Me)
- [x] Add focused security access-rules tests for role and auth guards.
- [ ] Re-run backend tests after Agent A merges response DTO changes.
- [ ] Re-run frontend `lint` and `build` after Agent B merges query/error changes.
- [ ] Validate end-to-end route contract for changed endpoints.
- [ ] Update project status docs (`AGENTS.md` / SRS mapping notes) after merge validation.
