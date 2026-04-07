#!/bin/bash

# Load Test Preparation Script for HRMS Backend
# Sets up test data and configuration for load testing

set -e

echo "HRMS Backend Load Test Preparation"
echo "==================================="
echo "Date: $(date)"
echo ""

# Configuration
TEST_USERS=100
CONCURRENT_USERS=50
TEST_DURATION="5m"
BASE_URL="http://localhost:8080"

# Create test data directory
mkdir -p test-data
cd test-data

echo "1. Creating test user credentials..."
cat > test-users.csv << EOF
email,password,role
superadmin@test.com,SuperAdmin123,SUPER_ADMIN
admin@test.com,Admin123,ADMIN
hr@test.com,Hr123,HR
manager@test.com,Manager123,MANAGER
employee@test.com,Employee123,EMPLOYEE
payroll@test.com,Payroll123,PAYROLL
EOF

# Generate additional test users
for i in $(seq 1 $TEST_USERS); do
    echo "user$i@test.com,Password123,EMPLOYEE" >> test-users.csv
done

echo "2. Creating load test scenarios..."

# Health check scenario
cat > health-check.js << 'EOF'
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 10,
  duration: '1m',
};

export default function () {
  const res = http.get('__BASE_URL__/api/health');
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 200ms': (r) => r.timings.duration < 200,
  });
  sleep(1);
}
EOF

# Authentication scenario
cat > auth-load.js << 'EOF'
import http from 'k6/http';
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';

const users = new SharedArray('users', function () {
  return JSON.parse(open('./test-users.json'));
});

export const options = {
  stages: [
    { duration: '30s', target: 20 },
    { duration: '1m', target: 50 },
    { duration: '30s', target: 0 },
  ],
};

export default function () {
  const user = users[Math.floor(Math.random() * users.length)];
  
  const loginRes = http.post('__BASE_URL__/api/auth/login', JSON.stringify({
    email: user.email,
    password: user.password
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
  
  check(loginRes, {
    'login successful': (r) => r.status === 200,
    'has token': (r) => JSON.parse(r.body).data && JSON.parse(r.body).data.token,
  });
  
  if (loginRes.status === 200) {
    const token = JSON.parse(loginRes.body).data.token;
    
    // Test authenticated endpoint
    const profileRes = http.get('__BASE_URL__/api/employees/me', {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    
    check(profileRes, {
      'profile accessible': (r) => r.status === 200,
    });
  }
  
  sleep(Math.random() * 2 + 1);
}
EOF

# Convert CSV to JSON for k6
echo "3. Converting test data to JSON..."
python3 -c "
import csv
import json
import sys

users = []
with open('test-users.csv', 'r') as f:
    reader = csv.DictReader(f)
    for row in reader:
        users.append(row)

with open('test-users.json', 'w') as f:
    json.dump(users, f, indent=2)
" || echo "Python not available, creating simple JSON..."

# Create simple JSON if Python not available
if [ ! -f test-users.json ]; then
    cat > test-users.json << 'EOF'
[
  {"email": "superadmin@test.com", "password": "SuperAdmin123", "role": "SUPER_ADMIN"},
  {"email": "admin@test.com", "password": "Admin123", "role": "ADMIN"},
  {"email": "hr@test.com", "password": "Hr123", "role": "HR"},
  {"email": "manager@test.com", "password": "Manager123", "role": "MANAGER"},
  {"email": "employee@test.com", "password": "Employee123", "role": "EMPLOYEE"},
  {"email": "payroll@test.com", "password": "Payroll123", "role": "PAYROLL"}
]
EOF
fi

echo "4. Creating Docker Compose for load test environment..."
cat > docker-compose-loadtest.yml << 'EOF'
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: hrms_loadtest
      POSTGRES_USER: test
      POSTGRES_PASSWORD: test
    ports:
      - "5433:5432"
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./init-test-data.sql:/docker-entrypoint-initdb.d/init-test-data.sql

  backend:
    build:
      context: ..
      dockerfile: Dockerfile
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/hrms_loadtest
      SPRING_DATASOURCE_USERNAME: test
      SPRING_DATASOURCE_PASSWORD: test
      SPRING_JPA_HIBERNATE_DDL_AUTO: update
      JWT_SECRET: TestSecretKeyForLoadTestingMustBe32CharsLong!!
    ports:
      - "8081:8080"
    depends_on:
      - postgres

  k6:
    image: grafana/k6:latest
    volumes:
      - ./:/scripts
    command: run /scripts/auth-load.js
    depends_on:
      - backend

volumes:
  postgres-data:
EOF

echo "5. Creating SQL script for test data..."
cat > init-test-data.sql << 'EOF'
-- Insert test roles
INSERT INTO roles (role_name, description) VALUES
('SUPER_ADMIN', 'Super Administrator'),
('ADMIN', 'Administrator'),
('HR', 'Human Resources'),
('MANAGER', 'Department Manager'),
('EMPLOYEE', 'Regular Employee'),
('PAYROLL', 'Payroll Specialist')
ON CONFLICT DO NOTHING;

-- Insert test users (passwords are BCrypt hashes of 'Password123')
INSERT INTO employees (full_name, email, password_hash, status, role_id) VALUES
('Super Admin', 'superadmin@test.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye3Z7gV7Cw6Z5B7mHBrbRl.6Qc1oJQ1W2', 'Active', 1),
('Admin User', 'admin@test.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye3Z7gV7Cw6Z5B7mHBrbRl.6Qc1oJQ1W2', 'Active', 2),
('HR User', 'hr@test.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye3Z7gV7Cw6Z5B7mHBrbRl.6Qc1oJQ1W2', 'Active', 3),
('Manager User', 'manager@test.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye3Z7gV7Cw6Z5B7mHBrbRl.6Qc1oJQ1W2', 'Active', 4),
('Employee User', 'employee@test.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye3Z7gV7Cw6Z5B7mHBrbRl.6Qc1oJQ1W2', 'Active', 5),
('Payroll User', 'payroll@test.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye3Z7gV7Cw6Z5B7mHBrbRl.6Qc1oJQ1W2', 'Active', 6)
ON CONFLICT DO NOTHING;

-- Insert additional test employees
DO $$
DECLARE
    i INTEGER;
BEGIN
    FOR i IN 1..100 LOOP
        INSERT INTO employees (full_name, email, password_hash, status, role_id, manager_id)
        VALUES (
            'Test Employee ' || i,
            'user' || i || '@test.com',
            '$2a$10$N9qo8uLOickgx2ZMRZoMye3Z7gV7Cw6Z5B7mHBrbRl.6Qc1oJQ1W2',
            'Active',
            5,
            CASE WHEN i % 10 = 0 THEN NULL ELSE 4 END
        ) ON CONFLICT DO NOTHING;
    END LOOP;
END $$;
EOF

echo "6. Creating k6 test configuration..."
cat > k6-config.json << 'EOF'
{
  "summaryTrendStats": ["avg", "min", "med", "max", "p(90)", "p(95)", "p(99)"],
  "summaryTimeUnit": "ms",
  "noConnectionReuse": false,
  "insecureSkipTLSVerify": true,
  "batch": 20,
  "batchPerHost": 20,
  "httpDebug": false
}
EOF

echo "7. Creating test run script..."
cat > run-load-test.sh << 'EOF'
#!/bin/bash

set -e

echo "Starting load test..."
echo ""

# Update URLs in test scripts
sed -i "s|__BASE_URL__|${BASE_URL:-http://localhost:8081}|g" *.js

echo "1. Starting test environment..."
docker-compose -f docker-compose-loadtest.yml up -d postgres backend

echo "Waiting for backend to start..."
sleep 30

echo "2. Running health check test..."
docker-compose -f docker-compose-loadtest.yml run --rm k6 run /scripts/health-check.js

echo "3. Running authentication load test..."
docker-compose -f docker-compose-loadtest.yml run --rm k6 run /scripts/auth-load.js

echo "4. Cleaning up..."
docker-compose -f docker-compose-loadtest.yml down

echo ""
echo "Load test complete!"
EOF

chmod +x run-load-test.sh

echo "8. Creating performance monitoring script..."
cat > monitor-performance.sh << 'EOF'
#!/bin/bash

# Monitor backend performance during load tests

set -e

INTERVAL=5
DURATION=300  # 5 minutes

echo "Monitoring backend performance for ${DURATION} seconds..."
echo "Press Ctrl+C to stop"
echo ""

end_time=$((SECONDS + DURATION))

while [ $SECONDS -lt $end_time ]; do
    # Check health endpoint
    health_response=$(curl -s -w "%{http_code} %{time_total}" -o /dev/null http://localhost:8080/api/health)
    health_code=$(echo $health_response | awk '{print $1}')
    health_time=$(echo $health_response | awk '{print $2}')
    
    # Get memory usage (if using Docker)
    if command -v docker &> /dev/null; then
        mem_usage=$(docker stats --no-stream --format "{{.MemUsage}}" hrms-backend 2>/dev/null || echo "N/A")
    else
        mem_usage="N/A"
    fi
    
    echo "$(date '+%H:%M:%S') - Health: ${health_code} (${health_time}s) | Memory: ${mem_usage}"
    
    sleep $INTERVAL
done

echo ""
echo "Monitoring complete."
EOF

chmod +x monitor-performance.sh

echo ""
echo "Preparation complete!"
echo ""
echo "Files created:"
echo "  - test-users.csv: Test user credentials"
echo "  - test-users.json: Test users in JSON format"
echo "  - health-check.js: k6 health check test"
echo "  - auth-load.js: k6 authentication load test"
echo "  - docker-compose-loadtest.yml: Docker Compose for load test"
echo "  - init-test-data.sql: SQL script for test data"
echo "  - k6-config.json: k6 configuration"
echo "  - run-load-test.sh: Script to run load tests"
echo "  - monitor-performance.sh: Script to monitor performance"
echo ""
echo "To run load tests:"
echo "  1. Install Docker and Docker Compose"
echo "  2. Run: ./run-load-test.sh"
echo "  3. Monitor: ./monitor-performance.sh"
echo ""
echo "Note: Update BASE_URL in the scripts if needed."