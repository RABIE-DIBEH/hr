import { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  CreditCard,
  IdCard,
  Link as LinkIcon,
  Power,
  RefreshCcw,
  Search,
  Trash2,
  UserPlus,
  FileText,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import PaginationControls from '../components/PaginationControls';
import CurrentDateTimePanel from '../components/CurrentDateTimePanel';
import RecruitmentRequestForm from '../components/RecruitmentRequestForm';
import {
  assignEmployeeNfcCard,
  getEmployeeNfcCard,
  getPendingLeavesForHrPage,
  getPendingRecruitmentRequestsPage,
  listEmployees,
  processLeaveRequest,
  processRecruitmentRequest,
  replaceEmployeeNfcCard,
  unassignEmployeeNfcCard,
  updateEmployeeNfcCardStatus,
  downloadRecruitmentPdf,
  downloadRecruitmentExcel,
  downloadAttendancePdf,
  downloadAttendanceExcel,
  downloadPayrollPdf,
  downloadPayrollExcel,
  type EmployeeSummary,
  type LeaveRequest,
  type NfcCard,
  type RecruitmentRequest,
} from '../services/api';

const HRDashboard = () => {
  const [employees, setEmployees] = useState<EmployeeSummary[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | ''>('');
  const [selectedCard, setSelectedCard] = useState<NfcCard | null>(null);
  const [cardUidInput, setCardUidInput] = useState('');
  const [cardActionLoading, setCardActionLoading] = useState(false);
  const [cardFeedback, setCardFeedback] = useState<string | null>(null);
  const [showRecruitmentForm, setShowRecruitmentForm] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [reportDate, setReportDate] = useState(new Date());

  const reportMonth = reportDate.getMonth() + 1;
  const reportYear = reportDate.getFullYear();

  // Leave Requests state
  const [pendingLeaves, setPendingLeaves] = useState<LeaveRequest[]>([]);
  const [processingLeave, setProcessingLeave] = useState<number | null>(null);
  const [leaveNote, setLeaveNote] = useState<string>('');
  const [selectedLeaveId, setSelectedLeaveId] = useState<number | null>(null);

  // Recruitment Requests state
  const [pendingRecruitment, setPendingRecruitment] = useState<RecruitmentRequest[]>([]);
  const [processingRecruitment, setProcessingRecruitment] = useState<number | null>(null);
  const [recruitmentNote, setRecruitmentNote] = useState<string>('');
  const [adjustedSalary, setAdjustedSalary] = useState<string>('');
  const [selectedRecruitmentId, setSelectedRecruitmentId] = useState<number | null>(null);
  const [recruitmentPage, setRecruitmentPage] = useState(0);
  const [recruitmentTotalPages, setRecruitmentTotalPages] = useState(0);
  const [recruitmentTotalCount, setRecruitmentTotalCount] = useState(0);
  const [leavePage, setLeavePage] = useState(0);
  const [leaveTotalPages, setLeaveTotalPages] = useState(0);
  const [leaveTotalCount, setLeaveTotalCount] = useState(0);

  const selectedEmployee = selectedEmployeeId === ''
    ? null
    : employees.find((employee) => employee.employeeId === selectedEmployeeId) ?? null;

  const getErrorMessage = (error: unknown, fallback: string) => {
    if (axios.isAxiosError(error)) {
      const message = typeof error.response?.data?.message === 'string'
        ? error.response.data.message
        : null;
      return message ?? fallback;
    }
    return fallback;
  };

  const loadEmployees = async () => {
    const res = await listEmployees();
    setEmployees(res.data);
  };

  const loadSelectedCard = async (employeeId: number) => {
    try {
      const res = await getEmployeeNfcCard(employeeId);
      setSelectedCard(res.data);
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        setSelectedCard(null);
        return;
      }
      throw error;
    }
  };

  useEffect(() => {
    loadEmployees()
      .then(() => setLoadError(null))
      .catch(() => setLoadError('تعذر تحميل قائمة الموظفين. تأكد من صلاحيات HR والاتصال بالخادم.'));

    getPendingLeavesForHrPage({ page: leavePage, size: 10 })
      .then((res) => {
        setPendingLeaves(res.data.items);
        setLeaveTotalPages(res.data.totalPages);
        setLeaveTotalCount(res.data.totalCount);
      })
      .catch(() => console.error('Failed to load pending leaves for HR'));

    getPendingRecruitmentRequestsPage({ page: recruitmentPage, size: 10 })
      .then((res) => {
        setPendingRecruitment(res.data.items);
        setRecruitmentTotalPages(res.data.totalPages);
        setRecruitmentTotalCount(res.data.totalCount);
      })
      .catch(() => console.error('Failed to load pending recruitment requests'));
  }, [leavePage, recruitmentPage]);

  useEffect(() => {
    if (selectedEmployeeId === '') {
      setSelectedCard(null);
      setCardUidInput('');
      setCardFeedback(null);
      return;
    }

    loadSelectedCard(selectedEmployeeId)
      .then(() => setCardFeedback(null))
      .catch(() => setCardFeedback('تعذر تحميل بيانات البطاقة الحالية.'));
  }, [selectedEmployeeId]);

  const refreshEmployeesAndCard = async (employeeId: number) => {
    await loadEmployees();
    await loadSelectedCard(employeeId);
  };

  const handleAssignOrReplace = async () => {
    if (selectedEmployeeId === '' || !cardUidInput.trim()) {
      setCardFeedback('اختر موظفاً وأدخل UID صالحاً أولاً.');
      return;
    }

    setCardActionLoading(true);
    try {
      if (selectedCard) {
        await replaceEmployeeNfcCard(selectedEmployeeId, cardUidInput.trim());
        setCardFeedback('تم استبدال البطاقة وربط UID جديد بنجاح.');
      } else {
        await assignEmployeeNfcCard(selectedEmployeeId, cardUidInput.trim());
        setCardFeedback('تم ربط البطاقة الجديدة بالموظف بنجاح.');
      }
      setCardUidInput('');
      await refreshEmployeesAndCard(selectedEmployeeId);
      setLoadError(null);
    } catch (error: unknown) {
      setCardFeedback(getErrorMessage(error, 'فشل حفظ بيانات البطاقة.'));
    } finally {
      setCardActionLoading(false);
    }
  };

  const handleStatusUpdate = async (status: 'ACTIVE' | 'INACTIVE' | 'BLOCKED') => {
    if (selectedEmployeeId === '') {
      setCardFeedback('اختر موظفاً أولاً.');
      return;
    }

    setCardActionLoading(true);
    try {
      await updateEmployeeNfcCardStatus(selectedEmployeeId, status);
      await refreshEmployeesAndCard(selectedEmployeeId);
      setCardFeedback('تم تحديث حالة البطاقة بنجاح.');
      setLoadError(null);
    } catch (error: unknown) {
      setCardFeedback(getErrorMessage(error, 'فشل تحديث حالة البطاقة.'));
    } finally {
      setCardActionLoading(false);
    }
  };

  const handleUnassign = async () => {
    if (selectedEmployeeId === '') {
      setCardFeedback('اختر موظفاً أولاً.');
      return;
    }

    setCardActionLoading(true);
    try {
      await unassignEmployeeNfcCard(selectedEmployeeId);
      await loadEmployees();
      setSelectedCard(null);
      setCardUidInput('');
      setCardFeedback('تم فك ربط البطاقة من الموظف.');
      setLoadError(null);
    } catch (error: unknown) {
      setCardFeedback(getErrorMessage(error, 'فشل فك ربط البطاقة.'));
    } finally {
      setCardActionLoading(false);
    }
  };

  const handleRecruitmentSuccess = () => {
    setShowRecruitmentForm(false);
    getPendingRecruitmentRequestsPage({ page: recruitmentPage, size: 10 })
      .then((res) => {
        setPendingRecruitment(res.data.items);
        setRecruitmentTotalPages(res.data.totalPages);
        setRecruitmentTotalCount(res.data.totalCount);
      })
      .catch(() => {});
  };

  const handlePrevMonth = () => {
    setReportDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setReportDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleDownloadRecruitment = async (type: 'pdf' | 'excel') => {
    setIsDownloading(true);
    try {
      const response = type === 'pdf' 
        ? await downloadRecruitmentPdf(reportMonth, reportYear)
        : await downloadRecruitmentExcel(reportMonth, reportYear);
      
      const blob = new Blob([response.data], { 
        type: type === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `recruitment_report_${reportMonth}_${reportYear}.${type === 'pdf' ? 'pdf' : 'xlsx'}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      alert('فشل تحميل تقرير التوظيف.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadAttendance = async (type: 'pdf' | 'excel') => {
    setIsDownloading(true);
    try {
      const response = type === 'pdf' 
        ? await downloadAttendancePdf(reportMonth, reportYear)
        : await downloadAttendanceExcel(reportMonth, reportYear);
      
      const blob = new Blob([response.data], { 
        type: type === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `attendance_report_${reportMonth}_${reportYear}.${type === 'pdf' ? 'pdf' : 'xlsx'}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      alert('فشل تحميل تقرير الحضور.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadPayroll = async (type: 'pdf' | 'excel') => {
    setIsDownloading(true);
    try {
      const response = type === 'pdf' 
        ? await downloadPayrollPdf(reportMonth, reportYear)
        : await downloadPayrollExcel(reportMonth, reportYear);
      
      const blob = new Blob([response.data], { 
        type: type === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `payroll_report_${reportMonth}_${reportYear}.${type === 'pdf' ? 'pdf' : 'xlsx'}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      alert('فشل تحميل تقرير الرواتب.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleProcessRecruitment = async (requestId: number, status: 'Approved' | 'Rejected') => {
    setProcessingRecruitment(requestId);
    try {
      const salaryNum = adjustedSalary ? parseFloat(adjustedSalary) : undefined;
      await processRecruitmentRequest(requestId, status, recruitmentNote || undefined, salaryNum);
      setPendingRecruitment((prev) => prev.filter((r) => r.requestId !== requestId));
      setRecruitmentNote('');
      setAdjustedSalary('');
      setSelectedRecruitmentId(null);
    } catch {
      setLoadError('فشل معالجة طلب التوظيف');
    } finally {
      setProcessingRecruitment(null);
    }
  };

  const handleProcessLeave = async (requestId: number, status: 'APPROVED' | 'REJECTED') => {
    setProcessingLeave(requestId);
    try {
      await processLeaveRequest(requestId, status, leaveNote || undefined);
      setPendingLeaves((prev) => prev.filter((r) => r.requestId !== requestId));
      setLeaveNote('');
      setSelectedLeaveId(null);
    } catch {
      setLoadError('فشل معالجة طلب الإجازة');
    } finally {
      setProcessingLeave(null);
    }
  };

  const cardStatusBadge = selectedCard
    ? selectedCard.status === 'Active'
      ? 'bg-green-500/10 text-green-400'
      : selectedCard.status === 'Blocked'
        ? 'bg-red-500/10 text-red-400'
        : 'bg-amber-500/10 text-amber-300'
    : 'bg-slate-500/10 text-slate-400';

  return (
    <>
      <header className="mb-10">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight arabic-text">
              إدارة الموارد البشرية (HR)
            </h1>
            <p className="text-slate-400 mt-1">إدارة البطاقات الذكية ومعالجة الرواتب الشهرية</p>
          </div>
          <div className="flex items-center gap-4">
            <CurrentDateTimePanel />
            <Link
              to="/hr/grid"
              className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all border border-white/10"
            >
              <Search size={20} />
              <span>الشبكة المركزية للحضور</span>
            </Link>
            <button
              onClick={() => setShowRecruitmentForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-600/20"
            >
              <UserPlus size={20} />
              <span>طلب توظيف جديد</span>
            </button>
          </div>
        </div>
      </header>

      {loadError && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 text-red-200 text-sm font-medium">{loadError}</div>
      )}

      <div className="grid grid-cols-1 gap-8 mb-10">
        <motion.div
          initial={{ opacity: 1, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-luxury-surface rounded-[2.5rem] p-8 shadow-sm border border-white/5"
        >
          <div className="flex justify-between items-start mb-6 gap-4 flex-wrap">
            <div>
              <div className="bg-blue-600 w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-900/20 mb-4">
                <CreditCard size={24} />
              </div>
              <h2 className="text-xl font-bold mb-2 text-white">إدارة بطاقات NFC</h2>
              <p className="text-slate-400 text-sm leading-relaxed">
                اختر موظفاً ثم اربط بطاقة جديدة، استبدل UID، غيّر الحالة، أو فك الارتباط بالكامل.
              </p>
            </div>
            <span className="bg-blue-500/10 text-blue-400 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-widest">
              Live Card Control
            </span>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-6">
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <select
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-sm text-white focus:ring-2 focus:ring-blue-500/20 appearance-none"
                  value={selectedEmployeeId === '' ? '' : String(selectedEmployeeId)}
                  onChange={(e) => {
                    setSelectedEmployeeId(e.target.value ? Number(e.target.value) : '');
                    setCardFeedback(null);
                    setCardUidInput('');
                  }}
                >
                  <option value="" className="bg-slate-900">اختر الموظف من القائمة...</option>
                  {employees.map((employee) => (
                    <option key={employee.employeeId} value={employee.employeeId} className="bg-slate-900">
                      {employee.fullName} ({employee.teamName ?? '—'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                  <p className="text-slate-500 text-xs mb-1">الموظف</p>
                  <p className="text-white font-bold">{selectedEmployee?.fullName ?? '—'}</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                  <p className="text-slate-500 text-xs mb-1">UID الحالي</p>
                  <p className="text-slate-200 font-mono text-sm break-all">{selectedCard?.uid ?? '—'}</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                  <p className="text-slate-500 text-xs mb-1">الحالة</p>
                  <span className={`inline-flex px-3 py-1 rounded-lg text-[11px] font-black uppercase ${cardStatusBadge}`}>
                    {selectedCard?.status ?? 'No Card'}
                  </span>
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-2 text-white font-bold">
                  <IdCard size={18} />
                  <span>{selectedCard ? 'استبدال أو إعادة إصدار البطاقة' : 'ربط بطاقة جديدة'}</span>
                </div>
                <input
                  type="text"
                  value={cardUidInput}
                  onChange={(e) => setCardUidInput(e.target.value)}
                  placeholder={selectedCard ? 'أدخل UID جديداً للاستبدال' : 'أدخل UID البطاقة الجديدة'}
                  className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-sm text-white placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500/20"
                />
                <button
                  type="button"
                  onClick={handleAssignOrReplace}
                  disabled={cardActionLoading || selectedEmployeeId === ''}
                  className="w-full bg-white text-black py-3 rounded-xl font-bold hover:bg-slate-200 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {cardActionLoading ? <RefreshCcw className="animate-spin" size={18} /> : <LinkIcon size={18} />}
                  <span>{selectedCard ? 'استبدال البطاقة الحالية' : 'ربط البطاقة الجديدة'}</span>
                </button>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-[2rem] p-6 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-white font-bold">إجراءات الحالة</p>
                  <p className="text-slate-500 text-xs mt-1">تفعيل، إيقاف، حظر، أو فك الارتباط</p>
                </div>
                <span className="text-xs text-slate-500">{selectedEmployee?.fullName ?? ''}</span>
              </div>

              <button
                type="button"
                onClick={() => handleStatusUpdate('ACTIVE')}
                disabled={cardActionLoading || !selectedCard}
                className="w-full bg-green-500/10 text-green-300 border border-green-500/20 py-3 rounded-xl font-bold hover:bg-green-500/15 transition-all disabled:opacity-40"
              >
                تفعيل البطاقة
              </button>
              <button
                type="button"
                onClick={() => handleStatusUpdate('INACTIVE')}
                disabled={cardActionLoading || !selectedCard}
                className="w-full bg-amber-500/10 text-amber-200 border border-amber-500/20 py-3 rounded-xl font-bold hover:bg-amber-500/15 transition-all disabled:opacity-40"
              >
                <span className="inline-flex items-center gap-2">
                  <Power size={16} />
                  إيقاف البطاقة
                </span>
              </button>
              <button
                type="button"
                onClick={() => handleStatusUpdate('BLOCKED')}
                disabled={cardActionLoading || !selectedCard}
                className="w-full bg-red-500/10 text-red-300 border border-red-500/20 py-3 rounded-xl font-bold hover:bg-red-500/15 transition-all disabled:opacity-40"
              >
                حظر البطاقة
              </button>
              <button
                type="button"
                onClick={handleUnassign}
                disabled={cardActionLoading || !selectedCard}
                className="w-full bg-white/5 text-slate-300 border border-white/10 py-3 rounded-xl font-bold hover:bg-white/10 transition-all disabled:opacity-40"
              >
                <span className="inline-flex items-center gap-2">
                  <Trash2 size={16} />
                  فك الارتباط نهائياً
                </span>
              </button>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4 min-h-28">
                <p className="text-slate-500 text-xs mb-2">ملخص البطاقة</p>
                {selectedCard ? (
                  <div className="space-y-2 text-sm">
                    <p className="text-slate-200">UID: <span className="font-mono">{selectedCard.uid}</span></p>
                    <p className="text-slate-200">الحالة الحالية: {selectedCard.status}</p>
                    <p className="text-slate-400 text-xs">تاريخ الإصدار: {selectedCard.issuedDate ? new Date(selectedCard.issuedDate).toLocaleString('ar-SA') : '—'}</p>
                  </div>
                ) : (
                  <p className="text-slate-500 text-sm">لا توجد بطاقة مرتبطة بالموظف المحدد حالياً.</p>
                )}
              </div>
            </div>
          </div>

          {cardFeedback && (
            <div className="mt-6 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-200 text-sm font-medium">
              {cardFeedback}
            </div>
          )}
        </motion.div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
        {/* Reports Center Card */}
        <motion.div
          initial={{ opacity: 1, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:col-span-3 bg-luxury-surface rounded-[2.5rem] p-8 shadow-sm border border-white/5"
        >
          <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-6">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-500/10 w-12 h-12 rounded-2xl flex items-center justify-center text-emerald-400">
                <FileText size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">مركز التقارير الشهرية</h2>
                <p className="text-slate-400 text-sm">تصدير بيانات الحضور، الرواتب، والتوظيف لـ {reportDate.toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' })}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-xl border border-white/10">
              <button onClick={handlePrevMonth} className="text-slate-400 hover:text-white transition-colors">
                <ChevronRight size={18} />
              </button>
              <span className="text-white font-bold text-xs min-w-[100px] text-center">
                {reportDate.toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' })}
              </span>
              <button 
                onClick={handleNextMonth} 
                disabled={reportDate >= new Date()} 
                className="text-slate-400 hover:text-white disabled:opacity-30 transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Attendance Reports */}
            <div className="bg-white/5 p-6 rounded-2xl border border-white/5">
              <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                <CheckCircle2 size={16} className="text-blue-400" />
                تقارير الحضور
              </h3>
              <div className="flex gap-2">
                <button 
                  onClick={() => handleDownloadAttendance('pdf')}
                  disabled={isDownloading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-bold transition-all text-xs disabled:opacity-50"
                >
                  PDF
                </button>
                <button 
                  onClick={() => handleDownloadAttendance('excel')}
                  disabled={isDownloading}
                  className="flex-1 bg-white/10 hover:bg-white/20 text-white py-2 rounded-lg font-bold transition-all text-xs disabled:opacity-50"
                >
                  Excel
                </button>
              </div>
            </div>

            {/* Payroll Reports */}
            <div className="bg-white/5 p-6 rounded-2xl border border-white/5">
              <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                <CreditCard size={16} className="text-purple-400" />
                تقارير الرواتب
              </h3>
              <div className="flex gap-2">
                <button 
                  onClick={() => handleDownloadPayroll('pdf')}
                  disabled={isDownloading}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg font-bold transition-all text-xs disabled:opacity-50"
                >
                  PDF
                </button>
                <button 
                  onClick={() => handleDownloadPayroll('excel')}
                  disabled={isDownloading}
                  className="flex-1 bg-white/10 hover:bg-white/20 text-white py-2 rounded-lg font-bold transition-all text-xs disabled:opacity-50"
                >
                  Excel
                </button>
              </div>
            </div>

            {/* Recruitment Reports */}
            <div className="bg-white/5 p-6 rounded-2xl border border-white/5">
              <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                <UserPlus size={16} className="text-orange-400" />
                تقارير التوظيف
              </h3>
              <div className="flex gap-2">
                <button 
                  onClick={() => handleDownloadRecruitment('pdf')}
                  disabled={isDownloading}
                  className="flex-1 bg-orange-600 hover:bg-orange-700 text-white py-2 rounded-lg font-bold transition-all text-xs disabled:opacity-50"
                >
                  PDF
                </button>
                <button 
                  onClick={() => handleDownloadRecruitment('excel')}
                  disabled={isDownloading}
                  className="flex-1 bg-white/10 hover:bg-white/20 text-white py-2 rounded-lg font-bold transition-all text-xs disabled:opacity-50"
                >
                  Excel
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="bg-luxury-surface rounded-[2.5rem] shadow-sm border border-white/5 overflow-hidden mb-10">
        <div className="p-8 border-b border-white/5 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-orange-500/10 w-12 h-12 rounded-2xl flex items-center justify-center text-orange-400">
              <UserPlus size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">طلبات التوظيف المعلقة</h2>
              <p className="text-slate-400 text-sm">
                {pendingRecruitment.length} طلب بانتظار المراجعة
              </p>
            </div>
          </div>
        </div>

        {pendingRecruitment.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <UserPlus size={48} className="mx-auto mb-4 opacity-50" />
            <p>لا توجد طلبات توظيف معلقة</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {pendingRecruitment.map((request) => (
              <div key={request.requestId} className="p-6 hover:bg-white/5 transition-all">
                <div className="flex justify-between items-start gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-lg font-bold text-white">{request.fullName}</h3>
                      <span className="bg-orange-500/10 text-orange-400 px-3 py-1 rounded-lg text-xs font-bold">
                        {request.status?.replace('_', ' ') || 'قيد المراجعة'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-slate-500 text-xs mb-1">الوظيفة</p>
                        <p className="text-slate-200 font-medium">{request.jobDescription}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-xs mb-1">القسم</p>
                        <p className="text-slate-200 font-medium">{request.department}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-xs mb-1">الراتب المتوقع</p>
                        <p className="text-slate-200 font-medium">{request.expectedSalary} ريال</p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-xs mb-1">رقم الهوية</p>
                        <p className="text-slate-200 font-mono">{request.nationalId}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-xs mb-1">الجوال</p>
                        <p className="text-slate-200 font-mono">{request.mobileNumber}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-xs mb-1">تاريخ الطلب</p>
                        <p className="text-slate-200">
                          {request.requestedAt
                            ? new Date(request.requestedAt).toLocaleDateString('ar-SA')
                            : '—'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 min-w-[220px]">
                    {selectedRecruitmentId === request.requestId ? (
                      <div className="space-y-2">
                        <input
                          type="number"
                          placeholder="تعديل الراتب (اختياري)"
                          value={adjustedSalary}
                          onChange={(e) => setAdjustedSalary(e.target.value)}
                          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500/20"
                        />
                        <input
                          type="text"
                          placeholder="ملاحظة (اختياري)"
                          value={recruitmentNote}
                          onChange={(e) => setRecruitmentNote(e.target.value)}
                          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500/20"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleProcessRecruitment(request.requestId!, 'Approved')}
                            disabled={processingRecruitment === request.requestId}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1 disabled:opacity-50"
                          >
                            موافقة
                          </button>
                          <button
                            onClick={() => handleProcessRecruitment(request.requestId!, 'Rejected')}
                            disabled={processingRecruitment === request.requestId}
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1 disabled:opacity-50"
                          >
                            رفض
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setSelectedRecruitmentId(request.requestId!);
                          setRecruitmentNote('');
                          setAdjustedSalary('');
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all"
                      >
                        مراجعة الطلب
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        <PaginationControls
          page={recruitmentPage}
          totalPages={recruitmentTotalPages}
          totalCount={recruitmentTotalCount}
          onPageChange={setRecruitmentPage}
        />
      </div>

      <div className="bg-luxury-surface rounded-[2.5rem] shadow-sm border border-white/5 overflow-hidden mb-10">
        <div className="p-8 border-b border-white/5 flex items-center gap-3">
          <div className="bg-blue-500/10 w-12 h-12 rounded-2xl flex items-center justify-center text-blue-400">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">اعتمادات الإجازات (HR)</h2>
            <p className="text-slate-400 text-sm">
              {pendingLeaves.length} طلب إجازة معتمد من المدير بانتظار توثيق الـ HR
            </p>
          </div>
        </div>

        {pendingLeaves.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <CheckCircle2 size={48} className="mx-auto mb-4 opacity-50" />
            <p>لا توجد طلبات إجازة معلقة للمراجعة</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {pendingLeaves.map((leave) => (
              <div key={leave.requestId} className="p-6 hover:bg-white/5 transition-all">
                <div className="flex justify-between items-start gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-lg font-bold text-white">{leave.employeeName ?? `الموظف #${leave.employeeId}`}</h3>
                      <span className="bg-blue-500/10 text-blue-400 px-3 py-1 rounded-lg text-xs font-bold">
                        {leave.leaveType === 'Hourly' ? 'إجازة ساعية' : 'إجازة مسبقة'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-slate-500 text-xs mb-1">المدة</p>
                        <p className="text-slate-200 font-medium">{leave.duration} {leave.leaveType === 'Hourly' ? 'ساعة' : 'يوم'}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-xs mb-1">تاريخ الإجازة</p>
                        <p className="text-slate-200 font-medium">{leave.startDate}</p>
                      </div>
                      {leave.reason && (
                        <div className="col-span-2">
                          <p className="text-slate-500 text-xs mb-1">السبب</p>
                          <p className="text-slate-200 text-xs">{leave.reason}</p>
                        </div>
                      )}
                      {leave.managerNote && (
                        <div className="col-span-2">
                          <p className="text-orange-400 text-xs mb-1">ملاحظة المدير</p>
                          <p className="text-slate-200 text-xs border border-orange-500/20 bg-orange-500/5 p-2 rounded-lg">{leave.managerNote}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 min-w-[200px]">
                    {selectedLeaveId === leave.requestId ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          placeholder="ملاحظة للموظف (اختياري)"
                          value={leaveNote}
                          onChange={(e) => setLeaveNote(e.target.value)}
                          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500/20"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleProcessLeave(leave.requestId!, 'APPROVED')}
                            disabled={processingLeave === leave.requestId}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1 disabled:opacity-50"
                          >
                            {processingLeave === leave.requestId ? '...' : 'اعتماد وخصم الرصيد'}
                          </button>
                          <button
                            onClick={() => handleProcessLeave(leave.requestId!, 'REJECTED')}
                            disabled={processingLeave === leave.requestId}
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1 disabled:opacity-50"
                          >
                            رفض
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setSelectedLeaveId(leave.requestId!);
                          setLeaveNote('');
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all"
                      >
                        مراجعة الاعتماد
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        <PaginationControls
          page={leavePage}
          totalPages={leaveTotalPages}
          totalCount={leaveTotalCount}
          onPageChange={setLeavePage}
        />
      </div>

      <section className="bg-luxury-surface rounded-[2.5rem] shadow-sm border border-white/5 overflow-hidden">
        <div className="p-8 border-b border-white/5 flex justify-between items-center flex-wrap gap-4">
          <h3 className="font-bold text-xl text-white">قائمة الموظفين (قاعدة البيانات)</h3>
          <span className="text-sm text-slate-500">{employees.length} موظف</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead className="bg-white/5 text-slate-400 text-[10px] font-black uppercase tracking-[0.15em]">
              <tr>
                <th className="p-6">الموظف</th>
                <th className="p-6">البريد</th>
                <th className="p-6">الفريق</th>
                <th className="p-6">معرف البطاقة UID</th>
                <th className="p-6">حالة البطاقة</th>
                <th className="p-6">إدارة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {employees.length === 0 && !loadError ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500 text-sm">
                    لا يوجد موظفون في النظام. أضف موظفين عبر قاعدة البيانات أو أداة الإدارة.
                  </td>
                </tr>
              ) : (
                employees.map((emp) => (
                  <tr key={emp.employeeId} className="hover:bg-white/5 transition-all">
                    <td className="p-6 font-bold text-slate-100">{emp.fullName}</td>
                    <td className="p-6 text-slate-400 text-sm font-medium">{emp.email}</td>
                    <td className="p-6 text-slate-400 text-sm font-medium">{emp.teamName ?? '—'}</td>
                    <td className="p-6 font-mono text-slate-400 text-sm">{emp.cardUid ?? '—'}</td>
                    <td className="p-6">
                      <span
                        className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${
                          emp.nfcLinked
                            ? emp.nfcStatus === 'Blocked'
                              ? 'bg-red-500/10 text-red-400'
                              : emp.nfcStatus === 'Inactive'
                                ? 'bg-amber-500/10 text-amber-300'
                                : 'bg-green-500/10 text-green-400'
                            : 'bg-orange-500/10 text-orange-400'
                        }`}
                      >
                        {emp.nfcLinked ? (emp.nfcStatus ?? 'مرتبط') : 'بدون بطاقة'}
                      </span>
                    </td>
                    <td className="p-6">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedEmployeeId(emp.employeeId);
                          setCardFeedback(null);
                          setCardUidInput('');
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all"
                      >
                        إدارة البطاقة
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {showRecruitmentForm && (
        <RecruitmentRequestForm
          onClose={() => setShowRecruitmentForm(false)}
          onSuccess={handleRecruitmentSuccess}
        />
      )}
    </>
  );
};

export default HRDashboard;
