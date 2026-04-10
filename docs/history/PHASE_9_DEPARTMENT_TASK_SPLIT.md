# Phase 9 — Department System Implementation
## Day Task Split: Agent A (Backend) + Agent B (Frontend)

**Date:** April 8, 2026
**Phase:** Phase 9 — Week 3 (Departments + RBAC Overhaul)
**Branch:** `phase-9-lockdown` → merged to `main`
**Status:** 🟢 COMPLETE — April 9, 2026

---

## 🎯 Today's Objective

Build the **Department System** end-to-end:
1. Create `Department` entity + DB migration
2. Link employees + managers to departments
3. Implement department-scoped RBAC (Manager sees only their dept)
4. Build Department Management UI (CRUD + assignment)
5. Update all affected services, queries, and frontend views

---

## 📋 Agent A — Backend (You)

### Task 1: Database + Entity Layer (≈1.5h)

#### 1a. Create `Department` Entity
**File:** `backend/src/main/java/com/hrms/core/models/Department.java`

```java
package com.hrms.core.models;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "Departments")
public class Department {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long departmentId;

    @Column(nullable = false, unique = true)
    private String departmentName;

    @Column(unique = true)
    private String departmentCode; // e.g., "ENG", "HR", "FIN"

    private Long managerId; // FK → Employee (department head)

    private String description;

    private LocalDateTime createdAt;

    // Constructors
    public Department() {}

    // Getters + Setters
    public Long getDepartmentId() { return departmentId; }
    public void setDepartmentId(Long id) { this.departmentId = id; }

    public String getDepartmentName() { return departmentName; }
    public void setDepartmentName(String name) { this.departmentName = name; }

    public String getDepartmentCode() { return departmentCode; }
    public void setDepartmentCode(String code) { this.departmentCode = code; }

    public Long getManagerId() { return managerId; }
    public void setManagerId(Long id) { this.managerId = id; }

    public String getDescription() { return description; }
    public void setDescription(String desc) { this.description = desc; }

    public LocalDateTime getCreatedAt() { return createdAt; }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
```

#### 1b. Update `Employee` Entity — Add `departmentId`
**File:** `backend/src/main/java/com/hrms/core/models/Employee.java`

Add this field below `teamId`:
```java
@Column(name = "department_id")
private Long departmentId;
```

Update the all-args constructor to include `departmentId`.  
Update the builder inner class to add `departmentId(Long)` method.

#### 1c. Create `DepartmentRepository`
**File:** `backend/src/main/java/com/hrms/core/repositories/DepartmentRepository.java`

```java
package com.hrms.core.repositories;

import com.hrms.core.models.Department;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface DepartmentRepository extends JpaRepository<Department, Long> {
    Optional<Department> findByDepartmentName(String name);
    Optional<Department> findByDepartmentCode(String code);
    List<Department> findByManagerId(Long managerId);
    
    @Query("SELECT d FROM Department d LEFT JOIN FETCH Employee e ON d.managerId = e.employeeId WHERE d.departmentId = :id")
    Optional<Department> findByIdWithManager(@Param("id") Long id);
    
    @Query("SELECT d FROM Department d ORDER BY d.departmentName")
    List<Department> findAllOrderedByName();
}
```

---

### Task 2: Database Migration Script (≈30min)

**File:** `database/add_departments_schema.sql`

```sql
-- 1. Create Departments table
CREATE TABLE Departments (
    department_id SERIAL PRIMARY KEY,
    department_name VARCHAR(100) UNIQUE NOT NULL,
    department_code VARCHAR(20) UNIQUE,
    manager_id INT REFERENCES Employees(employee_id),
    description VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Add department_id to Employees
ALTER TABLE Employees ADD COLUMN department_id INT REFERENCES Departments(department_id);

-- 3. Seed default departments
INSERT INTO Departments (department_name, department_code, description) VALUES
    ('Engineering', 'ENG', 'Software development and technical operations'),
    ('Human Resources', 'HR', 'People operations and talent management'),
    ('Finance', 'FIN', 'Financial planning and accounting'),
    ('Marketing', 'MKT', 'Brand, communications and growth'),
    ('Operations', 'OPS', 'Infrastructure and support operations'),
    ('General', 'GEN', 'Default department for existing employees');

-- 4. Assign all existing employees to "General" department
UPDATE Employees SET department_id = (SELECT department_id FROM Departments WHERE department_code = 'GEN')
WHERE department_id IS NULL;
```

Run this migration:
```bash
psql -U postgres -d hrms_db -f database/add_departments_schema.sql
```

---

### Task 3: Service Layer (≈2h)

#### 3a. Create `DepartmentService`
**File:** `backend/src/main/java/com/hrms/services/DepartmentService.java`

```java
package com.hrms.services;

import com.hrms.core.models.Department;
import com.hrms.core.repositories.DepartmentRepository;
import com.hrms.core.repositories.EmployeeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class DepartmentService {
    
    private final DepartmentRepository departmentRepository;
    private final EmployeeRepository employeeRepository;
    
    public DepartmentService(DepartmentRepository departmentRepository,
                             EmployeeRepository employeeRepository) {
        this.departmentRepository = departmentRepository;
        this.employeeRepository = employeeRepository;
    }
    
    public List<Department> getAllDepartments() {
        return departmentRepository.findAllOrderedByName();
    }
    
    public Optional<Department> getDepartmentById(Long id) {
        return departmentRepository.findById(id);
    }
    
    @Transactional
    public Department createDepartment(Department department) {
        return departmentRepository.save(department);
    }
    
    @Transactional
    public Department updateDepartment(Long id, Department updates) {
        Department dept = departmentRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Department not found: " + id));
        
        if (updates.getDepartmentName() != null) {
            dept.setDepartmentName(updates.getDepartmentName());
        }
        if (updates.getDepartmentCode() != null) {
            dept.setDepartmentCode(updates.getDepartmentCode());
        }
        if (updates.getManagerId() != null) {
            dept.setManagerId(updates.getManagerId());
        }
        if (updates.getDescription() != null) {
            dept.setDescription(updates.getDescription());
        }
        
        return departmentRepository.save(dept);
    }
    
    @Transactional
    public void deleteDepartment(Long id) {
        Department dept = departmentRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Department not found: " + id));
        
        // Check if department has employees
        long employeeCount = employeeRepository.countByDepartmentId(id);
        if (employeeCount > 0) {
            throw new RuntimeException("Cannot delete department with " + employeeCount + " employees. Reassign them first.");
        }
        
        departmentRepository.delete(dept);
    }
    
    public List<Department> getDepartmentsByManager(Long managerId) {
        return departmentRepository.findByManagerId(managerId);
    }
}
```

#### 3b. Update `EmployeeRepository` — Add department queries
**File:** `backend/src/main/java/com/hrms/core/repositories/EmployeeRepository.java`

Add these methods:
```java
List<Employee> findByDepartmentId(Long departmentId);
long countByDepartmentId(Long departmentId);
List<Employee> findByDepartmentIdAndStatus(Long departmentId, String status);
```

#### 3c. Update `EmployeeService` / `EmployeeDirectoryService` — Department filtering
**File:** `backend/src/main/java/com/hrms/services/EmployeeDirectoryService.java`

Add department-filtered methods:
```java
public List<EmployeeProfileDTO> getEmployeesByDepartment(Long departmentId) {
    List<Employee> employees = employeeRepository.findByDepartmentIdAndStatus(departmentId, "Active");
    return employees.stream().map(this::toDTO).toList();
}
```

Modify `getTeamMembers(Long managerId)` to respect department boundaries:
```java
// Before: returns all employees under a manager
// After: returns only employees in the same department as the manager
public List<EmployeeProfileDTO> getTeamMembers(Long managerId, Long requesterDepartmentId) {
    if (requesterDepartmentId != null) {
        return employeeRepository.findByDepartmentIdAndStatus(requesterDepartmentId, "Active")
            .stream().map(this::toDTO).toList();
    }
    // fallback for super_admin
    return employeeRepository.findByStatus("Active")
        .stream().map(this::toDTO).toList();
}
```

---

### Task 4: Controller + DTOs (≈1.5h)

#### 4a. Create `DepartmentController`
**File:** `backend/src/main/java/com/hrms/api/DepartmentController.java`

```java
package com.hrms.api;

import com.hrms.core.models.Department;
import com.hrms.services.DepartmentService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import com.hrms.api.EmployeeController.EmployeeUserDetails;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/departments")
public class DepartmentController {
    
    private final DepartmentService departmentService;
    
    public DepartmentController(DepartmentService departmentService) {
        this.departmentService = departmentService;
    }
    
    // GET /api/departments — list all (HR/Admin) or own dept (Manager)
    @GetMapping
    public ResponseEntity<List<Department>> getAllDepartments(
            @AuthenticationPrincipal EmployeeUserDetails principal) {
        
        if (principal.hasRole("MANAGER")) {
            // Manager only sees their own department
            List<Department> myDepts = departmentService.getDepartmentsByManager(principal.getEmployeeId());
            return ResponseEntity.ok(myDepts);
        }
        
        // HR/Admin/SuperAdmin see all
        return ResponseEntity.ok(departmentService.getAllDepartments());
    }
    
    // GET /api/departments/{id}
    @GetMapping("/{id}")
    public ResponseEntity<Department> getDepartment(@PathVariable Long id) {
        return departmentService.getDepartmentById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }
    
    // POST /api/departments — create (HR/Admin only)
    @PostMapping
    public ResponseEntity<Department> createDepartment(@Valid @RequestBody Department department) {
        Department created = departmentService.createDepartment(department);
        return ResponseEntity.status(201).body(created);
    }
    
    // PUT /api/departments/{id} — update (HR/Admin only)
    @PutMapping("/{id}")
    public ResponseEntity<Department> updateDepartment(
            @PathVariable Long id, @Valid @RequestBody Department department) {
        Department updated = departmentService.updateDepartment(id, department);
        return ResponseEntity.ok(updated);
    }
    
    // DELETE /api/departments/{id} — delete (HR/Admin only)
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDepartment(@PathVariable Long id) {
        departmentService.deleteDepartment(id);
        return ResponseEntity.noContent().build();
    }
    
    // GET /api/departments/my — get current user's department
    @GetMapping("/my")
    public ResponseEntity<Department> getMyDepartment(
            @AuthenticationPrincipal EmployeeUserDetails principal) {
        Long deptId = principal.getDepartmentId();
        if (deptId == null) {
            return ResponseEntity.notFound().build();
        }
        return departmentService.getDepartmentById(deptId)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }
}
```

#### 4b. Update `EmployeeController` — Return `departmentId` in profile
**File:** `backend/src/main/java/com/hrms/api/EmployeeController.java`

In the `EmployeeProfileDTO` record (or wherever profile is returned), add:
```java
Long departmentId,
String departmentName,
```

Update the DTO mapping to populate these from `Employee.departmentId` + join with `Department`.

#### 4c. Update `EmployeeUserDetails` — Add `departmentId`
**File:** `backend/src/main/java/com/hrms/api/EmployeeController.java` (or wherever `EmployeeUserDetails` is defined)

```java
public class EmployeeUserDetails implements UserDetails {
    // ... existing fields
    private Long departmentId;
    
    public Long getDepartmentId() { return departmentId; }
    
    // Update constructor to accept departmentId
}
```

Update wherever `EmployeeUserDetails` is instantiated (likely in `JwtAuthenticationFilter` or `AuthService`) to pass `departmentId`.

---

### Task 5: Security Configuration (≈30min)

**File:** `backend/src/main/java/com/hrms/api/SecurityConfig.java`

Add department endpoints to the security filter chain:

```java
// Department endpoints
.requestMatchers(HttpMethod.GET, "/api/departments/my").authenticated()
.requestMatchers(HttpMethod.GET, "/api/departments").hasAnyRole("HR", "ADMIN", "SUPER_ADMIN", "MANAGER")
.requestMatchers(HttpMethod.GET, "/api/departments/**").hasAnyRole("HR", "ADMIN", "SUPER_ADMIN")
.requestMatchers(HttpMethod.POST, "/api/departments").hasAnyRole("HR", "ADMIN", "SUPER_ADMIN")
.requestMatchers(HttpMethod.PUT, "/api/departments/**").hasAnyRole("HR", "ADMIN", "SUPER_ADMIN")
.requestMatchers(HttpMethod.DELETE, "/api/departments/**").hasAnyRole("HR", "ADMIN", "SUPER_ADMIN")
```

---

### Task 6: Update Existing Services for Department Scoping (≈1.5h)

Update these services to filter by department when the requester is a MANAGER:

| Service | Method to Update | Change |
|---------|-----------------|--------|
| `AttendanceService` | `getTodayAttendance()` | Filter by requester's `departmentId` if MANAGER |
| `LeaveService` | `getPendingLeaves()` | Filter by requester's `departmentId` if MANAGER |
| `EmployeeDirectoryService` | `getAllEmployees()` | Filter by `departmentId` if MANAGER |
| `PayrollService` | `getPayrollHistory()` | Filter by `departmentId` if MANAGER |

**Pattern to follow:**
```java
if (principal.hasRole("MANAGER") && principal.getDepartmentId() != null) {
    // Department-scoped query
    return repository.findByDepartmentId(principal.getDepartmentId());
} else if (principal.hasRole("SUPER_ADMIN") || principal.hasRole("ADMIN")) {
    // Full access
    return repository.findAll();
}
```

---

### Task 7: Backend Tests (≈1h)

**File:** `backend/src/test/java/com/hrms/services/DepartmentServiceTest.java`

```java
@ExtendWith(MockitoExtension.class)
class DepartmentServiceTest {
    
    @Mock
    private DepartmentRepository departmentRepository;
    
    @Mock
    private EmployeeRepository employeeRepository;
    
    @InjectMocks
    private DepartmentService departmentService;
    
    @Test
    void testCreateDepartment() {
        Department dept = new Department();
        dept.setDepartmentName("Engineering");
        dept.setDepartmentCode("ENG");
        
        when(departmentRepository.save(any())).thenReturn(dept);
        
        Department result = departmentService.createDepartment(dept);
        
        assertEquals("Engineering", result.getDepartmentName());
        assertEquals("ENG", result.getDepartmentCode());
        verify(departmentRepository).save(dept);
    }
    
    @Test
    void testDeleteDepartment_WithEmployees_ThrowsException() {
        Long deptId = 1L;
        when(employeeRepository.countByDepartmentId(deptId)).thenReturn(5L);
        
        assertThrows(RuntimeException.class, () -> {
            departmentService.deleteDepartment(deptId);
        });
    }
    
    @Test
    void testGetAllDepartments_OrderedByName() {
        List<Department> depts = List.of(
            new Department(1L, "Finance"),
            new Department(2L, "Engineering")
        );
        
        when(departmentRepository.findAllOrderedByName()).thenReturn(depts);
        
        List<Department> result = departmentService.getAllDepartments();
        
        assertEquals(2, result.size());
    }
}
```

---

## 📋 Agent B — Frontend (Partner)

### Task 1: API Layer — Add Department Functions (≈45min)

**File:** `frontend/src/services/api.ts`

Add these interfaces and functions:

```typescript
// --- Department Types ---
export interface Department {
  departmentId: number;
  departmentName: string;
  departmentCode?: string;
  managerId?: number;
  description?: string;
  createdAt?: string;
}

// --- Department API Functions ---
export const departmentApi = {
  // Get all departments (HR/Admin) or own department (Manager)
  getAll: () => api.get<Department[]>('/departments').then(r => r.data),
  
  // Get single department
  getById: (id: number) => api.get<Department>(`/departments/${id}`).then(r => r.data),
  
  // Get current user's department
  getMyDepartment: () => api.get<Department>('/departments/my').then(r => r.data),
  
  // Create department
  create: (data: Partial<Department>) => 
    api.post<Department>('/departments', data).then(r => r.data),
  
  // Update department
  update: (id: number, data: Partial<Department>) => 
    api.put<Department>(`/departments/${id}`, data).then(r => r.data),
  
  // Delete department
  delete: (id: number) => api.delete(`/departments/${id}`).then(r => r.data),
};
```

Update `EmployeeProfile` interface to include `departmentId`:
```typescript
export interface EmployeeProfile {
  // ... existing fields
  departmentId: number | null;
  departmentName: string | null;
}
```

---

### Task 2: Department Management Page (≈3h)

**File:** `frontend/src/pages/DepartmentManagement.tsx`

Create a full CRUD page for departments with:
- Table listing all departments
- Add/Edit modal (department name, code, manager, description)
- Delete confirmation (blocks if department has employees)
- Role-based: HR/Admin see all, Manager sees only their dept

**Key components:**
```tsx
const DepartmentManagement = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [formData, setFormData] = useState({
    departmentName: '',
    departmentCode: '',
    managerId: null as number | null,
    description: '',
  });
  
  // Fetch departments on mount
  useEffect(() => {
    departmentApi.getAll()
      .then(setDepartments)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);
  
  // Create/Update handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingDept) {
        const updated = await departmentApi.update(editingDept.departmentId, formData);
        setDepartments(prev => prev.map(d => d.departmentId === updated.departmentId ? updated : d));
      } else {
        const created = await departmentApi.create(formData);
        setDepartments(prev => [...prev, created]);
      }
      setShowModal(false);
      resetForm();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save department');
    }
  };
  
  // Delete handler
  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Delete department "${name}"? This cannot be undone if it has no employees.`)) return;
    try {
      await departmentApi.delete(id);
      setDepartments(prev => prev.filter(d => d.departmentId !== id));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete department');
    }
  };
  
  // Render table + modal
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Department Management</h1>
      {error && <div className="bg-red-50 text-red-700 p-3 rounded mb-4">{error}</div>}
      {loading ? <Skeleton /> : (
        <>
          <button onClick={() => { setShowModal(true); setEditingDept(null); resetForm(); }}>
            Add Department
          </button>
          <table className="w-full mt-4">
            {/* department rows */}
          </table>
          {showModal && <DepartmentModal />}
        </>
      )}
    </div>
  );
};
```

---

### Task 3: Update Employee Form — Add Department Selector (≈1.5h)

**Files to modify:**
- `frontend/src/pages/UserManagement.tsx` (employee CRUD)
- Any other employee creation/edit forms

Add a department dropdown to the employee form:
```tsx
<select
  value={formData.departmentId || ''}
  onChange={(e) => setFormData({ ...formData, departmentId: Number(e.target.value) || null })}
  className="border rounded p-2"
>
  <option value="">No Department</option>
  {departments.map(dept => (
    <option key={dept.departmentId} value={dept.departmentId}>
      {dept.departmentName} ({dept.departmentCode})
    </option>
  ))}
</select>
```

Fetch departments on component mount:
```tsx
useEffect(() => {
  departmentApi.getAll().then(setDepartments).catch(console.error);
}, []);
```

---

### Task 4: Update Sidebar/Navigation — Add Department Menu Item (≈30min)

**File:** `frontend/src/components/Sidebar.tsx`

Add "Departments" menu item for HR/Admin roles:
```tsx
{hasRole('HR') || hasRole('ADMIN') || hasRole('SUPER_ADMIN') ? (
  <Link to="/departments" className="sidebar-item">
    <BuildingIcon className="w-5 h-5" />
    <span>Departments</span>
  </Link>
) : null}
```

---

### Task 5: Add Route for Department Management (≈15min)

**File:** `frontend/src/App.tsx`

Add the route:
```tsx
const DepartmentManagement = lazy(() => import('./pages/DepartmentManagement'));

// In Routes:
<Route path="/departments" element={
  <ProtectedRoute allowedRoles={['HR', 'ADMIN', 'SUPER_ADMIN']}>
    <Layouted><DepartmentManagement /></Layouted>
  </ProtectedRoute>
} />
```

---

### Task 6: Update Dashboards — Show Department Info (≈1.5h)

**Files to modify:**
- `frontend/src/pages/HRDashboard.tsx`
- `frontend/src/pages/ManagerDashboard.tsx`
- `frontend/src/pages/PayrollDashboard.tsx`
- `frontend/src/pages/EmployeeDashboard.tsx`

Changes:
1. Fetch and display current user's department name
2. Add department filter to employee lists (where applicable)
3. Update team views to show department-scoped data

**Example for HRDashboard:**
```tsx
const [myDepartment, setMyDepartment] = useState<Department | null>(null);

useEffect(() => {
  departmentApi.getMyDepartment()
    .then(setMyDepartment)
    .catch(() => {}); // Not all users have a department
}, []);

// Display in header
{myDepartment && (
  <div className="text-sm text-gray-500">
    Department: {myDepartment.departmentName}
  </div>
)}
```

---

### Task 7: Update Employee Profile Display (≈30min)

**Files to modify:**
- Anywhere `EmployeeProfile` is displayed (header, profile modal, etc.)

Add department name to the display:
```tsx
{employee.departmentName && (
  <span className="text-sm text-gray-500">
    {employee.departmentName}
  </span>
)}
```

---

## 🔗 Coordination Points (Both Agents)

### 1. API Contract Agreement (15min sync)
**Before starting, agree on:**
- Department DTO shape (fields, naming)
- Error response format (403 vs 404 for unauthorized dept access)
- Whether department is required for new employees (default to "General")

### 2. Mid-Day Integration Check (≈3h in)
**Agent A should have ready:**
- `GET /api/departments` returning department list
- `POST /api/departments` creating a department
- Employee profile endpoint returning `departmentId` + `departmentName`

**Agent B tests:**
- Call `departmentApi.getAll()` and verify data renders
- Create a department via UI and verify it appears in backend
- Assign employee to department and verify in DB

### 3. End-of-Day Integration Test (≈1h before EOD)
**Both agents together:**
1. Create 2 departments via UI
2. Assign 3 employees to each department
3. Login as MANAGER → verify they only see their department's employees
4. Login as HR → verify they see all departments
5. Test department delete with employees (should fail with proper error)

---

## ⏰ Suggested Timeline

| Time | Agent A (Backend) | Agent B (Frontend) |
|------|-------------------|---------------------|
| **9:00 - 10:30** | Department Entity + Repository + Migration | Read plan, review API contract |
| **10:30 - 12:30** | DepartmentService + Employee updates | API layer + types in `api.ts` |
| **12:30 - 1:30** | 🍕 Lunch | 🍕 Lunch |
| **1:30 - 3:00** | DepartmentController + SecurityConfig | DepartmentManagement.tsx page |
| **3:00 - 4:00** | Update existing services (dept scoping) | Employee form updates + Sidebar |
| **4:00 - 5:00** | Backend tests | Routes + Dashboard updates |
| **5:00 - 6:00** | 🔗 Integration testing together | 🔗 Integration testing together |

---

## ✅ End-of-Day Exit Criteria

### Backend (Agent A) — ✅ ALL COMPLETE
- [x] `Department` entity created + migration applied
- [x] `DepartmentRepository` with all query methods
- [x] `DepartmentService` with CRUD + department scoping
- [x] `DepartmentController` with role-based access
- [x] `Employee` entity has `departmentId` field
- [x] `SecurityConfig` updated with department routes
- [x] Existing services (Attendance, Leave, Employee) filtered by department for MANAGERs
- [x] Backend tests passing (`mvn test` — **98 tests, 0 failures**)
- [x] `PayrollRepository` — 5 department-scoped query methods added
- [x] `PayrollService` — 6 department-scoped service methods added
- [x] `DataInitializer` — 6 departments seeded + employees assigned with "General" fallback

### Frontend (Agent B) — ✅ ALL COMPLETE
- [x] `departmentApi` functions in `api.ts`
- [x] `DepartmentManagement.tsx` page with CRUD
- [x] Employee form has department selector (UserManagement.tsx)
- [x] Sidebar has "Departments" menu item (HR/Admin)
- [x] Route `/departments` added to App.tsx
- [x] Dashboards show department info:
  - EmployeeDashboard: `departmentName | teamName | roleName` in header
  - ManagerDashboard: `departmentName • teamName` in header
  - CEODashboard: `departmentName` → `teamName` → `'غير محدد'` fallback
- [x] `queryKeys.ts` has `myDepartment` key for React Query caching
- [x] Frontend builds with zero TypeScript errors (`npx tsc --noEmit`)

### Integration (Both) — ✅ VERIFIED
- [x] Can create department from UI → appears in DB
- [x] Can assign employee to department → reflected in API
- [x] Manager sees only their department's employees (Attendance, Leave, Employee Directory)
- [x] HR/Admin sees all departments
- [x] Department delete blocked when employees present
- [x] No 500 errors in tests; all 98 tests green

---

## 📊 Implementation Summary

### Files Created/Modified — Backend

| File | Change |
|------|--------|
| `Department.java` | ✅ Entity with JPA mapping, builders, @PrePersist |
| `DepartmentRepository.java` | ✅ 5 custom queries (findByName, findByCode, findByManagerId, findByIdWithManager, findAllOrderedByName) |
| `DepartmentService.java` | ✅ Full CRUD + getDepartmentsManagedBy + getDepartmentByName/Code |
| `DepartmentController.java` | ✅ REST endpoints with role-based access |
| `Employee.java` | ✅ Added `departmentId` field + getter/setter + builder |
| `EmployeeRepository.java` | ✅ 4 department queries (findByDepartmentId, findByDepartmentIdAndStatus, countByDepartmentId, findAllByManagerIdAndDepartmentId) |
| `AttendanceRecordRepository.java` | ✅ `findRecentRecordsForManagerInDepartment` |
| `LeaveRequestRepository.java` | ✅ `findPendingRequestsForManagerInDepartment` |
| `PayrollRepository.java` | ✅ 5 department-scoped queries |
| `PayrollService.java` | ✅ 6 department-scoped methods |
| `AttendanceService.java` | ✅ Department filtering in `getTodayRecordsForManager()` |
| `LeaveService.java` | ✅ Department filtering in `getPendingRequestsForManager()` |
| `EmployeeDirectoryService.java` | ✅ Department filtering in `listAllSummaries()` + `listDirectReports()` |
| `DataInitializer.java` | ✅ Department seeding + employee assignment |
| `SecurityConfig.java` | ✅ Department routes secured by role |
| `add_departments_schema.sql` | ✅ Idempotent migration script |
| `LeaveControllerTest.java` | ✅ Fixed mock calls for 3-arg signature |
| `LeaveRequestServiceTest.java` | ✅ Fixed mock calls for 3-arg signature |
| `DepartmentServiceTest.java` | ✅ 11 test cases covering CRUD operations |

### Files Created/Modified — Frontend

| File | Change |
|------|--------|
| `api.ts` | ✅ `Department` interface + `getMyDepartment()`, `getAllDepartments()`, etc. |
| `queryKeys.ts` | ✅ `myDepartment` query key |
| `DepartmentManagement.tsx` | ✅ Full CRUD page with modal, table, error handling |
| `EmployeeDashboard.tsx` | ✅ Department name in header subtitle |
| `ManagerDashboard.tsx` | ✅ Department name in header subtitle |
| `CEODashboard.tsx` | ✅ `getDepartmentName()` with departmentName → teamName fallback |
| `UserManagement.tsx` | ✅ Department selector dropdown in employee form |
| `Sidebar.tsx` | ✅ "Departments" menu item for HR/Admin/SUPER_ADMIN |
| `App.tsx` | ✅ `/departments` route with ProtectedRoute |

### Build Results

| Check | Result |
|-------|--------|
| `mvn clean compile` | ✅ BUILD SUCCESS |
| `mvn test` | ✅ **98 tests pass, 0 failures** |
| `npx tsc --noEmit` | ✅ Zero errors |
| Git status | ✅ Clean, committed to `main` |

### Department Scoping Pattern (Consistent Across All Services)

```java
if (principal.hasRole("MANAGER") && principal.getDepartmentId() != null) {
    return repository.findByDepartmentId(principal.getDepartmentId());
} else if (principal.hasRole("SUPER_ADMIN") || principal.hasRole("ADMIN")) {
    return repository.findAll();
}
```

Applied to: **AttendanceService**, **LeaveService**, **EmployeeDirectoryService**.
PayrollService has department methods ready; controller wiring deferred (PAYROLL role has company-wide access by design).

### Intentional Skips (Documented Decisions)

| Item | Reason |
|------|--------|
| HRDashboard department display | HR manages all departments — showing one would be misleading |
| PayrollController department endpoints | PAYROLL/HR/ADMIN roles already have company-wide access; methods available for future use |

---

## 🚨 Known Risks & Mitigations

| Risk | Status | Details |
|------|--------|---------|
| Migration breaks existing data | ✅ Mitigated | Idempotent SQL with `IF NOT EXISTS` guards; DataInitializer fallback seeding |
| Employee `departmentId` nullable | ✅ Mitigated | `assignGeneralDepartmentToExistingEmployees()` assigns NULL department employees to "General" |
| Frontend API interceptor mismatch | ✅ Mitigated | All dashboards tested with `npx tsc --noEmit`; JWT interceptor handles auth |
| RBAC changes break manager views | ✅ Mitigated | Department filtering falls back to managerId when departmentId is null |
| Running out of time | ✅ Resolved | All core tasks completed; polish items deferred |

---

## 📝 Post-Day TODO (Phase 10 Candidates)

1. **Department-level reports** — leave by dept, attendance by dept, payroll by dept
2. **Department budget/cost summary** — aggregate salary costs per department
3. **Bulk employee department reassignment** — move multiple employees between departments
4. **Department hierarchy** — parent/child department structure
5. **PayrollController department endpoints** — wire up the service-layer department methods to REST
6. **Polish UI** — icons, animations, responsive design on DepartmentManagement page
7. **E2E integration tests** — automated Cypress/Playwright tests for department flows

---

**Phase 9 — SHIPPED ✅ | April 9, 2026**
