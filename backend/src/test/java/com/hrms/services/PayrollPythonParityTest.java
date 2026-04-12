package com.hrms.services;

import com.hrms.api.dto.EmployeePayrollData;
import com.hrms.api.dto.PayrollResult;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.fail;

/**
 * Real parity validation against the accountant-maintained workbook.
 *
 * This test intentionally exercises the Java import + calculation path rather
 * than duplicating the formulas inside the test.
 */
class PayrollPythonParityTest {

    private static final BigDecimal TOLERANCE = new BigDecimal("1");

    private final PayrollExcelImportService importService = new PayrollExcelImportService();
    private final PayrollCalculationService calculationService = new PayrollCalculationService();

    @Test
    @DisplayName("Java net salary must match Python net salary within ±1 for all employees")
    void verifyParityWithRealInputMasterXlsx() throws Exception {
        List<EmployeePayrollData> rows = loadPayrollRows();
        List<String> failures = new ArrayList<>();
        int validatedCount = 0;

        for (int index = 0; index < rows.size(); index++) {
            EmployeePayrollData row = rows.get(index);
            if (shouldSkipRow(row)) {
                continue;
            }

            PayrollResult result = calculationService.calculate(row);
            BigDecimal expectedNet = truncate(row.netSalaryInput());
            BigDecimal actualNet = truncate(result.netSalary());
            BigDecimal diff = actualNet.subtract(expectedNet).abs();

            if (diff.compareTo(TOLERANCE) > 0) {
                failures.add(String.format(
                        "Row %d | Code=%s | Name=%s | Expected(net)=%s | Actual(net)=%s | Diff=%s",
                        index + 3,
                        row.employeeCode(),
                        row.employeeName(),
                        expectedNet,
                        actualNet,
                        diff
                ));
            }

            validatedCount++;
        }

        assertTrue(validatedCount >= 5,
                "Must validate at least 5 employee rows, but only validated " + validatedCount);

        if (!failures.isEmpty()) {
            fail(String.format(
                    "Parity validation failed: %d out of %d employees mismatched%n%s",
                    failures.size(),
                    validatedCount,
                    String.join(System.lineSeparator(), failures.subList(0, Math.min(20, failures.size())))
            ));
        }
    }

    @Test
    @DisplayName("First 5 employee rows must match Python net salary within ±1")
    void firstFiveEmployeesMatchPython() throws Exception {
        List<EmployeePayrollData> rows = loadPayrollRows();
        int matched = 0;

        for (int index = 0; index < rows.size() && matched < 5; index++) {
            EmployeePayrollData row = rows.get(index);
            if (shouldSkipRow(row)) {
                continue;
            }

            PayrollResult result = calculationService.calculate(row);
            BigDecimal expectedNet = truncate(row.netSalaryInput());
            BigDecimal actualNet = truncate(result.netSalary());
            BigDecimal diff = actualNet.subtract(expectedNet).abs();

            assertTrue(diff.compareTo(TOLERANCE) <= 0,
                    String.format(
                            "Row %d | Code=%s | Name=%s | Expected(net)=%s | Actual(net)=%s | Diff=%s",
                            index + 3,
                            row.employeeCode(),
                            row.employeeName(),
                            expectedNet,
                            actualNet,
                            diff
                    ));

            matched++;
        }

        assertTrue(matched >= 5,
                "Expected at least 5 valid employee rows, found " + matched);
    }

    private List<EmployeePayrollData> loadPayrollRows() throws Exception {
        Path projectRoot = Paths.get(System.getProperty("user.dir")).getParent();
        Path xlsxPath = projectRoot.resolve("payroll calculater").resolve("input-master.xlsx");
        assertTrue(xlsxPath.toFile().exists(), "input-master.xlsx must exist at: " + xlsxPath);
        return importService.importPayrollData(xlsxPath);
    }

    private boolean shouldSkipRow(EmployeePayrollData row) {
        return row.basicSalary().compareTo(BigDecimal.ZERO) == 0
                || row.netSalaryInput().compareTo(BigDecimal.ZERO) == 0;
    }

    private BigDecimal truncate(BigDecimal value) {
        return value.setScale(0, RoundingMode.DOWN);
    }
}
