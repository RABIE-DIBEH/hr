import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attendance API
export const clockByNfc = (cardUid: string) => 
  api.post('/attendance/nfc-clock', { cardUid });

// Leave API
export const submitLeaveRequest = (data: { leaveType: string, startDate: string, endDate: string }) =>
  api.post('/leaves/request', data);

export const getMyLeaveRequests = (employeeId: number) =>
  api.get(`/leaves/my-requests?employeeId=${employeeId}`);

// Payroll API
export const calculatePayroll = (employeeId: number, month: number, year: number) =>
  api.post(`/payroll/calculate?employeeId=${employeeId}&month=${month}&year=${year}`);

export default api;
