import { useEffect, useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  FileText,
  PencilLine,
  ShieldCheck,
  Users,
  X,
} from 'lucide-react';
import PaginationControls from '../components/PaginationControls';
import Sidebar from '../components/Sidebar';
import {
  getHrMonthlyAttendancePage,
  listEmployees,
  manuallyCorrectAttendance,
  downloadAttendancePdf,
  downloadAttendanceExcel,
  type AttendanceRecord,
  type EmployeeSummary,
} from '../services/api';
import { getPayrollStatusMeta, getReviewStatusMeta } from '../components/attendanceStatus';

const HRAttendanceGrid = () => {
  const [employees, setEmployees] = useState<EmployeeSummary[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);
  const [correctionCheckIn, setCorrectionCheckIn] = useState('');
  const [correctionCheckOut, setCorrectionCheckOut] = useState('');
  const [correctionReason, setCorrectionReason] = useState('');
  const [approveForPayroll, setApproveForPayroll] = useState(true);
  const [submittingCorrection, setSubmittingCorrection] = useState(false);
  const [correctionFeedback, setCorrectionFeedback] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const [currentDate, setCurrentDate] = useState(new Date());

  const month = currentDate.getMonth() + 1;
  const year = currentDate.getFullYear();
  
  const daysInMonth = new Date(year, month, 0).getDate();
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  useEffect(() => {
    const loadData = async () => {
      try {
        const empRes = await listEmployees();
        setEmployees(empRes.data);
        const recordRes = await getHrMonthlyAttendancePage(month, year, { page, size: 100 });
        setRecords(recordRes.data.items);
        setTotalPages(recordRes.data.totalPages);
        setTotalCount(recordRes.data.totalCount);
        setLoadError(null);
      } catch {
        setLoadError('تعذر تحميل البيانات المركزية للحضور. تأكد من صلاحيات HR.');
      }
    };

    void loadData();
  }, [month, year, page]);

  const handlePrevMonth = () => {
    setPage(0);
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setPage(0);
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleDownloadAttendance = async (type: 'pdf' | 'excel') => {
    setIsDownloading(true);
    try {
      const response = type === 'pdf' 
        ? await downloadAttendancePdf(month, year)
        : await downloadAttendanceExcel(month, year);
      
      const blob = new Blob([response.data], { 
        type: type === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `attendance_report_${month}_${year}.${type === 'pdf' ? 'pdf' : 'xlsx'}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed', error);
      alert('فشل تحميل التقرير. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsDownloading(false);
    }
  };
  
  // Matrix Building Logic
  const getDailyStatus = (empId: number, day: number) => {
    const dailyRecords = records.filter(r => {
      if (!r.checkIn) return false;
      const checkInDate = new Date(r.checkIn);
      return r.employeeId === empId && checkInDate.getDate() === day;
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

  const toLocalInputValue = (value?: string) => {
    if (!value) {
      return '';
    }
    const date = new Date(value);
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - offset * 60_000);
    return localDate.toISOString().slice(0, 16);
  };

  const toApiDateTime = (value: string) => {
    if (!value) {
      return undefined;
    }
    return `${value}:00`;
  };

  const openCorrectionModal = (record: AttendanceRecord) => {
    setSelectedRecord(record);
    setCorrectionCheckIn(toLocalInputValue(record.checkIn));
    setCorrectionCheckOut(toLocalInputValue(record.checkOut));
    setCorrectionReason(record.manualAdjustmentReason ?? record.managerNotes ?? '');
    setApproveForPayroll(record.payrollStatus !== 'EXCLUDED_FROM_PAYROLL');
    setCorrectionFeedback(null);
  };

  const closeCorrectionModal = () => {
    setSelectedRecord(null);
    setCorrectionCheckIn('');
    setCorrectionCheckOut('');
    setCorrectionReason('');
    setApproveForPayroll(true);
    setCorrectionFeedback(null);
  };

  const handleSubmitCorrection = async () => {
    if (!selectedRecord) {
      return;
    }
    if (!correctionReason.trim()) {
      setCorrectionFeedback('سبب التصحيح مطلوب.');
      return;
    }

    setSubmittingCorrection(true);
    try {
      await manuallyCorrectAttendance(selectedRecord.recordId, {
        checkIn: toApiDateTime(correctionCheckIn),
        checkOut: toApiDateTime(correctionCheckOut),
        reason: correctionReason.trim(),
        approveForPayroll,
      });

      const empRes = await listEmployees();
      setEmployees(empRes.data);
      const recordRes = await getHrMonthlyAttendancePage(month, year, { page, size: 100 });
      setRecords(recordRes.data.items);
      setTotalPages(recordRes.data.totalPages);
      setTotalCount(recordRes.data.totalCount);
      setLoadError(null);
      closeCorrectionModal();
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && typeof error.response?.data?.message === 'string') {
        setCorrectionFeedback(error.response.data.message);
      } else {
        setCorrectionFeedback('فشل حفظ التصحيح اليدوي.');
      }
    } finally {
      setSubmittingCorrection(false);
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
              <div className="flex gap-2">
                <button 
                  onClick={() => handleDownloadAttendance('pdf')}
                  disabled={isDownloading}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white px-5 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all"
                >
                  <FileText size={18} />
                  {isDownloading ? 'جارٍ التحميل...' : 'تصدير PDF'}
                </button>
                <button 
                  onClick={() => handleDownloadAttendance('excel')}
                  disabled={isDownloading}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-800 text-white px-5 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all"
                >
                  <FileSpreadsheet size={18} />
                  {isDownloading ? 'جارٍ التحميل...' : 'تصدير Excel'}
                </button>
              </div>
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
          <PaginationControls
            page={page}
            totalPages={totalPages}
            totalCount={totalCount}
            onPageChange={setPage}
          />

          <section className="mt-8 overflow-hidden rounded-3xl border border-white/5 bg-luxury-surface">
            <div className="flex items-center justify-between border-b border-white/5 p-6">
              <div>
                <h2 className="text-xl font-bold text-white">سجلات الشهر الحالية</h2>
                <p className="mt-1 text-sm text-slate-400">
                  تعرض هذه القائمة حالة المراجعة والرواتب بشكل صريح مع إمكانية التصحيح اليدوي.
                </p>
              </div>
              <div className="rounded-2xl bg-white/5 px-4 py-3 text-xs font-bold text-slate-300">
                {totalCount} سجل في الصفحة الحالية
              </div>
            </div>

            {records.length === 0 ? (
              <div className="p-10 text-center text-slate-500">لا توجد سجلات حضور لهذا الشهر.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right">
                  <thead className="bg-white/5 text-[11px] font-black uppercase tracking-[0.15em] text-slate-400">
                    <tr>
                      <th className="p-5">الموظف</th>
                      <th className="p-5">التاريخ</th>
                      <th className="p-5">الحضور</th>
                      <th className="p-5">المراجعة</th>
                      <th className="p-5">الرواتب</th>
                      <th className="p-5">الإجراء</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {records.map((record) => {
                      const reviewMeta = getReviewStatusMeta(record.reviewStatus);
                      const payrollMeta = getPayrollStatusMeta(record.payrollStatus);

                      return (
                        <tr key={record.recordId} className="hover:bg-white/5">
                          <td className="p-5">
                            <p className="font-bold text-slate-100">{record.employeeName}</p>
                            <p className="mt-1 text-xs text-slate-500">#{record.recordId}</p>
                          </td>
                          <td className="p-5 text-sm text-slate-300">
                            {new Date(record.checkIn).toLocaleDateString('ar-SA', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </td>
                          <td className="p-5 text-sm text-slate-300">
                            <div>{new Date(record.checkIn).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}</div>
                            <div className="mt-1 text-xs text-slate-500">
                              خروج: {record.checkOut ? new Date(record.checkOut).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }) : '—'}
                            </div>
                            <div className="mt-1 text-xs text-slate-500">
                              الساعات: {record.workHours ?? '—'}
                            </div>
                          </td>
                          <td className="p-5">
                            <span className={`inline-flex rounded-lg px-3 py-1 text-xs font-bold ${reviewMeta.className}`}>
                              {reviewMeta.label}
                            </span>
                          </td>
                          <td className="p-5">
                            <span className={`inline-flex rounded-lg px-3 py-1 text-xs font-bold ${payrollMeta.className}`}>
                              {payrollMeta.label}
                            </span>
                          </td>
                          <td className="p-5">
                            <button
                              type="button"
                              onClick={() => openCorrectionModal(record)}
                              className="inline-flex items-center gap-2 rounded-xl border border-sky-500/20 bg-sky-500/10 px-4 py-2 text-sm font-bold text-sky-300 transition-all hover:bg-sky-500/20"
                            >
                              <PencilLine size={16} />
                              تصحيح يدوي
                            </button>
                            {record.manualAdjustmentReason && (
                              <p className="mt-2 max-w-xs text-xs text-slate-500">
                                السبب الأخير: {record.manualAdjustmentReason}
                              </p>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </main>

      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-[2rem] border border-white/10 bg-[#110d18] p-8 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-white">تصحيح سجل حضور</h2>
                <p className="mt-2 text-sm text-slate-400">
                  {selectedRecord.employeeName} • سجل رقم {selectedRecord.recordId}
                </p>
              </div>
              <button
                type="button"
                onClick={closeCorrectionModal}
                disabled={submittingCorrection}
                className="rounded-xl border border-white/10 p-2 text-slate-400 transition-all hover:bg-white/5 hover:text-white disabled:opacity-50"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-300">وقت الدخول</span>
                <input
                  type="datetime-local"
                  value={correctionCheckIn}
                  onChange={(event) => setCorrectionCheckIn(event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition-all focus:border-sky-500/50"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-300">وقت الخروج</span>
                <input
                  type="datetime-local"
                  value={correctionCheckOut}
                  onChange={(event) => setCorrectionCheckOut(event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition-all focus:border-sky-500/50"
                />
              </label>
            </div>

            <label className="mt-5 block">
              <span className="mb-2 block text-sm font-bold text-slate-300">سبب التصحيح</span>
              <textarea
                value={correctionReason}
                onChange={(event) => setCorrectionReason(event.target.value)}
                rows={4}
                className="w-full resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition-all focus:border-sky-500/50"
                placeholder="مثال: نسي الموظف تسجيل الخروج وتمت المراجعة مع المشرف"
              />
            </label>

            <label className="mt-5 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-slate-200">
              <input
                type="checkbox"
                checked={approveForPayroll}
                onChange={(event) => setApproveForPayroll(event.target.checked)}
                className="h-4 w-4 rounded border-white/20 bg-transparent text-sky-500"
              />
              <span className="flex items-center gap-2">
                <ShieldCheck size={16} className="text-sky-300" />
                اعتماد السجل مباشرة للرواتب
              </span>
            </label>

            {correctionFeedback && (
              <div className="mt-5 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {correctionFeedback}
              </div>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeCorrectionModal}
                disabled={submittingCorrection}
                className="rounded-2xl border border-white/10 px-5 py-3 text-sm font-bold text-slate-300 transition-all hover:bg-white/5 disabled:opacity-50"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleSubmitCorrection}
                disabled={submittingCorrection}
                className="rounded-2xl bg-sky-600 px-5 py-3 text-sm font-bold text-white transition-all hover:bg-sky-700 disabled:opacity-50"
              >
                {submittingCorrection ? 'جارٍ الحفظ...' : 'حفظ التصحيح'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HRAttendanceGrid;
