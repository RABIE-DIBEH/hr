import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import EmployeeDashboard from './pages/EmployeeDashboard';
import ManagerDashboard from './pages/ManagerDashboard';
import HRDashboard from './pages/HRDashboard';
import AdminDashboard from './pages/AdminDashboard';
import AttendanceLogs from './pages/AttendanceLogs';
import NFCClock from './pages/NFCClock';
import Login from './pages/Login';
import Expenses from './pages/Expenses';
import Savings from './pages/Savings';
import Goals from './pages/Goals';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        {/* Luxury Fintech View (Default Dashboard) */}
        <Route path="/dashboard" element={<Expenses />} />
        <Route path="/savings" element={<Savings />} />
        <Route path="/goals" element={<Goals />} />
        
        {/* Core HRMS Dashboards */}
        <Route path="/hrms-dashboard" element={<EmployeeDashboard />} />
        <Route path="/manager" element={<ManagerDashboard />} />
        <Route path="/hr" element={<HRDashboard />} />
        <Route path="/admin" element={<AdminDashboard />} />
        
        {/* Features */}
        <Route path="/attendance" element={<AttendanceLogs />} />
        <Route path="/clock" element={<NFCClock />} />
      </Routes>
    </Router>
  );
}

export default App;
