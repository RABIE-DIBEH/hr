import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  FileText,
  Info,
  X,
  User,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { getLeaveCalendar, downloadLeavePdf, downloadLeaveExcel, getCurrentEmployee, type LeaveRequest } from '../services/api';
import { getRole } from '../services/auth';

const LeaveCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [isDownloading, setIsDownloading] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  useQuery({
    queryKey: ['me'],
    queryFn: async () => (await getCurrentEmployee()).data,
  });

  const role = getRole();
  const isHighRole = ['HR', 'MANAGER', 'ADMIN', 'SUPER_ADMIN', 'ROLE_HR', 'ROLE_MANAGER', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN'].includes(role || '');

  const month = currentDate.getMonth() + 1;
  const year = currentDate.getFullYear();

  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDayOfMonth = new Date(year, month - 1, 1).getDay(); // 0 (Sun) to 6 (Sat)
  
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  useEffect(() => {
    const fetchLeaves = async () => {
      try {
        const start = new Date(year, month - 1, 1).toISOString().split('T')[0];
        const end = new Date(year, month, 0).toISOString().split('T')[0];
        const res = await getLeaveCalendar(start, end);
        const data = (res.data as any).data || res.data;
        setLeaves(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Failed to fetch calendar leaves', error);
      }
    };
    void fetchLeaves();
  }, [month, year]);

  const handlePrevMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleDownloadReport = async (type: 'pdf' | 'excel') => {
    setIsDownloading(true);
    try {
      const response = type === 'pdf'
        ? await downloadLeavePdf(month, year)
        : await downloadLeaveExcel(month, year);

      if (!(response.data instanceof Blob)) throw new Error('Invalid response');
      const blob = new Blob([response.data], {
        type: type === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `leave_report_${month}_${year}.${type === 'pdf' ? 'pdf' : 'xlsx'}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert('فشل تحميل تقرير الإجازات.');
    } finally {
      setIsDownloading(false);
    }
  };

  const getLeavesForDay = (day: number) => {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return leaves.filter(l => {
        const start = l.startDate.split('T')[0];
        const end = l.endDate.split('T')[0];
        return dateStr >= start && dateStr <= end;
    });
  };

  const weekDays = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

  return (
    <div className="w-full">
      <header className="mb-10 flex justify-between items-center bg-luxury-surface p-6 rounded-3xl border border-white/5">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight arabic-text flex items-center gap-3">
            <CalendarIcon className="text-purple-500" size={32} />
            تقويم الإجازات والغياب
          </h1>
          <p className="text-slate-400 mt-2">
            {isHighRole ? 'عرض مرئي لجميع الإجازات المعتمدة والمعلقة للقسم' : 'عرض مرئي لجميع طلبات الإجازة الخاصة بي'}
          </p>
        </div>
        <div className="flex gap-4 items-center">
          <div className="flex items-center gap-4 bg-white/5 px-6 py-3 rounded-xl border border-white/10">
            <button onClick={handlePrevMonth} className="text-slate-400 hover:text-white transition-colors">
              <ChevronRight size={24} />
            </button>
            <span className="text-white font-bold text-lg min-w-[140px] text-center">
              {currentDate.toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' })}
            </span>
            <button onClick={handleNextMonth} className="text-slate-400 hover:text-white transition-colors">
              <ChevronLeft size={24} />
            </button>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => handleDownloadReport('pdf')}
              disabled={isDownloading}
              className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-900 text-white px-5 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-purple-500/20 transition-all text-sm"
            >
              <FileText size={18} />
              {isDownloading ? '...' : 'PDF'}
            </button>
            <button 
              onClick={() => handleDownloadReport('excel')}
              disabled={isDownloading}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-900 text-white px-5 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all text-sm"
            >
              <FileSpreadsheet size={18} />
              {isDownloading ? '...' : 'Excel'}
            </button>
          </div>
        </div>
      </header>

      <div className="bg-luxury-surface rounded-[2.5rem] border border-white/5 shadow-2xl overflow-hidden">
        {/* Weekdays Header */}
        <div className="grid grid-cols-7 border-b border-white/5 bg-white/[0.02]">
          {weekDays.map(day => (
            <div key={day} className="p-4 text-center text-slate-500 font-black text-xs uppercase tracking-widest">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 min-h-[600px]">
          {blanks.map(i => (
            <div key={`blank-${i}`} className="border-l border-b border-white/5 bg-black/20" />
          ))}
          
          {daysArray.map(day => {
            const dayLeaves = getLeavesForDay(day);
            const isToday = new Date().toDateString() === new Date(year, month - 1, day).toDateString();
            
            return (
              <div 
                key={day} 
                onClick={() => setSelectedDay(day)}
                className={`border-l border-b border-white/5 p-2 min-h-[120px] transition-all hover:bg-white/[0.05] cursor-pointer group ${isToday ? 'bg-purple-500/5' : ''}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className={`text-sm font-bold transition-all group-hover:scale-110 ${isToday ? 'bg-purple-500 text-white w-7 h-7 flex items-center justify-center rounded-full shadow-lg shadow-purple-500/30' : 'text-slate-500'}`}>
                    {day}
                  </span>
                </div>
                
                <div className="space-y-1">
                  {dayLeaves.slice(0, 3).map((l, idx) => (
                    <motion.div 
                      initial={{ opacity: 0, x: 5 }}
                      animate={{ opacity: 1, x: 0 }}
                      key={l.requestId || idx}
                      className={`text-[10px] p-1.5 rounded-lg border flex flex-col gap-0.5 shadow-sm truncate ${
                        l.status === 'APPROVED' 
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                          : 'bg-orange-500/10 border-orange-500/20 text-orange-400'
                      }`}
                      title={`${l.employeeName}: ${l.leaveType}`}
                    >
                      <span className="font-bold truncate">{l.employeeName?.split(' ')[0]}</span>
                      <span className="opacity-70 text-[9px]">{l.leaveType}</span>
                    </motion.div>
                  ))}
                  {dayLeaves.length > 3 && (
                    <div className="text-[10px] text-slate-500 text-center font-bold py-1 bg-white/5 rounded-lg">
                      + {dayLeaves.length - 3} آخرون
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-emerald-500/5 border border-emerald-500/10 p-4 rounded-2xl flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
          <span className="text-emerald-400 text-sm font-bold">إجازة معتمدة (Approved)</span>
        </div>
        <div className="bg-orange-500/5 border border-orange-500/10 p-4 rounded-2xl flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]" />
          <span className="text-orange-400 text-sm font-bold">طلب معلق (Pending Review)</span>
        </div>
        <div className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center gap-3">
          <Info className="text-slate-500" size={16} />
          <span className="text-slate-400 text-sm font-medium">العطلات الرسمية تظهر باللون الداكن</span>
        </div>
      </div>

      <AnimatePresence>
        {selectedDay && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-luxury-surface w-full max-w-lg rounded-[2rem] border border-white/10 shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/5">
                <div>
                  <h3 className="text-2xl font-black text-white arabic-text">
                    إجازات يوم {selectedDay} {currentDate.toLocaleDateString('ar-EG', { month: 'long' })}
                  </h3>
                  <p className="text-slate-400 text-sm mt-1">قائمة الموظفين غير المتواجدين في هذا اليوم</p>
                </div>
                <button 
                  onClick={() => setSelectedDay(null)}
                  className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-all"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-8 max-h-[60vh] overflow-y-auto space-y-4 custom-scrollbar">
                {getLeavesForDay(selectedDay).length === 0 ? (
                  <div className="text-center py-10">
                    <CheckCircle2 className="mx-auto text-emerald-500 mb-4 opacity-20" size={60} />
                    <p className="text-slate-300 font-bold">لا توجد إجازات مسجلة لهذا اليوم</p>
                    <p className="text-slate-500 text-sm mt-1">الجميع حاضرون!</p>
                  </div>
                ) : (
                  getLeavesForDay(selectedDay).map((l, idx) => (
                    <div key={idx} className="flex items-center justify-between p-5 rounded-2xl bg-white/5 border border-white/5 group hover:bg-white/[0.08] transition-all">
                      <div className="flex items-center gap-4">
                        <div className="bg-purple-500/20 p-3 rounded-xl text-purple-400">
                          <User size={24} />
                        </div>
                        <div>
                          <p className="font-bold text-slate-100">{l.employeeName}</p>
                          <p className="text-xs text-slate-500 font-medium">{l.leaveType}</p>
                        </div>
                      </div>
                      <div className="text-right flex flex-col items-end gap-2">
                        <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase flex items-center gap-1.5 ${
                          l.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-orange-500/10 text-orange-400'
                        }`}>
                          {l.status === 'APPROVED' ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                          {l.status === 'APPROVED' ? 'معتمد' : 'قيد المراجعة'}
                        </span>
                        {l.reason && (
                          <div className="flex items-center gap-1.5 text-slate-500 text-[10px] bg-white/5 px-2 py-1 rounded-md">
                            <AlertCircle size={10} />
                            {l.reason}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="p-8 border-t border-white/5 bg-white/5 flex justify-end">
                <button 
                  onClick={() => setSelectedDay(null)}
                  className="bg-white text-black px-8 py-3 rounded-xl font-bold hover:scale-105 transition-transform"
                >
                  إغلاق
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LeaveCalendar;
