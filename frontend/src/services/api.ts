import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
export const AUTH_TOKEN_KEY = 'hrms_jwt';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-unwrap ApiResponse data field and handle 401
api.interceptors.response.use(
  (response) => {
    // If the response follows the ApiResponse structure, return the data field
    if (response.data && typeof response.data === 'object' && 'data' in response.data && 'status' in response.data) {
      return { ...response, data: response.data.data };
    }
    return response;
  },
  (error) => {
    // Only redirect to login on actual 401 Unauthorized (token expired/invalid)
    // Do NOT redirect on 403 Forbidden (permission denied) or 500 (server error)
    if (error.response?.status === 401) {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      // Only redirect if not already on the login page
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export interface EmployeeProfile {
  employeeId: number;
  fullName: string;
  email: string;
  teamId: number | null;
  teamName: string | null;
  departmentId: number | null;
  departmentName: string | null;
  roleId: number;
  roleName: string;
  managerId: number | null;
  baseSalary: string;
  status: string;
  mobileNumber?: string;
  address?: string;
  nationalId?: string;
  avatarUrl?: string;
  leaveBalanceDays?: number;
}

export interface EmployeeProfileUpdatePayload {
  fullName: string;
  email: string;
  mobileNumber?: string;
  address?: string;
  nationalId?: string;
  avatarUrl?: string;
}

export interface EmployeeAdminUpdatePayload {
  fullName: string;
  email: string;
  mobileNumber?: string;
  address?: string;
  nationalId?: string;
  avatarUrl?: string;
  teamId?: number | null;
  departmentId?: number | null;
  roleId?: number | null;
  managerId?: number | null;
  baseSalary?: string | null;
  employmentStatus?: string | null;
}

export interface EmployeeSummary {
  employeeId: number;
  fullName: string;
  email: string;
  teamId: number | null;
  teamName: string | null;
  departmentId: number | null;
  departmentName: string | null;
  cardUid: string | null;
  nfcLinked: boolean;
  nfcStatus: string | null;
  baseSalary: string;
  employmentStatus: string;
  roleId: number | null;
  roleName: string;
  mobileNumber?: string;
  address?: string;
  nationalId?: string;
}

export interface EmployeeDeletionResponse {
  employeeId: number;
  fullName: string;
  email: string;
  previousStatus: string;
  newStatus: string;
  archivedBy: number;
  archivedByName: string;
  reason: string;
  archivedAt: string;
}

export interface ArchiveEmployeePayload {
  reason: string;
}

export interface PasswordResetResponse {
  employeeId: number;
  fullName: string;
  email: string;
  newPassword: string;
  resetBy: number;
  resetByName: string;
}

export interface AttendanceRecord {
  recordId: number;
  employeeId: number;
  employeeName: string;
  employeeEmail: string;
  checkIn: string;
  checkOut?: string;
  workHours?: number;
  status: string;
  isVerifiedByManager: boolean;
  verifiedAt?: string;
  managerNotes?: string;
  reviewStatus?: string;
  payrollStatus?: string;
  manuallyAdjusted: boolean;
  manuallyAdjustedAt?: string;
  manuallyAdjustedBy?: number;
  manualAdjustmentReason?: string;
}

export interface ManualAttendanceCorrectionPayload {
  checkIn?: string;
  checkOut?: string;
  reason: string;
  approveForPayroll?: boolean;
}

export interface SystemLog {
  logId: number;
  action: string;
  originUser: string;
  timestamp: string;
  status: string;
}

export interface NfcDevice {
  deviceId: string;
  name: string;
  status: string;
  systemLoad: string;
}

export interface NfcCard {
  cardId?: number;
  uid: string;
  employeeId: number;
  employeeName: string;
  status: 'Active' | 'Inactive' | 'Blocked';
  issuedDate?: string | null;
}

interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
}

export interface PaginationParams {
  page?: number;
  size?: number;
}

export type PaginatedList<T> = PaginatedResponse<T>;

export interface SystemMetrics {
  cpu: string;
  storage: string;
  uptime: string;
  uptimeStr: string;
  status: string;
}

export interface RecruitmentRequest {
  requestId?: number;
  fullName: string;
  email: string;
  nationalId: string;
  address: string;
  jobDescription: string;
  department: string;
  age: number;
  insuranceNumber?: string;
  healthNumber?: string;
  militaryServiceStatus: string;
  maritalStatus: string;
  numberOfChildren?: number;
  mobileNumber: string;
  expectedSalary: number;
  requestedBy?: number;
  requestedByName?: string;
  status?: string;
  managerNote?: string;
  requestedAt?: string;
  processedAt?: string;
  approvedBy?: number;
  employeeId?: number;
  autoGenerateEmployeeId?: boolean;
}

// Backend returns a dedicated RecruitmentRequestResponse DTO. For now it matches the frontend shape.
export type RecruitmentRequestResponse = RecruitmentRequest;

export interface AdvanceRequest {
  advanceId?: number;
  employeeId?: number;
  employeeName?: string;
  amount: number;
  reason?: string;
  status?: string;
  requestedAt?: string;
  processedAt?: string;
  processedBy?: number;
  processedByName?: string;
  paidAt?: string;
  hrNote?: string;
}

export interface LeaveRequest {
  requestId?: number;
  employeeId?: number;
  employeeName?: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  duration: number;
  reason?: string;
  status?: string;
  managerNote?: string;
  requestedAt?: string;
}

export interface LeaveBalanceReportResponse {
  employeeId: number;
  fullName: string;
  email: string;
  departmentName: string;
  status: string;
  leaveBalanceDays: number;
  overtimeBalanceHours: number;
}

/** 
 * Typed response from the login endpoint 
 * Matches the backend ApiResponse<Map<string, string>>
 */
interface LoginResponse {
  status: number;
  message: string;
  data: {
    token: string;
  };
}

export const login = async (email: string, password: string) => {
  // Use raw axios to avoid the ApiResponse auto-unwrap interceptor
  // since login response structure is different
  const { data } = await axios.post<LoginResponse>(
    `${API_BASE_URL}/auth/login`,
    { email, password },
    { headers: { 'Content-Type': 'application/json' } }
  );

  // Extract token from the nested data field in ApiResponse
  const token = data.data?.token;
  if (token) {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  }
  return data;
};

export const logout = () => {
  localStorage.removeItem(AUTH_TOKEN_KEY);
};

export const changePassword = (data: { currentPassword: string; newPassword: string }) =>
  api.post('/auth/change-password', data);

export const getCurrentEmployee = () => api.get<EmployeeProfile>('/employees/me');

export const searchEmployees = (query: string) =>
  api.get<{ employeeId: number; fullName: string; email: string; status: string }[]>(`/employees/search?q=${encodeURIComponent(query)}`);

export const updateProfileMe = (data: EmployeeProfileUpdatePayload) =>
  api.put<EmployeeProfile>('/employees/me', data);

export const updateEmployee = (employeeId: number, data: EmployeeAdminUpdatePayload) =>
  api.put<EmployeeProfile>(`/employees/${employeeId}`, data);

export const archiveEmployee = (employeeId: number, payload: ArchiveEmployeePayload) =>
  api.post<EmployeeDeletionResponse>(`/employees/${employeeId}/archive`, payload);

export const resetEmployeePassword = (employeeId: number) =>
  api.post<PasswordResetResponse>(`/employees/${employeeId}/reset-password`);

export const listEmployees = () => getPaginatedItems<EmployeeSummary>('/employees');
export const listEmployeesPage = (params?: PaginationParams) =>
  getPaginatedPage<EmployeeSummary>('/employees', params);

export const listMyTeam = () => getPaginatedItems<EmployeeSummary>('/employees/team');
export const listMyTeamPage = (params?: PaginationParams) =>
  getPaginatedPage<EmployeeSummary>('/employees/team', params);

const buildPaginatedPath = (path: string, page: number, pageSize: number) => {
  const separator = path.includes('?') ? '&' : '?';
  return `${path}${separator}page=${page}&size=${pageSize}`;
};

const getPaginatedPage = async <T>(path: string, params: PaginationParams = {}) => {
  const page = params.page ?? 0;
  const size = params.size ?? 20;
  const response = await api.get<PaginatedResponse<T>>(buildPaginatedPath(path, page, size));
  return {
    data: response.data as PaginatedList<T>,
  };
};

const getPaginatedItems = async <T>(path: string, pageSize = 100) => {
  let page = 0;
  let hasNext = true;
  let items: T[] = [];

  while (hasNext) {
    const response = await api.get<PaginatedResponse<T>>(buildPaginatedPath(path, page, pageSize));
    items = items.concat(response.data.items);
    hasNext = response.data.hasNext;
    page += 1;

    if (page > 100) {
      throw new Error(`Exceeded pagination safety limit for ${path}`);
    }
  }

  return {
    data: items,
  };
};

// Attendance API
export const getMyAttendance = () =>
  getPaginatedItems<AttendanceRecord>('/attendance/my');

export const getMyAttendancePage = (params?: PaginationParams) =>
  getPaginatedPage<AttendanceRecord>('/attendance/my', params);

export const getManagerTodayAttendance = () =>
  getPaginatedItems<AttendanceRecord>('/attendance/manager/today');

export const getManagerTodayAttendancePage = (params?: PaginationParams) =>
  getPaginatedPage<AttendanceRecord>('/attendance/manager/today', params);

export const verifyAttendance = (recordId: number, note?: string) =>
  api.put(`/attendance/verify/${recordId}`, { note });

export const reportFraud = (recordId: number, note?: string) =>
  api.put(`/attendance/report-fraud/${recordId}`, { note });

export const manuallyCorrectAttendance = (
  recordId: number,
  data: ManualAttendanceCorrectionPayload,
) => api.put(`/attendance/manual-correct/${recordId}`, data);

export const clockByNfc = (cardUid: string) =>
  api.post('/attendance/nfc-clock', { cardUid });

// Admin API
export const getAdminMetrics = () => api.get<SystemMetrics>('/admin/metrics');
export const getSystemLogs = () => getPaginatedItems<SystemLog>('/admin/logs');
export const getSystemLogsPage = (params?: PaginationParams) =>
  getPaginatedPage<SystemLog>('/admin/logs', params);
export const getNfcDevices = () => getPaginatedItems<NfcDevice>('/admin/devices');
export const getNfcDevicesPage = (params?: PaginationParams) =>
  getPaginatedPage<NfcDevice>('/admin/devices', params);
export const clearSystemLogs = () => api.delete('/admin/logs');
export const addNfcDevice = (device: Pick<NfcDevice, 'deviceId' | 'name' | 'status' | 'systemLoad'>) =>
  api.post<NfcDevice>('/admin/devices', device);

export const updateNfcDeviceStatus = (deviceId: string, status: string) =>
  api.put<NfcDevice>(`/admin/devices/${deviceId}/status`, { status });

export const deleteNfcDevice = (deviceId: string) =>
  api.delete(`/admin/devices/${deviceId}`);
export const triggerBackup = () => api.post<{ status: string }>('/admin/backup', {});
export const getHrMonthlyAttendance = (month: number, year: number) => 
  getPaginatedItems<AttendanceRecord>(`/attendance/hr/monthly?month=${month}&year=${year}`);

export const getHrMonthlyAttendancePage = (month: number, year: number, params?: PaginationParams) =>
  getPaginatedPage<AttendanceRecord>(`/attendance/hr/monthly?month=${month}&year=${year}`, params);

// NFC card management API
export const getEmployeeNfcCard = (employeeId: number) =>
  api.get<NfcCard>(`/nfc-cards/employees/${employeeId}`);

export const assignEmployeeNfcCard = (employeeId: number, uid: string) =>
  api.post<NfcCard>(`/nfc-cards/employees/${employeeId}`, { uid });

export const replaceEmployeeNfcCard = (employeeId: number, newUid: string) =>
  api.put<NfcCard>(`/nfc-cards/employees/${employeeId}/replace`, { newUid });

export const updateEmployeeNfcCardStatus = (
  employeeId: number,
  status: 'ACTIVE' | 'INACTIVE' | 'BLOCKED',
) => api.put<NfcCard>(`/nfc-cards/employees/${employeeId}/status`, { status });

export const unassignEmployeeNfcCard = (employeeId: number) =>
  api.delete<{ status: string }>(`/nfc-cards/employees/${employeeId}`);

export const calculatePayroll = (month: number, year: number, employeeId?: number) => {
  const params = new URLSearchParams({
    month: String(month),
    year: String(year),
  });
  if (employeeId != null) {
    params.set('employeeId', String(employeeId));
  }
  return api.post(`/payroll/calculate?${params.toString()}`);
};

export const calculateAllPayroll = (month: number, year: number) =>
  api.post<PayrollBulkResult>(`/payroll/calculate-all?month=${month}&year=${year}`);

// Recruitment Request APIs
export const submitRecruitmentRequest = (data: RecruitmentRequest) =>
  api.post('/recruitment/request', data);

export const getNextEmployeeId = () =>
  api.get<{ id: number }>('/recruitment/next-employee-id');

export const getPendingRecruitmentRequests = (department?: string) =>
  department
    ? getPaginatedItems<RecruitmentRequest>(`/recruitment/pending?department=${encodeURIComponent(department)}`)
    : getPaginatedItems<RecruitmentRequest>('/recruitment/pending');

export const getPendingRecruitmentRequestsPage = (params?: PaginationParams, department?: string) =>
  department
    ? getPaginatedPage<RecruitmentRequest>(`/recruitment/pending?department=${encodeURIComponent(department)}`, params)
    : getPaginatedPage<RecruitmentRequest>('/recruitment/pending', params);

export const getMyRecruitmentRequests = () =>
  getPaginatedItems<RecruitmentRequest>('/recruitment/my-requests');

export const getAllRecruitmentRequests = (status?: string) =>
  status
    ? getPaginatedItems<RecruitmentRequest>(`/recruitment/all?status=${encodeURIComponent(status)}`)
    : getPaginatedItems<RecruitmentRequest>('/recruitment/all');

export const processRecruitmentRequest = (requestId: number, status: string, note?: string, salary?: number) =>
  api.put<ProcessRecruitmentResponse>(`/recruitment/process/${requestId}`, { status, note, salary });

export const getRecruitmentRequest = (requestId: number) =>
  api.get<RecruitmentRequest>(`/recruitment/${requestId}`);

// Advance Request APIs
export const submitAdvanceRequest = (data: { amount: number; reason?: string }) =>
  api.post('/advances/request', data);

export const getPendingAdvanceRequests = () =>
  getPaginatedItems<AdvanceRequest>('/advances/pending');

export const getPendingAdvanceRequestsPage = (params?: PaginationParams) =>
  getPaginatedPage<AdvanceRequest>('/advances/pending', params);

export const getApprovedAdvancesAwaitingDeliveryPage = (params?: PaginationParams) =>
  getPaginatedPage<AdvanceRequest>('/advances/approved-awaiting-delivery', params);

export const getDeliveredAdvancesPage = (month: number, year: number, params?: PaginationParams) =>
  getPaginatedPage<AdvanceRequest>(`/advances/delivered?month=${month}&year=${year}`, params);

export const getMyAdvanceRequests = () =>
  getPaginatedItems<AdvanceRequest>('/advances/my-requests');

export const getAllAdvanceRequests = (status?: string) =>
  status
    ? getPaginatedItems<AdvanceRequest>(`/advances/all?status=${encodeURIComponent(status)}`)
    : getPaginatedItems<AdvanceRequest>('/advances/all');

export const getAllAdvanceRequestsPage = (params?: PaginationParams, status?: string) =>
  status
    ? getPaginatedPage<AdvanceRequest>(`/advances/all?status=${encodeURIComponent(status)}`, params)
    : getPaginatedPage<AdvanceRequest>('/advances/all', params);

export const processAdvanceRequest = (
  advanceId: number,
  status: string,
  note?: string,
  amount?: number,
  reason?: string,
) =>
  api.put(`/advances/process/${advanceId}`, { status, note, amount, reason });

export const deliverAdvanceRequest = (advanceId: number) =>
  api.put(`/advances/deliver/${advanceId}`);

export const deliverAllApprovedAdvances = (month: number, year: number) =>
  api.put<{ status: string }>(`/advances/deliver-all?month=${month}&year=${year}`);

export interface AdvanceApprovalReportResponse {
  month: number;
  year: number;
  totalCount: number;
  totalAmount: number | string;
  items: AdvanceRequest[];
}

export const getAdvanceApprovalReport = (month: number, year: number) =>
  api.get<AdvanceApprovalReportResponse>(`/advances/report?month=${month}&year=${year}`);

export const getPaidAdvanceRequests = () =>
  getPaginatedItems<AdvanceRequest>('/advances/all?status=DELIVERED');

export const getAdvanceRequest = (advanceId: number) =>
  api.get<AdvanceRequest>(`/advances/id/${advanceId}`);

// Payroll slip API
export const getMyPayrollSlips = () =>
  getPaginatedItems<PayrollSlip>('/payroll/my-slips');
export const getMyPayrollSlipsPage = (params?: PaginationParams) =>
  getPaginatedPage<PayrollSlip>('/payroll/my-slips', params);

export const getAllPayrollHistory = () =>
  getPaginatedItems<PayrollSlip>('/payroll/history');
export const getAllPayrollHistoryPage = (params?: PaginationParams) =>
  getPaginatedPage<PayrollSlip>('/payroll/history', params);

export interface PayrollSlip {
  payrollId: number;
  employeeId: number;
  employeeName: string;
  month: number;
  year: number;
  totalWorkHours: number;
  overtimeHours: number;
  deductions: number;
  netSalary: number;
  generatedAt: string;
  paid?: boolean;
  paidAt?: string | null;
}

export interface PayrollMonthlySummaryResponse {
  month: number;
  year: number;
  totalSlips: number;
  paidSlips: number;
  totalNetSalary: number;
  isLocked: boolean;
}

export const getMonthlyPayrollPage = (month: number, year: number, params?: PaginationParams) =>
  getPaginatedPage<PayrollSlip>(`/payroll/monthly?month=${month}&year=${year}`, params);

export const getPayrollMonthlySummary = (month: number, year: number) =>
  api.get<PayrollMonthlySummaryResponse>(`/payroll/summary?month=${month}&year=${year}`);

export const markPayrollPaid = (month: number, year: number, employeeId: number) =>
  api.put(`/payroll/pay?employeeId=${employeeId}&month=${month}&year=${year}`);

export const markAllPayrollPaid = (month: number, year: number) =>
  api.put(`/payroll/pay-all?month=${month}&year=${year}`);

export interface PayrollBulkResult {
  month: number;
  year: number;
  successCount: number;
  errorCount: number;
  totalProcessed: number;
  requester: string;
}

export type CalculateAllPayrollResult = PayrollBulkResult;

export interface ProcessRecruitmentResponse {
  request: RecruitmentRequestResponse;
  // When the request isn't at "final approval" yet, backend returns null (or may omit if configured to exclude nulls).
  username?: string | null;
  password?: string | null;
  employeeId?: string | null;
}

// Leave Request APIs
export const submitLeaveRequest = (data: { leaveType: string; startDate: string; endDate: string; duration: number; reason?: string }) =>
  api.post('/leaves/request', data);

export const getMyLeaveRequests = () =>
  getPaginatedItems<LeaveRequest>('/leaves/my-requests');

export const getPendingLeavesForManager = (managerId: number) =>
  getPaginatedItems<LeaveRequest>(`/leaves/manager/pending?managerId=${managerId}`);

export const getPendingLeavesForManagerPage = (managerId: number, params?: PaginationParams) =>
  getPaginatedPage<LeaveRequest>(`/leaves/manager/pending?managerId=${managerId}`, params);

export const getPendingLeavesForHr = () =>
  getPaginatedItems<LeaveRequest>('/leaves/hr/pending');

export const getPendingLeavesForHrPage = (params?: PaginationParams) =>
  getPaginatedPage<LeaveRequest>('/leaves/hr/pending', params);

export const processLeaveRequest = (requestId: number, status: string, note?: string) =>
  api.put(`/leaves/process/${requestId}`, { status, note });

export const getLeaveCalendar = (start: string, end: string) =>
  api.get<LeaveRequest[]>(`/leaves/calendar?start=${start}&end=${end}`);

export const getLeaveBalanceReport = () =>
  api.get<LeaveBalanceReportResponse[]>('/leaves/balance-report');

// Report API 
export const downloadAttendancePdf = (month: number, year: number) =>
  api.get(`/reports/attendance/pdf?month=${month}&year=${year}`, { responseType: 'blob' });

export const downloadAttendanceExcel = (month: number, year: number) =>
  api.get(`/reports/attendance/excel?month=${month}&year=${year}`, { responseType: 'blob' });

export const downloadPayrollPdf = (month: number, year: number) =>
  api.get(`/reports/payroll/pdf?month=${month}&year=${year}`, { responseType: 'blob' });

export const downloadPayrollExcel = (month: number, year: number) =>
  api.get(`/reports/payroll/excel?month=${month}&year=${year}`, { responseType: 'blob' });

export const downloadLeavePdf = (month: number, year: number) =>
  api.get(`/reports/leave/pdf?month=${month}&year=${year}`, { responseType: 'blob' });

export const downloadLeaveExcel = (month: number, year: number) =>
  api.get(`/reports/leave/excel?month=${month}&year=${year}`, { responseType: 'blob' });

export const downloadRecruitmentPdf = (month: number, year: number) =>
  api.get(`/reports/recruitment/pdf?month=${month}&year=${year}`, { responseType: 'blob' });

export const downloadRecruitmentExcel = (month: number, year: number) =>
  api.get(`/reports/recruitment/excel?month=${month}&year=${year}`, { responseType: 'blob' });

export interface Department {
  departmentId: number;
  departmentName: string;
  departmentCode?: string;
  managerId?: number | null;
  description?: string | null;
  createdAt?: string;
}

export interface InboxMessage {
  messageId: number;
  title: string;
  message: string;
  targetRole: string;
  senderName: string;
  senderEmployeeId?: number;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  createdAt: string;
  readAt?: string;
  archived: boolean;
  isRead?: boolean;
  replyTo?: number;
  replyCount?: number;
}

export const getInbox = () =>
  getPaginatedItems<InboxMessage>('/inbox');

export const getInboxPage = (params?: PaginationParams) =>
  getPaginatedPage<InboxMessage>('/inbox', params);

export const getUnreadMessages = () =>
  getPaginatedItems<InboxMessage>('/inbox/unread');

export const getUnreadMessagesPage = (params?: PaginationParams) =>
  getPaginatedPage<InboxMessage>('/inbox/unread', params);

export const getUnreadCount = () =>
  api.get<{ unreadCount: number }>('/inbox/unread-count');

export const getHighPriorityMessages = () =>
  getPaginatedItems<InboxMessage>('/inbox/high-priority');

export const getHighPriorityMessagesPage = (params?: PaginationParams) =>
  getPaginatedPage<InboxMessage>('/inbox/high-priority', params);

export const markMessageAsRead = (messageId: number) =>
  api.put(`/inbox/${messageId}/read`);

export const markAllAsRead = () =>
  api.put('/inbox/read-all', {});

export const archiveMessage = (messageId: number) =>
  api.put(`/inbox/${messageId}/archive`);

export const getArchivedMessages = () =>
  getPaginatedItems<InboxMessage>('/inbox/archived');

export const getArchivedMessagesPage = (params?: PaginationParams) =>
  getPaginatedPage<InboxMessage>('/inbox/archived', params);

export const deleteMessage = (messageId: number) =>
  api.delete(`/inbox/${messageId}`);

export const sendMessage = (data: { title: string; message: string; targetRole: string; senderName?: string; priority?: string }) =>
  api.post('/inbox/send', data);

// New messaging APIs
export const replyToMessage = (messageId: number, message: string) =>
  api.post<InboxMessage>(`/inbox/${messageId}/reply`, { replyTo: messageId, message });

export const getMessageThread = (messageId: number) =>
  api.get<InboxMessage[]>(`/inbox/${messageId}/thread`);

export const sendToEmployee = (data: { targetEmployeeId: number; title: string; message: string; priority?: string }) =>
  api.post<InboxMessage>('/inbox/send-to-employee', data);

export const getSentMessages = () =>
  getPaginatedItems<InboxMessage>('/inbox/sent');

export const getSentMessagesPage = (params?: PaginationParams) =>
  getPaginatedPage<InboxMessage>('/inbox/sent', params);

export const getConversation = (employeeId: number) =>
  getPaginatedItems<InboxMessage>(`/inbox/conversation/${employeeId}`);

export const getConversationPage = (employeeId: number, params?: PaginationParams) =>
  getPaginatedPage<InboxMessage>(`/inbox/conversation/${employeeId}`, params);

// Department API
export const getAllDepartments = () =>
  api.get<Department[]>('/departments').then(r => r.data);

export const getMyDepartment = () =>
  api.get<Department>('/departments/my').then(r => r.data);

export const getDepartmentById = (departmentId: number) =>
  api.get<Department>(`/departments/${departmentId}`).then(r => r.data);

export const createDepartment = (data: Partial<Department>) =>
  api.post<Department>('/departments', data).then(r => r.data);

export const updateDepartment = (departmentId: number, data: Partial<Department>) =>
  api.put<Department>(`/departments/${departmentId}`, data).then(r => r.data);

export const deleteDepartment = (departmentId: number) =>
  api.delete(`/departments/${departmentId}`).then(r => r.data);

export default api;
