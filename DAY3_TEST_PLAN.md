# Day 3 Test Plan - Employee Form Department Selector Testing
**Date:** April 10, 2026  
**Agent:** Agent B (Frontend)  
**Phase:** Department System Integration - Day 3

## Test Objectives
1. Test UserManagement page department dropdown functionality
2. Test employee department assignment via UI
3. Test new employee creation through recruitment system
4. Verify department changes reflect in dashboards

## Test Environment
- Backend: Running on http://localhost:8080
- Frontend: Running on http://localhost:5173
- Database: PostgreSQL with departments migration applied

## Test Cases

### Test 1: UserManagement Page - Department Dropdown

#### 1.1 Login as ADMIN
- **Action:** Login as ADMIN user (`admin@hrms.com` / `ADMIN@1234`)
- **Expected:** Access to `/users` page
- **Result:** 

#### 1.2 Navigate to UserManagement
- **Action:** Go to `/users` page
- **Expected:** Employee list displayed with department column
- **Result:** 

#### 1.3 Edit Employee - Department Dropdown
- **Action:** Click edit on any employee
- **Expected:** Edit modal opens with department dropdown showing all 6 departments
- **Result:** 

#### 1.4 Change Department
- **Action:** Select different department from dropdown and save
- **Expected:** Employee department updated successfully
- **Result:** 

#### 1.5 Verify Department Change in Table
- **Action:** Check employee list after update
- **Expected:** Department column shows updated department name
- **Result:** 

### Test 2: Employee Department Assignment Verification

#### 2.1 Verify Dashboard Header Update
- **Action:** Login as the updated employee
- **Expected:** Dashboard header shows new department name
- **Result:** 

#### 2.2 Verify Manager Scoping
- **Action:** Login as manager of the new department
- **Expected:** Employee appears in manager's team list
- **Result:** 

#### 2.3 Verify Old Manager Scoping
- **Action:** Login as manager of old department
- **Expected:** Employee no longer appears in old manager's team list
- **Result:** 

### Test 3: Recruitment Request Form - Department Field

#### 3.1 Login as HR
- **Action:** Login as HR user (`hr@hrms.com`)
- **Expected:** Access to HR dashboard
- **Result:** 

#### 3.2 Open Recruitment Request Form
- **Action:** Click "طلب توظيف جديد" button
- **Expected:** Recruitment form opens
- **Result:** 

#### 3.3 Test Department Field
- **Action:** Check department field type
- **Expected:** Should be dropdown with department list (currently text input)
- **Result:** 

#### 3.4 Submit Recruitment Request
- **Action:** Fill form with valid data and submit
- **Expected:** Request submitted successfully
- **Result:** 

### Test 4: Error Handling and Edge Cases

#### 4.1 Empty Department Selection
- **Action:** Try to save employee with no department selected
- **Expected:** Should allow null department (or show validation error)
- **Result:** 

#### 4.2 Invalid Department ID
- **Action:** Try to save with invalid department ID (via API)
- **Expected:** Appropriate error message
- **Result:** 

#### 4.3 Department with Employees - Delete Attempt
- **Action:** Try to delete department with assigned employees
- **Expected:** Error message preventing deletion
- **Result:** 

## Issues to Investigate

### Issue 1: RecruitmentRequestForm Department Field
- **Current:** Text input field
- **Expected:** Dropdown with department list from `getAllDepartments()`
- **Priority:** Medium - affects data consistency

### Issue 2: Department Validation
- **Check:** Backend validation for department existence
- **Expected:** 400 error for non-existent department ID
- **Priority:** High - data integrity

### Issue 3: Department Display Consistency
- **Check:** All dashboards show department name correctly
- **Expected:** Consistent department display across all pages
- **Priority:** Medium - UI consistency

## Success Criteria
- [ ] UserManagement department dropdown works correctly
- [ ] Employee department assignment persists
- [ ] Department changes reflect in dashboards
- [ ] Manager scoping works correctly after department change
- [ ] Recruitment form department field is functional
- [ ] Error handling for invalid department IDs

## Notes
- RecruitmentRequestForm currently uses text input for department, not dropdown
- Need to verify backend validation for department IDs
- Test manager scoping after department changes