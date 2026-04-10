#!/bin/bash
# =============================================================================
# HRMS Database Backup & Restore Script
# Usage:
#   ./scripts/db-backup.sh backup   - Create a timestamped .sql dump
#   ./scripts/db-backup restore <file> - Restore from a .sql dump
#   ./scripts/db-backup list        - List available backups
# =============================================================================
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-backups}"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
BACKUP_FILE="${BACKUP_DIR}/hrms_backup_${TIMESTAMP}.sql"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

usage() {
    echo -e "${YELLOW}Usage:${NC}"
    echo -e "  $0 backup              - Create a timestamped database backup"
    echo -e "  $0 restore <file.sql>  - Restore from a backup file"
    echo -e "  $0 list                - List available backups"
    exit 1
}

create_backup() {
    mkdir -p "${BACKUP_DIR}"

    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] Starting database backup...${NC}"
    docker compose exec -T postgres pg_dump -U hrms_user hrms > "${BACKUP_FILE}"

    local file_size
    file_size=$(du -h "${BACKUP_FILE}" | cut -f1)
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] Backup created successfully: ${BACKUP_FILE} (${file_size})${NC}"
    echo ""
    echo -e "${YELLOW}To restore, run:${NC}"
    echo -e "  $0 restore ${BACKUP_FILE}"
}

restore_backup() {
    local restore_file="$1"

    if [[ ! -f "${restore_file}" ]]; then
        echo -e "${RED}Error: Backup file not found: ${restore_file}${NC}"
        exit 1
    fi

    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING: This will overwrite the current database.${NC}"
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] Restoring from: ${restore_file}${NC}"

    # Restore the database
    docker compose exec -T postgres psql -U hrms_user -d hrms < "${restore_file}"

    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] Database restored successfully from: ${restore_file}${NC}"
}

list_backups() {
    if [[ ! -d "${BACKUP_DIR}" ]] || [[ -z "$(ls -A "${BACKUP_DIR}"/*.sql 2>/dev/null)" ]]; then
        echo -e "${YELLOW}No backups found in ${BACKUP_DIR}${NC}"
        exit 0
    fi

    echo -e "${GREEN}Available backups in ${BACKUP_DIR}:${NC}"
    echo ""
    printf "%-50s %-10s %-20s\n" "FILE" "SIZE" "DATE"
    printf "%-50s %-10s %-20s\n" "----" "----" "----"
    for f in "${BACKUP_DIR}"/*.sql; do
        local size date_str
        size=$(du -h "$f" | cut -f1)
        date_str=$(stat -c '%y' "$f" 2>/dev/null | cut -d'.' -f1 || stat -f '%Sm' "$f" 2>/dev/null)
        printf "%-50s %-10s %-20s\n" "$(basename "$f")" "$size" "$date_str"
    done
}

# Main dispatch
case "${1:-}" in
    backup)
        create_backup
        ;;
    restore)
        if [[ -z "${2:-}" ]]; then
            echo -e "${RED}Error: Please specify a backup file to restore${NC}"
            echo ""
            usage
        fi
        restore_backup "$2"
        ;;
    list)
        list_backups
        ;;
    *)
        usage
        ;;
esac
