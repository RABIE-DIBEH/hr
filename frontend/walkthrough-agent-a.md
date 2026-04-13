# Agent A — Walkthrough: Forms & Recruitment Localization

## How to Verify

### 1. Arabic Language Check
1. Open the app, switch to Arabic (ar)
2. Open the Recruitment Request form (from any dashboard)
3. Verify:
   - All labels, placeholders, and buttons show Arabic text
   - Validation errors (leave email empty → submit) show Arabic messages
   - Marital/Military dropdowns show Arabic options
   - Submit button shows "إرسال للموافقة"
   - Loading state shows "جاري الإرسال..."
   - Success modal shows "إغلاق" for close button

### 2. English Language Check
1. Switch to English (en)
2. Open the same form
3. Verify all text above shows English equivalents

### 3. Backend Compatibility
- Marital status values submitted: `single`, `married`, `divorced`, `widowed` (was Arabic text)
- Military status values submitted: `served`, `exempt`, `excluded`, `notServed` (was Arabic text)
- Backend stores these as raw VARCHAR — no migration needed
- Existing DB records with Arabic values will still display (they're just strings)
- New records will use English enum constants

### 4. Build Verification
```bash
cd frontend && npm run build
```
Should pass with no errors.

## Key Design Decision
Option `value` attributes changed from Arabic to English constants. This ensures:
- Backend receives stable, language-independent values
- Display is fully localized via `t()` calls
- Future language additions won't require backend changes
- Database queries/filters on these fields are language-agnostic
