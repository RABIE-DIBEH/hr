import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HandCoins,
  DollarSign,
  Clock,
  FileText,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  Search,
  Calculator,
  History,
  X,
  TrendingUp,
  TrendingDown,
  Printer,
  AlertCircle,
  UserPlus,
} from 'lucide-react';
import PaginationControls from '../components/PaginationControls';
import {
  getCurrentEmployee,
  getPendingAdvanceRequestsPage,
  processAdvanceRequest,
  deliverAdvanceRequest,
  getApprovedAdvancesAwaitingDeliveryPage,
  deliverAllApprovedAdvances,
  getAdvanceApprovalReport,
  getAllAdvanceRequestsPage,
  downloadPayrollPdf,
  downloadPayrollExcel,
  getAllPayrollHistoryPage,
  calculatePayroll,
  calculateAllPayroll,
  listEmployeesPage,
  getPendingRecruitmentRequestsPage,
  processRecruitmentRequest,
  type EmployeeProfile,
  type AdvanceRequest,
  type PayrollSlip,
  type EmployeeSummary,
  type RecruitmentRequest,
  type ProcessRecruitmentResponse,
} from '../services/api';

const PayrollDashboard = () => {
  const [me, setMe] = useState<EmployeeProfile | null>(null);
  const [activeTab, setActiveTab] = useState<'advances' | 'recruitment' | 'history' | 'calculate'>('advances');
  const [, setLoadError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());

  // Advances State
  const [pendingAdvances, setPendingAdvances] = useState<AdvanceRequest[]>([]);
  const [approvedAdvances, setApprovedAdvances] = useState<AdvanceRequest[]>([]);
  const [allAdvances, setAllAdvances] = useState<AdvanceRequest[]>([]);
  const [processingAdvance, setProcessingAdvance] = useState<number | null>(null);
  const [advanceNote, setAdvanceNote] = useState<string>('');
  const [selectedAdvanceId, setSelectedAdvanceId] = useState<number | null>(null);
  const [advancesSubTab, setAdvancesSubTab] = useState<'pending' | 'approved' | 'all'>('pending');
  const [pendingPage, setPendingPage] = useState(0);
  const [pendingTotalPages, setPendingTotalPages] = useState(0);
  const [pendingTotalCount, setPendingTotalCount] = useState(0);
  const [approvedPage, setApprovedPage] = useState(0);
  const [approvedTotalPages, setApprovedTotalPages] = useState(0);
  const [approvedTotalCount, setApprovedTotalCount] = useState(0);
  const [allPage, setAllPage] = useState(0);
  const [allTotalPages, setAllTotalPages] = useState(0);
  const [allTotalCount, setAllTotalCount] = useState(0);

  // History State
  const [slips, setSlips] = useState<PayrollSlip[]>([]);
  const [historyPage, setHistoryPage] = useState(0);
  const [historyTotalPages, setHistoryTotalPages] = useState(0);
  const [historyTotalCount, setHistoryTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSlip, setSelectedSlip] = useState<PayrollSlip | null>(null);

  // Calculate State
  const [employees, setEmployees] = useState<EmployeeSummary[]>([]);
  const [calculatingId, setCalculatingId] = useState<number | null>(null);
  const [calcFeedback, setCalcFeedback] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [showConfirmCalc, setShowConfirmCalc] = useState<{ id?: number; name: string } | null>(null);

  // Recruitment approvals (Stage 3: PENDING_PAYROLL)
  const [pendingRecruitment, setPendingRecruitment] = useState<RecruitmentRequest[]>([]);
  const [recruitmentPage, setRecruitmentPage] = useState(0);
  const [recruitmentTotalPages, setRecruitmentTotalPages] = useState(0);
  const [recruitmentTotalCount, setRecruitmentTotalCount] = useState(0);
  const [processingRecruitment, setProcessingRecruitment] = useState<number | null>(null);
  const [recruitmentNote, setRecruitmentNote] = useState('');
  const [adjustedSalary, setAdjustedSalary] = useState('');
  const [selectedRecruitmentId, setSelectedRecruitmentId] = useState<number | null>(null);
  const [createdCredentials, setCreatedCredentials] = useState<{
    username: string;
    password: string;
    employeeId: string;
    employeeName: string;
  } | null>(null);

  const reportMonth = currentDate.getMonth() + 1;
  const reportYear = currentDate.getFullYear();

  useEffect(() => {
    getCurrentEmployee()
      .then((res) => setMe(res.data))
      .catch(() => setMe(null));
  }, []);

  const canManagePayroll = me?.roleName === 'HR'
    || me?.roleName === 'PAYROLL'
    || me?.roleName === 'ADMIN'
    || me?.roleName === 'SUPER_ADMIN';

  // Load Advances
  const loadAdvancesData = async () => {
    if (!canManagePayroll) return;
    try {
      const [pendingRes, approvedRes, allRes] = await Promise.all([
        getPendingAdvanceRequestsPage({ page: pendingPage, size: 10 }),
        getApprovedAdvancesAwaitingDeliveryPage({ page: approvedPage, size: 10 }),
        getAllAdvanceRequestsPage({ page: allPage, size: 10 }),
      ]);
      setPendingAdvances(pendingRes.data.items);
      setPendingTotalPages(pendingRes.data.totalPages);
      setPendingTotalCount(pendingRes.data.totalCount);
      setApprovedAdvances(approvedRes.data.items);
      setApprovedTotalPages(approvedRes.data.totalPages);
      setApprovedTotalCount(approvedRes.data.totalCount);
      setAllAdvances(allRes.data.items);
      setAllTotalPages(allRes.data.totalPages);
      setAllTotalCount(allRes.data.totalCount);
    } catch {
      setLoadError('تعذر تحميل بيانات السلف');
    }
  };

  // Load History
  const loadHistoryData = async () => {
    if (!canManagePayroll) return;
    try {
      const res = await getAllPayrollHistoryPage({ page: historyPage, size: 10 });
      setSlips(res.data.items);
      setHistoryTotalPages(res.data.totalPages);
      setHistoryTotalCount(res.data.totalCount);
    } catch {
      setLoadError('تعذر تحميل سجل الرواتب');
    }
  };

  // Load Employees for Calculation
  const loadEmployeesForCalc = async () => {
    if (!canManagePayroll) return;
    try {
      const res = await listEmployeesPage({ page: 0, size: 100 });
      setEmployees(res.data.items);
    } catch {
      setLoadError('تعذر تحميل قائمة الموظفين');
    }
  };

  const loadRecruitmentData = async () => {
    if (!canManagePayroll) return;
    try {
      const res = await getPendingRecruitmentRequestsPage({ page: recruitmentPage, size: 10 });
      setPendingRecruitment(res.data.items);
      setRecruitmentTotalPages(res.data.totalPages);
      setRecruitmentTotalCount(res.data.totalCount);
    } catch {
      setLoadError('تعذر تحميل طلبات التوظيف');
    }
  };

  useEffect(() => {
    if (activeTab === 'advances') void loadAdvancesData();
    if (activeTab === 'recruitment') void loadRecruitmentData();
    if (activeTab === 'history') void loadHistoryData();
    if (activeTab === 'calculate') void loadEmployeesForCalc();
  }, [activeTab, pendingPage, approvedPage, allPage, historyPage, recruitmentPage, canManagePayroll]);

  const handleProcessRecruitment = async (requestId: number, status: 'Approved' | 'Rejected') => {
    setProcessingRecruitment(requestId);
    try {
      const salaryNum = adjustedSalary ? parseFloat(adjustedSalary) : undefined;
      const res = await processRecruitmentRequest(requestId, status, recruitmentNote || undefined, salaryNum);
      const data: ProcessRecruitmentResponse = res.data;

      if (status === 'Approved' && data.username && data.password) {
        setCreatedCredentials({
          username: data.username ?? '',
          password: data.password ?? '',
          employeeId: data.employeeId ?? '',
          employeeName: data.request?.fullName ?? '',
        });
      }

      setRecruitmentNote('');
      setAdjustedSalary('');
      setSelectedRecruitmentId(null);
      void loadRecruitmentData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'فشل معالجة طلب التوظيف';
      setLoadError(msg);
    } finally {
      setProcessingRecruitment(null);
    }
  };

  const handlePrevMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
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
      alert('فشل تحميل تقرير الرواتب');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleProcessAdvance = async (advanceId: number, status: 'Approved' | 'Rejected') => {
    setProcessingAdvance(advanceId);
    try {
      await processAdvanceRequest(advanceId, status, advanceNote || undefined);
      setAdvanceNote('');
      setSelectedAdvanceId(null);
      void loadAdvancesData();
    } catch {
      setLoadError('فشل معالجة طلب السلفة');
    } finally {
      setProcessingAdvance(null);
    }
  };

  const handleDeliverAdvance = async (advanceId: number) => {
    setProcessingAdvance(advanceId);
    try {
      await deliverAdvanceRequest(advanceId);
      void loadAdvancesData();
    } catch {
      setLoadError('فشل تعليم طلب السلفة كـ تم التسليم');
    } finally {
      setProcessingAdvance(null);
    }
  };

  const handleDeliverAllApproved = async () => {
    if (!window.confirm(`تأكيد: تسليم جميع السلف المعتمدة لشهر ${reportMonth}/${reportYear}؟`)) return;
    setProcessingAdvance(-1);
    try {
      await deliverAllApprovedAdvances(reportMonth, reportYear);
      void loadAdvancesData();
    } catch {
      setLoadError('فشل تسليم جميع السلف المعتمدة');
    } finally {
      setProcessingAdvance(null);
    }
  };

  const handleDownloadAdvanceReportCsv = async () => {
    try {
      const res = await getAdvanceApprovalReport(reportMonth, reportYear);
      const report = res.data;

      const rows = [
        ['employeeId', 'employeeName', 'amount', 'requestedAt', 'reason'],
        ...report.items.map((item) => [
          String(item.employeeId ?? ''),
          String(item.employeeName ?? ''),
          String(item.amount ?? ''),
          String(item.requestedAt ?? ''),
          String(item.reason ?? ''),
        ]),
        [],
        ['totalCount', String(report.totalCount)],
        ['totalAmount', String(report.totalAmount)],
      ];

      const csv = rows
        .map((cols) =>
          cols
            .map((col) => {
              const s = String(col ?? '');
              // Basic CSV escaping.
              return `"${s.replaceAll('"', '""')}"`;
            })
            .join(','),
        )
        .join('\n');

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `advances_approved_${reportMonth}_${reportYear}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      alert('فشل تحميل تقرير السلف');
    }
  };

  const handleRunCalculation = async (empId?: number) => {
    setCalculatingId(empId ?? -1); // -1 for "All"
    setCalcFeedback(null);
    setShowConfirmCalc(null);
    try {
      if (empId === undefined || empId === -1) {
        // Batch calculation for all employees
        const res = await calculateAllPayroll(reportMonth, reportYear);
        const data = res.data;
        const successCount = data.successCount;
        const errorCount = data.errorCount;
        setCalcFeedback({
          msg: `تم احتساب ${successCount} موظف بنجاح${errorCount > 0 ? `، ${errorCount} خطأ` : ''}`,
          type: 'success',
        });
      } else {
        await calculatePayroll(reportMonth, reportYear, empId);
        setCalcFeedback({ msg: 'تم احتساب الراتب بنجاح', type: 'success' });
      }
      if (activeTab === 'history') void loadHistoryData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'فشل احتساب الراتب';
      setCalcFeedback({ msg, type: 'error' });
    } finally {
      setCalculatingId(null);
    }
  };

  const totalApprovedAmount = approvedAdvances
    .reduce((sum, a) => sum + (typeof a.amount === 'number' ? a.amount : Number(a.amount ?? 0)), 0);

  const stats = [
    { label: 'سلف معلقة', value: String(pendingTotalCount), icon: Clock, color: 'text-orange-400', bg: 'bg-orange-500/10' },
    { label: 'إجمالي السلف', value: totalApprovedAmount.toLocaleString() + ' ر.س', icon: HandCoins, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { label: 'سجلات الرواتب', value: String(historyTotalCount), icon: History, color: 'text-green-400', bg: 'bg-green-500/10' },
  ];

  return (
    <>
      <header className="mb-10 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight arabic-text">
            إدارة الرواتب
          </h1>
          <p className="text-slate-400 mt-2">
            إدارة شاملة للسلف المالية، احتساب الرواتب، وسجلات الصرف
          </p>
        </div>
        <div className="flex items-center gap-3 bg-purple-500/10 px-6 py-3 rounded-2xl border border-purple-500/20">
          <DollarSign size={24} className="text-purple-400" />
          <span className="text-purple-100 font-black text-lg">Payroll Management Department</span>
        </div>
      </header>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {stats.map((stat, idx) => (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                key={stat.label}
                className="bg-luxury-surface p-6 rounded-3xl shadow-sm border border-white/5"
              >
                <div className={stat.bg + ' ' + stat.color + ' w-12 h-12 rounded-2xl flex items-center justify-center mb-4'}>
                  <stat.icon size={24} />
                </div>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">{stat.label}</p>
                <p className="text-2xl font-black text-white">{stat.value}</p>
              </motion.div>
            ))}
          </div>

          {/* Monthly Report Quick Export */}
          <div className="mb-10 bg-luxury-surface p-8 rounded-[2.5rem] border border-white/5 shadow-sm">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-3">
                  <FileText className="text-purple-500" size={24} />
                  تقارير الرواتب الشهرية
                </h3>
                <p className="text-slate-400 text-sm mt-1">تصدير ملخص الرواتب لجميع الموظفين حسب الشهر</p>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-3 bg-white/5 px-5 py-2 rounded-xl border border-white/5">
                  <button onClick={handlePrevMonth} className="text-slate-400 hover:text-white transition-colors">
                    <ChevronRight size={20} />
                  </button>
                  <span className="text-white font-bold min-w-[100px] text-center">
                    {currentDate.toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' })}
                  </span>
                  <button 
                    onClick={handleNextMonth} 
                    disabled={currentDate >= new Date()} 
                    className="text-slate-400 hover:text-white disabled:opacity-30 transition-colors"
                  >
                    <ChevronLeft size={20} />
                  </button>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleDownloadPayroll('pdf')}
                    disabled={isDownloading}
                    className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all text-sm"
                  >
                    <FileText size={16} />
                    {isDownloading ? '...' : 'تصدير PDF'}
                  </button>
                  <button 
                    onClick={() => handleDownloadPayroll('excel')}
                    disabled={isDownloading}
                    className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-800 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all text-sm"
                  >
                    <FileSpreadsheet size={16} />
                    {isDownloading ? '...' : 'تصدير Excel'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Main Tabs */}
          <div className="flex gap-2 mb-8 bg-white/5 p-1.5 rounded-2xl w-fit">
            <button
              onClick={() => setActiveTab('advances')}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
                activeTab === 'advances' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' : 'text-slate-400 hover:text-white'
              }`}
            >
              <HandCoins size={18} />
              السلف المالية
            </button>
            <button
              onClick={() => setActiveTab('recruitment')}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
                activeTab === 'recruitment' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' : 'text-slate-400 hover:text-white'
              }`}
            >
              <UserPlus size={18} />
              التوظيف
            </button>
            <button
              onClick={() => setActiveTab('calculate')}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
                activeTab === 'calculate' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Calculator size={18} />
              احتساب الرواتب
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
                activeTab === 'history' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' : 'text-slate-400 hover:text-white'
              }`}
            >
              <History size={18} />
              سجل الرواتب
            </button>
          </div>

          {/* Tab Content */}
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
	            {activeTab === 'advances' && (
	              <>
	                <div className="flex gap-4 mb-4 border-b border-white/5">
	                  <button
	                    onClick={() => setAdvancesSubTab('pending')}
	                    className={`pb-4 px-4 font-bold transition-all ${advancesSubTab === 'pending' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-slate-500'}`}
	                  >
	                    بانتظار اعتماد الرواتب ({pendingTotalCount})
	                  </button>
	                  <button
	                    onClick={() => setAdvancesSubTab('approved')}
	                    className={`pb-4 px-4 font-bold transition-all ${advancesSubTab === 'approved' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-slate-500'}`}
	                  >
	                    معتمدة بانتظار التسليم ({approvedTotalCount})
	                  </button>
	                  <button
	                    onClick={() => setAdvancesSubTab('all')}
	                    className={`pb-4 px-4 font-bold transition-all ${advancesSubTab === 'all' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-slate-500'}`}
	                  >
	                    جميع السجلات ({allTotalCount})
	                  </button>
	                </div>
	
	                <div className="bg-luxury-surface rounded-[2.5rem] border border-white/5 overflow-hidden">
	                  {advancesSubTab === 'pending' ? (
	                    pendingAdvances.length === 0 ? (
	                      <div className="p-20 text-center text-slate-500">لا توجد طلبات سلف بانتظار اعتماد الرواتب.</div>
	                    ) : (
	                      <div className="divide-y divide-white/5">
	                        {pendingAdvances.map(advance => (
	                          <div key={advance.advanceId} className="p-8 hover:bg-white/[0.02] transition-all">
	                            <div className="flex justify-between items-start">
	                              <div className="flex gap-4">
	                                <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-400 font-black text-xl">
	                                  {advance.employeeName?.[0] || '؟'}
	                                </div>
	                                <div>
	                                  <h4 className="text-xl font-bold text-white">{advance.employeeName}</h4>
	                                  <p className="text-slate-500 text-sm flex items-center gap-2 mt-1">
	                                    <Clock size={14} /> {advance.requestedAt ? new Date(advance.requestedAt).toLocaleDateString('ar-SA') : ''}
	                                  </p>
	                                  <div className="mt-4 flex gap-8">
	                                    <div>
	                                      <p className="text-slate-500 text-xs font-bold uppercase mb-1">المبلغ</p>
	                                      <p className="text-purple-300 font-black text-lg">{advance.amount} ر.س</p>
	                                    </div>
	                                    <div>
	                                      <p className="text-slate-500 text-xs font-bold uppercase mb-1">السبب</p>
	                                      <p className="text-slate-300 text-sm">{advance.reason || '—'}</p>
	                                    </div>
	                                  </div>
	                                </div>
	                              </div>
	                              <div className="min-w-[250px]">
	                                {selectedAdvanceId === advance.advanceId ? (
	                                  <div className="space-y-3 p-4 bg-white/5 rounded-2xl border border-white/5">
	                                    <textarea
	                                      placeholder="ملاحظة الاعتماد/الرفض..."
	                                      value={advanceNote}
	                                      onChange={(e) => setAdvanceNote(e.target.value)}
	                                      className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white resize-none h-20"
	                                    />
	                                    <div className="flex gap-2">
	                                      <button
	                                        onClick={() => handleProcessAdvance(advance.advanceId!, 'Approved')}
	                                        disabled={processingAdvance === advance.advanceId}
	                                        className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-xl text-sm disabled:opacity-50"
	                                      >
	                                        اعتماد نهائي
	                                      </button>
	                                      <button
	                                        onClick={() => handleProcessAdvance(advance.advanceId!, 'Rejected')}
	                                        disabled={processingAdvance === advance.advanceId}
	                                        className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded-xl text-sm disabled:opacity-50"
	                                      >
	                                        رفض
	                                      </button>
	                                    </div>
	                                  </div>
	                                ) : (
	                                  <button
	                                    onClick={() => setSelectedAdvanceId(advance.advanceId!)}
	                                    className="w-full bg-white/5 hover:bg-white/10 text-white font-bold py-4 rounded-2xl border border-white/5 transition-all"
	                                  >
	                                    اتخاذ قرار
	                                  </button>
	                                )}
	                              </div>
	                            </div>
	                          </div>
	                        ))}
	                      </div>
	                    )
	                  ) : advancesSubTab === 'approved' ? (
	                    <>
	                      <div className="p-6 border-b border-white/5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
	                        <div>
	                          <p className="text-white font-bold">معتمدة بانتظار التسليم</p>
	                          <p className="text-slate-400 text-xs mt-1">يمكنك استخراج تقرير ثم تسليم السلف (فردي أو جماعي).</p>
	                        </div>
	                        <div className="flex flex-wrap gap-2">
	                          <button
	                            onClick={handleDownloadAdvanceReportCsv}
	                            className="bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-xl font-bold border border-white/10 text-sm"
	                          >
	                            تنزيل تقرير CSV
	                          </button>
	                          <button
	                            onClick={handleDeliverAllApproved}
	                            disabled={approvedTotalCount === 0 || processingAdvance !== null}
	                            className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-900 text-white px-4 py-2 rounded-xl font-bold text-sm"
	                          >
	                            تسليم الكل ({reportMonth}/{reportYear})
	                          </button>
	                        </div>
	                      </div>

	                      {approvedAdvances.length === 0 ? (
	                        <div className="p-20 text-center text-slate-500">لا توجد سلف معتمدة بانتظار التسليم.</div>
	                      ) : (
	                        <div className="divide-y divide-white/5">
	                          {approvedAdvances.map((adv) => (
	                            <div key={adv.advanceId} className="p-8 hover:bg-white/[0.02] transition-all flex flex-col md:flex-row md:items-center justify-between gap-6">
	                              <div className="flex items-start gap-4">
	                                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-300 font-black text-xl">
	                                  {adv.employeeName?.[0] || '؟'}
	                                </div>
	                                <div>
	                                  <p className="text-white font-black text-lg">{adv.employeeName}</p>
	                                  <p className="text-slate-500 text-sm">{adv.reason || '—'}</p>
	                                  <p className="text-slate-500 text-xs mt-2">
	                                    {adv.processedAt ? new Date(adv.processedAt).toLocaleString('ar-SA') : ''}
	                                  </p>
	                                </div>
	                              </div>
	                              <div className="flex items-center justify-between md:justify-end gap-4">
	                                <div className="text-right">
	                                  <p className="text-slate-500 text-xs font-bold uppercase mb-1">المبلغ</p>
	                                  <p className="text-emerald-200 font-black text-xl">{adv.amount} ر.س</p>
	                                </div>
	                                <button
	                                  onClick={() => handleDeliverAdvance(adv.advanceId!)}
	                                  disabled={processingAdvance === adv.advanceId}
	                                  className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-900 text-white font-bold px-6 py-3 rounded-2xl"
	                                >
	                                  {processingAdvance === adv.advanceId ? '...' : 'تم التسليم'}
	                                </button>
	                              </div>
	                            </div>
	                          ))}
	                        </div>
	                      )}
	                    </>
	                  ) : (
	                    <div className="overflow-x-auto">
	                      <table className="w-full text-right">
	                        <thead className="bg-white/5 text-slate-400 text-[11px] font-black uppercase tracking-wider">
	                          <tr>
	                            <th className="p-6">الموظف</th>
	                            <th className="p-6">المبلغ</th>
	                            <th className="p-6">الحالة</th>
	                            <th className="p-6">التاريخ</th>
	                            <th className="p-6">المعالج</th>
	                          </tr>
	                        </thead>
	                        <tbody className="divide-y divide-white/5 text-sm">
	                          {allAdvances.map(adv => {
	                            const status = adv.status;
	                            const statusClass =
	                              status === 'APPROVED' ? 'bg-green-500/10 text-green-400' :
	                              status === 'REJECTED' ? 'bg-red-500/10 text-red-400' :
	                              status === 'DELIVERED' ? 'bg-blue-500/10 text-blue-400' :
	                              status === 'PENDING_PAYROLL' ? 'bg-purple-500/10 text-purple-400' :
	                              'bg-orange-500/10 text-orange-400';
	                            const statusLabel =
	                              status === 'APPROVED' ? 'معتمد' :
	                              status === 'REJECTED' ? 'مرفوض' :
	                              status === 'DELIVERED' ? 'تم التسليم' :
	                              status === 'PENDING_PAYROLL' ? 'بانتظار الرواتب' :
	                              'بانتظار المدير';
	                            return (
	                              <tr key={adv.advanceId} className="hover:bg-white/[0.02]">
	                                <td className="p-6 font-bold text-slate-100">{adv.employeeName}</td>
	                                <td className="p-6 text-purple-300 font-bold">{adv.amount} ر.س</td>
	                                <td className="p-6">
	                                  <span className={`px-3 py-1 rounded-lg font-bold text-xs ${statusClass}`}>
	                                    {statusLabel}
	                                  </span>
	                                </td>
	                                <td className="p-6 text-slate-500">{adv.requestedAt ? new Date(adv.requestedAt).toLocaleDateString('ar-SA') : ''}</td>
	                                <td className="p-6 text-slate-400">{adv.processedByName || '—'}</td>
	                              </tr>
	                            );
	                          })}
	                        </tbody>
	                      </table>
	                    </div>
	                  )}
	                  {advancesSubTab === 'pending' ? (
	                    <PaginationControls page={pendingPage} totalPages={pendingTotalPages} totalCount={pendingTotalCount} onPageChange={setPendingPage} />
	                  ) : advancesSubTab === 'approved' ? (
	                    <PaginationControls page={approvedPage} totalPages={approvedTotalPages} totalCount={approvedTotalCount} onPageChange={setApprovedPage} />
	                  ) : (
	                    <PaginationControls page={allPage} totalPages={allTotalPages} totalCount={allTotalCount} onPageChange={setAllPage} />
	                  )}
	                </div>
	              </>
	            )}

            {activeTab === 'recruitment' && (
              <div className="bg-luxury-surface rounded-[2.5rem] border border-white/5 overflow-hidden">
                <div className="p-8 border-b border-white/5 flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-white arabic-text">اعتماد طلبات التوظيف (Payroll)</h3>
                    <p className="text-slate-400 text-sm mt-1">المرحلة الأخيرة: تحديد الراتب النهائي وإنشاء الموظف</p>
                  </div>
                  <div className="text-slate-400 text-sm">
                    إجمالي الطلبات: <span className="text-white font-bold">{recruitmentTotalCount}</span>
                  </div>
                </div>

                {pendingRecruitment.length === 0 ? (
                  <div className="p-20 text-center text-slate-500">لا توجد طلبات توظيف بانتظار اعتماد الرواتب حالياً.</div>
                ) : (
                  <div className="divide-y divide-white/5">
                    {pendingRecruitment.map((req) => (
                      <div key={req.requestId} className="p-8 hover:bg-white/[0.02] transition-all">
                        <div className="flex justify-between items-start gap-8">
                          <div className="flex-1">
                            <h4 className="text-xl font-bold text-white">{req.fullName}</h4>
                            <p className="text-slate-500 text-sm mt-1">{req.email}</p>
                            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                                <p className="text-slate-500 text-xs font-bold uppercase mb-1">الوظيفة</p>
                                <p className="text-slate-200 font-bold">{req.jobDescription}</p>
                              </div>
                              <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                                <p className="text-slate-500 text-xs font-bold uppercase mb-1">القسم</p>
                                <p className="text-slate-200 font-bold">{req.department}</p>
                              </div>
                              <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                                <p className="text-slate-500 text-xs font-bold uppercase mb-1">الراتب المتوقع (آخر قيمة)</p>
                                <p className="text-purple-200 font-black text-lg">
                                  {typeof req.expectedSalary === 'number' ? req.expectedSalary.toLocaleString() : req.expectedSalary} ر.س
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="min-w-[320px]">
                            {selectedRecruitmentId === req.requestId ? (
                              <div className="space-y-3 p-4 bg-white/5 rounded-2xl border border-white/5">
                                <input
                                  placeholder="الراتب النهائي (اختياري)"
                                  value={adjustedSalary}
                                  onChange={(e) => setAdjustedSalary(e.target.value)}
                                  className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white"
                                />
                                <textarea
                                  placeholder="ملاحظة الاعتماد..."
                                  value={recruitmentNote}
                                  onChange={(e) => setRecruitmentNote(e.target.value)}
                                  className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white resize-none h-20"
                                />
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleProcessRecruitment(req.requestId!, 'Approved')}
                                    disabled={processingRecruitment === req.requestId}
                                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-xl text-sm disabled:opacity-50"
                                  >
                                    اعتماد نهائي
                                  </button>
                                  <button
                                    onClick={() => handleProcessRecruitment(req.requestId!, 'Rejected')}
                                    disabled={processingRecruitment === req.requestId}
                                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded-xl text-sm disabled:opacity-50"
                                  >
                                    رفض
                                  </button>
                                </div>
                                <button
                                  onClick={() => {
                                    setSelectedRecruitmentId(null);
                                    setRecruitmentNote('');
                                    setAdjustedSalary('');
                                  }}
                                  className="w-full bg-white/5 hover:bg-white/10 text-white font-bold py-2 rounded-xl text-sm border border-white/10"
                                >
                                  إلغاء
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => {
                                  setSelectedRecruitmentId(req.requestId ?? null);
                                  setRecruitmentNote('');
                                  setAdjustedSalary('');
                                }}
                                className="w-full bg-white/5 hover:bg-white/10 text-white font-bold py-4 rounded-2xl border border-white/5 transition-all"
                              >
                                اتخاذ قرار (Stage 3)
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
            )}

            {activeTab === 'calculate' && (
              <div className="space-y-6">
                <div className="bg-purple-600/10 border border-purple-500/20 p-6 rounded-3xl flex justify-between items-center">
                  <div>
                    <h4 className="text-white font-bold text-lg">احتساب رواتب الشهر لجميع الموظفين</h4>
                    <p className="text-slate-400 text-sm mt-1">سيتم معالجة ساعات العمل المعتمدة وتحويلها إلى رواتب قابلة للصرف</p>
                  </div>
                  <button
                    onClick={() => setShowConfirmCalc({ name: 'جميع الموظفين' })}
                    disabled={calculatingId !== null}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-8 py-4 rounded-2xl shadow-xl shadow-purple-500/20 disabled:opacity-50 transition-all flex items-center gap-3"
                  >
                    {calculatingId === -1 ? <Clock className="animate-spin" /> : <Calculator />}
                    احتساب الكل ({reportMonth}/{reportYear})
                  </button>
                </div>

                {calcFeedback && (
                  <div className={`p-4 rounded-2xl font-bold text-sm ${calcFeedback.type === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                    {calcFeedback.msg}
                  </div>
                )}

                <div className="bg-luxury-surface rounded-[2.5rem] border border-white/5 overflow-hidden">
                  <div className="p-6 border-b border-white/5 flex justify-between items-center">
                    <h5 className="text-white font-bold">احتساب فردي للموظفين</h5>
                    <div className="relative w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                      <input
                        type="text"
                        placeholder="بحث عن موظف..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-xs text-white w-full"
                      />
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-right">
                      <thead className="bg-white/5 text-slate-400 text-[11px] font-black uppercase">
                        <tr>
                          <th className="p-6">الموظف</th>
                          <th className="p-6">الراتب الأساسي</th>
                          <th className="p-6">الحالة</th>
                          <th className="p-6">الإجراء</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {employees
                          .filter(emp => !searchTerm || emp.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || emp.email.toLowerCase().includes(searchTerm.toLowerCase()))
                          .map(emp => (
                          <tr key={emp.employeeId} className="hover:bg-white/[0.02]">
                            <td className="p-6 font-bold text-slate-100">{emp.fullName}</td>
                            <td className="p-6 text-slate-300 font-bold">{emp.baseSalary} ر.س</td>
                            <td className="p-6">
                              <span className="bg-green-500/10 text-green-400 px-2 py-1 rounded-md text-[10px] font-bold">نشط</span>
                            </td>
                            <td className="p-6">
                              <button
                                onClick={() => setShowConfirmCalc({ id: emp.employeeId, name: emp.fullName })}
                                disabled={calculatingId !== null}
                                className="text-purple-400 hover:text-purple-300 font-bold text-sm flex items-center gap-2 disabled:opacity-50"
                              >
                                {calculatingId === emp.employeeId ? <Clock size={16} className="animate-spin" /> : <Calculator size={16} />}
                                احتساب الآن
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'history' && (
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input
                      type="text"
                      placeholder="بحث باسم الموظف في السجلات..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm text-white placeholder:text-slate-500 focus:ring-2 focus:ring-purple-500/20"
                    />
                  </div>
                </div>

                <div className="bg-luxury-surface rounded-[2.5rem] border border-white/5 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-right">
                      <thead className="bg-white/5 text-slate-400 text-[11px] font-black uppercase">
                        <tr>
                          <th className="p-6">الموظف</th>
                          <th className="p-6">الشهر</th>
                          <th className="p-6">ساعات العمل</th>
                          <th className="p-6">إضافي</th>
                          <th className="p-6">سلف مخصومة</th>
                          <th className="p-6">الصافي</th>
                          <th className="p-6">تفاصيل</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {slips.filter(s => s.employeeName?.includes(searchTerm)).map(slip => (
                          <tr key={slip.payrollId} className="hover:bg-white/[0.02] group">
                            <td className="p-6 font-bold text-slate-100">{slip.employeeName}</td>
                            <td className="p-6 text-slate-400 text-xs">
                              {new Date(slip.year, slip.month - 1).toLocaleDateString('ar-SA', { month: 'long', year: 'numeric' })}
                            </td>
                            <td className="p-6 text-slate-300 font-bold">{slip.totalWorkHours} س</td>
                            <td className="p-6 text-blue-400 font-bold">{slip.overtimeHours} س</td>
                            <td className="p-6 text-red-400 font-bold">{slip.deductions} ر.س</td>
                            <td className="p-6 text-green-400 font-black text-lg">{slip.netSalary?.toLocaleString()} ر.س</td>
                            <td className="p-6">
                              <button 
                                onClick={() => setSelectedSlip(slip)}
                                className="p-2 hover:bg-white/10 rounded-lg text-slate-500 hover:text-white transition-all"
                              >
                                <Search size={18} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <PaginationControls page={historyPage} totalPages={historyTotalPages} totalCount={historyTotalCount} onPageChange={setHistoryPage} />
                </div>
              </div>
            )}
          </motion.div>

          <AnimatePresence>
            {selectedSlip && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 30 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 30 }}
                  className="bg-[#0f1115] w-full max-w-2xl rounded-[2.5rem] border border-white/10 shadow-3xl overflow-hidden"
                >
                  <div className="p-8 border-b border-white/5 flex justify-between items-center bg-gradient-to-r from-purple-600/10 to-transparent">
                    <div className="flex items-center gap-4">
                      <div className="bg-purple-600 p-3 rounded-2xl text-white shadow-lg shadow-purple-600/30">
                        <FileText size={24} />
                      </div>
                      <div>
                        <h3 className="text-2xl font-black text-white arabic-text">تفاصيل قسيمة الراتب</h3>
                        <p className="text-slate-400 text-sm">{selectedSlip.employeeName} — {new Date(selectedSlip.year, selectedSlip.month - 1).toLocaleDateString('ar-SA', { month: 'long', year: 'numeric' })}</p>
                      </div>
                    </div>
                    <button onClick={() => setSelectedSlip(null)} className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-all">
                      <X size={24} />
                    </button>
                  </div>

                  <div className="p-10 space-y-8">
                    <div className="grid grid-cols-2 gap-8">
                      <div className="bg-white/5 p-6 rounded-3xl border border-white/5">
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                          <TrendingUp size={14} className="text-green-500" /> الاستحقاقات
                        </p>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400 text-sm">ساعات العمل الأساسية</span>
                            <span className="text-white font-bold">{selectedSlip.totalWorkHours} ساعة</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400 text-sm">الساعات الإضافية</span>
                            <span className="text-blue-400 font-bold">+{selectedSlip.overtimeHours} ساعة</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white/5 p-6 rounded-3xl border border-white/5">
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                          <TrendingDown size={14} className="text-red-500" /> الاستقطاعات
                        </p>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400 text-sm">سلف مخصومة</span>
                            <span className="text-red-400 font-bold">{selectedSlip.deductions?.toLocaleString()} ر.س</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400 text-sm">تأمينات / أخرى</span>
                            <span className="text-slate-500 font-bold">0 ر.س</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-purple-600/10 p-8 rounded-[2rem] border border-purple-500/20 text-center relative overflow-hidden">
                       <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl" />
                       <p className="text-purple-400 text-xs font-black uppercase tracking-[0.2em] mb-2">صافي المبلغ المستحق</p>
                       <p className="text-5xl font-black text-white tracking-tight">{selectedSlip.netSalary?.toLocaleString()} <span className="text-lg font-bold text-purple-400">ر.س</span></p>
                    </div>

                    <div className="flex items-center gap-2 text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                      <Clock size={12} /> صدر بتاريخ: {new Date(selectedSlip.generatedAt).toLocaleString('ar-SA')}
                    </div>
                  </div>

                  <div className="p-8 border-t border-white/5 bg-white/5 flex justify-between gap-4">
                    <button className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold py-4 rounded-2xl border border-white/5 transition-all flex items-center justify-center gap-2">
                      <Printer size={18} /> طباعة القسيمة
                    </button>
                    <button onClick={() => setSelectedSlip(null)} className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 rounded-2xl shadow-xl shadow-purple-600/20 transition-all">
                      حسناً
                    </button>
                  </div>
                </motion.div>
              </div>
            )}

            {createdCredentials && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  className="bg-[#0f1115] w-full max-w-md rounded-[2rem] border border-white/10 shadow-3xl p-8"
                >
                  <div className="bg-green-500/10 w-16 h-16 rounded-2xl flex items-center justify-center text-green-400 mb-6">
                    <UserPlus size={32} />
                  </div>
                  <h3 className="text-2xl font-black text-white arabic-text mb-2">تم إنشاء الموظف</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    تم اعتماد طلب التوظيف وإنشاء حساب الموظف <span className="text-white font-bold">{createdCredentials.employeeName || '—'}</span>.
                    هذه البيانات تظهر مرة واحدة فقط.
                  </p>

                  <div className="mt-6 space-y-3">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                      <p className="text-slate-500 text-xs font-black uppercase tracking-wider mb-1">Username</p>
                      <p className="text-white font-mono font-bold break-all">{createdCredentials.username || '—'}</p>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                      <p className="text-slate-500 text-xs font-black uppercase tracking-wider mb-1">Password</p>
                      <p className="text-white font-mono font-bold break-all">{createdCredentials.password || '—'}</p>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                      <p className="text-slate-500 text-xs font-black uppercase tracking-wider mb-1">Employee ID</p>
                      <p className="text-white font-mono font-bold break-all">{createdCredentials.employeeId || '—'}</p>
                    </div>
                  </div>

                  <div className="mt-8">
                    <button
                      onClick={() => setCreatedCredentials(null)}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 rounded-2xl shadow-xl shadow-purple-600/20 transition-all"
                    >
                      حسناً
                    </button>
                  </div>
                </motion.div>
              </div>
            )}

            {showConfirmCalc && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-[#0f1115] w-full max-w-md rounded-[2rem] border border-white/10 shadow-3xl p-8"
                >
                  <div className="bg-orange-500/10 w-16 h-16 rounded-2xl flex items-center justify-center text-orange-500 mb-6">
                    <AlertCircle size={32} />
                  </div>
                  <h3 className="text-2xl font-black text-white arabic-text mb-2">تأكيد احتساب الراتب</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    أنت على وشك احتساب راتب شهر <span className="text-white font-bold">{reportMonth}/{reportYear}</span> لـ <span className="text-purple-400 font-bold">{showConfirmCalc.name}</span>.
                    سيتم اعتماد ساعات العمل المعتمدة وخصم السلف الموافق عليها تلقائياً.
                  </p>
                  
                  <div className="mt-8 space-y-3">
                    <button
                      onClick={() => handleRunCalculation(showConfirmCalc.id)}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 rounded-2xl shadow-xl shadow-purple-600/20 transition-all flex items-center justify-center gap-2"
                    >
                      <Calculator size={18} />
                      تأكيد والاحتساب الآن
                    </button>
                    <button
                      onClick={() => setShowConfirmCalc(null)}
                      className="w-full bg-white/5 hover:bg-white/10 text-white font-bold py-4 rounded-2xl transition-all"
                    >
                      إلغاء
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
    </>
  );
};

export default PayrollDashboard;
