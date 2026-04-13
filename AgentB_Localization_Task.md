# Agent B: Specialized Features & Calendar Localization Task

**Agent:** Agent B (Frontend - Specialized Features & Calendar)  
**Date:** April 12, 2026  
**Status:** 🟡 IN PROGRESS  

## 🎯 Objective
Localize all hardcoded Arabic strings in specialized features and calendar components using React i18next.

## 📋 Target Files

### **Primary Files:**
1. **`NFCClock.tsx`** - Priority: Almost entirely Arabic terminal interface
2. **`LeaveCalendar.tsx`** - Calendar visualization with weekday arrays and legend indicators
3. **`LeaveBalanceReport.tsx`** - Reporting tools with filter labels and chart legends

### **Secondary Files (if time permits):**
- Any other specialized feature components with hardcoded Arabic

## 🛠️ Implementation Strategy

### **1. Pattern to Follow:**
```typescript
// BEFORE:
const status = "جهاز NFC متصل";

// AFTER:
const status = t('nfc.device.connected');

// In ar.json:
{
  "nfc": {
    "device": {
      "connected": "جهاز NFC متصل"
    }
  }
}

// In en.json:
{
  "nfc": {
    "device": {
      "connected": "NFC Device Connected"
    }
  }
}
```

### **2. Key Principles:**
- Use `t('key')` pattern consistently
- Group related strings under logical namespaces (e.g., `nfc.*`, `calendar.*`, `reports.*`)
- Append new translations to both `ar.json` and `en.json`
- Maintain existing JSON structure and indentation
- Test each component after localization

### **3. Common Patterns to Extract:**
- Button labels ("محاكاة", "إعادة تعيين", "تصدير")
- Status messages ("متصل", "غير متصل", "جارٍ المعالجة")
- Table headers ("التاريخ", "الحالة", "الإجراءات")
- Instructions ("انقر على تاريخ لطلب إجازة")
- Error messages ("فشل الاتصال بالجهاز")

## 📊 Work Breakdown

### **Phase 1: NFCClock.tsx (Highest Priority)**
**Estimated:** 2-3 hours
- Terminal interface strings
- Device status messages
- Simulation buttons and labels
- Connection status indicators
- Error/feedback messages

### **Phase 2: LeaveCalendar.tsx**
**Estimated:** 1-2 hours
- Weekday arrays (الأحد, الإثنين, etc.)
- Legend indicators ("معتمد", "قيد الانتظار", "مرفوض")
- Instruction text
- Month/year navigation labels
- Tooltip text

### **Phase 3: LeaveBalanceReport.tsx**
**Estimated:** 1-2 hours
- Filter labels ("الفترة", "القسم", "النوع")
- Export button text ("تصدير PDF", "تصدير Excel")
- Chart legend categories
- Table headers and data labels
- Empty state messages

### **Phase 4: Testing & Verification**
**Estimated:** 1 hour
- Run `npm run build` to check for errors
- Visual smoke test with language switching
- Verify no layout breakage with longer Arabic text
- Check console for missing translation keys

## 🔍 File Analysis Required

Before starting, I need to:
1. Examine each target file to identify all hardcoded Arabic strings
2. Plan the JSON key structure for each component
3. Check for existing translation keys that can be reused
4. Identify any dynamic strings that need special handling

## ✅ Success Criteria

- [ ] Zero hardcoded Arabic strings in target files (excluding JSON)
- [ ] All strings use `t('key')` pattern
- [ ] New translations added to both `ar.json` and `en.json`
- [ ] `npm run build` passes without errors
- [ ] Language switching works correctly in each component
- [ ] No layout breakage with translated text
- [ ] `grep -r "[\u0600-\u06FF]"` returns zero matches for target files

## 📝 Documentation

I will create:
1. **`AgentB_Localization_Walkthrough.md`** - Step-by-step implementation guide
2. **Translation key reference** - Mapping of all new keys created
3. **Testing report** - Results of build and visual tests

## 🚨 Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Long Arabic text breaks layout | Medium | Test with longest translations, adjust CSS if needed |
| Missing translation keys | Low | Use fallback to English, test language switching |
| Build errors from i18n syntax | Low | Run `npm run build` frequently, fix errors immediately |
| Inconsistent key naming | Medium | Follow established patterns, review with team |

## 🔗 Coordination Points

- **Start**: Confirm with Agents A and C that we're starting simultaneously
- **Mid-point**: Share progress and any reusable translation keys
- **Completion**: Run final `grep` sweep together to verify zero hardcoded Arabic

---

**Ready to begin Phase 1: NFCClock.tsx analysis and localization.**