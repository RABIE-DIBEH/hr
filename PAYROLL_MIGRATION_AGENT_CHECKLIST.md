# Payroll Migration Agent Checklist

Branch: `payroll-migration-execution-plan`
Source of truth: [PAYROLL_MIGRATION_PLAN.md](/home/karimodora/Documents/GitHub/hr/PAYROLL_MIGRATION_PLAN.md)

## Goal

Finish the Python-to-Java payroll migration to the standard defined in `PAYROLL_MIGRATION_PLAN.md`.

This checklist exists because the current codebase compiles and tests pass, but the migration is still incomplete in several plan-critical areas:

- Formula derivation is still wrong for worked days and absence logic.
- The new export backend path is only partially wired.
- Frontend export still uses the old report endpoints.
- Python parity validation is not implemented as required.
- `app.payroll.locked` is still `true`.

## Working Rules

- Do not delete `payroll calculater/`.
- Do not call Python from Java.
- Use `BigDecimal`, never `double`, for payroll math.
- Final values must truncate with `RoundingMode.DOWN`.
- Do not flip `app.payroll.locked=false` until parity validation is real and passing.
- Keep each agent focused on its owned files to reduce merge conflict risk.

## Agent A: Formula Engine + Service Layer

Owner: DB-driven payroll derivation and persistence.

### Scope

- [ ] Update [PayrollFormulaEngine.java](/home/karimodora/Documents/GitHub/hr/backend/src/main/java/com/hrms/services/PayrollFormulaEngine.java)
- [ ] Update [PayrollService.java](/home/karimodora/Documents/GitHub/hr/backend/src/main/java/com/hrms/services/PayrollService.java)
- [ ] Update [PayrollServiceTest.java](/home/karimodora/Documents/GitHub/hr/backend/src/test/java/com/hrms/services/PayrollServiceTest.java)
- [ ] Update [PayrollCalculationWorkflowIntegrationTest.java](/home/karimodora/Documents/GitHub/hr/backend/src/test/java/com/hrms/workflows/PayrollCalculationWorkflowIntegrationTest.java)

### Required fixes

- [ ] Change the formula engine contract so it accepts `workedDays` explicitly.
- [ ] Stop deriving worked days from `workedHours / 8`.
- [ ] Keep the DB-driven formulas aligned with the migration plan:
  - `dailyWage = baseSalary / 26`
  - `hourlyWage = dailyWage / 8`
  - `overtimeHours = max(0, workedHours - 160)`
  - `absenceDays = max(0, 26 - workedDays)`
  - `totalDeductions = absenceDays * dailyWage + advanceDeductions`
  - `totalAdditions = overtimeHours * hourlyWage`
  - `netSalary = baseSalary + totalAdditions - totalDeductions`
- [ ] Review whether net salary should be clamped to zero. If the plan requires Python parity, do not invent new behavior.

### Service-layer requirements

- [ ] In `PayrollService.getPayrollPreview()` derive:
  - `workedHours` as the monthly `SUM(workHours)`
  - `workedDays` as the `COUNT` of attendance records where `workHours > 0`
  - `advanceDeductions` from `AdvanceRequestService`
- [ ] Pass both `workedHours` and `workedDays` into the formula engine.
- [ ] Ensure `calculateMonthlyPayroll()` persists:
  - `totalWorkHours`
  - `advanceDeductions`
  - `overtimeHours`
  - `deductions`
  - `netSalary`
- [ ] Keep attendance records transitioning to `PROCESSED`.
- [ ] Keep advance deductions marked as deducted after successful payroll calculation.
- [ ] Confirm there is no remaining `baseSalary / 160` logic anywhere in the active payroll path.

### Test requirements

- [ ] Update service tests to cover:
  - Standard month with 160h across 20 worked days
  - Overtime month
  - Absence month
  - Advance deduction month
  - Zero-attendance month
- [ ] Assert all of:
  - `netSalary`
  - `overtimeHours`
  - `absenceDays`
  - `totalDeductions`
- [ ] Update workflow integration tests so attendance fixtures represent real day counts, not only total hours.

### Definition of done

- [ ] Formula engine uses explicit `workedDays`
- [ ] Service derives worked days from attendance row count
- [ ] Tests reflect DB-driven rules from the plan

## Agent B: Export + Controller

Owner: export services, payload shaping, and `/api/payroll/export`.

### Scope

- [ ] Update [PayrollController.java](/home/karimodora/Documents/GitHub/hr/backend/src/main/java/com/hrms/api/PayrollController.java)
- [ ] Update [PayrollExcelExportService.java](/home/karimodora/Documents/GitHub/hr/backend/src/main/java/com/hrms/services/PayrollExcelExportService.java)
- [ ] Update [PayrollPdfService.java](/home/karimodora/Documents/GitHub/hr/backend/src/main/java/com/hrms/services/PayrollPdfService.java)
- [ ] Update [PayrollControllerTest.java](/home/karimodora/Documents/GitHub/hr/backend/src/test/java/com/hrms/api/PayrollControllerTest.java)
- [ ] Update [PayrollExcelExportServiceTest.java](/home/karimodora/Documents/GitHub/hr/backend/src/test/java/com/hrms/services/PayrollExcelExportServiceTest.java)
- [ ] Update [PayrollPdfServiceTest.java](/home/karimodora/Documents/GitHub/hr/backend/src/test/java/com/hrms/services/PayrollPdfServiceTest.java)

### Controller requirements

- [ ] Finish `POST /api/payroll/export`.
- [ ] Make `departmentId` actually filter exported employees.
- [ ] Align permissions and scoping with the migration plan and current product decision.
- [ ] Stop using raw `departmentId` and `roleId` values as display text.
- [ ] Build export rows with real:
  - employee code
  - full name
  - job title
  - department name
- [ ] Decide and document whether export uses:
  - existing persisted payroll rows for the month, or
  - live preview-calculated results for eligible employees
- [ ] Use the chosen path consistently for both Excel and PDF.

### Excel export requirements

- [ ] Keep 2 sheets per employee.
- [ ] Match the planned Arabic layout closely:
  - merged company/department/title headers
  - employee code/name/job cells
  - notes row
  - earnings vs deductions section
  - net salary row
  - signature row
- [ ] Ensure RTL is enabled.
- [ ] Ensure sheet names are capped at 31 chars.
- [ ] Ensure output cell values come from the DB-driven payroll result, not placeholder or mixed DTO data.

### PDF export requirements

- [ ] Generate 2 pages per employee.
- [ ] English labels are acceptable for v1.
- [ ] Use real payroll export data, not placeholder content.
- [ ] Ensure multi-employee output preserves page boundaries.

### Response requirements

- [ ] Excel content type must be `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- [ ] PDF content type must be `application/pdf`
- [ ] Attachment filenames should be stable and month/year based

### Test requirements

- [ ] Controller tests:
  - Excel export success
  - PDF export success
  - invalid format
  - forbidden role
  - department-scoped export
- [ ] Excel service tests must assert:
  - 2 sheets per employee
  - correct naming pattern
  - sheet name length <= 31
  - RTL enabled
  - header text
  - key employee cells
  - net salary cell
- [ ] PDF service tests must do more than assert non-empty bytes when possible

### Definition of done

- [ ] `/api/payroll/export` is a real backend path, not partial plumbing
- [ ] Export data is readable and correctly scoped
- [ ] Excel/PDF output matches the migration plan closely enough for HR use

## Agent C: Frontend + Validation + Unlock

Owner: frontend wiring, parity validation, lock release, final verification.

### Scope

- [ ] Update [api.ts](/home/karimodora/Documents/GitHub/hr/frontend/src/services/api.ts)
- [ ] Update [PayrollDashboard.tsx](/home/karimodora/Documents/GitHub/hr/frontend/src/pages/PayrollDashboard.tsx)
- [ ] Update [PayrollPythonParityTest.java](/home/karimodora/Documents/GitHub/hr/backend/src/test/java/com/hrms/services/PayrollPythonParityTest.java)
- [ ] Update [application.properties](/home/karimodora/Documents/GitHub/hr/backend/src/main/resources/application.properties)
- [ ] Verify [en.json](/home/karimodora/Documents/GitHub/hr/frontend/src/locales/en.json) and [ar.json](/home/karimodora/Documents/GitHub/hr/frontend/src/locales/ar.json)

### Frontend requirements

- [ ] Add real API helpers for `POST /api/payroll/export`.
- [ ] Stop using `/reports/payroll/pdf` and `/reports/payroll/excel` from the payroll dashboard if `/api/payroll/export` is the intended backend contract.
- [ ] Update dashboard export handlers to call the new API methods.
- [ ] Keep month/year request params aligned with backend.
- [ ] If department export is exposed in UI, wire `departmentId` too.
- [ ] Keep current translation keys and add only what is required by the final UI.

### Parity validation requirements

- [ ] Replace the current placeholder parity test with the real one.
- [ ] Read `payroll calculater/input-master.xlsx` using POI.
- [ ] Validate at least 5 real employee rows.
- [ ] Compare Java net salary against the Python Excel net salary column.
- [ ] Enforce match within `±1`.
- [ ] Fail with clear diagnostics:
  - employee code or name
  - row number
  - expected net
  - actual net

### Unlock requirements

- [ ] Only after parity validation is real and passing, set:
  - `app.payroll.locked=false`
- [ ] Confirm no remaining lock-based UX behavior blocks payroll in the relevant dashboard flow.

### Final verification

- [ ] Run backend tests:
  - `mvn test -DskipIT=true`
- [ ] Run frontend tests:
  - `npm run test:run`
- [ ] Run frontend build:
  - `npm run build`
- [ ] Record any remaining known gaps before merge

### Definition of done

- [ ] Frontend uses the new payroll export backend
- [ ] Real parity validation exists and passes
- [ ] Payroll is unlocked only after validation is trustworthy

## Execution Order

1. [ ] Agent A finishes formula/service contract first
2. [ ] Agent B builds on Agent A’s stable result shape
3. [ ] Agent C rewires frontend and final validation after Agent B is stable
4. [ ] Final merge only after all definitions of done are satisfied

## Handoff Checklist

### Agent A -> Agent B

- [ ] Final `PayrollFormulaEngine` method signature shared
- [ ] Final `PayrollResult` shape shared
- [ ] Worked-hours and worked-days derivation documented

### Agent B -> Agent C

- [ ] Final export endpoint contract shared
- [ ] Supported params documented:
  - `month`
  - `year`
  - `departmentId` if supported
  - `format`
- [ ] Success response behavior documented for Excel and PDF

## Merge Gate

- [ ] Formula uses attendance row count for worked days
- [ ] Export endpoint is real and used by frontend
- [ ] Parity test reads `input-master.xlsx`
- [ ] `app.payroll.locked=false`
- [ ] Backend tests pass
- [ ] Frontend tests pass
- [ ] Frontend build passes

## Notes

- Green tests alone are not enough if they do not enforce the plan requirements.
- Do not mark the migration complete until parity validation and unlock criteria are both satisfied.
