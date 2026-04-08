# Phase 8: Fix & Ship — Action Plan

**Date**: April 8, 2026  
**Team**: 2 Agents (no Agent C)  
**Goal**: Fix what's broken, fill SRS gaps, ship v1.0-rc1

---

## 🔍 Current State Audit (Verified — Not Promised)

| Claim | Status | Evidence |
|-------|--------|----------|
| 86 backend tests passing | ✅ Solid | Just ran `mvn test` — 86 pass |
| Security headers (CSP, HSTS, X-Frame) | ✅ Solid | `SecurityHeadersConfig.java` exists |
| Structured JSON logging | ✅ Solid | `StructuredLoggingFilter.java` in security chain |
| Code splitting (15 lazy routes) | ✅ Solid | 15 `lazy()` calls in `App.tsx` |
| Mobile `android/` directory | ✅ Solid | Exists with `app/`, `build.gradle`, etc. |
| CI pipeline (checkstyle, lint, etc.) | ✅ Solid | `ci.yml` has all jobs |
| Prometheus monitoring | ✅ Solid | `monitoring/prometheus.yml` + actuator configured |
| Ops scripts (5 scripts) | ✅ Solid | All 5 exist |
| 4 integration test workflows | ⚠️ Exists | Files in `workflows/` dir, not verified running |
| v0.9-stable tag | ❌ Wrong commit | Points to `7bcdce1` — 19 commits behind HEAD |
| `SECURITY_AUDIT_REPORT.md` | ❌ Deleted | File does not exist |
| `PERFORMANCE_BENCHMARK_REPORT.md` | ❌ Deleted | File does not exist |
| `AGENT_A_SUMMARY.md` | ❌ Deleted | File does not exist |
| `AGENT_B_SUMMARY.md` | ❌ Deleted | File does not exist |
| Mobile `ios/` directory | ❌ Never existed | Only `android/` was added |
| CI integration test gate | ❌ Fake | Line 217: `|| echo "..."` swallows failures |
| aria-labels in CEODashboard | ❌ Missing | 0 matches in `CEODashboard.tsx` |

---

## 🔴 Agent A — Backend + DevOps

| # | Task | Priority | Details |
|---|------|----------|---------|
| 1 | **Fix CI swallowing integration tests** | 🔴 Critical | Remove `|| echo "Integration tests completed (some may be skipped)"` on line 217 of `.github/workflows/ci.yml`. Tests must fail the build when they fail. |
| 2 | **Fix v0.9-stable tag** | 🔴 Critical | `git tag -d v0.9-stable && git tag -f v0.9-stable HEAD && git push -f origin v0.9-stable`. Tag must point to real latest. |
| 3 | **Verify backend tests** | 🟡 Medium | `mvn test` — confirm 86 still pass after all merges. |
| 4 | **Verify integration tests actually run** | 🟡 Medium | Run the 4 workflow tests locally. They extend `AbstractContainerBaseTest` (Testcontainers) — may be skipped without Docker. Decide: keep them or convert to in-memory. |
| 5 | **Restore deleted report files** | 🟡 Medium | Regenerate: `SECURITY_AUDIT_REPORT.md`, `PERFORMANCE_BENCHMARK_REPORT.md`, `AGENT_A_SUMMARY.md`, `AGENT_B_SUMMARY.md`. They were Phase 7 deliverables, now gone. |
| 6 | **Add SRS missing features** | 🟡 Medium | See SRS Gap Analysis below. Pick top 2. |

---

## 🟡 Agent B — Frontend + Mobile

| # | Task | Priority | Details |
|---|------|----------|---------|
| 1 | **Fix aria-labels in CEODashboard.tsx** | 🟡 Medium | 0 aria-labels found. Every icon button needs one for accessibility. |
| 2 | **Run frontend tests** | 🟡 Medium | `npx vitest run` — verify all 23 tests still pass after the Layout refactor. |
| 3 | **Verify frontend production build** | 🟡 Medium | `npm run build` — must compile with zero errors. No build has been done since the merge. |
| 4 | **Add mobile ios/ directory** | 🟢 Low | `cd mobile && flutter create --platforms=ios .` — only `android/` exists. |
| 5 | **Remove BottomNav dead code** | 🟢 Low | `BottomNav.tsx` is no longer imported anywhere. Delete the file. |
| 6 | **Add SRS missing features** | 🟡 Medium | See SRS Gap Analysis below. Pick top 1-2. |

---

## 🔍 SRS Gap Analysis

Features described in the SRS (`project structure.md`) but not fully implemented:

| Feature | SRS Section | Current Status | Gap |
|---------|-------------|----------------|-----|
| **PDF/Excel report downloads** | Attendance, Payroll, Leave | ⚠️ API endpoints exist | Not verified working end-to-end |
| **Overtime calculation** | Payroll formula | ⚠️ Partially implemented | May not match SRS formula exactly |
| **Late arrival deductions** | Payroll calculation | ⚠️ Partially implemented | May not match SRS formula exactly |
| **Manager daily check ("تأكيد المشاهدة")** | فريق العمل | ✅ Exists in TeamAttendance | Verified |
| **Fraud reporting ("إبلاغ عن تلاعب")** | التلاعب | ✅ Exists | Verified |
| **Device management UI** | أجهزة NFC | ✅ Exists in DeviceManagement | Verified |
| **Audit log viewer (سجل التعديلات)** | HR permissions | ⚠️ API exists | No dedicated UI page for viewing audit logs |
| **Employee self-service profile edit** | تحديث البيانات | ✅ ProfileEditModal exists | Verified |

**Priority SRS gaps to fill in Phase 8:**
1. **Audit log viewer page** — HR/Admin needs to see who changed what and when
2. **PDF/Excel download buttons** — make existing report APIs accessible from UI
3. **Payroll formula verification** — confirm overtime + late deductions match SRS

---

## 📅 Execution Order

| Day | Agent A | Agent B |
|-----|---------|---------|
| **Day 1** | Fix CI gate + re-tag v0.9-stable (2h) | Fix CEODashboard aria-labels + run vitest (2h) |
| **Day 2** | Verify integration tests + restore report files (3h) | Build frontend (`npm run build`) + delete BottomNav (2h) |
| **Day 3** | Implement audit log viewer page (3h) | Add ios/ to mobile + implement PDF/Excel download UI (3h) |
| **Day 4** | Verify payroll formula vs SRS (2h) | Polish + responsive fixes (2h) |
| **End** | Both: final test pass, tag `v1.0-rc1`, push | |

---

## ✅ Phase 8 Exit Criteria

- [ ] CI integration test job fails when tests fail (no echo swallowing)
- [ ] v0.9-stable tag points to correct commit
- [ ] All 4 deleted report files restored
- [ ] 86 backend tests pass
- [ ] 23 frontend tests pass
- [ ] `npm run build` succeeds with 0 errors
- [ ] CEODashboard has aria-labels on all icon buttons
- [ ] BottomNav.tsx deleted
- [ ] mobile/ios/ exists
- [ ] Audit log viewer page exists and works
- [ ] Report download buttons work (PDF/Excel)
- [ ] Tag `v1.0-rc1` on verified HEAD
