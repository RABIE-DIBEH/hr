# HRMS Scripts Directory

## Overview
This directory contains operational scripts for database management, deployment, testing, and system maintenance. These scripts automate common tasks and ensure consistent operations across development, testing, and production environments.

## 📁 Scripts Overview

```
scripts/
├── db-backup.sh              # Phase 9: Database backup/restore utility
├── verify-setup.sh           # System verification script
├── run-tests.sh              # Comprehensive test runner
├── deploy.sh                 # Deployment automation
├── clean-docker.sh           # Docker cleanup utility
└── README.md                 # This file
```

## 🔧 Script Details

### 1. Database Backup Script (`db-backup.sh`) - Phase 9
**Purpose**: Comprehensive database backup and restore utility with disaster recovery capabilities.

**Features**:
- Timestamped backup files
- Backup listing and management
- Safe restore with confirmation
- Color-coded output for readability
- Integration with Docker Compose

**Usage**:
```bash
# Create a backup
./scripts/db-backup.sh backup

# Restore from backup
./scripts/db-backup.sh restore backups/hrms_backup_20260410_103000.sql

# List available backups
./scripts/db-backup.sh list
```

**Output Example**:
```
[2026-04-10 10:30:00] Starting database backup...
[2026-04-10 10:30:05] Backup created successfully: backups/hrms_backup_20260410_103000.sql (45MB)
```

### 2. System Verification Script (`verify-setup.sh`)
**Purpose**: Verify that all system components are properly configured and running.

**Checks**:
- Database connectivity
- Backend service status
- Frontend build capability
- Docker container health
- Environment variables

**Usage**:
```bash
./scripts/verify-setup.sh
```

### 3. Test Runner Script (`run-tests.sh`)
**Purpose**: Run comprehensive test suite across all components.

**Tests**:
- Backend unit and integration tests
- Frontend component tests
- API integration tests
- Database migration tests

**Usage**:
```bash
# Run all tests
./scripts/run-tests.sh

# Run specific test suite
./scripts/run-tests.sh backend
./scripts/run-tests.sh frontend
./scripts/run-tests.sh integration
```

### 4. Deployment Script (`deploy.sh`)
**Purpose**: Automated deployment pipeline for staging/production.

**Steps**:
1. Run comprehensive tests
2. Build Docker images
3. Push to container registry
4. Deploy to target environment
5. Run health checks

**Usage**:
```bash
# Deploy to staging
./scripts/deploy.sh staging

# Deploy to production
./scripts/deploy.sh production
```

### 5. Docker Cleanup Script (`clean-docker.sh`)
**Purpose**: Clean up Docker resources to free disk space.

**Cleans**:
- Stopped containers
- Dangling images
- Unused volumes
- Old build cache

**Usage**:
```bash
# Dry run (show what would be removed)
./scripts/clean-docker.sh --dry-run

# Clean everything
./scripts/clean-docker.sh --all

# Clean specific resources
./scripts/clean-docker.sh --containers
./scripts/clean-docker.sh --images
./scripts/clean-docker.sh --volumes
```

## 🚀 Quick Start

### Makefile Integration
All scripts are integrated with the project Makefile for convenience:

```bash
# Database operations
make db-backup
make db-restore file=backups/hrms_backup_20260410_103000.sql
make db-list

# Testing
make test-all
make test-backend
make test-frontend

# Deployment
make deploy-staging
make deploy-production

# Maintenance
make clean-docker
make verify-setup
```

### Environment Configuration
Scripts use environment variables for configuration:

```bash
# Set in your shell or .env file
export BACKUP_DIR="/path/to/backups"
export DOCKER_REGISTRY="your-registry.com"
export DEPLOY_ENV="staging"
```

## 🔒 Security Considerations

### Backup Security
1. **Encryption**: Backup files contain sensitive data - encrypt in production
2. **Access Control**: Restrict script execution to authorized users
3. **Audit Logging**: All backup/restore operations should be logged
4. **Retention Policy**: Implement backup rotation and retention

### Script Security
1. **Input Validation**: All scripts validate input parameters
2. **Error Handling**: Graceful failure with informative messages
3. **Permission Checks**: Verify user has necessary permissions
4. **Dry Run Option**: Preview actions before execution

## 📊 Monitoring & Logging

### Script Logging
All scripts implement consistent logging:

```bash
# Log format: [timestamp] [level] message
[2026-04-10 10:30:00] INFO Starting backup operation...
[2026-04-10 10:30:05] SUCCESS Backup completed successfully
[2026-04-10 10:30:06] WARNING Some warnings occurred
[2026-04-10 10:30:07] ERROR Operation failed with error
```

### Log Locations
- **Console**: Immediate feedback during execution
- **File Logs**: Persistent logs in `logs/` directory
- **System Logs**: Integration with system logging (syslog/journald)

## 🐳 Docker Integration

### Containerized Operations
Scripts support both local and Docker-based operations:

```bash
# Local PostgreSQL
./scripts/db-backup.sh backup

# Docker Compose
docker-compose exec postgres pg_dump -U hrms_user hrms > backup.sql

# Docker standalone
docker run --rm -v $(pwd)/backups:/backups postgres:15 pg_dump -U hrms_user hrms > /backups/backup.sql
```

### Health Checks
```bash
# Check Docker container health
./scripts/verify-setup.sh --docker

# Check service availability
curl -f http://localhost:8080/actuator/health || echo "Backend unhealthy"
curl -f http://localhost:5173 || echo "Frontend unhealthy"
```

## 🔄 Backup & Restore Procedures

### Regular Backup Schedule
```bash
# Add to crontab for daily backups
0 2 * * * /path/to/hrms/scripts/db-backup.sh backup >> /var/log/hrms-backup.log 2>&1

# Weekly full backup with rotation
0 3 * * 0 /path/to/hrms/scripts/db-backup.sh backup --full >> /var/log/hrms-backup-full.log 2>&1
```

### Disaster Recovery Procedure
1. **Identify latest backup**:
   ```bash
   ./scripts/db-backup.sh list
   ```

2. **Stop services**:
   ```bash
   docker-compose down
   ```

3. **Restore database**:
   ```bash
   ./scripts/db-backup.sh restore backups/hrms_backup_latest.sql
   ```

4. **Verify restoration**:
   ```bash
   ./scripts/verify-setup.sh --database
   ```

5. **Restart services**:
   ```bash
   docker-compose up -d
   ```

## 🧪 Testing Scripts

### Script Self-Tests
Each script includes self-validation:

```bash
# Test backup script
./scripts/db-backup.sh --test

# Test with mock data
./scripts/db-backup.sh --dry-run
```

### Integration Testing
```bash
# Test complete backup/restore cycle
./scripts/test-backup-cycle.sh

# Test deployment pipeline
./scripts/test-deployment.sh staging
```

## 📈 Performance Considerations

### Backup Optimization
1. **Incremental Backups**: Support for incremental backups
2. **Compression**: Automatic gzip compression for large backups
3. **Parallel Processing**: Multi-threaded operations where possible
4. **Resource Limits**: Configurable CPU/memory limits

### Script Performance
```bash
# Monitor script performance
time ./scripts/db-backup.sh backup

# Profile resource usage
/usr/bin/time -v ./scripts/deploy.sh staging
```

## 🛠️ Development Guidelines

### Adding New Scripts
1. **Template**: Use existing scripts as templates
2. **Documentation**: Include usage examples and parameters
3. **Testing**: Add test cases for new functionality
4. **Integration**: Update Makefile and verify-setup.sh

### Script Standards
1. **Shebang**: Always use `#!/bin/bash`
2. **Error Handling**: `set -euo pipefail` at top
3. **Logging**: Use consistent logging functions
4. **Colors**: Use ANSI colors for better readability
5. **Help**: Include `--help` option

### Example Script Template
```bash
#!/bin/bash
set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Logging functions
log_info() { echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] $*${NC}"; }
log_success() { echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] $*${NC}"; }
log_error() { echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] $*${NC}" >&2; }

# Usage
usage() {
    echo "Usage: $0 [options]"
    echo "Options:"
    echo "  --help     Show this help"
    echo "  --dry-run  Preview actions without executing"
    exit 1
}

# Main function
main() {
    local dry_run=false
    
    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --dry-run) dry_run=true ;;
            --help) usage ;;
            *) log_error "Unknown option: $1"; usage ;;
        esac
        shift
    done
    
    log_info "Starting operation..."
    
    if [[ "$dry_run" == true ]]; then
        log_info "Dry run mode - no changes will be made"
        # Preview actions
    else
        # Execute actions
        log_success "Operation completed successfully"
    fi
}

# Run main function
main "$@"
```

## 📞 Troubleshooting

### Common Issues

1. **Permission Denied**
   ```bash
   # Make scripts executable
   chmod +x scripts/*.sh
   
   # Check sudo requirements
   sudo ./scripts/db-backup.sh backup
   ```

2. **Database Connection Failed**
   ```bash
   # Check PostgreSQL service
   systemctl status postgresql
   
   # Test connection
   psql -U postgres -d hrms_db -c "SELECT 1"
   ```

3. **Docker Not Available**
   ```bash
   # Check Docker service
   systemctl status docker
   
   # Test Docker
   docker ps
   ```

4. **Script Errors**
   ```bash
   # Enable debug mode
   bash -x ./scripts/db-backup.sh backup
   
   # Check syntax
   bash -n ./scripts/db-backup.sh
   ```

### Debugging Tips
1. **Verbose Mode**: Use `--verbose` flag for detailed output
2. **Dry Run**: Test with `--dry-run` before actual execution
3. **Step Execution**: Run scripts step by step for debugging
4. **Log Review**: Check script logs for error details

## 🔄 Maintenance Schedule

### Daily Tasks
```bash
# Database backup
./scripts/db-backup.sh backup

# System verification
./scripts/verify-setup.sh
```

### Weekly Tasks
```bash
# Full system test
./scripts/run-tests.sh all

# Cleanup old backups
find backups/ -name "*.sql" -mtime +30 -delete

# Docker cleanup
./scripts/clean-docker.sh --all
```

### Monthly Tasks
```bash
# Security audit
./scripts/security-audit.sh

# Performance review
./scripts/performance-review.sh

# Update dependencies
./scripts/update-dependencies.sh
```

## 📄 License
Proprietary software. All rights reserved.

---

*Last Updated: April 2026*  
*Version: 1.0.0-stable*  
*Phase 9: Structural & Operational Lockdown - COMPLETE*