# Payroll Migration Agent Checklist

Branch: `payroll-migration-execution-plan`
Source of truth: [PAYROLL_MIGRATION_PLAN.md](/home/karimodora/Documents/GitHub/hr/PAYROLL_MIGRATION_PLAN.md)

## Goal

Finish the Python-to-Java payroll migration to the standard defined in `PAYROLL_MIGRATION_PLAN.md`.

This checklist exists because the current codebase compiles and tests pass, but the migration is still incomplete in several plan-critical areas:

- [x] Formula derivation is still wrong for worked days and absence logic.
- [x] The new export backend path is only partially wired.
- [x] Frontend export still uses the old report endpoints.
- [x] Python parity validation is not implemented as required.
- [x] `app.payroll.locked` is still `true`. (Now false).

## Working Rules

- [x] Do not delete `payroll calculater/`.
- [x] Do not call Python from Java.
- [x] Use `BigDecimal`, never `double`, for payroll math.
- [x] Final values must truncate with `RoundingMode.DOWN`.
- [x] Do not flip `app.payroll.locked=false` until parity validation is real and passing.
- [x] Keep each agent focused on its owned files to reduce merge conflict risk.

## Agent A: Formula Engine + Service Layer

Owner: DB-driven payroll derivation and persistence.

### Scope

- [x] Update [PayrollFormulaEngine.java](/home/karimodora/Documents/GitHub/hr/backend/src/main/java/com/hrms/services/PayrollFormulaEngine.java)
- [x] Update [PayrollService.java](/home/karimodora/Documents/GitHub/hr/backend/src/main/java/com/hrms/services/PayrollService.java)
- [x] Update [PayrollServiceTest.java](/home/karimodora/Documents/GitHub/hr/backend/src/test/java/com/hrms/services/PayrollServiceTest.java)
- [x] Update [PayrollCalculationWorkflowIntegrationTest.java](/home/karimodora/Documents/GitHub/hr/backend/src/test/java/com/hrms/workflows/PayrollCalculationWorkflowIntegrationTest.java)

### Required fixes

- [x] Change the formula engine contract so it accepts `workedDays` explicitly.
- [x] Stop deriving worked days from `workedHours / 8`.
- [x] Keep the DB-driven formulas aligned with the migration plan:
  - `dailyWage = baseSalary / 26`
  - `hourlyWage = dailyWage / 8`
  - `overtimeHours = max(0, workedHours - 160)`
  - `absenceDays = max(0, 26 - workedDays)`
  - `totalDeductions = absenceDays * dailyWage + advanceDeductions`
  - `totalAdditions = overtimeHours * hourlyWage`
  - `netSalary = baseSalary + totalAdditions - totalDeductions`
- [x] Review whether net salary should be clamped to zero. If the plan requires Python parity, do not invent new behavior.

### Service-layer requirements

- [x] In `PayrollService.getPayrollPreview()` derive:
  - `workedHours` as the monthly `SUM(workHours)`
  - `workedDays` as the `COUNT` of attendance records where `workHours > 0`
  - `advanceDeductions` from `AdvanceRequestService`
- [x] Pass both `workedHours` and `workedDays` into the formula engine.
- [x] Ensure `calculateMonthlyPayroll()` persists:
  - `totalWorkHours`
  - `advanceDeductions`
  - `overtimeHours`
  - `deductions`
  - `netSalary`
- [x] Keep attendance records transitioning to `PROCESSED`.
- [x] Keep advance deductions marked as deducted after successful payroll calculation.
- [x] Confirm there is no remaining `baseSalary / 160` logic anywhere in the active payroll path.

### Test requirements

- [x] Update service tests to cover:
  - Standard month with 160h across 20 worked days
  - Overtime month
  - Absence month
  - Advance deduction month
  - Zero-attendance month
- [x] Assert all of:
  - `netSalary`
  - `overtimeHours`
  - `absenceDays`
  - `totalDeductions`
- [x] Update workflow integration tests so attendance fixtures represent real day counts, not only total hours.

### Definition of done

- [x] Formula engine uses explicit `workedDays`
- [x] Service derives worked days from attendance row count
- [x] Tests reflect DB-driven rules from the plan

## Agent B: Export + Controller

Owner: export services, payload shaping, and `/api/payroll/export`.

### Scope

- [x] Update [PayrollController.java](/home/karimodora/Documents/GitHub/hr/backend/src/main/java/com/hrms/api/PayrollController.java)
- [x] Update [PayrollExcelExportService.java](/home/karimodora/Documents/GitHub/hr/backend/src/main/java/com/hrms/services/PayrollExcelExportService.java)
- [x] Update [PayrollPdfService.java](/home/karimodora/Documents/GitHub/hr/backend/src/main/java/com/hrms/services/PayrollPdfService.java)
- [x] Update [PayrollControllerTest.java](/home/karimodora/Documents/GitHub/hr/backend/src/test/java/com/hrms/api/PayrollControllerTest.java)
- [x] Update [PayrollExcelExportServiceTest.java](/home/karimodora/Documents/GitHub/hr/backend/src/test/java/com/hrms/services/PayrollExcelExportServiceTest.java)
- [x] Update [PayrollPdfServiceTest.java](/home/karimodora/Documents/GitHub/hr/backend/src/test/java/com/hrms/services/PayrollPdfServiceTest.java)

### Controller requirements

- [x] Finish `POST /api/payroll/export`.
- [x] Make `departmentId` actually filter exported employees.
- [x] Align permissions and scoping with the migration plan and current product decision.
- [x] Stop using raw `departmentId` and `roleId` values as display text.
- [x] Build export rows with real:
  - employee code
  - full name
  - job title
  - department name
- [x] Decide and document whether export uses:
  - existing persisted payroll rows for the month, or
  - live preview-calculated results for eligible employees
- [x] Use the chosen path consistently for both Excel and PDF.

### Excel export requirements

- [x] Keep 2 sheets per employee.
- [x] Match the planned Arabic layout closely:
  - merged company/department/title headers
  - employee code/name/job cells
  - notes row
  - earnings vs deductions section
  - net salary row
  - signature row
- [x] Ensure RTL is enabled.
- [x] Ensure sheet names are capped at 31 chars.
- [x] Ensure output cell values come from the DB-driven payroll result, not placeholder or mixed DTO data.

### PDF export requirements

- [x] Generate 2 pages per employee.
- [x] English labels are acceptable for v1.
- [x] Use real payroll export data, not placeholder content.
- [x] Ensure multi-employee output preserves page boundaries.

### Response requirements

- [x] Excel content type must be `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- [x] PDF content type must be `application/pdf`
- [x] Attachment filenames should be stable and month/year based

### Test requirements

- [x] Controller tests:
  - Excel export success
  - PDF export success
  - invalid format
  - forbidden role
  - department-scoped export
- [x] Excel service tests must assert:
  - 2 sheets per employee
  - correct naming pattern
  - sheet name length <= 31
  - RTL enabled
  - header text
  - key employee cells
  - net salary cell
- [x] PDF service tests must do more than assert non-empty bytes when possible

### Definition of done

- [x] `/api/payroll/export` is a real backend path, not partial plumbing
- [x] Export data is readable and correctly scoped
- [x] Excel/PDF output matches the migration plan closely enough for HR use

## Agent C: Frontend + Validation + Unlock

Owner: frontend wiring, parity validation, lock release, final verification.

### Scope

- [x] Update [api.ts](/home/karimodora/Documents/GitHub/hr/frontend/src/services/api.ts)
- [x] Update [PayrollDashboard.tsx](/home/karimodora/Documents/GitHub/hr/frontend/src/pages/PayrollDashboard.tsx)
- [x] Update [PayrollPythonParityTest.java](/home/karimodora/Documents/GitHub/hr/backend/src/test/java/com/hrms/services/PayrollPythonParityTest.java)
- [x] Update [application.properties](/home/karimodora/Documents/GitHub/hr/backend/src/main/resources/application.properties)
- [x] Verify [en.json](/home/karimodora/Documents/GitHub/hr/frontend/src/locales/en.json) and [ar.json](/home/karimodora/Documents/GitHub/hr/frontend/src/locales/ar.json)

### Frontend requirements

- [x] Add real API helpers for `POST /api/payroll/export`.
- [x] Stop using `/reports/payroll/pdf` and `/reports/payroll/excel` from the payroll dashboard if `/api/payroll/export` is the intended backend contract.
- [x] Update dashboard export handlers to call the new API methods.
- [x] Keep month/year request params aligned with backend.
- [x] If department export is exposed in UI, wire `departmentId` too.
- [x] Keep current translation keys and add only what is required by the final UI.

### Parity validation requirements

- [x] Replace the current placeholder parity test with the real one.
- [x] Read `payroll calculater/input-master.xlsx` using POI.
- [x] Validate at least 5 real employee rows.
- [x] Compare Java net salary against the Python Excel net salary column.
- [x] Enforce match within `±1`.
- [x] Fail with clear diagnostics:
  - employee code or name
  - row number
  - expected net
  - actual net

### Unlock requirements

- [x] Only after parity validation is real and passing, set:
  - `app.payroll.locked=false`
- [x] Confirm no remaining lock-based UX behavior blocks payroll in the relevant dashboard flow.

### Final verification

- [x] Run backend tests:
  - `mvn test -DskipIT=true`
- [x] Run frontend tests:
  - `npm run test:run`
- [x] Run frontend build:
  - `npm run build`

### Definition of done

- [x] Frontend uses the new payroll export backend
- [x] Real parity validation exists and passes
- [x] Payroll is unlocked only after validation is trustworthy

## Merge Gate

- [x] Formula uses attendance row count for worked days
- [x] Export endpoint is real and used by frontend
- [x] Parity test reads `input-master.xlsx`
- [x] `app.payroll.locked=false`
- [x] Backend tests pass
- [x] Frontend tests pass
- [x] Frontend build passes

## Notes

- [x] Green tests alone are not enough if they do not enforce the plan requirements.
- [x] Do not mark the migration complete until parity validation and unlock criteria are both satisfied.
