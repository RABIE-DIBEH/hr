# Phase 9: Structural & Operational Lockdown Plan

**Status:** ACTIVE PIVOT  
**Date:** April 10, 2026  
**Objective:** Finalize all non-mathematical core features to achieve `v1.0-stable` readiness while deferring Payroll formulas until next month.

---

## 🛠️ Task 1: The Leave Quota Engine (Non-Financial)
Leaves in this system are **100% paid** (no salary deduction), but we must track the legal quota of days (e.g., 21 days/year).

*   **Step 1: Quota Tracking:** Add a `leave_balance_days` field to the `Employee` entity (Default: 21.0).
*   **Step 2: Automatic Deduction:** Implement a service-layer trigger. When a Manager **approves** a leave request, the system must subtract the requested days from the employee's `leave_balance_days`.
*   **Step 3: Validation Logic:** Update the `LeaveRequest` submission logic. Prevent an employee from requesting 10 days if their balance is only 5 days.
*   **Step 4: HR View:** Create a specialized "Leave Quota Report" showing every employee's remaining paid days.

## 📱 Task 2: NFC Mobile Feedback Loop (UX Finalization)
Transform the current "functional scan" into a professional hardware interaction.

*   **Step 1: High-Fidelity Feedback:** Update the Flutter app with full-screen animations:
    *   **Success:** Large green checkmark + subtle vibration.
    *   **Failure/Blocked:** Large red "X" + aggressive vibration/buzzer.
*   **Step 2: Intelligent Scanning:** Implement "Anti-Double-Tap" logic. If a scan occurs within 5 minutes of a previous one, the app should ask: *"You just scanned. Is this a mistake or a Clock-Out?"*
*   **Step 3: Connectivity Resilience:** Implement basic caching to prevent app crashes during intermittent Wi-Fi drops.

## 🛡️ Task 3: DevOps & Security "Hardening"
Prepare the infrastructure for a production environment.

*   **Step 1: Docker Multi-Stage Builds:** Rewrite Backend/Frontend `Dockerfiles`.
    *   **Benefit:** Reduces image sizes from ~800MB to ~150MB. Improves security by removing build tools from production images.
*   **Step 2: Security Headers:** Inject production headers into the Nginx configuration:
    *   `Content-Security-Policy` (CSP)
    *   `Strict-Transport-Security` (HSTS)
    *   `X-Content-Type-Options: nosniff`
*   **Step 3: Disaster Recovery:** Create a `scripts/db-backup.sh` that generates a timestamped `.sql` dump and a restoration guide.

## 📝 Task 4: System Audit Logs (Security Oversight)
Standard requirement for `v1.0-stable` to track sensitive data changes.

*   **Action:** Create a `system_logs` table.
*   **Logic:** Automatically log an entry whenever:
    *   An Employee's **Salary** is modified.
    *   An Employee's **Role/Permission** is changed.
    *   An **Attendance Record** is manually edited by an Admin.
*   **Structure:** `{ timestamp, actor_id, target_id, action_type, old_value, new_value }`.

---

## 🤖 Work Distribution

### **Agent A: The Backend & DevOps Architect**
1.  **Leave Logic:** Add `leave_balance_days` to `Employee` entity + implement deduction logic in `LeaveRequestService`.
2.  **Audit Logs:** Create `SystemLog` entity and Repository. Add `@EventListener` or Service-layer hooks to log Salary/Role changes.
3.  **Docker:** Implement Multi-stage `Dockerfiles` for Backend and Frontend.
4.  **Nginx:** Add production security headers to `frontend/nginx.conf`.
5.  **Recovery:** Finalize the `db-backup.sh` script in the `/scripts` folder.

### **Agent B: The Frontend & Mobile Specialist**
1.  **Dashboard UI:** Show "Remaining Leave Days" on the `EmployeeDashboard`.
2.  **HR Report:** Build the `LeaveBalanceReport.tsx` page for HR/Admin.
3.  **Mobile UX:** Implement full-screen animations (Green/Red) and vibrations in Flutter.
4.  **Mobile Logic:** Implement the "Duplicate Scan" confirmation dialog and offline error handling.

### **Agent C: The Orchestrator (Gemini CLI)**
1.  **Integration:** Verify that Agent A's backend changes correctly supply data to Agent B's UI.
2.  **Testing:** Run `mvn test` and `npm run build` after every major task completion.
3.  **Documentation:** Update `API_DOCS.md` with the new Audit Log and Leave Quota endpoints.
4.  **Final Polish:** Conduct a final code review to ensure NO hardcoded Payroll logic was introduced prematurely.

---

## ❄️ The "Waiting for Python" Strategy (Payroll)

| Feature | Action | Status |
| :--- | :--- | :--- |
| **Excel Calculations** | **DEFER** until next month. | ❄️ Frozen |
| **Individual PDF Slips** | **DEFER** to match 2-page company template. | ❄️ Frozen |
| **Merged Payroll PDF** | **DEFER** until next month. | ❄️ Frozen |
| **Leave Management** | **Build Quota Logic** (Days only, no money). | ✅ Active |
