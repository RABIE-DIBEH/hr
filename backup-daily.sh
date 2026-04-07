#!/bin/bash
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-backups}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
BACKUP_FILE="${BACKUP_DIR}/hrms_${TIMESTAMP}.sql"

mkdir -p "${BACKUP_DIR}"

echo "Creating backup at ${BACKUP_FILE}"
docker compose exec -T postgres pg_dump -U hrms_user hrms > "${BACKUP_FILE}"

echo "Pruning backups older than ${RETENTION_DAYS} days"
find "${BACKUP_DIR}" -type f -name 'hrms_*.sql' -mtime +"${RETENTION_DAYS}" -delete

echo "Backup complete"
