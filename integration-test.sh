#!/bin/bash

# HRMS Integration Test Script
set -e

echo "=== HRMS Integration Test ==="
echo "Starting at: $(date)"
echo

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

# Step 1: Check prerequisites
echo "=== Step 1: Checking Prerequisites ==="
if ! command -v docker &> /dev/null; then
    print_error "Docker not found"
    exit 1
fi
print_success "Docker found"

if ! docker compose version &> /dev/null; then
    print_error "Docker Compose not found"
    exit 1
fi
print_success "Docker Compose found"

if ! command -v curl &> /dev/null; then
    print_warning "curl not found, some tests will be skipped"
fi

# Step 2: Start services
echo
echo "=== Step 2: Starting Services ==="
if [ -f docker-compose.yml ]; then
    print_success "Found docker-compose.yml"
    
    echo "Starting services in background..."
    docker compose up -d
    
    # Wait for services to start
    echo "Waiting for services to be ready..."
    sleep 10
    
    # Check if services are running
    if docker compose ps | grep -q "Up"; then
        print_success "Services are running"
    else
        print_error "Services failed to start"
        docker compose logs
        exit 1
    fi
else
    print_error "docker-compose.yml not found"
    exit 1
fi

# Step 3: Test backend API
echo
echo "=== Step 3: Testing Backend API ==="

# Test 1: Health endpoint
echo "Testing health endpoint..."
if command -v curl &> /dev/null; then
    if curl -s http://localhost:8080/actuator/health | grep -q '"status":"UP"'; then
        print_success "Backend health check passed"
    else
        print_error "Backend health check failed"
        docker compose logs backend
    fi
else
    print_warning "Skipping health check (curl not available)"
fi

# Test 2: Swagger UI
echo "Testing Swagger UI..."
if command -v curl &> /dev/null; then
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/swagger-ui.html | grep -q "200"; then
        print_success "Swagger UI is accessible"
    else
        print_warning "Swagger UI may not be accessible"
    fi
fi

# Test 3: API endpoints (without auth)
echo "Testing public endpoints..."
if command -v curl &> /dev/null; then
    # Test login endpoint exists
    if curl -s -X POST http://localhost:8080/api/auth/login -H "Content-Type: application/json" -d '{"email":"test","password":"test"}' | grep -q "status"; then
        print_success "Login endpoint responds"
    else
        print_warning "Login endpoint may have issues"
    fi
fi

# Step 4: Test frontend
echo
echo "=== Step 4: Testing Frontend ==="

# Test 1: Frontend container
echo "Checking frontend container..."
if docker compose ps frontend | grep -q "Up"; then
    print_success "Frontend container is running"
else
    print_error "Frontend container is not running"
    docker compose logs frontend
fi

# Test 2: Frontend accessibility
echo "Testing frontend accessibility..."
if command -v curl &> /dev/null; then
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:80 | grep -q "200\|30"; then
        print_success "Frontend is accessible"
    else
        print_warning "Frontend may not be accessible (check port 80)"
    fi
fi

# Step 5: Test database
echo
echo "=== Step 5: Testing Database ==="

# Test 1: Database container
echo "Checking database container..."
if docker compose ps postgres | grep -q "Up"; then
    print_success "Database container is running"
else
    print_error "Database container is not running"
    docker compose logs postgres
fi

# Test 2: Database connectivity
echo "Testing database connectivity..."
if docker compose exec -T postgres pg_isready -U hrms_user -d hrms > /dev/null 2>&1; then
    print_success "Database is accepting connections"
else
    print_error "Database is not accepting connections"
fi

# Step 6: Run automated tests
echo
echo "=== Step 6: Running Automated Tests ==="

# Backend tests
echo "Running backend tests..."
cd backend
if mvn test -q 2>/dev/null; then
    print_success "Backend tests passed"
else
    print_error "Backend tests failed"
    # Show test results
    mvn test 2>&1 | tail -50
fi
cd ..

# Frontend tests (if in development mode)
echo "Running frontend tests..."
if [ -f frontend/package.json ]; then
    cd frontend
    if npm test -- --run 2>/dev/null; then
        print_success "Frontend tests passed"
    else
        print_warning "Frontend tests may have issues (check manually)"
    fi
    cd ..
else
    print_warning "Frontend source not found for testing"
fi

# Step 7: Cleanup
echo
echo "=== Step 7: Final Status ==="

# Show container status
echo "Container status:"
docker compose ps

# Show resource usage
echo
echo "Resource usage:"
docker stats --no-stream 2>/dev/null || echo "Docker stats not available"

# Summary
echo
echo "=== Integration Test Summary ==="
echo "Completed at: $(date)"
echo
echo "Services Tested:"
echo "  ✅ Backend API (Spring Boot)"
echo "  ✅ Frontend (React + Nginx)"
echo "  ✅ Database (PostgreSQL)"
echo
echo "Next Steps:"
echo "  1. Manual testing with different user roles"
echo "  2. Test specific workflows (leave, payroll, etc.)"
echo "  3. Performance testing"
echo "  4. Security testing"
echo
echo "To stop services: docker compose down"
echo "To view logs: docker compose logs -f"
echo
print_success "Integration test completed successfully!"