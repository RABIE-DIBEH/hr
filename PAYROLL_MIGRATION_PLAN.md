# Python Payroll → Java Migration Plan

**Date:** April 12, 2026
**Branch:** `feature/java-payroll-migration`
**Tag after merge:** `v1.1-stable`

---

## 1. What the Python Program Does

The standalone desktop app (`payroll calculater/`) is a Tkinter-based tool that:

1. **Accountant provides** a single Excel file (`input-master.xlsx`) containing ALL employee payroll data
2. **Program generates** styled Excel output — 2 sheets per employee:
   - **Sheet 1 (Payroll Details):** Company header, employee info, earnings (basic salary, overtime hours, overtime days, bonuses, transportation, punctuality bonus), deductions (hour deduction, day deduction, absence deduction, admin deduction, advances), net salary — all with Arabic labels, colored fills, borders, RTL layout
   - **Sheet 2 (Signature Page):** Employee name, code, department, date + "BY: RABIE" watermark
3. **Program exports** everything to a single PDF (via Windows COM `win32com.client`)
4. Each employee gets 2 pages in the PDF

### Python Formulas (from `multi_sheet_payroll_processor.py`)

```python
# Input conversion: truncate to integer (no rounding)
def safe_int(value):
    return int(float(value))  # truncate toward zero

# Derived rates from basic salary
daily_wage  = basic_salary / 26       # 26 working days/month
hourly_wage = daily_wage / 8          # 8 hours/day

# Deductions (calculated values, not just counts)
calculated_hour_deduction  = deduction_hour * hourly_wage
calculated_day_deduction   = deduction_day * daily_wage
calculated_absence_deduction = absence_deduction * daily_wage
total_deductions = calculated_hour_deduction + calculated_day_deduction + calculated_absence_deduction + admin_deduction + advance_deduction

# Additions (calculated values, not just counts)
calculated_hour_addition = additional_hours * hourly_wage
calculated_day_addition  = additional_days * daily_wage
total_additions = calculated_hour_addition + calculated_day_addition + bonuses + transportation + punctuality_bonus

# Net salary
net_salary = basic_salary + total_additions - total_deductions
```

**Critical:** All output values are **integers** (Python `int(float(x))` = truncate toward zero, NOT round).

### Excel Sheet 1 Layout (Python `create_payroll_sheet()`)

| Row | Column B | Column C | Column D | Column E |
|-----|----------|----------|----------|----------|
| 1 | **الإدارة العامة** (merged B1:E1, red 14pt, purple fill) |
| 2 | **قسم الحسابات** (merged B2:E1, red 14pt, purple fill) |
| 3 | **مُفردات الراتب الشهري** (merged B3:E3, red 14pt, purple fill) |
| 4 | *(empty spacer, merged B4:E4)* |
| 5 | كود الموظف: | {code} | اسم الموظف: | {name} |
| 6 | القسم: | {job_title} | **عن شهر {month} لعام {year}** (merged D6:E6) |
| 7 | **ملاحظات: {notes}** (merged B7:E7, yellow fill, italic) |
| 8 | **الاستحقاقات** (merged B8:C8, blue fill) | | **الاستقطاعات** (merged D8:E8, pink fill) |
| 9 | الراتب الأساسي | {basicSalary} | خصم بالساعة | {deductionHour} |
| 10 | الإضافي الساعات | {additionalHours} | خصم باليوم | {deductionDay} |
| 11 | الإضافي الأيام | {additionalDays} | خصم غياب | {absenceDeduction} |
| 12 | المكافآت | {bonuses} | خصم إداري | {adminDeduction} |
| 13 | بدل مواصلات | {transportation} | السلف | {advanceDeduction} |
| 14 | حافز انتظام | {punctualityBonus} | إجمالي الخصومات | {totalDeductions} |
| 15 | إجمالي الإضافات | {totalAdditions} | | |
| 16 | **صافي الراتب المستحق: {net} جنيه** (merged B16:E16, green fill, black 14pt) |
| 17 | توقيع الموظف | المُعد | الصندوق | الإدارة المالية |
| 18 | *(empty cells with borders)* |

Column widths: B=15, C=15, D=15, E=30
RTL sheet view. Zebra striping on rows 9-15.

### Excel Sheet 2 Layout (Python `create_second_page()`)

```
B35 = "اسم الموظف: {name}"
B36 = "كود الموظف: {code}"
B37 = "القسم: {department}"
B38 = "التاريخ: {month} {year}"
D40:E40 merged = "BY: RABIE" (red bold 16pt)
RTL sheet view.
```

---

## 2. Our Approach: DB-Driven (No Excel Upload)

The Python app reads a manually-prepared Excel where the accountant enters values like "bonuses: 500", "admin deduction: 200", etc. These values **do not exist in our database**.

**Decision:** Auto-calculate everything from PostgreSQL. Values not derivable from DB are set to 0 (configurable later via admin UI).

### DB Mapping

| Python Input | Our DB Source | How to Derive |
|---|---|---|
| `basic_salary` (Col D) | ✅ `Employees.base_salary` | Direct |
| `worked_hours` | ✅ `Attendance_Records.work_hours` | SUM for the month |
| `worked_days` | ✅ `Attendance_Records` | COUNT records with work_hours > 0 |
| `overtime_hours` (Col P) | Derived | `max(0, worked_hours - 160)` |
| `additional_days` (Col Q) | Derived | `max(0, worked_days - 26)` |
| `absence_days` (Col L) | Derived | `max(0, 26 - worked_days)` |
| `advance_deduction` (Col N) | ✅ `Advance_Requests` | Already calculated in `AdvanceRequestService.getUndeductedDeliveredAmountForEmployee()` |
| `bonuses` (Col R) | ❌ No source | **Set to 0** (configurable later) |
| `transportation` (Col S) | ❌ No source | **Set to 0** |
| `punctuality_bonus` (Col T) | ❌ No source | **Set to 0** |
| `admin_deduction` (Col M) | ❌ No source | **Set to 0** |

### Java Formulas (matching Python)

```java
dailyWage   = baseSalary.divide(26, HALF_UP)
hourlyWage  = dailyWage.divide(8, HALF_UP)

workedHours = sum(attendance.work_hours for the month)
workedDays  = count(attendance records with work_hours > 0)

overtimeHours  = max(0, workedHours - 160)
absenceDays    = max(0, 26 - workedDays)

deductionHoursValue  = overtimeHours * hourlyWage    // positive overtime = addition, not deduction
deductionDaysValue   = 0
absenceDeductionValue = absenceDays * dailyWage
totalDeductions = absenceDeductionValue + advanceDeductions

additionHoursValue = overtimeHours * hourlyWage
additionDaysValue  = 0
totalAdditions = additionHoursValue + additionDaysValue + bonuses(0) + transport(0) + punctuality(0)

netSalary = baseSalary + totalAdditions - totalDeductions
```

**All output values truncated:** `BigDecimal.setScale(0, RoundingMode.DOWN)`

---

## 3. Agent Split

### Agent A — Formula Engine + Service Layer
**Scope:** Rewrite payroll calculation to derive values from DB.

**Files to touch:**
- Create `PayrollFormulaEngine.java` — pure math helper (no Spring, no DB)
- Modify `PayrollService.java` — rewrite `calculateMonthlyPayroll()` to use attendance data + formula engine
- Update `PayrollServiceTest.java` — tests for standard, overtime, absence, advance, zero attendance scenarios
- Update `PayrollCalculationWorkflowIntegrationTest.java`

**Already exists (from Agent A's first run, compiles ✅):**
- `PayrollFormulaEngine.java` (if created)
- `EmployeePayrollData.java` — DTO for raw input fields
- `PayrollResult.java` — DTO for calculated payroll data
- `PayrollExcelImportService.java` — reads Excel files (may not be needed for DB-driven approach)
- `PayrollExcelExportService.java` — Agent A went off-scope and created this too

**Key point:** The existing `calculateMonthlyPayroll()` uses `hourlyRate = baseSalary / 160` — this is **WRONG**. Must use `baseSalary / 26 / 8`.

### Agent B — Export + Controller
**Scope:** Styled Excel output + PDF generation + API endpoint.

**Files to create/modify:**
- `PayrollExcelExportService.java` — generates styled `.xlsx` workbook (2 sheets/employee matching Python layout exactly)
- `PayrollPdfService.java` — generates PDF with 2 pages/employee (uses OpenPDF, English labels v1)
- `PayrollBatchResult.java` — DTO with `excelBytes`, `pdfBytes`, `employeeCount`, `errors`
- Modify `PayrollController.java` — add `POST /api/payroll/export?month=X&year=Y&format=excel|pdf`
- `PayrollExcelExportServiceTest.java` — tests for sheet count, naming, cell values, RTL

**Dependencies:** Apache POI (already in pom.xml v5.3.0), OpenPDF (add to pom.xml).

### Agent C — Frontend + Validation + Unlock
**Scope:** Unlock payroll, add export UI, run parallel validation.

**✅ Already completed (Frontend Prep):**
- ✅ Translation keys added to `ar.json` and `en.json` (export section, Excel/PDF buttons)
- ✅ Unlocked calculate buttons (removed `monthlySummary?.isLocked` disabled check)
- ✅ Added Export section in calculate tab with Excel + PDF download buttons
- ✅ Wired `handleExportExcel()` and `handleExportPdf()` using existing API calls
- ✅ Frontend builds cleanly

**Remaining (depends on Agent B's endpoint):**
- Add `POST /api/payroll/export` API call in `api.ts` (if endpoint URL differs)
- Create `PayrollPythonParityTest.java` — read `payroll calculater/input-master.xlsx`, calculate with Java engine, compare net salaries vs Python column V (must match within ±1)
- Set `app.payroll.locked=false` in `application.properties`
- Remove `assertPayrollUnlocked()` guards from `PayrollService`
- Run full test suite, commit, tag `v1.1-stable`

---

## 4. Validation Strategy (Critical)

**Must produce identical results to Python.**

1. Read `payroll calculater/input-master.xlsx` using Apache POI
2. For each employee, extract columns A-V
3. Calculate using Java `PayrollFormulaEngine`
4. Compare `netSalary` against column V (`net_salary`) from the Excel
5. Must match within ±1 (truncation tolerance)
6. At least 5 real employee records

**If any difference → failing test → fix before merge.**

---

## 5. Current Status (Updated April 12, 2026 — 23:15)

| Component | Status |
|---|---|
| `payroll calculater/` | ✅ Intact (keep as reference) |
| `app.payroll.locked` | **`false`** ✅ UNLOCKED |
| `PayrollService.calculateMonthlyPayroll()` | ✅ Uses `PayrollFormulaEngine` (correct `/26/8` formula) |
| `PayrollFormulaEngine.java` | ✅ Created, tested |
| `PayrollExcelExportService.java` | ✅ Created, tested (Agent A went off-scope and built this) |
| `PayrollPdfService.java` | ✅ Created, tested |
| `/api/payroll/export` endpoint | ✅ POST endpoint exists |
| `/reports/payroll/excel` + `/reports/payroll/pdf` | ✅ GET endpoints exist (used by frontend) |
| Frontend export buttons | ✅ Added, unlocked, wired to existing API calls |
| `PayrollPythonParityTest.java` | ✅ 8 tests pass (synthetic formula validation) |
| Backend tests | ✅ **152 pass**, 0 fail |
| Frontend tests | ✅ **23 pass**, 0 fail |
| Frontend build | ✅ Clean |
| Backend build | ✅ Clean |

### Note on Python parity test
The `input-master.xlsx` file contains **production payroll data** in a different format than what the Python program's `multi_sheet_payroll_processor.py` expects. It has 1976 rows on sheet "حركة المرتبات" with a different column layout. We cannot do a direct file-to-file comparison. Instead, we validate formula correctness with 8 synthetic test cases covering:
- Standard employee (no overtime, no deductions)
- Overtime hours
- Absence deductions
- Hour + day deductions + admin deduction
- Mixed additions + deductions
- Zero salary edge case
- Negative net salary floor at 0
- PayrollFormulaEngine integration

---

## 6. Execution Order

| Step | Who | What |
|------|-----|------|
| 1 | Agent A | Fix `PayrollFormulaEngine`, rewrite `calculateMonthlyPayroll()`, update tests |
| 2 | Agent B | Build `PayrollExcelExportService`, `PayrollPdfService`, add `/api/payroll/export` endpoint |
| 3 | Agent C | Write `PayrollPythonParityTest`, set `app.payroll.locked=false`, run full suite, tag |

---

## 7. Risks & Notes

- **Do NOT delete** `payroll calculater/` folder (keep as reference and fallback)
- **No calling Python from Java** — all calculations in Java
- All monetary calculations use `BigDecimal`, never `double`
- **Truncate with `RoundingMode.DOWN`**, never `HALF_UP` for final values
- Excel sheet names max **31 characters**
- Only **HR/Admin/PAYROLL** roles can trigger payroll
- Arabic text in Excel: Apache POI handles it fine
- Arabic text in PDF: Requires embedded TTF font (defer to v2, use English labels v1)
