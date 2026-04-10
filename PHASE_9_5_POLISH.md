# Phase 9.5: Production-Ready Polish Plan

**Status:** PROPOSED  
**Objective:** Address technical debt and architectural inconsistencies identified in the Senior Architect Audit to ensure 100% professional coverage across all layers.

---

## 🛠️ Task 1: Backend Exception Unification (Agent A)
Migrate all remaining services and controllers to the `BusinessException` framework to ensure a consistent API error format.

*   **Audit Area:** `AdvanceRequestController`, `RecruitmentRequestController`, `InboxController`, `NfcCardController`, and `AdminController`.
*   **Action:** 
    *   Replace all `ResponseStatusException` and `IllegalArgumentException` with `BusinessException` using appropriate `ErrorCode` enums.
    *   Ensure every error returned to the frontend follows the `{ "status", "message", "error", "timestamp" }` format.
*   **Goal:** Zero raw Java exceptions or inconsistent HTTP status codes in the web layer.

## 🌍 Task 2: Frontend i18n Completion (Agent B)
Achieve 100% translation coverage for the entire application UI.

*   **Audit Area:** `AdvanceRequestForm.tsx`, `Inbox.tsx`, `Goals.tsx`, `ProfileEditModal.tsx`, `ChangePasswordModal.tsx`, and `HRAttendanceGrid.tsx`.
*   **Action:** 
    *   Extract all remaining hardcoded Arabic strings into `locales/ar.json` and `locales/en.json`.
    *   Verify the language switcher works correctly across all nested components.
*   **Goal:** The application must be 100% bilingual with zero hardcoded text in JSX.

## 🗄️ Task 3: Database Schema Consolidation (Agent A)
Clean up the fragmented SQL migration history to simplify deployment.

*   **Action:** 
    *   Consolidate all patches (`add_departments`, `soft_delete`, etc.) into a single, unified `database/schema.sql`.
    *   Create a clean `database/seed_production.sql` with only the essential system roles and one SuperAdmin account.
    *   Update `Makefile` and `DEV_SETUP.md` to reflect the new single-script setup process.
*   **Goal:** A new developer must be able to set up the DB by running exactly one command.

## 📱 Task 4: Mobile Background Sync & UX (Agent B)
Remove the "Manual Sync" risk by automating connectivity resilience.

*   **Action:** 
    *   **Silent Background Sync:** Implement a listener in the Flutter app that detects when connectivity returns (`connectivity_plus`) and automatically triggers the `syncOfflineScans()` method.
    *   **UX Update:** Change the "Sync" button to a status indicator ("All scans synced" vs "Syncing...").
*   **Goal:** Attendance data must never be lost if a user forgets to click "Sync."

## 🔒 Task 5: Security & Payroll Safety (Agent C / Orchestrator)
Implement safeguards against unauthorized or premature system actions.

*   **Action 1: Payroll Feature Flag:** Disable the "Calculate Monthly Payroll" buttons in the UI. Add a tooltip: "Calculation engine locked until Python formula migration (May 2026)."
*   **Action 2: API Protection:** Add a backend property `app.payroll.enabled=false` that causes the `/calculate-all` endpoint to return a `403 LOCKED` error until the formulas are ready.
*   **Action 3: Sensitive Action Logging:** Ensure that `SystemLog` now explicitly flags "High Risk" actions (like changing an employee's salary) for special visibility in the Admin Dashboard.
*   **Goal:** Prevent accidental generation of incorrect financial data.

---

## 🤖 Work Distribution

### **Agent A: The Backend & Migration Specialist**
1.  Unify Exceptions across all 5 remaining controllers.
2.  Consolidate the Database Schema and Seed files.
3.  Implement the Backend Feature Flag for the Payroll engine.

### **Agent B: The Frontend & Mobile Specialist**
1.  Complete i18n translation for all forms and edge-case pages.
2.  Implement Mobile Background Sync (Auto-trigger on connectivity return).
3.  Apply UI "Lock" to Payroll calculation buttons.

### **Agent C: The Orchestrator (Gemini CLI)**
1.  Verify DB setup with the consolidated `schema.sql`.
2.  Final build verification (`mvn verify` + `npm run build`).
3.  Perform a "Full English" vs "Full Arabic" UI audit.

---

## ❄️ Payroll Status: HARD LOCKDOWN
The Payroll system is now physically and logically locked to prevent data corruption. All development is focused on the "Polish" tasks above.
