-- Employee soft-delete + audit log (run after base schema + optional department migration)

ALTER TABLE Employees ADD COLUMN IF NOT EXISTS deleted BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE Employees ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

-- Existing terminated rows become soft-deleted for consistent filtering
UPDATE Employees
SET deleted = TRUE,
    deleted_at = COALESCE(created_at, CURRENT_TIMESTAMP)
WHERE UPPER(TRIM(status)) = 'TERMINATED';

CREATE TABLE IF NOT EXISTS employee_deletion_logs (
    id BIGSERIAL PRIMARY KEY,
    employee_id BIGINT NOT NULL,
    performed_by_employee_id BIGINT NOT NULL,
    reason VARCHAR(2000) NOT NULL,
    deleted_at TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_employee_deletion_logs_employee_id ON employee_deletion_logs (employee_id);
