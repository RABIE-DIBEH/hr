# Agent B: Specialized Features & Calendar Localization Walkthrough

**Agent:** Agent B (Frontend - Specialized Features & Calendar)  
**Date:** April 12, 2026  
**Status:** 🟡 IN PROGRESS - Phase 1: NFCClock.tsx

## Phase 1: NFCClock.tsx Localization

### File Analysis
The `NFCClock.tsx` file contains **24 hardcoded Arabic strings** that need to be localized. These include:

1. Terminal interface messages
2. Device status indicators  
3. Button labels
4. Modal dialog text
5. Placeholder text
6. Success/error messages

### Implementation Strategy

#### 1. Create NFC-specific namespace in translation files
I'll add a new `nfc` namespace to both `ar.json` and `en.json` with the following structure:
```json
"nfc": {
  "clock": {
    "title": "نظام الحضور الذكي",
    "branch": "فرع المركز الرئيسي",
    "connected": "متصل",
    "defaultMessage": "اقرب بطاقة NFC من القارئ",
    "verifying": "جاري التحقق من الهوية...",
    "registeredSuccessfully": "تم التسجيل بنجاح",
    "serverError": "خطأ في الاتصال بالخادم",
    "reading": "جاري القراءة...",
    "simulateButton": "محاكاة تمرير البطاقة (TEST-NFC-UID-0001)",
    "assignCardButton": "ربط بطاقة NFC بموظف",
    "deviceId": "معرّف الجهاز: NFC-TERMINAL-01"
  },
  "assignModal": {
    "title": "ربط بطاقة NFC",
    "searchEmployee": "البحث عن موظف",
    "searchPlaceholder": "اكتب الاسم أو البريد...",
    "cardUidLabel": "معرف البطاقة (UID)",
    "cardUidPlaceholder": "مثال: 04:23:1A:FF",
    "assignButton": "ربط البطاقة",
    "assigning": "جارِ الربط...",
    "assignSuccess": "تم ربط البطاقة بـ {{name}}",
    "done": "تم",
    "retry": "إعادة المحاولة"
  }
}
```

#### 2. Update NFCClock.tsx to use translations
I'll replace all hardcoded Arabic strings with `t('nfc.key')` calls.

#### 3. Test the implementation
- Run `npm run build` to check for errors
- Test language switching in the browser
- Verify all strings are properly translated

### Step-by-Step Process

**Step 1: Add translations to ar.json and en.json**
- Append new `nfc` namespace to both files
- Ensure consistent structure between Arabic and English

**Step 2: Update NFCClock.tsx**
- Import `useTranslation` hook
- Replace each hardcoded string with `t()` call
- Handle dynamic strings with template variables (e.g., `{{name}}`)

**Step 3: Test and verify**
- Build test
- Visual test with language switching
- Console error check

### Key Challenges
1. **Dynamic strings**: Some messages include employee names (`{{name}}`)
2. **Modal state messages**: Different messages based on success/error state
3. **Button states**: Loading states need separate translations
4. **Placeholder text**: Form field placeholders need translation

### Success Criteria for Phase 1
- [ ] All 24 Arabic strings in NFCClock.tsx replaced with `t()` calls
- [ ] New `nfc` namespace added to both translation files
- [ ] `npm run build` passes without errors
- [ ] Language switching works correctly
- [ ] No console errors for missing translation keys

---

## Phase 2: LeaveCalendar.tsx (Next)

### File Analysis
The `LeaveCalendar.tsx` file contains:
- Weekday arrays (الأحد, الإثنين, etc.)
- Legend indicators ("معتمد", "قيد الانتظار", "مرفوض")
- Instruction text
- Month/year navigation labels
- Tooltip text
- Modal dialog text

### Planned Namespace Structure
```json
"leaveCalendar": {
  "title": "تقويم الإجازات والغياب",
  "subtitle": {
    "highRole": "عرض مرئي لجميع الإجازات المعتمدة والمعلقة للقسم",
    "employee": "عرض مرئي لجميع طلبات الإجازة الخاصة بي"
  },
  "weekDays": ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"],
  "legend": {
    "approved": "إجازة معتمدة (Approved)",
    "pending": "طلب معلق (Pending Review)",
    "holiday": "العطلات الرسمية تظهر باللون الداكن"
  },
  "moreOthers": "+ {{count}} آخرون",
  "dayModal": {
    "title": "إجازات يوم {{day}} {{month}}",
    "subtitle": "قائمة الموظفين غير المتواجدين في هذا اليوم",
    "noLeaves": "لا توجد إجازات مسجلة لهذا اليوم",
    "allPresent": "الجميع حاضرون!",
    "close": "إغلاق"
  },
  "export": {
    "pdf": "PDF",
    "excel": "Excel",
    "downloading": "..."
  }
}
```

---

## Phase 3: LeaveBalanceReport.tsx (Final)

### File Analysis
The `LeaveBalanceReport.tsx` file contains:
- Filter labels ("كل الأقسام")
- Export button text ("تصدير تقرير")
- Chart legend categories
- Table headers
- Empty state messages

### Planned Namespace Structure
```json
"leaveBalanceReport": {
  "title": "تقرير أرصدة الإجازات",
  "subtitle": "متابعة الأيام المتبقية والمستخدمة لكل موظف",
  "exportButton": "تصدير تقرير",
  "allDepartments": "كل الأقسام",
  "legend": {
    "normal": "رصيد طبيعي (أكبر من 5 أيام)",
    "critical": "رصيد حرج (أقل من 5 أيام)"
  },
  "table": {
    "name": "الموظف",
    "dept": "القسم",
    "balance": "الرصيد المتبقي",
    "status": "الحالة"
  }
}
```

---

## Testing Plan

### Automated Tests
1. **Build test**: `npm run build` after each phase
2. **TypeScript check**: `npx tsc --noEmit` for type errors
3. **Lint check**: `npm run lint` for code quality

### Manual Tests
1. **Language switching**: Test each component in both Arabic and English
2. **Layout verification**: Ensure no layout breakage with translated text
3. **Console check**: No missing translation key warnings
4. **Functionality test**: All interactive elements still work

### Final Verification
1. **grep sweep**: `grep -r "[\u0600-\u06FF]" frontend/src --include="*.tsx" --include="*.ts"`
2. **Visual inspection**: Review each localized component
3. **Cross-browser test**: Check in Chrome, Firefox, Safari

---

## Progress Tracking

### Phase 1: NFCClock.tsx
- [ ] Analyze file and identify all strings
- [ ] Create translation keys in JSON files
- [ ] Update component with `t()` calls
- [ ] Test and verify

### Phase 2: LeaveCalendar.tsx  
- [ ] Analyze file and identify all strings
- [ ] Create translation keys in JSON files
- [ ] Update component with `t()` calls
- [ ] Test and verify

### Phase 3: LeaveBalanceReport.tsx
- [ ] Analyze file and identify all strings
- [ ] Create translation keys in JSON files
- [ ] Update component with `t()` calls
- [ ] Test and verify

### Final Phase: Testing & Verification
- [ ] Run full build test
- [ ] Perform visual smoke test
- [ ] Execute grep sweep for remaining Arabic
- [ ] Document completion

---

**Next Step**: Begin Phase 1 implementation for NFCClock.tsx