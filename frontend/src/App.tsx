import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import { ErrorBoundary } from './components/ErrorBoundary';

const Home = lazy(() => import('./pages/Home'));
const EmployeeDashboard = lazy(() => import('./pages/EmployeeDashboard'));
const ManagerDashboard = lazy(() => import('./pages/ManagerDashboard'));
const HRDashboard = lazy(() => import('./pages/HRDashboard'));
const HRAttendanceGrid = lazy(() => import('./pages/HRAttendanceGrid'));
const PayrollDashboard = lazy(() => import('./pages/PayrollDashboard'));
const PayrollHistory = lazy(() => import('./pages/PayrollHistory'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const AttendanceLogs = lazy(() => import('./pages/AttendanceLogs'));
const NFCClock = lazy(() => import('./pages/NFCClock'));
const Login = lazy(() => import('./pages/Login'));
const Expenses = lazy(() => import('./pages/Expenses'));
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
                <EmployeeDashboard />
              </ProtectedRoute>
            } />
            <Route path="/manager" element={
              <ProtectedRoute allowedRoles={['MANAGER']}>
                <ManagerDashboard />
              </ProtectedRoute>
            } />
            <Route path="/hr" element={
              <ProtectedRoute allowedRoles={['HR']}>
                <HRDashboard />
              </ProtectedRoute>
            } />
            <Route path="/hr/grid" element={
              <ProtectedRoute allowedRoles={['HR']}>
                <HRAttendanceGrid />
              </ProtectedRoute>
            } />
            <Route path="/payroll" element={
              <ProtectedRoute allowedRoles={['HR', 'ADMIN']}>
                <PayrollDashboard />
              </ProtectedRoute>
            } />
            <Route path="/payroll/history" element={
              <ProtectedRoute allowedRoles={['HR', 'ADMIN']}>
                <PayrollHistory />
              </ProtectedRoute>
            } />
            <Route path="/admin" element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminDashboard />
              </ProtectedRoute>
            } />

            {/* Shared protected pages (any authenticated user) */}
            <Route path="/attendance" element={
              <ProtectedRoute>
                <AttendanceLogs />
              </ProtectedRoute>
            } />
            <Route path="/clock" element={
              <ProtectedRoute>
                <NFCClock />
              </ProtectedRoute>
            } />
            <Route path="/finance" element={
              <ProtectedRoute>
                <Expenses />
              </ProtectedRoute>
            } />
            <Route path="/goals" element={
              <ProtectedRoute>
                <Goals />
              </ProtectedRoute>
            } />
            <Route path="/inbox" element={
              <ProtectedRoute>
                <Inbox />
              </ProtectedRoute>
            } />
          </Routes>
        </Router>
      </Suspense>
    </ErrorBoundary>
  );
}

export default App;
