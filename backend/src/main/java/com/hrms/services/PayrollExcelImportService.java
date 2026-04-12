package com.hrms.services;

import com.hrms.api.dto.EmployeePayrollData;
import org.apache.poi.ss.usermodel.*;
import org.springframework.stereotype.Service;

import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

/**
 * Reads the input-master.xlsx payroll file and returns a list of
 * {@link EmployeePayrollData} records, one per valid employee row.
 *
 * Mirrors the Python program's row-skipping logic:
 * <ul>
 *   <li>Data starts at row 3 (1-indexed), i.e. row index 2 in POI</li>
 *   <li>Rows with empty employee_name or header-like names are skipped</li>
 *   <li>Fully blank rows are skipped</li>
 * </ul>
 *
 * All numeric inputs are truncated toward zero (equivalent to Python's
 * {@code int(float(value))}).
 */
@Service
public class PayrollExcelImportService {

    /**
     * Names that indicate a header row rather than a real employee.
     */
    private static final Set<String> HEADER_NAMES = Set.of(
            "اسم الموظف", "Name", "Employee Name"
    );

    /**
     * Reads the payroll Excel file from the given path and returns all
     * valid employee records.
     *
     * @param filePath absolute path to the input Excel file
     * @return list of extracted employee payroll data
     * @throws IOException if the file cannot be read
     */
    public List<EmployeePayrollData> importPayrollData(Path filePath) throws IOException {
        try (FileInputStream fis = new FileInputStream(filePath.toFile())) {
            return importPayrollData(fis);
        }
    }

    /**
     * Reads the payroll Excel file from an InputStream.
     *
     * @param inputStream the Excel file content
     * @return list of extracted employee payroll data
     * @throws IOException if the stream cannot be read
     */
    public List<EmployeePayrollData> importPayrollData(InputStream inputStream) throws IOException {
        List<EmployeePayrollData> result = new ArrayList<>();

        try (Workbook workbook = WorkbookFactory.create(inputStream)) {
            Sheet sheet = workbook.getSheetAt(0);

            // Python: range(3, sheet.max_row + 1) => 1-indexed rows 3+
            // POI is 0-indexed, so start at row index 2
            int firstDataRow = 2;

            for (int i = firstDataRow; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null || isBlankRow(row)) {
                    continue;
                }

                EmployeePayrollData data = parseRow(row);
                if (data != null) {
                    result.add(data);
                }
            }
        }

        return result;
    }

    /**
     * Parses a single row into an EmployeePayrollData record.
     * Returns null if the row should be skipped (header, empty name, etc.).
     */
    private EmployeePayrollData parseRow(Row row) {
        String employeeCode = getCellStringValue(row, 0);
        String employeeName = getCellStringValue(row, 1);
        String jobTitle = getCellStringValue(row, 2);

        // Skip rows with empty or header-like employee names
        if (employeeName == null || employeeName.isBlank()
                || HEADER_NAMES.contains(employeeName.trim())) {
            return null;
        }

        // All monetary amounts: truncate toward zero like Python's int(float(x))
        BigDecimal basicSalary = getCellTruncatedBigDecimal(row, 3);
        int totalVacation = getCellTruncatedInt(row, 6);
        int usedVacation = getCellTruncatedInt(row, 7);
        int remainingVacation = getCellTruncatedInt(row, 8);
        int deductionHour = getCellTruncatedInt(row, 9);
        int deductionDay = getCellTruncatedInt(row, 10);
        int absenceDeduction = getCellTruncatedInt(row, 11);
        BigDecimal adminDeduction = getCellTruncatedBigDecimal(row, 12);
        BigDecimal advanceDeduction = getCellTruncatedBigDecimal(row, 13);
        BigDecimal totalDeductionsInput = getCellTruncatedBigDecimal(row, 14);
        int additionalHours = getCellTruncatedInt(row, 15);
        int additionalDays = getCellTruncatedInt(row, 16);
        BigDecimal bonuses = getCellTruncatedBigDecimal(row, 17);
        BigDecimal transportation = getCellTruncatedBigDecimal(row, 18);
        BigDecimal punctualityBonus = getCellTruncatedBigDecimal(row, 19);
        BigDecimal totalAdditionsInput = getCellTruncatedBigDecimal(row, 20);
        BigDecimal netSalaryInput = getCellTruncatedBigDecimal(row, 21);

        return new EmployeePayrollData(
                employeeCode,
                employeeName,
                jobTitle,
                basicSalary,
                totalVacation,
                usedVacation,
                remainingVacation,
                deductionHour,
                deductionDay,
                absenceDeduction,
                adminDeduction,
                advanceDeduction,
                totalDeductionsInput,
                additionalHours,
                additionalDays,
                bonuses,
                transportation,
                punctualityBonus,
                totalAdditionsInput,
                netSalaryInput
        );
    }

    /**
     * Checks whether every cell in the row is null or blank.
     */
    private boolean isBlankRow(Row row) {
        for (int i = 0; i <= 21; i++) {
            Cell cell = row.getCell(i, Row.MissingCellPolicy.RETURN_BLANK_AS_NULL);
            if (cell != null && !isCellBlank(cell)) {
                return false;
            }
        }
        return true;
    }

    private boolean isCellBlank(Cell cell) {
        return switch (cell.getCellType()) {
            case BLANK -> true;
            case STRING -> cell.getStringCellValue().isBlank();
            case NUMERIC -> false;
            case FORMULA -> {
                try {
                    cell.getStringCellValue();
                    yield cell.getStringCellValue().isBlank();
                } catch (Exception e) {
                    yield false;
                }
            }
            default -> false;
        };
    }

    /**
     * Gets a cell value as a String. Returns null for blank cells.
     */
    private String getCellStringValue(Row row, int colIndex) {
        Cell cell = row.getCell(colIndex, Row.MissingCellPolicy.RETURN_BLANK_AS_NULL);
        if (cell == null) {
            return null;
        }
        return switch (cell.getCellType()) {
            case STRING -> {
                String s = cell.getStringCellValue();
                yield s.isBlank() ? null : s;
            }
            case NUMERIC -> {
                double v = cell.getNumericCellValue();
                // If it's a whole number, format without decimal point
                if (v == Math.floor(v) && !Double.isInfinite(v)) {
                    yield String.valueOf((long) v);
                }
                yield String.valueOf(v);
            }
            case FORMULA -> {
                try {
                    yield cell.getStringCellValue();
                } catch (Exception e) {
                    double v = cell.getNumericCellValue();
                    if (v == Math.floor(v) && !Double.isInfinite(v)) {
                        yield String.valueOf((long) v);
                    }
                    yield String.valueOf(v);
                }
            }
            default -> null;
        };
    }

    /**
     * Reads a numeric cell value and truncates it toward zero, matching
     * Python's {@code int(float(value))} behaviour.
     * Returns 0 for blank or invalid cells.
     */
    private int getCellTruncatedInt(Row row, int colIndex) {
        Cell cell = row.getCell(colIndex, Row.MissingCellPolicy.RETURN_BLANK_AS_NULL);
        if (cell == null || cell.getCellType() == CellType.BLANK) {
            return 0;
        }
        try {
            double value = cell.getNumericCellValue();
            // Truncate toward zero (like Python int(float(x)))
            if (value >= 0) {
                return (int) Math.floor(value);
            } else {
                return (int) Math.ceil(value);
            }
        } catch (Exception e) {
            return 0;
        }
    }

    /**
     * Reads a numeric cell value and converts to BigDecimal truncated
     * toward zero (scale 0), matching Python's {@code int(float(value))}.
     * Returns BigDecimal.ZERO for blank or invalid cells.
     */
    private BigDecimal getCellTruncatedBigDecimal(Row row, int colIndex) {
        Cell cell = row.getCell(colIndex, Row.MissingCellPolicy.RETURN_BLANK_AS_NULL);
        if (cell == null || cell.getCellType() == CellType.BLANK) {
            return BigDecimal.ZERO;
        }
        try {
            double value = cell.getNumericCellValue();
            return BigDecimal.valueOf(value)
                    .setScale(0, RoundingMode.DOWN);
        } catch (Exception e) {
            return BigDecimal.ZERO;
        }
    }
}
