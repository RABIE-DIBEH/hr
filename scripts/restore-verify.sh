#!/bin/bash
set -euo pipefail

BACKUP_FILE="${1:-}"
VERIFY_DB="${VERIFY_DB:-hrms_restore_verify}"

if [ -z "${BACKUP_FILE}" ]; then
  echo "Usage: $0 <backup-file.sql>"
  exit 1
fi

if [ ! -f "${BACKUP_FILE}" ]; then
  echo "Backup file not found: ${BACKUP_FILE}"
  exit 1
fi

echo "Preparing temporary verification database: ${VERIFY_DB}"
docker compose exec -T postgres psql -U hrms_user -d postgres -c "DROP DATABASE IF EXISTS ${VERIFY_DB};"
docker compose exec -T postgres psql -U hrms_user -d postgres -c "CREATE DATABASE ${VERIFY_DB};"

echo "Restoring backup into ${VERIFY_DB}"
docker compose exec -T postgres psql -U hrms_user -d "${VERIFY_DB}" < "${BACKUP_FILE}"

echo "Running verification query"
docker compose exec -T postgres psql -U hrms_user -d "${VERIFY_DB}" -c "SELECT COUNT(*) AS public_tables FROM information_schema.tables WHERE table_schema = 'public';"

echo "Cleaning up ${VERIFY_DB}"
docker compose exec -T postgres psql -U hrms_user -d postgres -c "DROP DATABASE IF EXISTS ${VERIFY_DB};"

echo "Restore verification complete"
