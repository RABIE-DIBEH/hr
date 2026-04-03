import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import EmployeeDashboard from './pages/EmployeeDashboard';
import ManagerDashboard from './pages/ManagerDashboard';
import HRDashboard from './pages/HRDashboard';
import HRAttendanceGrid from './pages/HRAttendanceGrid';
import PayrollDashboard from './pages/PayrollDashboard';
import AdminDashboard from './pages/AdminDashboard';
import AttendanceLogs from './pages/AttendanceLogs';
import NFCClock from './pages/NFCClock';
import Login from './pages/Login';
import Expenses from './pages/Expenses';
import Goals from './pages/Goals';

function App() {
  return (
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
      </Routes>
    </Router>
  );
}

export default App;
