import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import { ErrorBoundary } from './components/ErrorBoundary';
import Layout from './components/Layout';

const Home = lazy(() => import('./pages/Home'));
const EmployeeDashboard = lazy(() => import('./pages/EmployeeDashboard'));
const ManagerDashboard = lazy(() => import('./pages/ManagerDashboard'));
const HRDashboard = lazy(() => import('./pages/HRDashboard'));
const HRAttendanceGrid = lazy(() => import('./pages/HRAttendanceGrid'));
const PayrollDashboard = lazy(() => import('./pages/PayrollDashboard'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const LeaveCalendar = lazy(() => import('./pages/LeaveCalendar'));
const AttendanceLogs = lazy(() => import('./pages/AttendanceLogs'));
const NFCClock = lazy(() => import('./pages/NFCClock'));
const Login = lazy(() => import('./pages/Login'));
const Goals = lazy(() => import('./pages/Goals'));
const Inbox = lazy(() => import('./pages/Inbox'));

const RouteFallback = () => (
  <div className="flex min-h-screen items-center justify-center bg-black text-sm font-medium text-slate-400">
    جاري تحميل الصفحة...
  </div>
);

function App() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<RouteFallback />}>
        <Router>
          <Routes>
            {/* Public */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />

            {/* Role-specific dashboards */}
            <Route path="/dashboard" element={
              <ProtectedRoute allowedRoles={['EMPLOYEE']}>
                <Layout><EmployeeDashboard /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/manager" element={
              <ProtectedRoute allowedRoles={['MANAGER']}>
                <Layout><ManagerDashboard /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/hr" element={
              <ProtectedRoute allowedRoles={['HR']}>
                <Layout><HRDashboard /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/hr/grid" element={
              <ProtectedRoute allowedRoles={['HR']}>
                <Layout><HRAttendanceGrid /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/payroll" element={
              <ProtectedRoute allowedRoles={['HR', 'ADMIN']}>
                <Layout><PayrollDashboard /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/admin" element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <Layout><AdminDashboard /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/leave-calendar" element={
              <ProtectedRoute allowedRoles={['HR', 'MANAGER', 'ADMIN', 'SUPER_ADMIN']}>
                <Layout><LeaveCalendar /></Layout>
              </ProtectedRoute>
            } />

            {/* Shared protected pages (any authenticated user) */}
            <Route path="/attendance" element={
              <ProtectedRoute>
                <Layout><AttendanceLogs /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/clock" element={
              <ProtectedRoute>
                <Layout><NFCClock /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/finance" element={
              <ProtectedRoute allowedRoles={['HR', 'ADMIN']}>
                <Navigate to="/payroll" replace />
              </ProtectedRoute>
            } />
            <Route path="/goals" element={
              <ProtectedRoute>
                <Layout><Goals /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/inbox" element={
              <ProtectedRoute>
                <Layout><Inbox /></Layout>
              </ProtectedRoute>
            } />
          </Routes>
        </Router>
      </Suspense>
    </ErrorBoundary>
  );
}

export default App;
