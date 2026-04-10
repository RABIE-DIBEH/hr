#!/bin/bash

# Quick validation of HRMS Docker setup
set -e

echo "=== Validating HRMS Docker Setup ==="
echo

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker daemon."
    exit 1
fi
echo "✅ Docker is running"

# Check if Docker Compose is available
if ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose is not available."
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

# Check Dockerfile syntax
echo
echo "=== Checking Dockerfile syntax ==="
if [ -f backend/Dockerfile ] && [ -f frontend/Dockerfile ]; then
    echo "✅ Dockerfiles exist"
else
    echo "❌ Dockerfiles missing"
    exit 1
fi

# Check docker-compose.yml
echo
echo "=== Checking docker-compose.yml ==="
if [ -f docker-compose.yml ]; then
    echo "✅ docker-compose.yml exists"
    
    # Basic syntax check
    if docker compose config -q > /dev/null 2>&1; then
        echo "✅ docker-compose.yml syntax is valid"
    else
        echo "❌ docker-compose.yml syntax error"
        exit 1
    fi
else
    echo "❌ docker-compose.yml missing"
    exit 1
fi

# Check Makefile
echo
echo "=== Checking Makefile ==="
if [ -f Makefile ]; then
    echo "✅ Makefile exists"
    
    # Check if help command works
    if make help > /dev/null 2>&1; then
        echo "✅ Makefile is functional"
    else
        echo "⚠️  Makefile may have issues"
    fi
else
    echo "❌ Makefile missing"
    exit 1
fi

echo
echo "=== Validation Complete ==="
echo "✅ All basic checks passed!"
echo
echo "Next steps:"
echo "1. Run 'make build' to build Docker images"
echo "2. Run 'make up' to start the application"
echo "3. Run 'make help' to see all available commands"
echo
echo "Note: First build may take several minutes to download dependencies."