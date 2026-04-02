import React from 'react';
import { motion } from 'framer-motion';
import { 
  Settings, 
  ShieldAlert, 
  Database, 
  HardDrive, 
  Activity, 
  Lock,
  Server,
  Terminal,
  RefreshCw,
  Cpu
} from 'lucide-react';
import Sidebar from '../components/Sidebar';

const AdminDashboard = () => {
  const systemLogs = [
    { id: 1, action: 'NFC Card Bind', user: 'HR_Manager_1', time: '10:15 AM', status: 'Success' },
    { id: 2, action: 'Database Backup', user: 'System', time: '03:00 AM', status: 'Success' },
    { id: 3, action: 'Failed Login', user: 'Unknown (IP: 192.168.1.5)', time: '02:45 AM', status: 'Blocked' },
  ];

  const devices = [
    { id: 'NFC-T1', name: 'Main Gate Terminal', status: 'Online', load: '12%' },
    { id: 'NFC-T2', name: 'IT Dept Terminal', status: 'Offline', load: '0%' },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans" dir="rtl">
      <Sidebar />
      
      <main className="mr-64 flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <header className="mb-10 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight arabic-text">لوحة التحكم الفنية (Admin)</h1>
              <p className="text-slate-500 mt-1">مراقبة أداء الخوادم والأمان والنسخ الاحتياطي</p>
            </div>
            <div className="flex gap-3">
              <button className="bg-slate-900 text-white px-5 py-3 rounded-xl font-bold flex items-center gap-2 shadow-xl shadow-slate-200">
                <Database size={18} />
                <span>النسخ الاحتياطي الآن</span>
              </button>
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
            {/* System Health Card */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="lg:col-span-2 bg-slate-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px]" />
              <div className="relative z-10">
                <div className="flex justify-between items-center mb-10">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-500/20 p-2 rounded-lg">
                      <Server size={24} className="text-blue-400" />
                    </div>
                    <h2 className="text-xl font-bold">حالة النظام المباشرة</h2>
                  </div>
                  <div className="flex items-center gap-2 text-green-400 font-bold text-xs uppercase tracking-widest">
                    <Activity size={14} /> System Healthy
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
                  <div className="space-y-2">
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wider flex items-center gap-2"><Cpu size={14}/> CPU Usage</p>
                    <p className="text-3xl font-black">24%</p>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full"><div className="bg-blue-500 h-full w-[24%] rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div></div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wider flex items-center gap-2"><HardDrive size={14}/> Storage</p>
                    <p className="text-3xl font-black">1.2<span className="text-slate-500 text-xl font-medium">TB</span></p>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full"><div className="bg-purple-500 h-full w-[45%] rounded-full shadow-[0_0_10px_rgba(168,85,247,0.5)]"></div></div>
                  </div>
                  <div className="space-y-2 col-span-2 md:col-span-1">
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wider flex items-center gap-2"><RefreshCw size={14}/> Uptime</p>
                    <p className="text-3xl font-black">99.9%</p>
                    <p className="text-[10px] text-green-400 font-bold">Last reset 42 days ago</p>
                  </div>
                </div>

                <div className="mt-12 flex gap-4">
                  <button className="bg-white/10 hover:bg-white/20 px-6 py-3 rounded-xl font-bold transition-all border border-white/5 flex items-center gap-2">
                    <Terminal size={18} /> View Raw Logs
                  </button>
                  <button className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20">
                    System Settings
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Device Status List */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100"
            >
              <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                <Lock className="text-slate-400" size={20} /> أجهزة القراءة NFC
              </h3>
              <div className="space-y-4">
                {devices.map(device => (
                  <div key={device.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${device.status === 'Online' ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`} />
                      <div>
                        <p className="text-sm font-bold text-slate-800">{device.name}</p>
                        <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{device.id}</p>
                      </div>
                    </div>
                    <p className="text-xs font-bold text-slate-500">{device.load}</p>
                  </div>
                ))}
              </div>
              <button className="w-full mt-6 py-3 rounded-xl border border-slate-200 text-slate-500 font-bold text-sm hover:bg-slate-50 transition-all">
                Add New Device
              </button>
            </motion.div>
          </div>

          {/* Audit Logs Table */}
          <section className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-8 border-b border-slate-50 flex justify-between items-center">
              <h3 className="font-bold text-xl flex items-center gap-2">
                <ShieldAlert className="text-red-500" size={24} /> سجلات الأمان (Audit Logs)
              </h3>
              <button className="text-xs font-bold text-blue-600 uppercase tracking-widest">Clear Logs</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-[0.15em]">
                  <tr>
                    <th className="p-6">Action Event</th>
                    <th className="p-6">Origin User</th>
                    <th className="p-6">Timestamp</th>
                    <th className="p-6">Status</th>
                    <th className="p-6">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {systemLogs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-50/50 transition-all text-sm">
                      <td className="p-6 font-bold text-slate-800 tracking-tight">{log.action}</td>
                      <td className="p-6 text-slate-600 font-medium">{log.user}</td>
                      <td className="p-6 text-slate-400 font-mono">{log.time}</td>
                      <td className="p-6">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase ${
                          log.status === 'Success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                        }`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="p-6">
                        <button className="p-2 hover:bg-slate-100 rounded-lg transition-all text-slate-400 hover:text-slate-600">
                          <Settings size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
