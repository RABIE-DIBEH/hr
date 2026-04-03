import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import EmployeeDashboard from './pages/EmployeeDashboard';
import ManagerDashboard from './pages/ManagerDashboard';
import HRDashboard from './pages/HRDashboard';
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
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        
        {/* Core HRMS Dashboards */}
        <Route path="/dashboard" element={<EmployeeDashboard />} />
        <Route path="/manager" element={<ManagerDashboard />} />
        <Route path="/hr" element={<HRDashboard />} />
        <Route path="/admin" element={<AdminDashboard />} />
        
        {/* Luxury Fintech View */}
        <Route path="/finance" element={<Expenses />} />
        <Route path="/goals" element={<Goals />} />
        
        {/* Features */}
        <Route path="/attendance" element={<AttendanceLogs />} />
        <Route path="/clock" element={<NFCClock />} />
      </Routes>
    </Router>
  );
}

export default App;
