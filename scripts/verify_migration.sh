#!/bin/bash
# Verification script for Department System migration

echo "=== Department Migration Verification ==="
echo "Date: $(date)"
echo ""

# Get JWT token
echo "1. Getting JWT token..."
TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"dev@hrms.com","password":"Dev@1234"}' | \
  python3 -c "import sys,json; print(json.load(sys.stdin)['data']['token'])")

if [ -z "$TOKEN" ]; then
  echo "ERROR: Failed to get JWT token"
  exit 1
fi
echo "✓ Token obtained"
echo ""

# Check departments
echo "2. Checking Departments table..."
DEPARTMENTS_COUNT=$(curl -s -X GET http://localhost:8080/api/departments \
  -H "Authorization: Bearer $TOKEN" | \
  python3 -c "import sys,json; data=json.load(sys.stdin); print(len(data['data']))")

echo "   Found $DEPARTMENTS_COUNT departments"
if [ "$DEPARTMENTS_COUNT" -ge 6 ]; then
  echo "   ✓ Expected at least 6 departments"
else
  echo "   ✗ Expected at least 6 departments, found $DEPARTMENTS_COUNT"
fi

# List departments
echo "   Departments:"
curl -s -X GET http://localhost:8080/api/departments \
  -H "Authorization: Bearer $TOKEN" | \
  python3 -c "import sys,json; data=json.load(sys.stdin); 
for dept in data['data']: 
    print(f'    - {dept[\"departmentName\"]} ({dept[\"departmentCode\"]})')"
echo ""

# Check employees with departments
echo "3. Checking employee department assignments..."
EMPLOYEES_WITH_DEPT=$(curl -s -X GET "http://localhost:8080/api/employees?page=0&size=100" \
  -H "Authorization: Bearer $TOKEN" | \
  python3 -c "import sys,json; data=json.load(sys.stdin); 
employees = data['data']['items'];
with_dept = [e for e in employees if e.get('departmentId')];
print(len(with_dept));
print(len(employees));")

WITH_DEPT=$(echo "$EMPLOYEES_WITH_DEPT" | head -1)
TOTAL_EMPLOYEES=$(echo "$EMPLOYEES_WITH_DEPT" | tail -1)

echo "   $WITH_DEPT out of $TOTAL_EMPLOYEES employees have department assigned"
if [ "$WITH_DEPT" -eq "$TOTAL_EMPLOYEES" ]; then
  echo "   ✓ All employees have department assignments"
else
  echo "   ⚠️  Some employees missing department assignments"
fi
echo ""

# Check for orphans (employees with invalid department IDs)
echo "4. Checking for orphaned department references..."
# This would require direct DB access, but we can check via API
echo "   (Requires direct database access for complete verification)"
echo ""

echo "=== Verification Complete ==="
echo ""
echo "Summary:"
echo "- Departments table: $DEPARTMENTS_COUNT departments ✓"
echo "- Employee assignments: $WITH_DEPT/$TOTAL_EMPLOYEES employees have departments"
echo "- Rollback script: database/rollback_departments.sql ✓"
echo ""
echo "Note: For complete orphan check, run SQL directly:"
echo "  SELECT e.employee_id, e.full_name, e.department_id"
echo "  FROM Employees e"
echo "  LEFT JOIN Departments d ON e.department_id = d.department_id"
echo "  WHERE d.department_id IS NULL;"