import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, Download, ChevronRight, RefreshCcw } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { getMyAttendance, type AttendanceRecord } from '../services/api';

const AttendanceLogs = () => {
  const [logs, setLogs] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await getMyAttendance();
      setLogs(res.data);
      setError(null);
    } catch {
      setError('فشل في جلب سجل الدوام');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
  };
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <div className="flex min-h-screen bg-black" dir="rtl">
      <Sidebar />
      <main className="mr-64 flex-1 p-8">
        <div className="max-w-5xl mx-auto">
          <header className="flex justify-between items-center mb-10">
            <div>
              <h1 className="text-3xl font-black text-white arabic-text">سجل دوامي</h1>
              <p className="text-slate-400 mt-1">عرض تفاصيل الحضور والانصراف اليومية</p>
            </div>
            <button className="bg-luxury-surface border border-white/5 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-white/5 transition-all text-white">
              <Download size={16} /> تصدير PDF
            </button>
          </header>

            <div className="bg-luxury-surface rounded-[2rem] shadow-sm border border-white/5 overflow-hidden">
            <div className="divide-y divide-white/5">
              {loading ? (
                <div className="p-12 text-center text-slate-500 flex flex-col items-center">
                  <RefreshCcw className="animate-spin mb-4" size={32} />
                  <p>جاري تحميل السجل...</p>
                </div>
              ) : error ? (
                <div className="p-12 text-center text-red-400">
                  <p>{error}</p>
                </div>
              ) : logs.length === 0 ? (
                <div className="p-12 text-center text-slate-500">
                  <p>لا يوجد سجل دوام متاح بعد</p>
                </div>
              ) : (
                logs.map((log, idx) => (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    key={log.recordId} 
                    className="p-6 flex items-center justify-between hover:bg-white/5 transition-all group"
                  >
                    <div className="flex items-center gap-6">
                      <div className="bg-white/5 p-3 rounded-2xl text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                        <Clock size={24} />
                      </div>
                      <div>
                        <p className="font-bold text-slate-100 text-lg">{formatDate(log.checkIn)}</p>
                        <p className="text-sm text-slate-500 font-medium">ساعات العمل: {log.workHours ? `${log.workHours} ساعة` : 'جاري العمل...'}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-12">
                      <div className="flex gap-8 text-center">
                        <div>
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">دخول</p>
                          <p className="font-mono font-bold text-slate-200">{formatTime(log.checkIn)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">خروج</p>
                          <p className="font-mono font-bold text-slate-200">{log.checkOut ? formatTime(log.checkOut) : '—'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${
                          log.status === 'Verified' ? 'bg-green-500/10 text-green-400' :
                          log.status === 'Fraud' ? 'bg-red-500/10 text-red-400' :
                          'bg-orange-500/10 text-orange-400'
                        }`}>
                          {log.status === 'Verified' ? 'معتمد' : log.status === 'Fraud' ? 'تلاعب' : 'قيد المراجعة'}
                        </span>
                        <ChevronRight className="text-slate-600 group-hover:text-slate-300 transition-all" size={20} />
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AttendanceLogs;
