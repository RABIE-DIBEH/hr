import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, ChevronLeft, ChevronRight, Download, Users } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { listEmployees, getHrMonthlyAttendance, type EmployeeSummary, type AttendanceRecord } from '../services/api';

const HRAttendanceGrid = () => {
  const [employees, setEmployees] = useState<EmployeeSummary[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [currentDate, setCurrentDate] = useState(new Date());

  const month = currentDate.getMonth() + 1;
  const year = currentDate.getFullYear();
  
  const daysInMonth = new Date(year, month, 0).getDate();
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const empRes = await listEmployees();
        setEmployees(empRes.data);
        const recordRes = await getHrMonthlyAttendance(month, year);
        setRecords(recordRes.data);
        setLoadError(null);
      } catch {
        setLoadError('تعذر تحميل البيانات المركزية للحضور. تأكد من صلاحيات HR.');
      }
    };
    fetchData();
  }, [month, year]);

  const handlePrevMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };
  
  // Matrix Building Logic
  const getDailyStatus = (empId: number, day: number) => {
    const dailyRecords = records.filter(r => {
      if (!r.checkIn) return false;
      const checkInDate = new Date(r.checkIn);
      return r.employee && r.employee.employeeId === empId && checkInDate.getDate() === day;
    });

    if (dailyRecords.length === 0) {
      // Future dates in current month are Gray. Past dates are Red (Absent)
      const dayDate = new Date(year, month - 1, day);
      if (dayDate > new Date()) return 'neutral';
      
      // If it's a weekend (Fri/Sat in ME usually, check getDay() -> 5 is Fri, 6 is Sat)
      if (dayDate.getDay() === 5 || dayDate.getDay() === 6) {
         return 'weekend';
      }
      return 'absent';
    }

    const hasFraud = dailyRecords.some(r => r.status === 'Fraud' || r.status === 'FRAUD');
    if (hasFraud) return 'fraud';

    const totalHours = dailyRecords.reduce((sum, r) => sum + (r.workHours || 0), 0);
    
    // Simple 8 hour expectation logic or just anything > 0 
    // In our testing, most have 0 until checkout, so we allow 0 if currently active Session
    if (totalHours >= 8) return 'present';
    
    return 'late-or-incomplete';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'bg-green-500/80 border-green-400';
      case 'absent': return 'bg-red-500/80 border-red-400';
      case 'fraud': return 'bg-orange-500/80 border-orange-400';
      case 'late-or-incomplete': return 'bg-yellow-500/80 border-yellow-400';
      case 'weekend': return 'bg-slate-700/50 border-transparent';
      case 'neutral': return 'bg-white/5 border-transparent';
      default: return 'bg-white/5 border-transparent';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'present': return 'حضور';
      case 'absent': return 'غياب';
      case 'fraud': return 'مخالفة';
      case 'late-or-incomplete': return 'نقص ساعات';
      case 'weekend': return 'عطلة';
      case 'neutral': return '—';
      default: return '—';
    }
  };

  return (
    <div className="flex min-h-screen bg-black font-sans" dir="rtl">
      <Sidebar />
      <main className="mr-64 flex-1 p-8">
        <div className="max-w-[95%] mx-auto">
          <header className="mb-10 flex justify-between items-center bg-luxury-surface p-6 rounded-3xl border border-white/5">
            <div>
              <h1 className="text-3xl font-black text-white tracking-tight arabic-text flex items-center gap-3">
                <Calendar className="text-blue-500" size={32} />
                شاشة الحضور والانصراف المركزية
              </h1>
              <p className="text-slate-400 mt-2">عرض جدولي يضم جميع الموظفين وسجلات حضورهم</p>
            </div>
            <div className="flex gap-4 items-center">
              <div className="flex items-center gap-4 bg-white/5 px-6 py-3 rounded-xl">
                <button onClick={handlePrevMonth} className="hover:text-blue-400 transition-colors">
                  <ChevronRight size={24} />
                </button>
                <span className="text-white font-bold text-lg min-w-[120px] text-center">
                  {currentDate.toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' })}
                </span>
                <button 
                  onClick={handleNextMonth} 
                  disabled={currentDate >= new Date()} 
                  className="hover:text-blue-400 disabled:opacity-30 transition-colors"
                >
                  <ChevronLeft size={24} />
                </button>
              </div>
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-500/20">
                <Download size={18} />
                تصدير PDF
              </button>
            </div>
          </header>

          {loadError && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 text-red-200 text-sm font-medium border border-red-500/20">
              {loadError}
            </div>
          )}

          <div className="flex gap-4 mb-6">
            <span className="flex items-center gap-2 text-xs font-bold text-slate-400"><div className="w-3 h-3 rounded bg-green-500/80"></div> حضور كامل</span>
            <span className="flex items-center gap-2 text-xs font-bold text-slate-400"><div className="w-3 h-3 rounded bg-red-500/80"></div> غياب</span>
            <span className="flex items-center gap-2 text-xs font-bold text-slate-400"><div className="w-3 h-3 rounded bg-yellow-500/80"></div> نقص بساعات العمل</span>
            <span className="flex items-center gap-2 text-xs font-bold text-slate-400"><div className="w-3 h-3 rounded bg-orange-500/80"></div> مخالفة / احتيال</span>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-luxury-surface rounded-3xl shadow-sm border border-white/5 overflow-hidden"
          >
            <div className="overflow-x-auto p-4 custom-scrollbar">
              <table className="w-full text-center border-collapse text-xs whitespace-nowrap">
                <thead className="bg-white/5 border-b border-white/10">
                  <tr>
                    <th className="p-4 text-right sticky right-0 bg-[#0f0a1a] z-20 shadow-[inset_1px_0_0_rgba(255,255,255,0.05)] w-48 min-w-[200px]">
                      <div className="flex items-center gap-2 text-slate-300">
                        <Users size={16} /> اسم الموظف
                      </div>
                    </th>
                    {daysArray.map((day) => (
                      <th key={day} className="p-3 text-slate-400 font-bold min-w-[40px] border-l border-white/5">
                        {day}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {employees.map((emp) => (
                    <tr key={emp.employeeId} className="hover:bg-white/[0.02]">
                      <td className="p-4 text-right font-bold text-slate-200 sticky right-0 bg-[#0f0a1a] z-10 shadow-[inset_1px_0_0_rgba(255,255,255,0.05)] border-l border-white/5">
                        {emp.fullName}
                      </td>
                      {daysArray.map((day) => {
                        const status = getDailyStatus(emp.employeeId, day);
                        const colorClass = getStatusColor(status);
                        return (
                          <td key={day} className="p-1 border-l border-white/5">
                            <div 
                              title={`${emp.fullName} - اليوم ${day} - ${getStatusLabel(status)}`}
                              className={`w-full h-8 rounded-md flex items-center justify-center cursor-default transition-all hover:brightness-125 border ${colorClass}`}
                            >
                              {status === 'neutral' ? '-' : ''}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
              {employees.length === 0 && !loadError && (
                 <div className="p-12 text-center text-slate-500">لا يوجد موظفين مسجلين حالياً.</div>
              )}
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default HRAttendanceGrid;
