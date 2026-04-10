# Phase 9.5: Final Consistency & Safety Lockdown

**Status:** PROPOSED (Updated)  
**Objective:** Resolve the "Architectural Ghosts" identified in the latest audit to ensure 100% professional consistency before the `v1.0-stable` release.

---

## 🛠️ Task 1: Backend "Legacy" Exception Migration (Agent A)
Agent A successfully migrated the *new* code, but the older modules are still using inconsistent error formats.

*   **Action:** Refactor the following controllers/services to use the `BusinessException` framework:
    *   `AdvanceRequestController` & `AdvanceRequestService`
    *   `RecruitmentRequestController` & `RecruitmentRequestService`
    *   `InboxController` & `InboxService`
*   **Goal:** 100% of API errors must return the machine-readable `{ "error": "CODE" }` JSON format.

## 🗄️ Task 2: Master Schema Consolidation (Agent A)
The database folder is currently a "patch-work" of multiple files.

*   **Action:** 
    *   Create a single `database/master_schema_v1.sql` that combines the base schema, departments, soft-delete, and audit logs.
    *   Create a clean `database/master_seed_v1.sql` for a fresh installation.
*   **Goal:** A new production environment must be deployable with a single SQL script.

## ❄️ Task 3: Logical Payroll Hard-Lock (Agent A & B)
The "Frozen" payroll math is currently executable, which is a high risk for data corruption.

*   **Action (Backend):** Add a check in `PayrollService.calculateMonthlyPayroll` that throws a `BusinessException(ErrorCode.PAYROLL_LOCKED)` if a global flag `app.payroll.locked=true` is set.
*   **Action (Frontend):** Disable the "Calculate" buttons in `PayrollDashboard.tsx`. Add a persistent warning: *"Engine Locked: Pending Formula Verification (May 2026)."*
*   **Goal:** Zero risk of generating incorrect financial data by accident.

## 🌍 Task 4: The i18n "Long-Tail" Cleanup (Agent B)
Many modals and forms still have "shadow strings" (hardcoded Arabic).

*   **Audit & Fix:** Move all remaining strings in the following files to `ar.json` and `en.json`:
    *   `AdvanceRequestForm.tsx` (Validation messages)
    *   `Inbox.tsx` (Filter labels and placeholders)
    *   `Goals.tsx` (Empty state text)
    *   `ProfileEditModal.tsx` & `ChangePasswordModal.tsx`
*   **Goal:** A user must be able to use 100% of the app in English without seeing a single Arabic character (and vice-versa).

## 📱 Task 5: Mobile Sync Visibility (Agent B)
Background sync is implemented, but the user has no "Proof of Sync."

*   **Action:** Add a persistent "Status Bar" or persistent indicator in the `NfcClockScreen` that says: *"3 Scans pending sync..."* until the background process confirms success.
*   **Goal:** The employee must have visual confirmation that their data is safe before closing the app.

---

## 🤖 Work Distribution

### **Agent A: The Backend & DB Architect**
1.  Migrate Advance, Recruitment, and Inbox modules to `BusinessException`.
2.  Unify the Database folder into a single Master Schema.
3.  Implement the Backend "Hard-Lock" for the Payroll engine.

### **Agent B: The UI & Mobile Specialist**
1.  Perform the "Shadow String" audit and fix all remaining hardcoded text.
2.  Implement the UI "Lock" and tooltips for Payroll buttons.
3.  Add the persistent "Unsynced Count" to the Mobile NFC screen.

### **Agent C: The Orchestrator (Gemini CLI)**
1.  Verify the Master Schema by performing a clean-room DB setup.
2.  Perform a "Full UI Language Audit" (switching the toggle and checking every button).
3.  Tag the final `v1.0-stable` release.
