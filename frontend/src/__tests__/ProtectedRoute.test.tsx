import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import type { Location } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';
import * as auth from '../services/auth';

// Mock the auth module
vi.mock('../services/auth', () => ({
  isAuthenticated: vi.fn(),
  getRole: vi.fn(),
  isSuperAdmin: vi.fn(),
  dashboardForRole: vi.fn((role) => `/${role.toLowerCase()}`),
}));

const mockAuth = vi.mocked(auth);

const renderWithRouter = (ui: React.ReactElement, initialRoute = '/') => {
  let currentLocation: Location | null = null;

  const LocationDisplay = () => {
    const location = useLocation();
    currentLocation = location;
    return <div data-testid="location-display">{location.pathname}</div>;
  };

  const { container, rerender, ...rest } = render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <Routes>
        <Route path="/" element={ui} />
        <Route path="*" element={<LocationDisplay />} />
      </Routes>
    </MemoryRouter>
  );

  return {
    ...rest,
    container,
    getLocation: () => currentLocation,
  };
};

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirects unauthenticated users to /login', () => {
    mockAuth.isAuthenticated.mockReturnValue(false);

    const { container } = renderWithRouter(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    // Should redirect to login
    expect(container.textContent).toContain('/login');
  });

  it('renders children for authenticated users without role restrictions', () => {
    mockAuth.isAuthenticated.mockReturnValue(true);
    mockAuth.isSuperAdmin.mockReturnValue(false);

    const { container } = renderWithRouter(
      <ProtectedRoute>
        <div data-testid="content">Protected Content</div>
      </ProtectedRoute>
    );

    expect(container.textContent).toContain('Protected Content');
  });

  it('allows SUPER_ADMIN to access any route regardless of allowedRoles', () => {
    mockAuth.isAuthenticated.mockReturnValue(true);
    mockAuth.isSuperAdmin.mockReturnValue(true);

    const { container } = renderWithRouter(
      <ProtectedRoute allowedRoles={['ADMIN', 'HR']}>
        <div data-testid="content">Super Admin Content</div>
      </ProtectedRoute>
    );

    expect(container.textContent).toContain('Super Admin Content');
  });

  it('allows users with matching role to access route', () => {
    mockAuth.isAuthenticated.mockReturnValue(true);
    mockAuth.isSuperAdmin.mockReturnValue(false);
    mockAuth.getRole.mockReturnValue('MANAGER');

    const { container } = renderWithRouter(
      <ProtectedRoute allowedRoles={['MANAGER', 'HR']}>
        <div data-testid="content">Manager Content</div>
      </ProtectedRoute>
    );

    expect(container.textContent).toContain('Manager Content');
  });

  it('redirects users with non-matching role to their dashboard', () => {
    mockAuth.isAuthenticated.mockReturnValue(true);
    mockAuth.isSuperAdmin.mockReturnValue(false);
    mockAuth.getRole.mockReturnValue('EMPLOYEE');
    mockAuth.dashboardForRole.mockReturnValue('/employee');

    const { container } = renderWithRouter(
      <ProtectedRoute allowedRoles={['MANAGER', 'HR']}>
        <div>Employee Content</div>
      </ProtectedRoute>
    );

    // Should redirect to employee dashboard
    expect(container.textContent).toContain('/employee');
  });
});
