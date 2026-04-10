# HRMS PRO - API Documentation

## Authentication & Authorization

### `POST /api/auth/login`
- **Description**: Authenticate user and receive JWT token
- **Request Body**:
  ```json
  {
    "email": "user@hrms.com",
    "password": "password123"
  }
  ```
- **Response**: `ApiResponse<Map<String, String>>` with JWT token
- **Status Codes**: 200 (success), 401 (invalid credentials)

### `POST /api/auth/change-password`
- **Description**: Change current user's password
- **Request Body**: `ChangePasswordRequest` DTO
- **Authorization**: Bearer token required
- **Response**: `ApiResponse<Map<String, String>>`

## Employee Management

### `GET /api/employees/me`
- **Description**: Get current employee's profile
- **Response**: `ApiResponse<EmployeeProfileResponse>`
- **Authorization**: Any authenticated user

### `PUT /api/employees/me`
- **Description**: Update current employee's profile
- **Request Body**: `EmployeeProfileUpdate` DTO
- **Response**: `ApiResponse<EmployeeProfileResponse>`

### `GET /api/employees`
- **Description**: List all employees
- **Query Params**: `page`, `size` (pagination)
- **Authorization**: HR, ADMIN, SUPER_ADMIN, PAYROLL
- **Response**: `ApiResponse<PaginatedResponse<EmployeeSummaryResponse>>`

### `GET /api/employees/team`
- **Description**: Get manager's team members
- **Authorization**: MANAGER or SUPER_ADMIN
- **Response**: `ApiResponse<PaginatedResponse<EmployeeSummaryResponse>>`

### `GET /api/employees/search`
- **Description**: Search employees by name or email
- **Query Params**: `q` (search query, min 2 chars)
- **Response**: `ApiResponse<List<EmployeeSearchResult>>`

### `DELETE /api/employees/{employeeId}`
- **Description**: Soft-delete (terminate) an employee
- **Authorization**: HR, ADMIN, SUPER_ADMIN
- **Response**: `ApiResponse<EmployeeDeletionResponse>`

### `POST /api/employees/{employeeId}/reset-password`
- **Description**: Reset employee password to random value
- **Authorization**: dev@hrms.com, HR, ADMIN, SUPER_ADMIN, MANAGER
- **Response**: `ApiResponse<PasswordResetResponse>` (includes new password)

### `PUT /api/employees/{employeeId}`
- **Description**: Update another employee's profile (admin only)
- **Request Body**: `EmployeeAdminUpdate` DTO
- **Authorization**: HR, ADMIN, SUPER_ADMIN
- **Response**: `ApiResponse<EmployeeProfileResponse>`

## Departments

Department data is stored on employees and exposed via `/api/departments`. Listing is **role-scoped in the controller**: HR/Admin/Super Admin receive all departments; managers receive only departments they manage.

### `GET /api/departments/my`
- **Description**: Get the current user’s department (from their profile)
- **Authorization**: Any authenticated user
- **Response**: `ApiResponse<Department>` — 404 if the user has no department assigned

### `GET /api/departments`
- **Description**: List departments (filtered by role — see section intro)
- **Authorization**: HR, ADMIN, SUPER_ADMIN, MANAGER
- **Response**: `ApiResponse<List<Department>>`

### `GET /api/departments/{id}`
- **Description**: Get one department by ID
- **Authorization**: HR, ADMIN, SUPER_ADMIN
- **Response**: `ApiResponse<Department>`

### `POST /api/departments`
- **Description**: Create a department (`departmentName` required)
- **Request Body**: `Department` JSON (e.g. `departmentName`, optional fields as supported by the entity)
- **Authorization**: HR, ADMIN, SUPER_ADMIN
- **Response**: `ApiResponse<Department>` (201 Created)

### `PUT /api/departments/{id}`
- **Description**: Update a department
- **Request Body**: `Department` JSON
- **Authorization**: HR, ADMIN, SUPER_ADMIN
- **Response**: `ApiResponse<Department>`

### `DELETE /api/departments/{id}`
- **Description**: Delete a department (fails if employees are still assigned)
- **Authorization**: HR, ADMIN, SUPER_ADMIN
- **Response**: `ApiResponse<Void>`

## Attendance & NFC

### `POST /api/attendance/nfc-clock`
- **Description**: Clock in/out using NFC card
- **Request Body**: `NfcClockRequest` DTO
- **Response**: `ApiResponse<AttendanceRecordDto>`

### `PUT /api/attendance/report-fraud/{recordId}`
- **Description**: Flag attendance record as fraudulent
- **Request Body**: `FraudReportRequest` DTO
- **Authorization**: MANAGER or ADMIN
- **Response**: `ApiResponse<AttendanceRecordDto>`

### `PUT /api/attendance/manual-correction/{recordId}`
- **Description**: Manually correct attendance record
- **Request Body**: `ManualAttendanceCorrectionRequest` DTO
- **Authorization**: HR, ADMIN, SUPER_ADMIN
- **Response**: `ApiResponse<AttendanceRecordDto>`

## Leave Management

### `POST /api/leaves/request`
- **Description**: Submit leave request
- **Request Body**: `LeaveRequestDto`
- **Response**: `ApiResponse<IdResponseDto>` (request ID)

### `GET /api/leaves/my-requests`
- **Description**: Get current user's leave requests
- **Query Params**: `status` (optional), `page`, `size`
- **Response**: `ApiResponse<PaginatedResponse<LeaveRequestResponse>>`

### `GET /api/leaves/pending`
- **Description**: Get pending leave requests for approval
- **Authorization**: MANAGER or HR/ADMIN
- **Response**: `ApiResponse<PaginatedResponse<LeaveRequestResponse>>`

### `PUT /api/leaves/process/{requestId}`
- **Description**: Approve/reject leave request
- **Request Body**: `LeaveDecisionRequest` DTO
- **Authorization**: MANAGER or HR/ADMIN
- **Response**: `ApiResponse<LeaveRequestResponse>`

## Payroll

### `POST /api/payroll/calculate`
- **Description**: Calculate payroll for specific employee
- **Query Params**: `employeeId`, `month`, `year`
- **Authorization**: PAYROLL or SUPER_ADMIN
- **Response**: `ApiResponse<PayrollResponse>`

### `POST /api/payroll/calculate-all`
- **Description**: Calculate payroll for all active employees
- **Query Params**: `month`, `year`
- **Authorization**: PAYROLL or SUPER_ADMIN
- **Response**: `ApiResponse<PayrollBulkResult>`

### `GET /api/payroll/my-slips`
- **Description**: Get current user's payroll history
- **Query Params**: `page`, `size`
- **Response**: `ApiResponse<PaginatedResponse<PayrollResponse>>`

### `GET /api/payroll/history`
- **Description**: Get all payroll records
- **Authorization**: HR, ADMIN, SUPER_ADMIN, PAYROLL
- **Response**: `ApiResponse<PaginatedResponse<PayrollResponse>>`

### `GET /api/payroll/monthly`
- **Description**: Get monthly payroll slips
- **Query Params**: `month`, `year`, `page`, `size`
- **Authorization**: PAYROLL or SUPER_ADMIN
- **Response**: `ApiResponse<PaginatedResponse<PayrollResponse>>`

### `GET /api/payroll/summary`
- **Description**: Get payroll monthly summary
- **Query Params**: `month`, `year`
- **Authorization**: PAYROLL or SUPER_ADMIN
- **Response**: `ApiResponse<PayrollMonthlySummaryResponse>`

### `PUT /api/payroll/pay`
- **Description**: Mark payroll as paid
- **Query Params**: `employeeId`, `month`, `year`
- **Authorization**: PAYROLL or SUPER_ADMIN
- **Response**: `ApiResponse<PayrollResponse>`

### `PUT /api/payroll/pay-all`
- **Description**: Mark all payroll as paid for month/year
- **Query Params**: `month`, `year`
- **Authorization**: PAYROLL or SUPER_ADMIN
- **Response**: `ApiResponse<PayrollBulkResult>`

## Recruitment

### `POST /api/recruitment/request`
- **Description**: Submit new recruitment request
- **Request Body**: `RecruitmentRequestDto`
- **Authorization**: HR or SUPER_ADMIN
- **Response**: `ApiResponse<IdResponseDto>` (request ID)

### `GET /api/recruitment/pending`
- **Description**: Get pending recruitment requests
- **Query Params**: `department` (optional), `page`, `size`
- **Authorization**: MANAGER, HR, ADMIN, SUPER_ADMIN, PAYROLL
- **Response**: `ApiResponse<PaginatedResponse<RecruitmentRequestResponse>>`

### `GET /api/recruitment/my-requests`
- **Description**: Get requests created by current user
- **Query Params**: `page`, `size`
- **Response**: `ApiResponse<PaginatedResponse<RecruitmentRequestResponse>>`

### `GET /api/recruitment/all`
- **Description**: Get all recruitment requests
- **Query Params**: `status` (optional), `page`, `size`
- **Authorization**: HR, ADMIN, SUPER_ADMIN, PAYROLL
- **Response**: `ApiResponse<PaginatedResponse<RecruitmentRequestResponse>>`

### `PUT /api/recruitment/process/{requestId}`
- **Description**: Process (approve/reject) recruitment request
- **Request Body**: `ProcessRecruitmentRequestDto`
- **Authorization**: MANAGER, HR, ADMIN, SUPER_ADMIN, PAYROLL
- **Response**: `ApiResponse<ProcessRecruitmentResponse>` (may include credentials)

### `GET /api/recruitment/{requestId}`
- **Description**: Get specific recruitment request
- **Authorization**: Requester or authorized roles
- **Response**: `ApiResponse<RecruitmentRequestResponse>`

### `GET /api/recruitment/next-employee-id`
- **Description**: Get next available employee ID
- **Authorization**: HR, ADMIN, SUPER_ADMIN
- **Response**: `ApiResponse<IdResponseDto>`

## Advance Requests

### `POST /api/advances/request`
- **Description**: Submit salary advance request
- **Request Body**: `AdvanceRequestDto`
- **Response**: `ApiResponse<IdResponseDto>` (advance ID)

### `GET /api/advances/pending`
- **Description**: Get pending advance requests for current role
- **Authorization**: MANAGER, PAYROLL, SUPER_ADMIN
- **Response**: `ApiResponse<PaginatedResponse<AdvanceRequestResponse>>`

### `GET /api/advances/my-requests`
- **Description**: Get current user's advance requests
- **Query Params**: `page`, `size`
- **Response**: `ApiResponse<PaginatedResponse<AdvanceRequestResponse>>`

### `GET /api/advances/all`
- **Description**: Get all advance requests
- **Query Params**: `status` (optional), `page`, `size`
- **Authorization**: HR, ADMIN, SUPER_ADMIN, PAYROLL
- **Response**: `ApiResponse<PaginatedResponse<AdvanceRequestResponse>>`

### `PUT /api/advances/process/{advanceId}`
- **Description**: Process advance request
- **Request Body**: `ProcessAdvanceRequestDto`
- **Authorization**: MANAGER, PAYROLL, SUPER_ADMIN
- **Response**: `ApiResponse<StatusResponseDto>`

### `PUT /api/advances/deliver/{advanceId}`
- **Description**: Mark advance as delivered/paid
- **Authorization**: PAYROLL or SUPER_ADMIN
- **Response**: `ApiResponse<AdvanceDeliveryResponseDto>`

### `GET /api/advances/approved-awaiting-delivery`
- **Description**: Get approved advances awaiting delivery
- **Authorization**: PAYROLL or SUPER_ADMIN
- **Response**: `ApiResponse<PaginatedResponse<AdvanceRequestResponse>>`

### `GET /api/advances/delivered`
- **Description**: Get delivered advances for salary month/year
- **Query Params**: `month`, `year`, `page`, `size`
- **Authorization**: PAYROLL or SUPER_ADMIN
- **Response**: `ApiResponse<PaginatedResponse<AdvanceRequestResponse>>`

### `PUT /api/advances/deliver-all`
- **Description**: Deliver all approved advances for month/year
- **Query Params**: `month`, `year`
- **Authorization**: PAYROLL or SUPER_ADMIN
- **Response**: `ApiResponse<StatusResponseDto>`

### `GET /api/advances/report`
- **Description**: Get advance approval report
- **Query Params**: `month`, `year`
- **Authorization**: PAYROLL or SUPER_ADMIN
- **Response**: `ApiResponse<AdvanceApprovalReportResponse>`

### `GET /api/advances/id/{advanceId}`
- **Description**: Get specific advance request
- **Authorization**: Requester or HR/ADMIN/PAYROLL
- **Response**: `ApiResponse<AdvanceRequestResponse>`

## Admin & System Management

### `GET /api/admin/metrics`
- **Description**: Get system metrics
- **Response**: `ApiResponse<SystemMetricsDto>`

### `GET /api/admin/logs`
- **Description**: Get system logs
- **Query Params**: `page`, `size`
- **Response**: `ApiResponse<PaginatedResponse<SystemLog>>`

### `GET /api/admin/devices`
- **Description**: Get NFC devices
- **Query Params**: `page`, `size`
- **Response**: `ApiResponse<PaginatedResponse<NfcDeviceResponseDto>>`

### `DELETE /api/admin/logs`
- **Description**: Clear all system logs
- **Response**: `ApiResponse<StatusResponseDto>`

### `POST /api/admin/devices`
- **Description**: Add NFC device
- **Request Body**: `CreateNfcDeviceRequest` DTO
- **Response**: `ApiResponse<NfcDeviceResponseDto>`

### `PUT /api/admin/devices/{deviceId}/status`
- **Description**: Update device status
- **Request Body**: `Map<String, String>` with "status" field
- **Response**: `ApiResponse<NfcDeviceResponseDto>`

### `DELETE /api/admin/devices/{deviceId}`
- **Description**: Remove NFC device
- **Response**: `ApiResponse<StatusResponseDto>`

### `POST /api/admin/backup`
- **Description**: Trigger system backup
- **Response**: `ApiResponse<StatusResponseDto>`

## Inbox & Notifications

### `GET /api/inbox`
- **Description**: Get user's inbox messages
- **Query Params**: `archived` (boolean, optional), `page`, `size`
- **Response**: `ApiResponse<PaginatedResponse<InboxMessageResponse>>`

### `POST /api/inbox/send`
- **Description**: Send message to role or specific employee
- **Request Body**: `SendInboxMessageDto`
- **Authorization**: HR, ADMIN, SUPER_ADMIN
- **Response**: `ApiResponse<InboxActionResponseDto>`

### `PUT /api/inbox/{messageId}/read`
- **Description**: Mark message as read
- **Response**: `ApiResponse<InboxActionResponseDto>`

### `PUT /api/inbox/{messageId}/archive`
- **Description**: Archive message
- **Response**: `ApiResponse<InboxActionResponseDto>`

### `POST /api/inbox/{messageId}/reply`
- **Description**: Reply to message
- **Request Body**: `ReplyMessageDto`
- **Response**: `ApiResponse<InboxActionResponseDto>`

## NFC Card Management

### `POST /api/nfc/assign`
- **Description**: Assign NFC card to employee
- **Request Body**: `AssignNfcCardRequest`
- **Authorization**: HR, ADMIN, SUPER_ADMIN
- **Response**: `ApiResponse<NfcCardResponseDto>`

### `PUT /api/nfc/{cardId}/status`
- **Description**: Update NFC card status
- **Request Body**: `UpdateNfcCardStatusRequest`
- **Authorization**: HR, ADMIN, SUPER_ADMIN
- **Response**: `ApiResponse<NfcCardResponseDto>`

### `PUT /api/nfc/{cardId}/replace`
- **Description**: Replace lost/damaged NFC card
- **Request Body**: `ReplaceNfcCardRequest`
- **Authorization**: HR, ADMIN, SUPER_ADMIN
- **Response**: `ApiResponse<NfcCardResponseDto>`

## Reports

All report downloads are **binary file responses** (`Content-Disposition: attachment`). Each endpoint takes **`month`** and **`year`** (integers) only. Data covers the **whole organization for that calendar month** — there is **no `departmentId` or department filter** on these routes. For department-scoped views, use other APIs (e.g. recruitment pending with optional `department` query) or export then filter client-side.

### `GET /api/reports/attendance/pdf`
- **Description**: Attendance PDF for the given month/year
- **Query Params**: `month`, `year`
- **Authorization**: HR, ADMIN, SUPER_ADMIN, MANAGER
- **Response**: `application/pdf` file download

### `GET /api/reports/attendance/excel`
- **Description**: Attendance Excel (`.xlsx`) for the given month/year
- **Query Params**: `month`, `year`
- **Authorization**: HR, ADMIN, SUPER_ADMIN, MANAGER
- **Response**: Excel file download

### `GET /api/reports/payroll/pdf`
- **Description**: Payroll PDF for the given month/year
- **Query Params**: `month`, `year`
- **Authorization**: PAYROLL, SUPER_ADMIN
- **Response**: `application/pdf` file download

### `GET /api/reports/payroll/excel`
- **Description**: Payroll Excel for the given month/year
- **Query Params**: `month`, `year`
- **Authorization**: PAYROLL, SUPER_ADMIN
- **Response**: Excel file download

### `GET /api/reports/leave/pdf`
- **Description**: Leave PDF for the given month/year
- **Query Params**: `month`, `year`
- **Authorization**: HR, ADMIN, SUPER_ADMIN
- **Response**: `application/pdf` file download

### `GET /api/reports/leave/excel`
- **Description**: Leave Excel for the given month/year
- **Query Params**: `month`, `year`
- **Authorization**: HR, ADMIN, SUPER_ADMIN
- **Response**: Excel file download

### `GET /api/reports/recruitment/pdf`
- **Description**: Recruitment PDF for the given month/year
- **Query Params**: `month`, `year`
- **Authorization**: HR, ADMIN, SUPER_ADMIN
- **Response**: `application/pdf` file download

### `GET /api/reports/recruitment/excel`
- **Description**: Recruitment Excel for the given month/year
- **Query Params**: `month`, `year`
- **Authorization**: HR, ADMIN, SUPER_ADMIN
- **Response**: Excel file download

## Common Response Format

All endpoints return standardized `ApiResponse<T>`:

```json
{
  "status": 200,
  "message": "Operation successful",
  "data": { /* endpoint-specific data */ },
  "timestamp": "2024-04-07T10:30:00"
}
```

## Error Responses

- **400 Bad Request**: Validation errors, invalid parameters
- **401 Unauthorized**: Missing or invalid authentication
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource not found
- **500 Internal Server Error**: Server error

Validation errors include field-specific messages:
```json
{
  "status": 400,
  "message": "Validation failed",
  "data": {
    "fieldErrors": {
      "email": "Must be a valid email address",
      "password": "Password must be at least 8 characters"
    }
  },
  "timestamp": "2024-04-07T10:30:00"
}
```

## Pagination

List endpoints support pagination via `Pageable`:
- `page`: Page number (0-indexed)
- `size`: Items per page (default: 20)
- `sort`: Sort field and direction (e.g., `createdAt,desc`)

Response includes pagination metadata:
```json
{
  "items": [ /* array of items */ ],
  "total": 150,
  "page": 0,
  "pageSize": 20
}
```

## Swagger UI

Interactive API documentation available at:
- **Local**: http://localhost:8080/swagger-ui.html
- **OpenAPI Spec**: http://localhost:8080/v3/api-docs

## Authentication

All endpoints (except `/api/auth/login`) require JWT token in Authorization header:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Role-Based Access Control

| Role | Access Level |
|------|--------------|
| **EMPLOYEE** | Personal data, own requests; `GET /api/departments/my` |
| **MANAGER** | Team management, approvals; scoped `GET /api/departments` (managed departments only) |
| **HR** | Employee records, recruitment; full department list and CRUD |
| **PAYROLL** | Salary calculations, advances; payroll reports |
| **ADMIN** | System configuration; department CRUD |
| **SUPER_ADMIN** | Full system access |

*Last Updated: April 2026*
