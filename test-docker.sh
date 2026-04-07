#!/bin/bash

# Test script for HRMS Docker setup
set -e

echo "=== Testing HRMS Docker Setup ==="
echo

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker daemon."
    exit 1
fi
echo "✅ Docker is running"

# Check if Docker Compose is available
if ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose is not available. Please install Docker Compose."
    exit 1
fi
echo "✅ Docker Compose is available"

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating from .env.example..."
    cp .env.example .env
    echo "✅ Created .env file from .env.example"
else
    echo "✅ .env file exists"
fi

# Test backend build
echo
echo "=== Testing Backend Build ==="
cd backend
if docker build -t hrms-backend-test --target build . > /dev/null 2>&1; then
    echo "✅ Backend build stage successful"
else
    echo "❌ Backend build failed"
    exit 1
fi
cd ..

# Test frontend build
echo
echo "=== Testing Frontend Build ==="
cd frontend
if docker build -t hrms-frontend-test --target build . > /dev/null 2>&1; then
    echo "✅ Frontend build stage successful"
else
    echo "❌ Frontend build failed"
    exit 1
fi
cd ..

# Clean up test images
echo
echo "=== Cleaning up test images ==="
docker rmi hrms-backend-test hrms-frontend-test 2>/dev/null || true
echo "✅ Cleaned up test images"

echo
echo "=== All tests passed! ==="
echo
echo "You can now run:"
echo "  make build    # Build all images"
echo "  make up       # Start all services"
echo "  make help     # See all available commands"