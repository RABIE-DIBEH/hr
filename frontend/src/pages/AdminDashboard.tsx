import { useEffect, useState } from 'react';
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
import { 
  getAdminMetrics, 
  getSystemLogs, 
  getNfcDevices, 
  clearSystemLogs, 
  triggerBackup, 
  addNfcDevice,
  type SystemMetrics, 
  type SystemLog, 
  type NfcDevice 
} from '../services/api';

const AdminDashboard = () => {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [devices, setDevices] = useState<NfcDevice[]>([]);
  const [showRawLogs, setShowRawLogs] = useState(false);

  useEffect(() => {
    const loadData = () => {
      getAdminMetrics().then(res => setMetrics(res.data)).catch(console.error);
      getSystemLogs().then(res => setLogs(res.data)).catch(console.error);
      getNfcDevices().then(res => setDevices(res.data)).catch(console.error);
    };

    loadData();
    const interval = setInterval(loadData, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const handleBackup = async () => {
    try {
      const res = await triggerBackup();
      alert(res.data.status || 'Backup executed securely');
      getSystemLogs().then(r => setLogs(r.data)); // refresh logs
    } catch {
      alert('Error triggering backup');
    }
  };

  const handleClearLogs = async () => {
    if (!window.confirm('هل أنت متأكد من رغبتك بمسح السجلات السابقة كلياً؟')) return;
    try {
      await clearSystemLogs();
      setLogs([]);
      alert('All previous logs cleared.');
      getSystemLogs().then(r => setLogs(r.data)); // Should bring up the "Clear Logs" record
    } catch {
      alert('Failed to clear logs.');
    }
  };

  const handleAddDevice = async () => {
    const name = window.prompt("Enter new NFC device name (e.g. Floor 2 Gate C):", "New NFC Reader");
    if (!name) return;
    try {
      const payload = {
        name: name,
        deviceId: `NFC_${Math.floor(1000 + Math.random() * 9000)}-NEW`,
        status: "Online",
        systemLoad: "0%"
      };
      await addNfcDevice(payload);
      getNfcDevices().then(r => setDevices(r.data));
      getSystemLogs().then(r => setLogs(r.data));
    } catch {
      alert('Failed to register device.');
    }
  };

  return (
    <div className="flex min-h-screen bg-black font-sans" dir="rtl">
      <Sidebar />
      
      <main className="mr-64 flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <header className="mb-10 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-black text-white tracking-tight arabic-text">لوحة التحكم الفنية (Admin)</h1>
              <p className="text-slate-400 mt-1">مراقبة أداء الخوادم والأمان والنسخ الاحتياطي</p>
            </div>
            <div className="flex gap-3">
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

                <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
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
                  <div className="space-y-2 col-span-2 md:col-span-1">
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wider flex items-center gap-2"><RefreshCw size={14}/> Uptime</p>
                    <p className="text-3xl font-black text-white">{metrics ? metrics.uptime : '99.9%'}</p>
                    <p className="text-[10px] text-green-400 font-bold">Live since {metrics?.uptimeStr || '...'} ago</p>
                  </div>
                </div>

                <div className="mt-12 flex gap-4">
                  <button onClick={() => setShowRawLogs(true)} className="bg-white/5 hover:bg-white/10 px-6 py-3 rounded-xl font-bold transition-all border border-white/5 flex items-center gap-2 text-white">
                    <Terminal size={18} /> View Raw Logs
                  </button>
                  <button onClick={() => alert('إعدادات النظام قيد التطوير...')} className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-900/20 text-white">
                    System Settings
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
              <button onClick={handleAddDevice} className="w-full mt-6 py-3 rounded-xl border border-white/10 text-slate-400 font-bold text-sm hover:bg-white/5 hover:text-white transition-all">
                Add New Device
              </button>
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
          </section>
        </div>
      </main>

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
    </div>
  );
};

export default AdminDashboard;
