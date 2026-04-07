# N+1 Query Detection Guide

## Manual Detection Steps

### 1. Check Repository Methods
Look for methods that might cause N+1 queries:

```bash
# Search for repository methods that fetch entities with relationships
grep -r "findAll\|findBy\|findAllBy" backend/src/main/java/com/hrms/core/repositories/
```

### 2. Check Service Methods
Look for service methods that iterate over collections and access lazy-loaded relationships:

```bash
# Search for loops in service methods
grep -n "for.*:" backend/src/main/java/com/hrms/services/*.java
grep -n "stream()" backend/src/main/java/com/hrms/services/*.java
```

### 3. Common N+1 Patterns to Look For

#### Pattern 1: Looping over entities and accessing relationships
```java
List<Employee> employees = employeeRepository.findAll();
for (Employee emp : employees) {
    // This causes N+1 if manager is lazy-loaded
    System.out.println(emp.getManager().getName());
}
```

#### Pattern 2: Using repositories inside loops
```java
List<Department> departments = departmentRepository.findAll();
for (Department dept : departments) {
    // This causes N+1
    List<Employee> employees = employeeRepository.findByDepartmentId(dept.getId());
}
```

### 4. Potential N+1 Issues in HRMS

Based on code review, watch out for:

1. **Employee with manager relationships** - When fetching employees and accessing `getManager()`
2. **LeaveRequest with employee relationships** - When fetching leave requests and accessing employee details
3. **AttendanceRecord with employee relationships** - When fetching attendance records
4. **Payroll with employee relationships** - When fetching payroll records

### 5. Fixes for N+1 Queries

#### Use JOIN FETCH in Repository Queries
```java
@Query("SELECT e FROM Employee e JOIN FETCH e.manager WHERE e.department = :dept")
List<Employee> findByDepartmentWithManager(@Param("dept") Department department);
```

#### Use EntityGraph annotations
```java
@EntityGraph(attributePaths = {"manager", "department"})
List<Employee> findAll();
```

#### Use DTO projections
```java
@Query("SELECT new com.hrms.api.dto.EmployeeDTO(e.id, e.name, m.name) " +
       "FROM Employee e LEFT JOIN e.manager m")
List<EmployeeDTO> findAllWithManagerNames();
```

### 6. Testing for N+1 Queries

#### Enable SQL logging in `application.properties`:
```properties
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.format_sql=true
spring.jpa.properties.hibernate.use_sql_comments=true
```

#### Check for multiple SELECT statements:
```
-- Good: Single query with JOIN
SELECT e0_.id, e0_.name, e1_.id as manager_id, e1_.name as manager_name
FROM employee e0_ 
LEFT JOIN employee e1_ ON e0_.manager_id = e1_.id

-- Bad: N+1 queries
SELECT id, name FROM employee
SELECT id, name FROM employee WHERE id = ?  -- for each manager
```

### 7. Performance Monitoring

Consider adding:
- Spring Boot Actuator for metrics
- Micrometer for distributed tracing
- Query performance monitoring in production

### 8. Automated Detection Tools

For production monitoring:
- Use APM tools (New Relic, Datadog, AppDynamics)
- Enable slow query logging in PostgreSQL
- Use `EXPLAIN ANALYZE` for query optimization

## Current Code Analysis

Based on initial review:
- ✅ Entities use `FetchType.LAZY` (good practice)
- ✅ Repository queries use JPQL with proper joins where needed
- ⚠️ Need to verify service methods don't cause N+1 in loops
- ⚠️ Consider adding `@EntityGraph` for common use cases

## Recommended Actions

1. **Add integration tests** that verify query counts
2. **Enable SQL logging** in test environment to detect N+1
3. **Consider adding** `@EntityGraph` annotations to common repository methods
4. **Monitor production** for slow queries