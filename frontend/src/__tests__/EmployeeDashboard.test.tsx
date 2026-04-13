import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import EmployeeDashboard from '../pages/EmployeeDashboard';
import * as api from '../services/api';
import type { PaginatedList } from '../services/api';

const mockPaginated = <T,>(items: T[]): PaginatedList<T> => ({
  items,
  totalCount: items.length,
  page: 0,
  pageSize: 20,
  totalPages: 1,
  hasNext: false,
});

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
    } as Awaited<ReturnType<typeof api.getCurrentEmployee>>);

    vi.mocked(api.getMyAdvanceRequests).mockResolvedValue({ data: [] } as Awaited<ReturnType<typeof api.getMyAdvanceRequests>>);
    vi.mocked(api.getMyLeaveRequests).mockResolvedValue({ data: [] } as Awaited<ReturnType<typeof api.getMyLeaveRequests>>);
    vi.mocked(api.getMyPayrollSlipsPage).mockResolvedValue({ data: mockPaginated([]) } as Awaited<ReturnType<typeof api.getMyPayrollSlipsPage>>);
    vi.mocked(api.getMyAttendancePage).mockResolvedValue({ data: mockPaginated([]) } as Awaited<ReturnType<typeof api.getMyAttendancePage>>);
  });

  it('renders loading states initially', async () => {
    render(<EmployeeDashboard />, { wrapper: createWrapper() });
    
    await waitFor(() => {
      // Check for combined text content specifically in the H1
      const greeting = screen.getByText((_, element) => {
        return element?.tagName.toLowerCase() === 'h1' && 
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
      // The keys from ar.json
      expect(screen.getByText('ساعات الشهر')).toBeDefined();
      expect(screen.getByText('رصيد الإجازات')).toBeDefined();
      expect(screen.getByText('الراتب المتوقع')).toBeDefined();
    });
  });

  it('shows unverified attendance warning if data is present', async () => {
    vi.mocked(api.getMyAttendancePage).mockResolvedValue({
      data: mockPaginated([
        { recordId: 1, checkIn: '2024-05-20T09:00:00', status: 'Present', isVerifiedByManager: false }
      ])
    } as Awaited<ReturnType<typeof api.getMyAttendancePage>>);

    render(<EmployeeDashboard />, { wrapper: createWrapper() });
    
    await waitFor(() => {
      expect(screen.getAllByText((_, element) => element?.tagName.toLowerCase() === 'p' && element?.textContent?.includes('مؤكد') === true)).toBeDefined();
    });
  });
});
