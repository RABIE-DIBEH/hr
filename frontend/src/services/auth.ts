import { AUTH_TOKEN_KEY } from './api';

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'HR' | 'MANAGER' | 'PAYROLL' | 'EMPLOYEE';

interface JwtPayload {
  sub: string;        // email
  role: UserRole;
  employeeId: number;
  iat: number;
  exp: number;
}

/** Decode a JWT without verifying the signature (client-side only). */
function decodeJwt(token: string): JwtPayload | null {
  try {
    const base64Payload = token.split('.')[1];
    const json = atob(base64Payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

/** Return the raw token or null if not stored. */
export function getToken(): string | null {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

/** Return the decoded payload, or null if missing/expired. */
export function getPayload(): JwtPayload | null {
  const token = getToken();
  if (!token) return null;
  const payload = decodeJwt(token);
  if (!payload) return null;
  // Check expiry (exp is in seconds)
  if (Date.now() / 1000 > payload.exp) {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    return null;
  }
  return payload;
}

/** True if a valid, non-expired token exists. */
export function isAuthenticated(): boolean {
  return getPayload() !== null;
}

/** Return the role from the token, or null. */
export function getRole(): UserRole | null {
  return getPayload()?.role ?? null;
}

/** True if the current user is SUPER_ADMIN (full access to everything). */
export function isSuperAdmin(): boolean {
  return getRole() === 'SUPER_ADMIN';
}

/** Return the dashboard path for a given role. */
export function dashboardForRole(role: UserRole): string {
  switch (role) {
    case 'SUPER_ADMIN': return '/admin';   // lands on admin, can navigate anywhere
    case 'ADMIN':       return '/admin';
    case 'HR':          return '/hr';
    case 'MANAGER':     return '/manager';
    // Payroll users are still employees: land on the normal dashboard,
    // with payroll tools accessible from the sidebar.
    case 'PAYROLL':     return '/dashboard';
    case 'EMPLOYEE':    return '/dashboard';
  }
}
