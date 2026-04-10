#!/bin/bash
set -euo pipefail

OUTPUT_DIR="${OUTPUT_DIR:-uat}"
OUTPUT_FILE="${OUTPUT_DIR}/UAT_ROLE_SCENARIOS.md"

mkdir -p "${OUTPUT_DIR}"

cat > "${OUTPUT_FILE}" <<'EOF'
# UAT Role Scenarios

## Admin
- Login with `admin@hrms.com`
- View system metrics and logs
- Manage NFC devices
- Trigger backup

## HR
- Login with `hr@hrms.com`
- Approve leave requests
- Review recruitment requests
- Manage employee NFC assignments

## Manager
- Login with `manager@hrms.com`
- Approve direct-report leave requests
- Review team attendance
- Review advance requests

## Employee
- Login with `employee@hrms.com`
- Submit leave request
- Submit advance request
- Clock in with seeded NFC test card

## Expected Evidence
- Capture API/HTTP status for critical actions
- Record UI screenshots for each completed workflow
- Log actual result vs expected result for any failure
EOF

echo "Generated ${OUTPUT_FILE}"
