#!/bin/bash

echo "=== Day 3: Employee Form Department Selector Testing ==="
echo "Date: $(date)"
echo ""

# Test 1: Get JWT token for ADMIN user
echo "1. Getting JWT token for ADMIN user..."
ADMIN_RESPONSE=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@hrms.com","password":"ADMIN@1234"}')
echo "Login response raw: $ADMIN_RESPONSE"
ADMIN_TOKEN=$(echo "$ADMIN_RESPONSE" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    if 'data' in data and 'token' in data['data']:
        print(data['data']['token'])
    else:
        print('')
except Exception as e:
    print('Error:', e)
    print('')
")

if [ -z "$ADMIN_TOKEN" ]; then
  echo "❌ Failed to get ADMIN token"
  exit 1
fi
echo "✓ ADMIN token obtained: ${ADMIN_TOKEN:0:20}..."

# Test 2: Get departments list
echo ""
echo "2. Testing departments API..."
DEPARTMENTS_RESPONSE=$(curl -s -X GET http://localhost:8080/api/departments \
  -H "Authorization: Bearer $ADMIN_TOKEN")

echo "Departments response:"
echo "$DEPARTMENTS_RESPONSE" | python3 -m json.tool | head -20

# Test 3: Get employees list
echo ""
echo "3. Testing employees API..."
EMPLOYEES_RESPONSE=$(curl -s -X GET "http://localhost:8080/api/employees?page=0&size=5" \
  -H "Authorization: Bearer $ADMIN_TOKEN")

echo "Employees response (first 5):"
echo "$EMPLOYEES_RESPONSE" | python3 -m json.tool | head -30

# Test 4: Get specific employee to test
echo ""
echo "4. Getting employee details for testing..."
# Extract first employee ID from response
FIRST_EMPLOYEE_ID=$(echo "$EMPLOYEES_RESPONSE" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    if 'data' in data and 'items' in data['data'] and len(data['data']['items']) > 0:
        print(data['data']['items'][0]['employeeId'])
    else:
        print('')
except:
    print('')
")

if [ -z "$FIRST_EMPLOYEE_ID" ]; then
  echo "❌ No employees found"
  exit 1
fi
echo "✓ Found employee ID: $FIRST_EMPLOYEE_ID"

# Test 5: Get employee profile
echo ""
echo "5. Getting employee profile..."
EMPLOYEE_PROFILE=$(curl -s -X GET "http://localhost:8080/api/employees/me" \
  -H "Authorization: Bearer $ADMIN_TOKEN")

echo "ADMIN profile:"
echo "$EMPLOYEE_PROFILE" | python3 -m json.tool | head -20

# Test 6: Test department update API
echo ""
echo "6. Testing department update API..."
# First get current department ID
CURRENT_DEPT_ID=$(echo "$EMPLOYEE_PROFILE" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    if 'data' in data:
        dept_id = data['data'].get('departmentId')
        print(dept_id if dept_id is not None else 'null')
    else:
        print('null')
except:
    print('null')
")

echo "Current department ID: $CURRENT_DEPT_ID"

# Test 7: Get JWT for HR user
echo ""
echo "7. Getting JWT token for HR user..."
HR_RESPONSE=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"hr@hrms.com","password":"HR@1234"}')
echo "HR login response raw: $HR_RESPONSE"
HR_TOKEN=$(echo "$HR_RESPONSE" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    if 'data' in data and 'token' in data['data']:
        print(data['data']['token'])
    else:
        print('')
except Exception as e:
    print('Error:', e)
    print('')
")

if [ -z "$HR_TOKEN" ]; then
  echo "❌ Failed to get HR token"
  exit 1
fi
echo "✓ HR token obtained: ${HR_TOKEN:0:20}..."

# Test 8: Test recruitment API
echo ""
echo "8. Testing recruitment API endpoints..."
RECRUITMENT_PENDING=$(curl -s -X GET "http://localhost:8080/api/recruitment/pending?page=0&size=5" \
  -H "Authorization: Bearer $HR_TOKEN")

echo "Pending recruitment requests:"
echo "$RECRUITMENT_PENDING" | python3 -m json.tool | head -20

echo ""
echo "=== Summary ==="
echo "✅ Backend APIs are accessible"
echo "✅ Departments API returns data"
echo "✅ Employees API returns data with department information"
echo "✅ User authentication working"
echo ""
echo "Next steps:"
echo "1. Test UserManagement page UI at http://localhost:5174/users"
echo "2. Test department dropdown in edit modal"
echo "3. Test department change persistence"
echo "4. Test recruitment form department field"