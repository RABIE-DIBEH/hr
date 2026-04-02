# HRMS PRO - Final API Documentation

## 1. Authentication (Auth)
- `POST /api/auth/login`
  - Body: `{ "email": "ahmad@company.com", "password": "password123" }`
  - Response: `{ "token": "JWT_TOKEN_HERE" }`
  - Description: Validates credentials and returns a secure token.

## 2. Attendance & NFC
- `POST /api/attendance/nfc-clock`
  - Body: `{ "cardUid": "04:23:1A:FF" }`
  - Description: Toggles Check-In/Check-Out.
- `PUT /api/attendance/report-fraud/{recordId}`
  - Body: `{ "note": "..." }`
  - Description: Flags a record as fraud.

## 3. Leave Management
- `POST /api/leaves/request`
  - Body: `{ "leaveType": "Annual", "startDate": "2024-05-20", "endDate": "2024-05-22" }`
  - Description: Submits a leave request.

## 4. Payroll
- `POST /api/payroll/calculate`
  - Query: `employeeId=1&month=5&year=2024`
  - Description: Calculates monthly salary.

## 5. Administration
- Full role management and system health monitoring are available via the Admin Dashboard.
