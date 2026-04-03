import { Navigate, useLocation } from 'react-router-dom';
import { isAuthenticated, getRole, dashboardForRole } from '../services/auth';
import type { UserRole } from '../services/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** If provided, only users with one of these roles can access the route. */
  allowedRoles?: UserRole[];
}

/**
 * Wraps a route so that:
 * - Unauthenticated users are redirected to /login (with `from` saved in state).
 * - Authenticated users accessing a role they don't have are redirected to their own dashboard.
 */
const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const location = useLocation();

  if (!isAuthenticated()) {
    // Save where they were trying to go so Login can redirect back
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const role = getRole();
    if (!role || !allowedRoles.includes(role)) {
      // Redirect to their own dashboard instead of showing a blank/forbidden page
      const destination = role ? dashboardForRole(role) : '/login';
      return <Navigate to={destination} replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
