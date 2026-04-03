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

export const login = async (email: string, password: string) => {
  const { data } = await axios.post<{ token: string; message?: string }>(
    `${API_BASE_URL}/auth/login`,
    { email, password },
    { headers: { 'Content-Type': 'application/json' } }
  );
  if (data.token) {
    localStorage.setItem(AUTH_TOKEN_KEY, data.token);
  }
  return data;
};

export const logout = () => {
  localStorage.removeItem(AUTH_TOKEN_KEY);
};

export const getCurrentEmployee = () => api.get<EmployeeProfile>('/employees/me');

export const listEmployees = () => api.get<EmployeeSummary[]>('/employees');

export const listMyTeam = () => api.get<EmployeeSummary[]>('/employees/team');

export const clockByNfc = (cardUid: string) =>
  api.post('/attendance/nfc-clock', { cardUid });

export const submitLeaveRequest = (data: { leaveType: string; startDate: string; endDate: string }) =>
  api.post('/leaves/request', data);

export const getMyLeaveRequests = (employeeId?: number) =>
  employeeId != null
    ? api.get(`/leaves/my-requests?employeeId=${employeeId}`)
    : api.get('/leaves/my-requests');

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

export default api;
