# HRMS PRO - Phase 9: Final Lockdown

**Version:** v1.0-stable (Target)  
**Status:** Active Planning  
**Created:** April 2026  
**Estimated Duration:** 3.5–4.5 weeks (20–25 working days)  
**Daily Commitment:** 4–6 hours per person

---

## Table of Contents

1. [Introduction & Objectives](#1-introduction--objectives)
2. [Current Situation & Rationale](#2-current-situation--rationale)
3. [Phase Goals](#3-phase-goals)
4. [Task Priorities](#4-task-priorities)
5. [Weekly Breakdown](#5-weekly-breakdown)
6. [Python-to-Java Payroll Migration Guide](#6-python-to-java-payroll-migration-guide)
7. [Team Work Distribution](#7-team-work-distribution)
8. [Strict Rules During Phase 9](#8-strict-rules-during-phase-9)
9. [Success Criteria](#9-success-criteria)
10. [Risk Management](#10-risk-management)

---

## 1. Introduction & Objectives

This is the **final phase** before introducing any major new features to the HRMS PRO platform.  

The primary goal is to **close out all core systems** (Web Application + Docker + Mobile) into a stable, production-ready release tagged **`v1.0-stable`**, ready for internal use and client handoff.

---

## 2. Current Situation & Rationale

We are currently in a good state, but several critical areas require final closure before adding new features:

| Issue | Impact |
|-------|--------|
| **Payroll system needs refinement** | Current logic is incomplete; must match legacy Python program exactly |
| **Leave management not finalized** | Workflow not agreed upon with client; needs revision |
| **Weak organizational structure** | HR sees everything, single Manager only, no Departments |
| **No support for multiple roles** | Cannot handle Multiple Managers / HRs / Payroll Officers |
| **No employee deletion feature** | Missing Soft Delete with audit trail |
| **NFC implementation undefined** | Physical execution method not yet determined |
| **Need stable release** | Must ship a clean, stable version (`v1.0-stable`) |

---

## 3. Phase Goals

- ✅ Close all core systems definitively (Backend + Frontend + Mobile + Docker)
- ✅ Achieve high stability across Web App + Docker + Mobile
- ✅ Prepare the system for internal use and client delivery
- ✅ **Freeze all major new feature development** until this phase is complete

---

## 4. Task Priorities

| # | Task | Affected Parts | Est. Time | Priority |
|---|------|----------------|-----------|----------|
| 1 | **Refine & Improve Payroll System** | Backend + Frontend | 4–6 days | ★★★★★ |
| 2 | **Review & Adjust Leave Management** | Backend + Frontend | 3–4 days | ★★★★ |
| 3 | **Add Departments System + RBAC Overhaul** | Backend + DB + Frontend | 5–7 days | ★★★★★ |
| 4 | **Support Multiple Managers / HRs / Payroll Officers** | Backend (RBAC) | 2–3 days | ★★★★ |
| 5 | **Add Employee Soft Delete** | Backend + Frontend | 1–2 days | ★★★ |
| 6 | **Finalize NFC (Physical + Mobile)** | Mobile + Backend | 3–5 days | ★★★ |
| 7 | **Final Testing + UAT + Docker Optimization** | All parts | 3–4 days | ★★★★ |
| 8 | **Create v1.0-stable Tag + Final Documentation** | Documentation | 1 day | ★★★ |

---

## 5. Weekly Breakdown

### Week 1: Payroll System (Absolute Priority)

**Days 1–2: Review & Refine Current Calculations**
- Audit existing payroll logic in `PayrollCalculationService`
- Identify gaps between current implementation and legacy Python program
- Document all formulas: Gross Salary, Deductions, Taxes, Net Salary

**Days 2–4: Migrate Python Logic to Java**
- Extract all equations from Python program
- Create dedicated calculation methods in Java
- Use `BigDecimal` for all financial calculations (avoid `double` precision errors)
- Implement flexible rule engine for taxes and deductions

**Days 3–6: Add Required Features**
- **Excel Import:** Read full employee roster + monthly salaries from Excel file
- **Monthly Calculation:** Compute salary per employee (with taxes & deductions)
- **Individual Excel Export:** Generate per-employee salary slip in Excel format
- **PDF Generation:** Create single PDF file containing all salary slips (print-ready)
- **HR/Payroll UI Button:** Add "Process Payroll for Selected Month" button

**Day 7: Testing & Validation**
- Run 3–4 months of trial payroll processing
- Compare results with legacy Python program (must be **100% identical**)
- Document any discrepancies and fix immediately

**Deliverables:**
- [ ] `PayrollCalculationService.java` with full logic
- [ ] Excel Import/Export endpoints
- [ ] PDF generation endpoint
- [ ] HR/Payroll UI button + workflow
- [ ] Unit tests for all calculation methods
- [ ] Validation report (Python vs Java comparison)

---

### Week 2: Leave Management System

**Days 1–2: Comprehensive Review**
- Audit current leave request workflow (creation, approval, rejection)
- Review leave balance tracking logic
- Identify gaps vs. client requirements

**Days 3–4: Workflow Adjustments**
- Modify leave approval workflow based on client feedback
- Update leave balance calculations (used, remaining, carry-over rules)
- Ensure proper notifications on approval/rejection

**Days 5–6: Reports & Testing**
- Add clear reports:
  - Used leaves per employee
  - Remaining leaves per employee
  - Department-level leave summaries
  - Manager-level leave overviews
- Test all leave scenarios comprehensively

**Deliverables:**
- [ ] Updated leave workflow (Backend + Frontend)
- [ ] Leave balance tracking (accurate)
- [ ] Leave reports (by employee, by department, by manager)
- [ ] Integration tests for leave scenarios

---

### Week 3: Departments System + RBAC Overhaul (Largest Structural Change)

**Days 1–2: Database & Entity Design**
- Create new `Department` entity:
  - `departmentId` (PK)
  - `departmentName` (unique, not null)
  - `managerId` (FK → Employee, optional)
  - `createdAt`, `updatedAt`
- Add `departmentId` (FK) to `Employee` entity
- Update migration scripts

**Days 2–4: Backend RBAC Adjustments**
- **Manager:** Sees and manages only employees in their department
- **Top Manager (General Manager):** Sees only department heads
- **Multiple Managers:** Support multiple managers per department (optional)
- **Multiple HRs:** Allow multiple HR role users
- **Multiple Payroll Officers:** Allow multiple payroll role users

**Days 3–5: Service & Query Updates**
- Update all services to respect department boundaries
- Update all repository queries with department-scoped filters
- Ensure no cross-department data leakage

**Days 5–7: Frontend Adjustments**
- Update all dashboards to reflect new RBAC rules
- Add department selector where appropriate
- Update employee list, attendance, and leave views

**Deliverables:**
- [ ] `Department` entity + migration
- [ ] Updated RBAC logic in `SecurityConfig.java`
- [ ] Department-scoped queries in all repositories
- [ ] Updated services (Attendance, Leave, Payroll, Employee)
- [ ] Frontend department views
- [ ] Integration tests for RBAC

---

### Week 4: Final Cleanup & Project Closure

**Days 1–2: Employee Soft Delete**
- Add `deleted` (boolean) and `deletedAt` (timestamp) columns to `Employee`
- Implement Soft Delete pattern (never hard delete)
- Add Audit Log for deletions (who deleted, when, reason)
- Update all queries to exclude soft-deleted employees
- Add UI confirmation dialog + reason input

**Days 2–4: NFC Final Resolution**
- Decide on physical NFC implementation method
- Implement mobile NFC scanning (Flutter)
- Integrate with backend `/api/attendance/nfc-clock` endpoint
- Test end-to-end NFC flow

**Days 4–5: Comprehensive Testing**
- Full regression test (Web + Docker + Mobile)
- Docker Compose optimization
- Add Backup & Restore scripts
- Performance testing

**Day 6: Release & Documentation**
- Create Git tag `v1.0-stable`
- Update all documentation:
  - `README.md`
  - `DEPLOYMENT_CHECKLIST.md`
  - `OPERATIONS_RUNBOOK.md`
  - `API_DOCS.md`
  - `AGENTS.md`

**Day 7: Staging Deploy + UAT**
- Deploy to staging environment
- Conduct internal User Acceptance Testing (UAT)
- Document any critical bugs (fix only if blocking)

**Deliverables:**
- [ ] Soft Delete implementation + Audit Log
- [ ] NFC working (Mobile + Backend)
- [ ] Docker Compose optimized
- [ ] Backup & Restore scripts
- [ ] Git tag `v1.0-stable`
- [ ] Updated documentation
- [ ] Staging deployment
- [ ] UAT sign-off

---

## 6. Python-to-Java Payroll Migration Guide

### 6.1 Background

You have an existing **Python desktop program** that performs the following operations:
1. Reads a full Excel file (employee roster + monthly salaries)
2. Calculates salary per employee (with taxes & deductions)
3. Outputs individual Excel files (salary slips)
4. Generates a single PDF file containing all slips (print-ready)

We will migrate this logic to Spring Boot.

---

### 6.2 Step-by-Step Migration Process

#### Step 1: Extract Logic from Python

**Actions:**
1. Open the Python program and identify all calculation functions
2. Extract every formula:
   - **Gross Salary:** Base + Allowances + Overtime
   - **Deductions:** Insurance, Advances, Absences, Loans
   - **Taxes:** Income tax brackets, rates, thresholds, exemptions
   - **Net Salary:** Gross - Deductions - Taxes
3. Document:
   - Tax rules (percentages, brackets, limits, exceptions)
   - Deduction rules (social security, advances, absences)
   - Net salary calculation logic
4. Create a **Payroll Formula Document** (spreadsheet or markdown) with all equations

**Example Output:**
```markdown
| Formula | Python Code | Java Equivalent |
|---------|-------------|-----------------|
| Gross Salary | `base + allowances + overtime` | `base.add(allowances).add(overtime)` |
| Income Tax (10%) | `gross * 0.10 if gross <= 5000 else 500 + (gross - 5000) * 0.20` | See `calculateIncomeTax()` below |
| Social Security | `gross * 0.07` | `gross.multiply(BigDecimal.valueOf(0.07))` |
| Net Salary | `gross - deductions - taxes` | `gross.subtract(deductions).subtract(taxes)` |
```

---

#### Step 2: Create New Spring Boot Services

**File Structure:**
```
backend/src/main/java/com/hrms/services/payroll/
├── PayrollCalculationService.java   # Core calculation engine
├── PayrollImportService.java        # Excel import logic
├── PayrollExportService.java        # Excel + PDF export
└── PayrollRuleEngine.java           # Tax & deduction rules

backend/src/main/java/com/hrms/api/dto/payroll/
├── SalarySlipDTO.java               # Individual salary slip
├── PayrollResultDTO.java            # Monthly payroll result
├── TaxRule.java                     # Tax bracket configuration
├── DeductionRule.java               # Deduction configuration
└── PayrollImportRow.java            # Excel row mapping
```

---

#### Step 3: Migrate Equations to Java

**Key Principles:**
- ✅ **Use `BigDecimal`** for ALL financial calculations (avoid `double` precision errors)
- ✅ **Create separate methods** for each calculation (testable, maintainable)
- ✅ **Make rules configurable** (not hardcoded) for future flexibility

**Example Implementation:**

```java
@Service
public class PayrollCalculationService {
    
    private final List<TaxRule> taxRules;
    private final List<DeductionRule> deductionRules;
    
    public PayrollCalculationService(List<TaxRule> taxRules, List<DeductionRule> deductionRules) {
        this.taxRules = taxRules;
        this.deductionRules = deductionRules;
    }
    
    /**
     * Calculate gross salary: base + allowances + overtime
     */
    public BigDecimal calculateGrossSalary(BigDecimal base, BigDecimal allowances, BigDecimal overtime) {
        return base.add(allowances).add(overtime);
    }
    
    /**
     * Calculate income tax based on configurable tax brackets
     */
    public BigDecimal calculateIncomeTax(BigDecimal grossSalary) {
        BigDecimal tax = BigDecimal.ZERO;
        
        for (TaxRule rule : taxRules) {
            if (grossSalary.compareTo(rule.getMinThreshold()) >= 0) {
                if (rule.isProgressive()) {
                    // Progressive tax: apply rate only to amount above threshold
                    BigDecimal taxableAmount = grossSalary.subtract(rule.getMinThreshold());
                    tax = tax.add(taxableAmount.multiply(rule.getRate()));
                } else {
                    // Flat tax: apply rate to entire gross
                    tax = grossSalary.multiply(rule.getRate());
                }
            }
        }
        
        return tax.setScale(2, RoundingMode.HALF_UP);
    }
    
    /**
     * Calculate social security deduction (e.g., 7% of gross)
     */
    public BigDecimal calculateSocialSecurity(BigDecimal grossSalary) {
        return grossSalary.multiply(new BigDecimal("0.07"))
                          .setScale(2, RoundingMode.HALF_UP);
    }
    
    /**
     * Calculate total deductions (insurance + advances + absences + social security)
     */
    public BigDecimal calculateTotalDeductions(BigDecimal insurance, BigDecimal advances, 
                                               BigDecimal absences, BigDecimal socialSecurity) {
        return insurance.add(advances).add(absences).add(socialSecurity);
    }
    
    /**
     * Calculate net salary: gross - deductions - taxes
     */
    public BigDecimal calculateNetSalary(BigDecimal grossSalary, BigDecimal totalDeductions, 
                                         BigDecimal totalTaxes) {
        return grossSalary.subtract(totalDeductions).subtract(totalTaxes);
    }
    
    /**
     * Main calculation method: processes one employee's monthly salary
     */
    public SalarySlipDTO calculateMonthlySalary(Employee employee, BigDecimal baseSalary, 
                                                  BigDecimal allowances, BigDecimal overtime) {
        // 1. Gross Salary
        BigDecimal grossSalary = calculateGrossSalary(baseSalary, allowances, overtime);
        
        // 2. Taxes
        BigDecimal incomeTax = calculateIncomeTax(grossSalary);
        
        // 3. Deductions
        BigDecimal socialSecurity = calculateSocialSecurity(grossSalary);
        BigDecimal insurance = BigDecimal.ZERO; // TODO: Load from employee profile
        BigDecimal advances = BigDecimal.ZERO;  // TODO: Fetch pending advances
        BigDecimal absences = BigDecimal.ZERO;  // TODO: Calculate from attendance
        BigDecimal totalDeductions = calculateTotalDeductions(insurance, advances, absences, socialSecurity);
        
        // 4. Net Salary
        BigDecimal netSalary = calculateNetSalary(grossSalary, totalDeductions, incomeTax);
        
        // 5. Build DTO
        return SalarySlipDTO.builder()
            .employeeId(employee.getEmployeeId())
            .employeeName(employee.getFullName())
            .department(employee.getDepartment().getDepartmentName())
            .month(LocalDate.now().getMonthValue())
            .year(LocalDate.now().getYear())
            .baseSalary(baseSalary)
            .allowances(allowances)
            .overtime(overtime)
            .grossSalary(grossSalary)
            .incomeTax(incomeTax)
            .socialSecurity(socialSecurity)
            .totalDeductions(totalDeductions)
            .netSalary(netSalary)
            .build();
    }
}
```

---

#### Step 4: Excel Support

**Libraries:**
- **Apache POI** → Read/write Excel files (`.xlsx`)
- **OpenPDF** or **iText** → Generate PDF salary slips

**Add to `pom.xml`:**
```xml
<!-- Apache POI for Excel -->
<dependency>
    <groupId>org.apache.poi</groupId>
    <artifactId>poi-ooxml</artifactId>
    <version>5.2.5</version>
</dependency>

<!-- OpenPDF for PDF Generation -->
<dependency>
    <groupId>com.github.librepdf</groupId>
    <artifactId>openpdf</artifactId>
    <version>1.3.30</version>
</dependency>
```

**Excel Import Service:**
```java
@Service
public class PayrollImportService {
    
    /**
     * Read payroll data from Excel file
     * Expected columns: EmployeeID, BaseSalary, Allowances, Overtime
     */
    public List<PayrollImportRow> importPayrollData(MultipartFile excelFile) throws IOException {
        List<PayrollImportRow> rows = new ArrayList<>();
        
        try (Workbook workbook = WorkbookFactory.create(excelFile.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);
            
            for (Row row : sheet) {
                if (row.getRowNum() == 0) continue; // Skip header
                
                PayrollImportRow importRow = PayrollImportRow.builder()
                    .employeeId(getCellValueAsString(row.getCell(0)))
                    .baseSalary(new BigDecimal(getCellValueAsString(row.getCell(1))))
                    .allowances(new BigDecimal(getCellValueAsString(row.getCell(2))))
                    .overtime(new BigDecimal(getCellValueAsString(row.getCell(3))))
                    .build();
                
                rows.add(importRow);
            }
        }
        
        return rows;
    }
    
    private String getCellValueAsString(Cell cell) {
        if (cell == null) return "";
        switch (cell.getCellType()) {
            case STRING: return cell.getStringCellValue();
            case NUMERIC: return String.valueOf((long) cell.getNumericCellValue());
            default: return "";
        }
    }
}
```

**Excel Export Service:**
```java
@Service
public class PayrollExportService {
    
    /**
     * Export individual salary slip to Excel
     */
    public byte[] exportIndividualSlip(SalarySlipDTO slip) throws IOException {
        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Salary Slip");
            
            // Header
            Row header = sheet.createRow(0);
            header.createCell(0).setCellValue("Employee Name");
            header.createCell(1).setCellValue(slip.getEmployeeName());
            
            // Details
            int rowNum = 2;
            String[][] details = {
                {"Department", slip.getDepartment()},
                {"Month", String.valueOf(slip.getMonth())},
                {"Year", String.valueOf(slip.getYear())},
                {"", ""},
                {"Base Salary", slip.getBaseSalary().toString()},
                {"Allowances", slip.getAllowances().toString()},
                {"Overtime", slip.getOvertime().toString()},
                {"Gross Salary", slip.getGrossSalary().toString()},
                {"Income Tax", slip.getIncomeTax().toString()},
                {"Social Security", slip.getSocialSecurity().toString()},
                {"Total Deductions", slip.getTotalDeductions().toString()},
                {"Net Salary", slip.getNetSalary().toString()}
            };
            
            for (String[] row : details) {
                Row dataRow = sheet.createRow(rowNum++);
                dataRow.createCell(0).setCellValue(row[0]);
                dataRow.createCell(1).setCellValue(row[1]);
            }
            
            // Auto-size columns
            sheet.autoSizeColumn(0);
            sheet.autoSizeColumn(1);
            
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            workbook.write(baos);
            return baos.toByteArray();
        }
    }
    
    /**
     * Generate PDF containing all salary slips (print-ready)
     */
    public byte[] generateAllSlipsPDF(List<SalarySlipDTO> slips) throws Exception {
        Document document = new Document(PageSize.A4);
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        PdfWriter.getInstance(document, baos);
        
        document.open();
        
        for (SalarySlipDTO slip : slips) {
            // Add title
            Font titleFont = new Font(FontFamily.HELVETICA, 16, Font.BOLD);
            document.add(new Paragraph("Salary Slip", titleFont));
            document.add(new Paragraph(" "));
            
            // Add employee details
            document.add(new Paragraph("Employee: " + slip.getEmployeeName()));
            document.add(new Paragraph("Department: " + slip.getDepartment()));
            document.add(new Paragraph("Period: " + slip.getMonth() + "/" + slip.getYear()));
            document.add(new Paragraph(" "));
            
            // Add salary breakdown
            document.add(new Paragraph("Base Salary: " + slip.getBaseSalary()));
            document.add(new Paragraph("Allowances: " + slip.getAllowances()));
            document.add(new Paragraph("Gross Salary: " + slip.getGrossSalary()));
            document.add(new Paragraph("Income Tax: " + slip.getIncomeTax()));
            document.add(new Paragraph("Social Security: " + slip.getSocialSecurity()));
            document.add(new Paragraph("Total Deductions: " + slip.getTotalDeductions()));
            document.add(new Paragraph("Net Salary: " + slip.getNetSalary()));
            
            // Page break
            document.newPage();
        }
        
        document.close();
        return baos.toByteArray();
    }
}
```

---

#### Step 5: Proposed Code Structure

```
backend/src/main/java/com/hrms/
├── api/
│   └── PayrollController.java           # Endpoints: /process-month, /export-slip, /generate-pdf
├── services/payroll/
│   ├── PayrollCalculationService.java   # Core calculation engine (Python logic migrated here)
│   ├── PayrollImportService.java        # Excel import
│   ├── PayrollExportService.java        # Excel + PDF export
│   └── PayrollRuleEngine.java           # Tax & deduction rules
├── core/models/payroll/
│   ├── Department.java                  # NEW: Department entity
│   └── Employee.java                    # UPDATED: Add departmentId FK
└── api/dto/payroll/
    ├── SalarySlipDTO.java               # Individual slip response
    ├── PayrollResultDTO.java            # Monthly payroll result
    ├── TaxRule.java                     # Tax configuration
    ├── DeductionRule.java               # Deduction configuration
    └── PayrollImportRow.java            # Excel row mapping
```

**Controller Endpoints:**
```java
@RestController
@RequestMapping("/api/payroll")
public class PayrollController {
    
    private final PayrollCalculationService calculationService;
    private final PayrollImportService importService;
    private final PayrollExportService exportService;
    
    // ... constructor injection
    
    @PostMapping("/import")
    public ResponseEntity<List<PayrollImportRow>> importPayrollData(
            @RequestParam("file") MultipartFile file) throws IOException {
        return ResponseEntity.ok(importService.importPayrollData(file));
    }
    
    @PostMapping("/process-month")
    public ResponseEntity<PayrollResultDTO> processMonthlyPayroll(
            @RequestParam int month, @RequestParam int year) {
        // Trigger payroll calculation for all employees
        PayrollResultDTO result = calculationService.processMonthlyPayroll(month, year);
        return ResponseEntity.ok(result);
    }
    
    @GetMapping("/export-slip/{employeeId}")
    public ResponseEntity<byte[]> exportSlip(
            @PathVariable Long employeeId,
            @RequestParam int month, @RequestParam int year) throws IOException {
        SalarySlipDTO slip = calculationService.getEmployeeSlip(employeeId, month, year);
        byte[] excelBytes = exportService.exportIndividualSlip(slip);
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
        headers.setContentDispositionFormData("attachment", "salary_slip.xlsx");
        
        return new ResponseEntity<>(excelBytes, headers, HttpStatus.OK);
    }
    
    @GetMapping("/generate-pdf")
    public ResponseEntity<byte[]> generateAllSlipsPDF(
            @RequestParam int month, @RequestParam int year) throws Exception {
        List<SalarySlipDTO> slips = calculationService.getAllSlips(month, year);
        byte[] pdfBytes = exportService.generateAllSlipsPDF(slips);
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("attachment", "all_salary_slips.pdf");
        
        return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);
    }
}
```

---

#### Step 6: Testing Strategy

**Unit Tests (Every Calculation Method):**
```java
@ExtendWith(MockitoExtension.class)
class PayrollCalculationServiceTest {
    
    @InjectMocks
    private PayrollCalculationService service;
    
    @Test
    void testGrossSalaryCalculation() {
        BigDecimal base = new BigDecimal("5000");
        BigDecimal allowances = new BigDecimal("1000");
        BigDecimal overtime = new BigDecimal("500");
        
        BigDecimal gross = service.calculateGrossSalary(base, allowances, overtime);
        
        assertEquals(new BigDecimal("6500"), gross);
    }
    
    @Test
    void testIncomeTax_Progressive() {
        // Test progressive tax brackets
        // TODO: Add based on actual tax rules from Python program
    }
    
    @Test
    void testNetSalaryCalculation() {
        BigDecimal gross = new BigDecimal("6500");
        BigDecimal deductions = new BigDecimal("500");
        BigDecimal taxes = new BigDecimal("800");
        
        BigDecimal net = service.calculateNetSalary(gross, deductions, taxes);
        
        assertEquals(new BigDecimal("5200"), net);
    }
}
```

**Integration Test (Python vs Java Comparison):**
```java
@Test
void testPayrollMatchesPythonProgram() {
    // Load test data from Excel (same data used in Python program)
    // Run through Java calculation service
    // Compare results with expected values from Python program
    // Assert all values match within ±0.01 tolerance (rounding differences)
    
    // TODO: Implement with actual test data
}
```

---

### 6.3 Migration Checklist

- [ ] Extract all formulas from Python program
- [ ] Document tax rules (brackets, rates, thresholds)
- [ ] Document deduction rules (insurance, advances, absences)
- [ ] Create `PayrollCalculationService.java`
- [ ] Create DTOs (`SalarySlipDTO`, `TaxRule`, `DeductionRule`)
- [ ] Implement `calculateGrossSalary()`
- [ ] Implement `calculateIncomeTax()` (progressive + flat)
- [ ] Implement `calculateSocialSecurity()`
- [ ] Implement `calculateTotalDeductions()`
- [ ] Implement `calculateNetSalary()`
- [ ] Add Apache POI dependency
- [ ] Add OpenPDF dependency
- [ ] Implement `PayrollImportService.java`
- [ ] Implement `PayrollExportService.java`
- [ ] Create `PayrollController.java` endpoints
- [ ] Write unit tests for all calculation methods
- [ ] Write integration test (Python vs Java comparison)
- [ ] Run 3–4 months of trial payroll
- [ ] Document any discrepancies and fix

---

## 7. Team Work Distribution

### Backend Developer (You)
- ✅ Payroll Logic migration (Python → Java)
- ✅ Excel Import / Export + PDF Generation
- ✅ Departments Entity + Migration
- ✅ RBAC Backend overhaul
- ✅ Soft Delete implementation
- ✅ Unit + Integration tests for payroll

### Frontend + Mobile Developer (Partner)
- ✅ New Payroll UI (Import button, processing status, slip export)
- ✅ Departments UI (department selector, department-scoped views)
- ✅ NFC Mobile implementation (Flutter)
- ✅ Integration Testing (End-to-end flows)
- ✅ Docker Compose optimization
- ✅ Frontend RBAC adjustments

---

## 8. Strict Rules During Phase 9

1. **🚫 No New Features:** Absolutely no new features outside this plan are allowed.
2. **🌿 Dedicated Branch:** All work must be on branch `phase-9-lockdown`.
3. **📅 Daily Commits:** Every team member must commit daily progress.
4. **🗣️ Daily Standup:** 10–15 minute meeting to review progress and blockers.
5. **✅ Weekly Review:** At the end of each week, review and test what was delivered.
6. **📝 Documentation Updates:** Update relevant docs as you go (don't batch at the end).
7. **🧪 Test Coverage:** Every new feature must have unit tests + integration tests.
8. **🔒 Code Review:** All PRs require review before merging to `phase-9-lockdown`.

---

## 9. Success Criteria

Phase 9 is considered **complete** when:

- [ ] Payroll system matches Python program results (100% accuracy)
- [ ] Leave management workflow is finalized and tested
- [ ] Departments system is operational with proper RBAC
- [ ] Multiple Managers / HRs / Payroll Officers supported
- [ ] Employee Soft Delete implemented with Audit Log
- [ ] NFC working on mobile + backend integration
- [ ] All tests passing (unit + integration + E2E)
- [ ] Docker Compose setup is stable and optimized
- [ ] Backup & Restore scripts functional
- [ ] Git tag `v1.0-stable` created
- [ ] All documentation updated
- [ ] Staging deployment successful
- [ ] UAT sign-off received

---

## 10. Risk Management

| Risk | Impact | Mitigation |
|------|--------|------------|
| Payroll calculation mismatches | High | Run extensive comparison tests; fix discrepancies immediately |
| RBAC changes break existing features | High | Comprehensive regression testing; feature flags if needed |
| NFC hardware compatibility | Medium | Decide on method early; test with actual devices |
| Scope creep | High | Enforce strict rules; defer new features to Phase 10 |
| Timeline slippage | Medium | Daily standups; weekly reviews; adjust scope if needed |
| Team member unavailability | Medium | Document everything; ensure knowledge sharing |

---

## Appendix: Quick Reference

### Branch Strategy
```
main (stable)
  └── phase-9-lockdown (active development)
         └── feature/payroll-calculation
         └── feature/departments-rbac
         └── feature/soft-delete
         └── feature/nfc-mobile
```

### Key Files to Modify

| Week | Files |
|------|-------|
| 1 | `PayrollCalculationService.java`, `PayrollImportService.java`, `PayrollExportService.java`, `PayrollController.java`, `pom.xml` |
| 2 | `LeaveRequestService.java`, `LeaveRequestController.java`, Leave dashboard components |
| 3 | `Department.java` (new), `Employee.java` (update), `SecurityConfig.java`, all repository queries |
| 4 | `Employee.java` (soft delete), NFC mobile files, `docker-compose.yml`, backup scripts |

### Useful Commands

```bash
# Create phase-9 branch
git checkout -b phase-9-lockdown main

# Run backend tests
cd backend && mvn test

# Run frontend build
cd frontend && npm run build

# Run Docker Compose
docker-compose up -d

# Create release tag
git tag -a v1.0-stable -m "HRMS PRO v1.0 Stable Release"
git push origin v1.0-stable
```

---

**Good luck with Phase 9! 🚀**

*This document should be treated as the single source of truth for Phase 9 scope. Any changes must be discussed and agreed upon by the team.*
