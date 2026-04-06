import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
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
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import PaginationControls from '../components/PaginationControls';
import CurrentDateTimePanel from '../components/CurrentDateTimePanel';
import { 
  getAdminMetrics, 
  getSystemLogsPage, 
  getNfcDevicesPage, 
  clearSystemLogs, 
  triggerBackup, 
  type SystemMetrics, 
  type SystemLog, 
  type NfcDevice 
} from '../services/api';
import { queryKeys } from '../services/queryKeys';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showRawLogs, setShowRawLogs] = useState(false);
  const [logsPage, setLogsPage] = useState(0);
  const [devicesPage, setDevicesPage] = useState(0);

  // Mocked history data for the chart
  const baseCpuHistory = [
    { time: '10:00', usage: 20 },
    { time: '10:05', usage: 25 },
    { time: '10:10', usage: 18 },
    { time: '10:15', usage: 30 },
    { time: '10:20', usage: 22 },
    { time: '10:25', usage: 28 },
    { time: '10:30', usage: 24 },
  ];

  const metricsQuery = useQuery({
    queryKey: queryKeys.admin.metrics,
    queryFn: async () => (await getAdminMetrics()).data,
    refetchInterval: 30000,
  });

  const logsQuery = useQuery({
    queryKey: queryKeys.admin.logs(logsPage),
    queryFn: async () => (await getSystemLogsPage({ page: logsPage, size: 10 })).data,
    refetchInterval: 30000,
  });

  const devicesQuery = useQuery({
    queryKey: queryKeys.admin.devices(devicesPage),
    queryFn: async () => (await getNfcDevicesPage({ page: devicesPage, size: 8 })).data,
    refetchInterval: 30000,
  });

  const metrics: SystemMetrics | null = metricsQuery.data ?? null;
  const logs: SystemLog[] = logsQuery.data?.items ?? [];
  const logsTotalPages = logsQuery.data?.totalPages ?? 0;
  const logsTotalCount = logsQuery.data?.totalCount ?? 0;
  const devices: NfcDevice[] = devicesQuery.data?.items ?? [];
  const devicesTotalPages = devicesQuery.data?.totalPages ?? 0;
  const devicesTotalCount = devicesQuery.data?.totalCount ?? 0;

  const cpuHistory = [
    ...baseCpuHistory.slice(0, 6),
    { time: 'الآن', usage: parseInt((metrics?.cpu ?? '24%').replace('%', '')) || 24 },
  ];

  const handleBackup = async () => {
    try {
      const res = await triggerBackup();
      alert(res.data.status || 'Backup executed securely');
      await queryClient.invalidateQueries({ queryKey: queryKeys.admin.metrics });
      await queryClient.invalidateQueries({ queryKey: queryKeys.admin.logsRoot });
    } catch {
      alert('Error triggering backup');
    }
  };

  const handleClearLogs = async () => {
    if (!window.confirm('هل أنت متأكد من رغبتك بمسح السجلات السابقة كلياً؟')) return;
    try {
      await clearSystemLogs();
      alert('All previous logs cleared.');
      await queryClient.invalidateQueries({ queryKey: queryKeys.admin.logsRoot });
    } catch {
      alert('Failed to clear logs.');
    }
  };

  return (
    <>
      <header className="mb-10 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight arabic-text">لوحة التحكم الفنية (Admin)</h1>
          <p className="text-slate-400 mt-1">مراقبة أداء الخوادم والأمان والنسخ الاحتياطي</p>
        </div>
        <div className="flex items-center gap-3">
          <CurrentDateTimePanel />
          <a 
            href="/swagger-ui/index.html" 
            target="_blank" 
            rel="noopener noreferrer"
            className="bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 px-5 py-3 rounded-xl font-bold flex items-center gap-2 border border-blue-500/20 transition-all"
          >
            <Server size={18} />
            <span>وثائق API (Swagger)</span>
          </a>
          <button onClick={handleBackup} className="bg-white text-black px-5 py-3 rounded-xl font-bold flex items-center gap-2 shadow-xl shadow-white/5 transition-transform hover:scale-105 active:scale-95">
            <Database size={18} />
            <span>النسخ الاحتياطي الآن</span>
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        {/* System Health Card */}
        <motion.div 
          initial={{ opacity: 1, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 bg-luxury-surface rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl border border-white/5"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px]" />
          <div className="relative z-10">
            <div className="flex justify-between items-center mb-10">
              <div className="flex items-center gap-3">
                <div className="bg-blue-600/20 p-2 rounded-lg">
                  <Server size={24} className="text-blue-400" />
                </div>
                <h2 className="text-xl font-bold text-white">حالة النظام المباشرة</h2>
              </div>
              <div className="flex items-center gap-2 text-green-400 font-bold text-xs uppercase tracking-widest">
                <Activity size={14} /> {metrics?.status || 'System Healthy'}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="md:col-span-1 space-y-6">
                <div className="space-y-2">
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-wider flex items-center gap-2"><Cpu size={14}/> CPU Usage</p>
                  <p className="text-3xl font-black text-white">{metrics ? metrics.cpu : '24%'}</p>
                  <div className="w-full bg-white/5 h-1.5 rounded-full"><div className="bg-blue-500 h-full w-[24%] rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div></div>
                </div>
                <div className="space-y-2">
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-wider flex items-center gap-2"><HardDrive size={14}/> Storage</p>
                  <p className="text-3xl font-black text-white">{metrics ? metrics.storage : '1.2GB'}</p>
                  <div className="w-full bg-white/5 h-1.5 rounded-full"><div className="bg-purple-500 h-full w-[45%] rounded-full shadow-[0_0_10px_rgba(168,85,247,0.5)]"></div></div>
                </div>
                <div className="space-y-2">
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-wider flex items-center gap-2"><RefreshCw size={14}/> Uptime</p>
                  <p className="text-3xl font-black text-white">{metrics ? metrics.uptime : '99.9%'}</p>
                </div>
              </div>

              <div className="md:col-span-3 h-[200px] w-full bg-white/5 rounded-2xl p-4 border border-white/5">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={cpuHistory}>
                    <defs>
                      <linearGradient id="colorUsage" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                    <XAxis dataKey="time" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} unit="%" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #ffffff10', borderRadius: '8px' }}
                      itemStyle={{ color: '#3b82f6', fontWeight: 'bold' }}
                    />
                    <Area type="monotone" dataKey="usage" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorUsage)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="mt-12 flex gap-4">
              <button onClick={() => setShowRawLogs(true)} className="bg-white/5 hover:bg-white/10 px-6 py-3 rounded-xl font-bold transition-all border border-white/5 flex items-center gap-2 text-white">
                <Terminal size={18} /> View Raw Logs
              </button>
              <button onClick={() => navigate('/admin/devices')} className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-900/20 text-white flex items-center gap-2">
                <Server size={18} /> إدارة الأجهزة
              </button>
            </div>
          </div>
        </motion.div>

        {/* Device Status List */}
        <motion.div 
          initial={{ opacity: 1, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-luxury-surface rounded-[2.5rem] p-8 shadow-sm border border-white/5"
        >
          <h3 className="font-bold text-lg mb-6 flex items-center gap-2 text-white">
            <Lock className="text-slate-500" size={20} /> أجهزة القراءة NFC
          </h3>
          <div className="space-y-4">
            {devices.map(device => (
              <div key={device.deviceId} className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${device.status === 'Online' ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`} />
                  <div>
                    <p className="text-sm font-bold text-slate-100">{device.name}</p>
                    <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">{device.deviceId}</p>
                  </div>
                </div>
                <p className="text-xs font-bold text-slate-400">{device.systemLoad}</p>
              </div>
            ))}
          </div>
          <button onClick={() => navigate('/admin/devices')} className="w-full mt-6 py-3 rounded-xl border border-white/10 text-slate-400 font-bold text-sm hover:bg-white/5 hover:text-white transition-all">
            إدارة جميع الأجهزة ←
          </button>
          <PaginationControls
            page={devicesPage}
            totalPages={devicesTotalPages}
            totalCount={devicesTotalCount}
            onPageChange={setDevicesPage}
            className="mt-6 rounded-2xl"
          />
        </motion.div>
      </div>

      {/* Audit Logs Table */}
      <section id="audit-table" className="bg-luxury-surface rounded-[2.5rem] shadow-sm border border-white/5 overflow-hidden">
        <div className="p-8 border-b border-white/5 flex justify-between items-center">
          <h3 className="font-bold text-xl flex items-center gap-2 text-white">
            <ShieldAlert className="text-red-500" size={24} /> سجلات الأمان (Audit Logs)
          </h3>
          <button onClick={handleClearLogs} className="text-xs font-bold text-blue-400 uppercase tracking-widest hover:text-blue-300">Clear Logs</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead className="bg-white/5 text-slate-400 text-[10px] font-black uppercase tracking-[0.15em]">
              <tr>
                <th className="p-6">Action Event</th>
                <th className="p-6">Origin User</th>
                <th className="p-6">Timestamp</th>
                <th className="p-6">Status</th>
                <th className="p-6">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {logs.map(log => (
                <tr key={log.logId} className="hover:bg-white/5 transition-all text-sm">
                  <td className="p-6 font-bold text-slate-100 tracking-tight">{log.action}</td>
                  <td className="p-6 text-slate-400 font-medium">{log.originUser}</td>
                  <td className="p-6 text-slate-500 font-mono">{new Date(log.timestamp).toLocaleTimeString('ar-EG', {hour: '2-digit', minute: '2-digit'})}</td>
                  <td className="p-6">
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase ${
                      log.status === 'Success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                    }`}>
                      {log.status}
                    </span>
                  </td>
                  <td className="p-6">
                    <button 
                      onClick={() => alert(`تفاصيل السجل #${log.logId}:\nالحدث: ${log.action}\nالمستخدم: ${log.originUser}\nالتوقيت: ${new Date(log.timestamp).toLocaleString('ar-EG')}\nالحالة: ${log.status}`)}
                      className="p-2 hover:bg-white/10 rounded-lg transition-all text-slate-500 hover:text-slate-300"
                    >
                      <Settings size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <PaginationControls
          page={logsPage}
          totalPages={logsTotalPages}
          totalCount={logsTotalCount}
          onPageChange={setLogsPage}
        />
      </section>

      {/* Raw Logs Modal */}
      {showRawLogs && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm rtl:dir-ltr">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#0c0c0c] border border-white/10 rounded-2xl w-[90%] max-w-4xl max-h-[80vh] flex flex-col shadow-2xl"
          >
            <div className="flex justify-between items-center p-4 border-b border-white/10 bg-white/5">
              <div className="flex items-center gap-2 text-slate-300 font-mono text-sm">
                <Terminal size={16} /> /api/admin/logs output
              </div>
              <button onClick={() => setShowRawLogs(false)} className="text-white/50 hover:text-white bg-white/5 hover:bg-red-500/80 px-3 py-1 rounded-lg transition-colors">
                أغلق
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4 custom-scrollbar">
              <pre className="text-green-500 font-mono text-xs text-left" dir="ltr">
                {JSON.stringify(logs, null, 2)}
              </pre>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
};

export default AdminDashboard;
