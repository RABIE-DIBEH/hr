#!/bin/bash
set -euo pipefail

echo "Checking environment parity expectations"

required_env_vars=(
  DB_USERNAME
  DB_PASSWORD
  JWT_SECRET
)

missing=0
for key in "${required_env_vars[@]}"; do
  if ! grep -q "^${key}=" .env.example; then
    echo "Missing from .env.example: ${key}"
    missing=1
  fi
done

if ! grep -q "SPRING_PROFILES_ACTIVE: docker" docker-compose.yml; then
  echo "docker-compose.yml is missing the docker Spring profile"
  missing=1
fi

if ! grep -q "VITE_API_BASE_URL=/api" docker-compose.yml; then
  echo "docker-compose.yml is missing the frontend API base URL"
  missing=1
fi

if [ "${missing}" -ne 0 ]; then
  echo "Environment parity check failed"
  exit 1
fi

echo "Environment parity check passed"
