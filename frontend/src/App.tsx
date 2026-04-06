import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import Layout from './components/Layout';

// Direct imports to prevent visual bleed-through/stacking issues
import Home from './pages/Home';
import EmployeeDashboard from './pages/EmployeeDashboard';
import ManagerDashboard from './pages/ManagerDashboard';
import TeamAttendance from './pages/TeamAttendance';
import HRDashboard from './pages/HRDashboard';
import HRAttendanceGrid from './pages/HRAttendanceGrid';
import PayrollDashboard from './pages/PayrollDashboard';
import UserManagement from './pages/UserManagement';
import AdminDashboard from './pages/AdminDashboard';
import DeviceManagement from './pages/DeviceManagement';
import LeaveCalendar from './pages/LeaveCalendar';
import AttendanceLogs from './pages/AttendanceLogs';
import NFCClock from './pages/NFCClock';
import Login from './pages/Login';
import Goals from './pages/Goals';
import Inbox from './pages/Inbox';

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
            <ProtectedRoute allowedRoles={['EMPLOYEE']}>
              <Layout><EmployeeDashboard /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/manager" element={
            <ProtectedRoute allowedRoles={['MANAGER']}>
              <Layout><ManagerDashboard /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/manager/team-attendance" element={
            <ProtectedRoute allowedRoles={['MANAGER']}>
              <Layout><TeamAttendance /></Layout>
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
            <ProtectedRoute allowedRoles={['HR', 'ADMIN', 'PAYROLL']}>
              <Layout><PayrollDashboard /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/users" element={
            <ProtectedRoute allowedRoles={['HR', 'ADMIN', 'SUPER_ADMIN']}>
              <Layout><UserManagement /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <Layout><AdminDashboard /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/admin/devices" element={
            <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
              <Layout><DeviceManagement /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/leave-calendar" element={
            <ProtectedRoute allowedRoles={['HR', 'MANAGER', 'ADMIN', 'SUPER_ADMIN', 'EMPLOYEE']}>
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
    </ErrorBoundary>
  );
}

export default App;
