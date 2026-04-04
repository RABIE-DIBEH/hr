# Example Agent Prompts - HRMS Workspace

These prompts demonstrate how to leverage AGENTS.md and the updated workspace instructions effectively.

## 1. When Adding a New API Endpoint

**Prompt:**
```
I need to add a new endpoint POST /api/payroll/process-month-end.
This endpoint should accept MonthEndRequest with fields: month, year, includeBonus.
Follow the HRMS backend patterns from AGENTS.md.
Create the DTO with validation, service method with @Transactional, and controller endpoint.
Reference PayrollService.java and LoginRequest.java as exemplars.
```

**Agent will**:
1. Look up PayrollService exemplar in AGENTS.md
2. Create MonthEndRequest DTO with @Valid annotations (following LoginRequest pattern)
3. Add @Transactional method in PayrollService
4. Add endpoint in PayrollController that returns ResponseEntity<ApiResponse<T>>

---

## 2. When Fixing a Security Issue

**Prompt:**
```
The RecruitmentRequestController currently accepts Map<String, Object> requests.
This bypasses validation and is type-unsafe.
Follow AGENTS.md frontend/backend validation strategy and DTO pattern.
1. Create RecruitmentRequestDto with proper @Valid annotations
2. Update RecruitmentRequestController to use the new DTO
3. Ensure responses use ApiResponse<T> wrapper
Reference: LoginRequest.java, GlobalExceptionHandler.java
```

**Agent will**:
1. Create typed DTO with validation (LoginRequest is the exemplar)
2. Update controller to use @Valid @RequestBody RecruitmentRequestDto
3. Wrap responses in ApiResponse<T> format

---

## 3. When Implementing a Frontend Feature

**Prompt:**
```
I need to add a new form component AdvancedLeaveFilter for the AttendanceLogs page.
It should fetch filtered leave records and display them.
Follow AGENTS.md frontend patterns:
- Use Sidebar.tsx role-based filtering as exemplar
- API calls from api.ts (with interceptors already configured)
- Error handling following LeaveRequestForm.tsx pattern
- Use ProtectedRoute.tsx for access control if needed
Include proper TypeScript interfaces for API payloads (no any types).
```

**Agent will**:
1. Reference Sidebar.tsx and LeaveRequestForm.tsx patterns
2. Add API call to api.ts with proper TypeScript interfaces
3. Handle errors consistently with other forms
4. Ensure role-based access using ProtectedRoute/Sidebar pattern

---

## 4. When Fixing a Bug

**Prompt:**
```
AuthService.java logs with System.out.println() which isn't suitable for production.
The AGENTS.md roadmap says to use SLF4J logging.
Replace all System.out.println() calls with proper SLF4J logging.
Keep ERROR logs for failures, INFO for important state changes, DEBUG for flow.
Reference: AGENTS.md "Logging Pattern" section.
```

**Agent will**:
1. Add SLF4J logger field to AuthService
2. Replace println with log.debug/info/error calls at appropriate levels

---

## 5. When Auditing Endpoint Compliance

**Prompt:**
```
Audit all endpoints in RecruitmentRequestController against AGENTS.md patterns.
Check for:
1. Use of ResponseEntity<T> return type ✅
2. @Valid on @RequestBody parameters
3. Consistent error handling via GlobalExceptionHandler
4. Response wrapped in ApiResponse<T> format
5. Services use @Transactional on write operations
Report which patterns are missing and fix them.
```

**Agent will**:
1. Review controller against pattern checklist
2. Identify gaps vs exemplar files (LoginRequest, EmployeeController, etc.)
3. Implement fixes to match documented patterns

---

## 6. When Database Query Needs Optimization

**Prompt:**
```
The EmployeeService.findAllEmployees() returns full employee list causing N+1 queries.
According to AGENTS.md "Repositories" section:
- Use @ManyToOne(fetch=FetchType.LAZY) to avoid eager loading
- Use @Query for complex queries that need joins
- Add pagination support per "Pagination Strategy"
Review Employee.java entity relationships and fix the query.
Add pagination to the endpoint: GET /api/employees?page=0&pageSize=50
Reference: AGENTS.md roadmap item #5 (Pagination Pattern).
```

**Agent will**:
1. Check Employee.java foreign key relationships
2. Create custom @Query if needed to prevent N+1
3. Implement PageRequest/PaginatedResponse pattern
4. Update endpoint to accept/return paginated data

---

## 7. When Adding Error Handling

**Prompt:**
```
The LeaveController needs better error handling for invalid leave type requests.
According to AGENTS.md error handling section:
- Use @ControllerAdvice (GlobalExceptionHandler already exists)
- Throw ResponseStatusException with specific HTTP status
- Responses should use ApiResponse<T> format
Create a custom exception or use ResponseStatusException.
Ensure it integrates with GlobalExceptionHandler correctly.
Reference: GlobalExceptionHandler.java exemplar.
```

**Agent will**:
1. Create custom exception or use ResponseStatusException
2. Ensure GlobalExceptionHandler catches it
3. Return ApiResponse<T> formatted error

---

## 8. When Following Role-Based Access Pattern

**Prompt:**
```
The AdminController needs role-based access control.
According to AGENTS.md "Security & Authentication":
- Pattern: @AuthenticationPrincipal EmployeeUserDetails principal
- Use hasAnyRole(principal, "ROLE_ADMIN") helper
- SecurityConfig.java should enforce via @ControllerAdvice (roadmap item #4)
Implement role checks following EmployeeController.java pattern.
Ensure SUPER_ADMIN can access all admin endpoints.
```

**Agent will**:
1. Reference EmployeeController for role-checking pattern
2. Add role guards to AdminController methods
3. Ensure SUPER_ADMIN exception is handled

---

## 9. When Creating TypeScript Types

**Prompt:**
```
I need to add TypeScript interfaces for a new API endpoint response.
According to AGENTS.md frontend patterns:
- Define interfaces for all API payloads in api.ts
- Use strict TypeScript (tsconfig.app.json)
- Avoid any type - use proper typing for error handling
The endpoint returns: { id, name, department, joinDate, status }
Create proper interfaces and add to api.ts exemplar.
```

**Agent will**:
1. Reference api.ts for interface structure
2. Create strongly typed EmployeeDTO interface
3. Update API function to return this type
4. Ensure no `any` types in catch blocks

---

## 10. When Starting a Large Refactor

**Prompt:**
```
The RequestBody Map usage in getRecruitmentRequests() is a code smell.
According to AGENTS.md "Known Inconsistencies & Gaps":
- Map<String, Object> is type-unsafe
- Validation is bypassed
- Solution: Create RecruitmentRequestDto and migrate endpoints

Create a plan to:
1. Define RecruitmentRequestDto with @Valid annotations (exemplar: LoginRequest)
2. Update RecruitmentRequestController to use new DTO
3. Ensure GlobalExceptionHandler handles validation errors
4. Wrap responses in ApiResponse<T>
5. Write this as a reproducible pattern for AdvanceRequestDto next
Reference files: LoginRequest.java, GlobalExceptionHandler.java, EmployeeController.java
```

**Agent will**:
1. Break down the refactor into manageable steps
2. Use exemplar files as templates
3. Ensure pattern consistency for future DTOs

---

## Tips for Prompting Agents

### ✅ Good Prompts
- Reference specific exemplar files from AGENTS.md: "Following LoginRequest.java pattern"
- Quote the pattern name: "Use the Validation Strategy section"
- Mention why the change is needed: "Type safety + validation bypass prevention"
- Ask agent to check patterns: "Audit against AGENTS.md compliance"

### ❌ Avoid
- "Just add validation" (agent won't know the pattern)
- No specific file references
- Asking to "do whatever is best" (provide direction from AGENTS.md)
- Ignoring existing exemplars

### 📋 Template Prompt
```
Task: [What to implement]

Context: [Why this matters - reference AGENTS.md section]

Pattern Reference: [Exemplar files to follow]
- Template: backend/src/main/java/com/hrms/api/dto/LoginRequest.java
- Reference: backend/src/main/java/com/hrms/services/AuthService.java

Constraints: [What NOT to do]
- ❌ Don't use Map<String, Object>
- ❌ Don't skip @Valid annotations

Success Criteria: [How to know when done]
- ✅ @Valid annotations present
- ✅ GlobalExceptionHandler integration verified
- ✅ Responses match ApiResponse<T> format
```

---

## How AGENTS.md Powers These Prompts

Each prompt leverages three sections:
1. **"Actual Working Patterns"** → Find exemplar files (LoginRequest, AuthService, etc.)
2. **"Key Patterns to Follow"** → Understand step-by-step workflows
3. **"Known Inconsistencies & Gaps"** → Know what needs fixing and priority
