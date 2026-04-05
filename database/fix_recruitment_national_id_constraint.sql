-- Drop the UNIQUE constraint on national_id in Recruitment_Requests
-- This allows re-submitting a rejected request with the same national ID
-- The service-level check (existsActiveByNationalId) still prevents active duplicates

ALTER TABLE Recruitment_Requests DROP CONSTRAINT IF EXISTS uk_c6dxvb88wnh1ca30u5tayflfx;
