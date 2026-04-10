# Operations Runbook

## Monitoring

- Application health: `GET /api/health`
- Spring metrics: `GET /actuator/prometheus`
- Prometheus UI: `http://localhost:9090`

## Backup

- Manual backup: `./scripts/backup-daily.sh`
- Retention: `RETENTION_DAYS` defaults to `7`
- Suggested cron:

```cron
0 2 * * * cd /opt/hrms && ./scripts/backup-daily.sh >> /var/log/hrms-backup.log 2>&1
```

## Restore Verification

- Validate a backup safely:

```bash
./scripts/restore-verify.sh backups/hrms_YYYYMMDD_HHMMSS.sql
```

This restores into a temporary database and drops it after verification.

## Rollback

- Roll back to a known tag:

```bash
./scripts/rollback.sh v0.9-stable
```

The script checks out the tag in detached HEAD mode and rebuilds the stack.

## Environment Parity

- Verify expected environment wiring:

```bash
./scripts/check-env-parity.sh
```

## UAT Preparation

- Generate role-based UAT checklist:

```bash
./scripts/uat-role-scenarios.sh
```
