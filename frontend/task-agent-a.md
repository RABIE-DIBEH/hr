# Agent A — Forms & Recruitment Localization

## Scope
- RecruitmentRequestForm.tsx
- AdvanceRequestForm.tsx
- LeaveRequestForm.tsx
- ProfileEditModal.tsx

## Changes Made

### RecruitmentRequestForm.tsx (12 fixes)
1. **Validation errors** (lines 97, 99): Replaced hardcoded Arabic with `t('forms.recruitment.validation.emailRequired')` and `t('forms.recruitment.validation.emailInvalid')`
2. **Success modal close button** (line 277): `إغلاق` → `t('common.close')`
3. **Marital status option values** (lines 427-430): Changed `value="أعزب"` → `value="single"`, etc. — display text already uses `t()`
4. **Military status option values** (lines 474-477): Changed `value="أدى الخدمة"` → `value="served"`, etc.
5. **Starting number placeholder** (line 646): `placeholder="مثال: 5000"` → `placeholder={t('forms.recruitment.placeholders.startingNumber')}`
6. **Submit button** (lines 757, 760): `جاري الإرسال...` → `t('forms.recruitment.processing')`, `'إرسال للموافقة'` → `t('forms.recruitment.submit')`

### AdvanceRequestForm.tsx
- Already clean — 0 hardcoded Arabic strings.

### LeaveRequestForm.tsx
- Already clean — 0 hardcoded Arabic strings.

### ProfileEditModal.tsx
- Already clean — 0 hardcoded Arabic strings.

### Translation Keys Added
- `forms.recruitment.placeholders.startingNumber` — "e.g. 5000" / "مثال: 5000"

### Bonus Fix
- `PayrollDashboard.tsx` line 52: Added missing `i18n` destructuring from `useTranslation()` to fix build error.

## Verification
- `npm run build` — ✅ passes
- `grep -cP '[\x{0600}-\x{06FF}]'` — 0 matches across all 4 files
- Option values now use stable English enum constants (`single`, `married`, `served`, `exempt`, etc.) for backend consistency
