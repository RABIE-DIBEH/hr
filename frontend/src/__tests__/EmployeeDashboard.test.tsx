import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import EmployeeDashboard from '../pages/EmployeeDashboard';
import * as api from '../services/api';

// Mock the API services
vi.mock('../services/api', async () => {
  const actual = await vi.importActual('../services/api');
  return {
    ...actual,
    getCurrentEmployee: vi.fn(),
    getMyAdvanceRequests: vi.fn(),
    getMyLeaveRequests: vi.fn(),
    getMyPayrollSlipsPage: vi.fn(),
    getMyAttendancePage: vi.fn(),
  };
});

// Create a wrapper for React Query and Router
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        {children}
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('EmployeeDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mocks
    vi.mocked(api.getCurrentEmployee).mockResolvedValue({
      data: {
        employeeId: 1,
        fullName: 'John Doe',
        email: 'john@example.com',
        roleName: 'EMPLOYEE',
        teamName: 'Engineering',
        baseSalary: '5000',
        status: 'Active'
      }
    } as any);
    
    vi.mocked(api.getMyAdvanceRequests).mockResolvedValue({ data: [] } as any);
    vi.mocked(api.getMyLeaveRequests).mockResolvedValue({ data: [] } as any);
    vi.mocked(api.getMyPayrollSlipsPage).mockResolvedValue({ data: { items: [], totalPages: 0, totalCount: 0 } } as any);
    vi.mocked(api.getMyAttendancePage).mockResolvedValue({ data: { items: [], totalPages: 0, totalCount: 0 } } as any);
  });

  it('renders loading states initially', async () => {
    render(<EmployeeDashboard />, { wrapper: createWrapper() });
    
    await waitFor(() => {
      // Check for combined text content specifically in the H1
      const greeting = screen.getByText((_, element) => {
        return element?.tagName.toLowerCase() === 'h1' && 
               element?.textContent?.includes('مرحباً') === true && 
               element?.textContent?.includes('John Doe') === true;
      });
      expect(greeting).toBeDefined();
    });
  });

  it('renders the role and team information', async () => {
    render(<EmployeeDashboard />, { wrapper: createWrapper() });
    
    await waitFor(() => {
      const info = screen.getByText((_, element) => {
        return element?.tagName.toLowerCase() === 'p' &&
               element?.textContent?.includes('Engineering') === true && 
               element?.textContent?.includes('EMPLOYEE') === true;
      });
      expect(info).toBeDefined();
    });
  });

  it('renders main dashboard sections', async () => {
    render(<EmployeeDashboard />, { wrapper: createWrapper() });
    
    await waitFor(() => {
      expect(screen.getByText((_, element) => element?.tagName.toLowerCase() === 'p' && element?.textContent?.includes('ساعات الشهر') === true)).toBeDefined();
      expect(screen.getByText((_, element) => element?.tagName.toLowerCase() === 'p' && element?.textContent?.includes('رصيد الإجازات') === true)).toBeDefined();
      expect(screen.getByText((_, element) => element?.tagName.toLowerCase() === 'p' && element?.textContent?.includes('الراتب المتوقع') === true)).toBeDefined();
    });
  });

  it('shows unverified attendance warning if data is present', async () => {
    vi.mocked(api.getMyAttendancePage).mockResolvedValue({
      data: {
        items: [
          { recordId: 1, checkIn: '2024-05-20T09:00:00', status: 'Present', isVerifiedByManager: false }
        ],
        totalPages: 1,
        totalCount: 1
      }
    } as any);

    render(<EmployeeDashboard />, { wrapper: createWrapper() });
    
    await waitFor(() => {
      expect(screen.getAllByText((_, element) => element?.tagName.toLowerCase() === 'p' && element?.textContent?.includes('Verified') === true)).toBeDefined();
    });
  });
});
