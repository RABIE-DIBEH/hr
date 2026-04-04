import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';
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
    if (error.response?.status === 401) {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      window.location.href = '/login';
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
  roleId: number;
  roleName: string;
  managerId: number | null;
  baseSalary: string;
  status: string;
}

export interface EmployeeSummary {
  employeeId: number;
  fullName: string;
  email: string;
  teamId: number | null;
  teamName: string | null;
  cardUid: string | null;
  nfcLinked: boolean;
  nfcStatus: string | null;
  baseSalary: string;
  employmentStatus: string;
}

export interface AttendanceRecord {
  recordId: number;
  employee: EmployeeSummary;
  checkIn: string;
  checkOut?: string;
  workHours?: number;
  status: string;
  isVerifiedByManager: boolean;
  verifiedAt?: string;
  managerNotes?: string;
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
}

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

export const getCurrentEmployee = () => api.get<EmployeeProfile>('/employees/me');

export const listEmployees = () => api.get<EmployeeSummary[]>('/employees');

export const listMyTeam = () => api.get<EmployeeSummary[]>('/employees/team');

// Attendance API
export const getMyAttendance = () =>
  api.get<AttendanceRecord[]>('/attendance/my-records');

export const getManagerTodayAttendance = () =>
  api.get<AttendanceRecord[]>('/attendance/manager/today');

export const verifyAttendance = (recordId: number, note?: string) =>
  api.put(`/attendance/verify/${recordId}`, { note });

export const reportFraud = (recordId: number, note?: string) =>
  api.put(`/attendance/report-fraud/${recordId}`, { note });

export const clockByNfc = (cardUid: string) =>
  api.post('/attendance/nfc-clock', { cardUid });

// Admin API
export const getAdminMetrics = () => api.get<SystemMetrics>('/admin/metrics');
export const getSystemLogs = () => api.get<SystemLog[]>('/admin/logs');
export const getNfcDevices = () => api.get<NfcDevice[]>('/admin/devices');
export const clearSystemLogs = () => api.delete('/admin/logs');
export const addNfcDevice = (device: Partial<NfcDevice>) => api.post('/admin/devices', device);
export const triggerBackup = () => api.post('/admin/backup', {});
export const getHrMonthlyAttendance = (month: number, year: number) => 
  api.get<AttendanceRecord[]>(`/attendance/hr/monthly?month=${month}&year=${year}`);

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

// Recruitment Request APIs
export const submitRecruitmentRequest = (data: RecruitmentRequest) =>
  api.post('/recruitment/request', data);

export const getPendingRecruitmentRequests = (department?: string) =>
  department
    ? api.get<RecruitmentRequest[]>(`/recruitment/pending?department=${encodeURIComponent(department)}`)
    : api.get<RecruitmentRequest[]>('/recruitment/pending');

export const getMyRecruitmentRequests = () =>
  api.get<RecruitmentRequest[]>('/recruitment/my-requests');

export const getAllRecruitmentRequests = (status?: string) =>
  status
    ? api.get<RecruitmentRequest[]>(`/recruitment/all?status=${encodeURIComponent(status)}`)
    : api.get<RecruitmentRequest[]>('/recruitment/all');

export const processRecruitmentRequest = (requestId: number, status: string, note?: string) =>
  api.put(`/recruitment/process/${requestId}`, { status, note });

export const getRecruitmentRequest = (requestId: number) =>
  api.get<RecruitmentRequest>(`/recruitment/${requestId}`);

// Advance Request APIs
export const submitAdvanceRequest = (data: { amount: number; reason?: string }) =>
  api.post('/advances/request', data);

export const getPendingAdvanceRequests = () =>
  api.get<AdvanceRequest[]>('/advances/pending');

export const getMyAdvanceRequests = () =>
  api.get<AdvanceRequest[]>('/advances/my-requests');

export const getAllAdvanceRequests = (status?: string) =>
  status
    ? api.get<AdvanceRequest[]>(`/advances/all?status=${encodeURIComponent(status)}`)
    : api.get<AdvanceRequest[]>('/advances/all');

export const processAdvanceRequest = (advanceId: number, status: string, note?: string) =>
  api.put(`/advances/process/${advanceId}`, { status, note });

export const getAdvanceRequest = (advanceId: number) =>
  api.get<AdvanceRequest>(`/advances/${advanceId}`);

// Leave Request APIs
export const submitLeaveRequest = (data: { leaveType: string; startDate: string; endDate: string; duration: number; reason?: string }) =>
  api.post('/leaves/request', data);

export const getMyLeaveRequests = () =>
  api.get<LeaveRequest[]>('/leaves/my-requests');

export const getPendingLeavesForManager = (managerId: number) =>
  api.get<LeaveRequest[]>(`/leaves/manager/pending?managerId=${managerId}`);

export const getPendingLeavesForHr = () =>
  api.get<LeaveRequest[]>('/leaves/hr/pending');

export const processLeaveRequest = (requestId: number, status: string, note?: string) =>
  api.put(`/leaves/process/${requestId}`, { status, note });

// Inbox APIs
export interface InboxMessage {
  messageId: number;
  title: string;
  message: string;
  targetRole: string;
  senderName: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  createdAt: string;
  readAt?: string;
  archived: boolean;
}

export const getInbox = () =>
  api.get<InboxMessage[]>('/inbox');

export const getUnreadMessages = () =>
  api.get<InboxMessage[]>('/inbox/unread');

export const getUnreadCount = () =>
  api.get<{ count: number }>('/inbox/unread-count');

export const getHighPriorityMessages = () =>
  api.get<InboxMessage[]>('/inbox/high-priority');

export const markMessageAsRead = (messageId: number) =>
  api.put(`/inbox/${messageId}/read`);

export const markAllAsRead = () =>
  api.put('/inbox/read-all', {});

export const archiveMessage = (messageId: number) =>
  api.put(`/inbox/${messageId}/archive`);

export const sendMessage = (data: { title: string; message: string; targetRole: string; senderName?: string; priority?: string }) =>
  api.post('/inbox/send', data);

export default api;
