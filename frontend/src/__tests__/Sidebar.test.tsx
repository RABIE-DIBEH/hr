import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Sidebar from '../components/Sidebar';
import * as auth from '../services/auth';
import type { UserRole } from '../services/auth';

// Mock the auth service
vi.mock('../services/auth', () => ({
  isAuthenticated: vi.fn(),
  getRole: vi.fn(),
  isSuperAdmin: vi.fn(),
  dashboardForRole: vi.fn(),
}));

// Mock API for unread count
vi.mock('../services/api', async () => {
  const actual = await vi.importActual('../services/api');
  return {
    ...actual,
    getUnreadCount: vi.fn(() => Promise.resolve({ data: { unreadCount: 0 } })),
  };
});

const renderSidebar = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('Sidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const setupMocks = (role: UserRole) => {
    vi.mocked(auth.isAuthenticated).mockReturnValue(true);
    vi.mocked(auth.getRole).mockReturnValue(role);
    vi.mocked(auth.isSuperAdmin).mockReturnValue(role === 'SUPER_ADMIN');
  };

  it('renders basic navigation items for all users', () => {
    setupMocks('EMPLOYEE');
    renderSidebar();

    // i18n is not initialized in tests, so t() returns raw keys
    expect(screen.getByText('sidebar.dashboard')).toBeDefined();
    expect(screen.getByText('sidebar.attendanceLog')).toBeDefined();
    expect(screen.getByText('sidebar.inbox')).toBeDefined();
  });

  it('hides admin and hr links from regular employees', () => {
    setupMocks('EMPLOYEE');
    renderSidebar();

    expect(screen.queryByText('sidebar.adminManagement')).toBeNull();
    expect(screen.queryByText('sidebar.hrManagement')).toBeNull();
  });

  it('shows HR links to HR users', () => {
    setupMocks('HR');
    renderSidebar();

    expect(screen.getByText('sidebar.hrManagement')).toBeDefined();
  });

  it('shows Admin links to Admin users', () => {
    setupMocks('ADMIN');
    renderSidebar();

    expect(screen.getByText('sidebar.adminManagement')).toBeDefined();
  });

  it('shows Manager links to Managers', () => {
    setupMocks('MANAGER');
    renderSidebar();

    expect(screen.getByText('sidebar.teamManagement')).toBeDefined();
  });
});
