import { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import Layout from './components/Layout';
import Skeleton from './components/Skeleton';

// Public pages (eager-loaded for fast initial render)
import Home from './pages/Home';
import Login from './pages/Login';

// Dashboards (lazy-loaded for code-splitting)
const EmployeeDashboard = lazy(() => import('./pages/EmployeeDashboard'));
const ManagerDashboard = lazy(() => import('./pages/ManagerDashboard'));
const TeamAttendance = lazy(() => import('./pages/TeamAttendance'));
const HRDashboard = lazy(() => import('./pages/HRDashboard'));
const HRAttendanceGrid = lazy(() => import('./pages/HRAttendanceGrid'));
const PayrollDashboard = lazy(() => import('./pages/PayrollDashboard'));
const UserManagement = lazy(() => import('./pages/UserManagement'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const DeviceManagement = lazy(() => import('./pages/DeviceManagement'));
const LeaveCalendar = lazy(() => import('./pages/LeaveCalendar'));
const AttendanceLogs = lazy(() => import('./pages/AttendanceLogs'));
const NFCClock = lazy(() => import('./pages/NFCClock'));
const Goals = lazy(() => import('./pages/Goals'));
const Inbox = lazy(() => import('./pages/Inbox'));
const CEODashboard = lazy(() => import('./pages/CEODashboard'));

const LazyPage = () => (
  <Layout>
    <div className="p-8">
      <Skeleton />
    </div>
  </Layout>
);

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);
  return null;
};

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <ScrollToTop />
        <Routes>
          {/* Public */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />

          {/* Role-specific dashboards */}
          <Route path="/dashboard" element={
            <ProtectedRoute allowedRoles={['EMPLOYEE', 'PAYROLL', 'SUPER_ADMIN']}>
              <Suspense fallback={<LazyPage />}><EmployeeDashboard /></Suspense>
            </ProtectedRoute>
          } />
          <Route path="/manager" element={
            <ProtectedRoute allowedRoles={['MANAGER']}>
              <Suspense fallback={<LazyPage />}><ManagerDashboard /></Suspense>
            </ProtectedRoute>
          } />
          <Route path="/manager/team-attendance" element={
            <ProtectedRoute allowedRoles={['MANAGER']}>
              <Suspense fallback={<LazyPage />}><TeamAttendance /></Suspense>
            </ProtectedRoute>
          } />
          <Route path="/hr" element={
            <ProtectedRoute allowedRoles={['HR']}>
              <Suspense fallback={<LazyPage />}><HRDashboard /></Suspense>
            </ProtectedRoute>
          } />
          <Route path="/hr/grid" element={
            <ProtectedRoute allowedRoles={['HR']}>
              <Suspense fallback={<LazyPage />}><HRAttendanceGrid /></Suspense>
            </ProtectedRoute>
          } />
          <Route path="/payroll" element={
            <ProtectedRoute allowedRoles={['PAYROLL', 'SUPER_ADMIN']}>
              <Suspense fallback={<LazyPage />}><PayrollDashboard /></Suspense>
            </ProtectedRoute>
          } />
          <Route path="/users" element={
            <ProtectedRoute allowedRoles={['HR', 'ADMIN', 'SUPER_ADMIN']}>
              <Suspense fallback={<LazyPage />}><UserManagement /></Suspense>
            </ProtectedRoute>
          } />
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <Suspense fallback={<LazyPage />}><AdminDashboard /></Suspense>
            </ProtectedRoute>
          } />
          <Route path="/ceo" element={
            <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
              <Suspense fallback={<LazyPage />}><CEODashboard /></Suspense>
            </ProtectedRoute>
          } />
          <Route path="/admin/devices" element={
            <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
              <Suspense fallback={<LazyPage />}><DeviceManagement /></Suspense>
            </ProtectedRoute>
          } />
          <Route path="/leave-calendar" element={
            <ProtectedRoute allowedRoles={['HR', 'MANAGER', 'ADMIN', 'PAYROLL', 'SUPER_ADMIN', 'EMPLOYEE']}>
              <Suspense fallback={<LazyPage />}><LeaveCalendar /></Suspense>
            </ProtectedRoute>
          } />

          {/* Shared protected pages */}
          <Route path="/attendance" element={
            <ProtectedRoute>
              <Suspense fallback={<LazyPage />}><AttendanceLogs /></Suspense>
            </ProtectedRoute>
          } />
          <Route path="/clock" element={
            <ProtectedRoute>
              <Suspense fallback={<LazyPage />}><NFCClock /></Suspense>
            </ProtectedRoute>
          } />
          <Route path="/finance" element={
            <ProtectedRoute allowedRoles={['PAYROLL', 'SUPER_ADMIN']}>
              <Navigate to="/payroll" replace />
            </ProtectedRoute>
          } />
          <Route path="/goals" element={
            <ProtectedRoute>
              <Suspense fallback={<LazyPage />}><Goals /></Suspense>
            </ProtectedRoute>
          } />
          <Route path="/inbox" element={
            <ProtectedRoute>
              <Suspense fallback={<LazyPage />}><Inbox /></Suspense>
            </ProtectedRoute>
          } />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
