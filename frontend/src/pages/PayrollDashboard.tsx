import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  getDeliveredAdvancesPage,
  deliverAllApprovedAdvances,
  getAdvanceApprovalReport,
  getAllAdvanceRequestsPage,
  downloadPayrollPdf,
  downloadPayrollExcel,
  getAllPayrollHistoryPage,
  calculatePayroll,
  calculateAllPayroll,
  getMonthlyPayrollPage,
  getPayrollMonthlySummary,
  markPayrollPaid,
  markAllPayrollPaid,
  listEmployeesPage,
  getPendingRecruitmentRequestsPage,
  processRecruitmentRequest,
  type PayrollSlip,
  type ProcessRecruitmentResponse,
} from '../services/api';
import { queryKeys } from '../services/queryKeys';
import { extractApiError } from '../utils/errorHandler';

const PayrollDashboard = () => {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'advances' | 'recruitment' | 'history' | 'calculate'>('advances');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());

  // Advances State
  const [processingAdvance, setProcessingAdvance] = useState<number | null>(null);
  const [advanceNote, setAdvanceNote] = useState<string>('');
  const [selectedAdvanceId, setSelectedAdvanceId] = useState<number | null>(null);
  const [adjustedAdvanceAmount, setAdjustedAdvanceAmount] = useState<string>('');
  const [adjustedAdvanceReason, setAdjustedAdvanceReason] = useState<string>('');
  const [advancesSubTab, setAdvancesSubTab] = useState<'pending' | 'approved' | 'delivered' | 'all'>('pending');
  const [pendingPage, setPendingPage] = useState(0);
  const [approvedPage, setApprovedPage] = useState(0);
  const [deliveredPage, setDeliveredPage] = useState(0);
  const [allPage, setAllPage] = useState(0);

  // History State
  const [historyPage, setHistoryPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSlip, setSelectedSlip] = useState<PayrollSlip | null>(null);

  // Calculate State
  const [calculatingId, setCalculatingId] = useState<number | null>(null);
  const [calcFeedback, setCalcFeedback] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [showConfirmCalc, setShowConfirmCalc] = useState<{ id?: number; name: string } | null>(null);
  const [payingId, setPayingId] = useState<number | null>(null);

  // Recruitment approvals (Stage 3: PENDING_PAYROLL)
  const [recruitmentPage, setRecruitmentPage] = useState(0);
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

  // Query 1: Current employee (replaces first useEffect)
  const { data: me } = useQuery({
    queryKey: queryKeys.me,
    queryFn: async () => {
      const res = await getCurrentEmployee();
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const canManagePayroll = me?.roleName === 'PAYROLL'
    || me?.roleName === 'SUPER_ADMIN';

  // Query 2: Advances data (replaces part of second useEffect)
  const advancesQuery = useQuery({
    queryKey: queryKeys.payroll.advances(advancesSubTab, advancesSubTab === 'pending' ? pendingPage : advancesSubTab === 'approved' ? approvedPage : advancesSubTab === 'delivered' ? deliveredPage : allPage, reportMonth, reportYear),
    queryFn: async () => {
      if (!canManagePayroll) return null;
      const [pendingRes, reportRes, deliveredRes, allRes] = await Promise.all([
        getPendingAdvanceRequestsPage({ page: pendingPage, size: 10 }),
        getAdvanceApprovalReport(reportMonth, reportYear),
        getDeliveredAdvancesPage(reportMonth, reportYear, { page: deliveredPage, size: 10 }),
        getAllAdvanceRequestsPage({ page: allPage, size: 10 }),
      ]);
      return {
        pending: pendingRes.data,
        report: reportRes.data,
        delivered: deliveredRes.data,
        all: allRes.data,
      };
    },
    enabled: canManagePayroll && activeTab === 'advances',
  });

  // Query 3: History data (replaces part of second useEffect)
  const historyQuery = useQuery({
    queryKey: queryKeys.payroll.history(historyPage),
    queryFn: async () => {
      if (!canManagePayroll) return null;
      const res = await getAllPayrollHistoryPage({ page: historyPage, size: 10 });
      return res.data;
    },
    enabled: canManagePayroll && activeTab === 'history',
  });

  // Query 4: Employees for calculation (replaces part of second useEffect)
  const employeesQuery = useQuery({
    queryKey: queryKeys.payroll.employees,
    queryFn: async () => {
      if (!canManagePayroll) return null;
      const res = await listEmployeesPage({ page: 0, size: 100 });
      return res.data.items;
    },
    enabled: canManagePayroll && activeTab === 'calculate',
  });

  // Query 5: Monthly payroll for calculation (replaces part of second useEffect)
  const monthlyPayrollQuery = useQuery({
    queryKey: queryKeys.payroll.monthlyPayroll(reportMonth, reportYear),
    queryFn: async () => {
      if (!canManagePayroll) return null;
      const [slipsRes, summaryRes] = await Promise.all([
        getMonthlyPayrollPage(reportMonth, reportYear, { page: 0, size: 250 }),
        getPayrollMonthlySummary(reportMonth, reportYear),
      ]);
      const map: Record<number, PayrollSlip> = {};
      for (const slip of slipsRes.data.items) {
        map[slip.employeeId] = slip;
      }
      return { map, summary: summaryRes.data };
    },
    enabled: canManagePayroll && activeTab === 'calculate',
  });

  // Query 6: Recruitment data (replaces part of second useEffect)
  const recruitmentQuery = useQuery({
    queryKey: queryKeys.payroll.recruitment(recruitmentPage),
    queryFn: async () => {
      if (!canManagePayroll) return null;
      const res = await getPendingRecruitmentRequestsPage({ page: recruitmentPage, size: 10 });
      return res.data;
    },
    enabled: canManagePayroll && activeTab === 'recruitment',
  });

  // Derive state from queries
  const pendingAdvances = advancesQuery.data?.pending?.items ?? [];
  const pendingTotalPages = advancesQuery.data?.pending?.totalPages ?? 0;
  const pendingTotalCount = advancesQuery.data?.pending?.totalCount ?? 0;

  const reportData = advancesQuery.data?.report;
  const approvedAdvances = reportData?.items ?? [];
  const approvedTotalCount = reportData?.totalCount ?? 0;
  const approvedTotalAmountFromReport = String(reportData?.totalAmount ?? 0);
  const approvedTotalPages = Math.max(1, Math.ceil((approvedAdvances.length ?? 0) / 10));

  const deliveredAdvances = advancesQuery.data?.delivered?.items ?? [];
  const deliveredTotalPages = advancesQuery.data?.delivered?.totalPages ?? 0;
  const deliveredTotalCount = advancesQuery.data?.delivered?.totalCount ?? 0;

  const allAdvances = advancesQuery.data?.all?.items ?? [];
  const allTotalPages = advancesQuery.data?.all?.totalPages ?? 0;
  const allTotalCount = advancesQuery.data?.all?.totalCount ?? 0;

  const slips = historyQuery.data?.items ?? [];
  const historyTotalPages = historyQuery.data?.totalPages ?? 0;
  const historyTotalCount = historyQuery.data?.totalCount ?? 0;

  const employees = employeesQuery.data ?? [];
  const monthlyPayrollMap = monthlyPayrollQuery.data?.map ?? {};
  const monthlySummary = monthlyPayrollQuery.data?.summary ?? null;

  const pendingRecruitment = recruitmentQuery.data?.items ?? [];
  const recruitmentTotalPages = recruitmentQuery.data?.totalPages ?? 0;
  const recruitmentTotalCount = recruitmentQuery.data?.totalCount ?? 0;

  // Derive approvedTotalAmount from query data (no state sync needed)
  const derivedApprovedTotalAmount = approvedTotalAmountFromReport;

  // Reset approvedPage if out of range (useEffect to avoid render-time side effect)
  useEffect(() => {
    if (approvedPage >= approvedTotalPages && approvedTotalPages > 0) {
      setApprovedPage(0);
    }
  }, [approvedPage, approvedTotalPages]);

  // Handle query errors (useEffect to avoid render-time side effect)
  useEffect(() => {
    const queriesWithError = [advancesQuery, historyQuery, employeesQuery, monthlyPayrollQuery, recruitmentQuery];
    for (const q of queriesWithError) {
      if (q.error && !loadError) {
        setLoadError(extractApiError(q.error).message || t('common.error'));
        break;
      }
    }
  }, [advancesQuery, historyQuery, employeesQuery, monthlyPayrollQuery, recruitmentQuery, loadError]);

  // Mutation: Process recruitment request
  const processRecruitmentMutation = useMutation({
    mutationFn: async ({ requestId, status }: { requestId: number; status: 'Approved' | 'Rejected' }) => {
      const salaryNum = adjustedSalary ? parseFloat(adjustedSalary) : undefined;
      const res = await processRecruitmentRequest(requestId, status, recruitmentNote || undefined, salaryNum);
      return res.data as ProcessRecruitmentResponse;
    },
    onMutate: ({ requestId }) => setProcessingRecruitment(requestId),
    onSuccess: (data, { status }) => {
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
      void queryClient.invalidateQueries({ queryKey: queryKeys.payroll.recruitment(recruitmentPage) });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : t('common.error');
      setLoadError(msg);
    },
    onSettled: () => setProcessingRecruitment(null),
  });

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
      alert(t('common.error'));
    } finally {
      setIsDownloading(false);
    }
  };

  // Mutation: Process advance request
  const processAdvanceMutation = useMutation({
    mutationFn: async ({ advanceId, status }: { advanceId: number; status: 'Approved' | 'Rejected' }) => {
      const amountNum = adjustedAdvanceAmount.trim() ? Number(adjustedAdvanceAmount) : undefined;
      return processAdvanceRequest(
        advanceId,
        status,
        advanceNote || undefined,
        Number.isFinite(amountNum) ? amountNum : undefined,
        adjustedAdvanceReason || undefined,
      );
    },
    onMutate: ({ advanceId }) => setProcessingAdvance(advanceId),
    onSuccess: () => {
      setAdvanceNote('');
      setSelectedAdvanceId(null);
      setAdjustedAdvanceAmount('');
      setAdjustedAdvanceReason('');
      void queryClient.invalidateQueries({ queryKey: queryKeys.payroll.root });
    },
    onError: (err: unknown) => {
      setLoadError(extractApiError(err).message || t('common.error'));
    },
    onSettled: () => setProcessingAdvance(null),
  });

  // Mutation: Deliver advance
  const deliverAdvanceMutation = useMutation({
    mutationFn: (advanceId: number) => deliverAdvanceRequest(advanceId),
    onMutate: (advanceId) => setProcessingAdvance(advanceId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.payroll.root });
    },
    onError: (err: unknown) => {
      setLoadError(extractApiError(err).message || t('common.error'));
    },
    onSettled: () => setProcessingAdvance(null),
  });

  // Mutation: Deliver all approved advances
  const deliverAllAdvancesMutation = useMutation({
    mutationFn: () => deliverAllApprovedAdvances(reportMonth, reportYear),
    onMutate: () => setProcessingAdvance(-1),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.payroll.root });
    },
    onError: (err: unknown) => {
      setLoadError(extractApiError(err).message || t('common.error'));
    },
    onSettled: () => setProcessingAdvance(null),
  });

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
    } catch (err: unknown) {
      alert(extractApiError(err).message || t('common.error'));
    }
  };

  // Mutation: Calculate payroll
  const calculatePayrollMutation = useMutation({
    mutationFn: async (empId?: number) => {
      if (empId === undefined || empId === -1) {
        const res = await calculateAllPayroll(reportMonth, reportYear);
        return { type: 'all' as const, data: res.data };
      }
      await calculatePayroll(reportMonth, reportYear, empId);
      return { type: 'single' as const };
    },
    onMutate: (empId) => setCalculatingId(empId ?? -1),
    onSuccess: (result) => {
      if (result.type === 'all') {
        const { successCount, errorCount } = result.data;
        setCalcFeedback({
          msg: `${successCount} calculated successfully${errorCount > 0 ? `, ${errorCount} errors` : ''}`,
          type: 'success',
        });
      } else {
        setCalcFeedback({ msg: t('common.success'), type: 'success' });
      }
      void queryClient.invalidateQueries({ queryKey: queryKeys.payroll.monthlyPayroll(reportMonth, reportYear) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.payroll.history(historyPage) });
    },
    onError: (err: unknown) => {
      const msg = extractApiError(err).message || t('common.error');
      setCalcFeedback({ msg, type: 'error' });
    },
    onSettled: () => {
      setCalculatingId(null);
    },
  });

  // Mutation: Pay single payroll
  const payPayrollMutation = useMutation({
    mutationFn: (employeeId: number) => markPayrollPaid(reportMonth, reportYear, employeeId),
    onMutate: (employeeId) => setPayingId(employeeId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.payroll.monthlyPayroll(reportMonth, reportYear) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.payroll.history(historyPage) });
    },
    onError: (err: unknown) => {
      setLoadError(extractApiError(err).message || t('common.error'));
    },
    onSettled: () => setPayingId(null),
  });

  // Mutation: Pay all payroll
  const payAllPayrollMutation = useMutation({
    mutationFn: () => markAllPayrollPaid(reportMonth, reportYear),
    onMutate: () => setPayingId(-1),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.payroll.monthlyPayroll(reportMonth, reportYear) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.payroll.history(historyPage) });
    },
    onError: (err: unknown) => {
      setLoadError(extractApiError(err).message || t('common.error'));
    },
    onSettled: () => setPayingId(null),
  });

  // Wrapper handlers for JSX (call mutations)
  const handleProcessRecruitment = (requestId: number, status: 'Approved' | 'Rejected') => {
    processRecruitmentMutation.mutate({ requestId, status });
  };

  const handleProcessAdvance = (advanceId: number, status: 'Approved' | 'Rejected') => {
    processAdvanceMutation.mutate({ advanceId, status });
  };

  const handleDeliverAdvance = (advanceId: number) => {
    deliverAdvanceMutation.mutate(advanceId);
  };

  const handleDeliverAllApproved = () => {
    if (!window.confirm(t('common.confirm'))) return;
    deliverAllAdvancesMutation.mutate();
  };

  const handleRunCalculation = (empId?: number) => {
    setCalcFeedback(null);
    setShowConfirmCalc(null);
    calculatePayrollMutation.mutate(empId);
  };

  const handlePayPayroll = (employeeId: number) => {
    payPayrollMutation.mutate(employeeId);
  };

  const handlePayAllPayroll = () => {
    if (!window.confirm(t('common.confirm'))) return;
    payAllPayrollMutation.mutate();
  };

  const totalApprovedAmount = approvedAdvances
    .reduce((sum, a) => sum + (typeof a.amount === 'number' ? a.amount : Number(a.amount ?? 0)), 0);

  const stats = [
    { label: t('payroll.stats.pendingAdvances'), value: String(pendingTotalCount), icon: Clock, color: 'text-orange-400', bg: 'bg-orange-500/10' },
    { label: t('payroll.stats.totalAdvances'), value: (Number(derivedApprovedTotalAmount) || totalApprovedAmount).toLocaleString() + ' ' + t('advanceRequest.currencySymbol'), icon: HandCoins, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { label: t('payroll.stats.payrollRecords'), value: String(historyTotalCount), icon: History, color: 'text-green-400', bg: 'bg-green-500/10' },
  ];

  return (
    <>
      <header className="mb-10 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight arabic-text">
            {t('payroll.title')}
          </h1>
          <p className="text-slate-400 mt-2">
            {t('payroll.subtitle')}
          </p>
        </div>
        <div className="flex items-center gap-3 bg-purple-500/10 px-6 py-3 rounded-2xl border border-purple-500/20">
          <DollarSign size={24} className="text-purple-400" />
          <span className="text-purple-100 font-black text-lg">{t('adminDashboard.deptName')}</span>
        </div>
      </header>

      {loadError && (
        <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-200 text-sm font-bold flex items-start justify-between gap-4">
          <div className="flex-1">{loadError}</div>
          <button
            type="button"
            onClick={() => setLoadError(null)}
            className="text-red-200/70 hover:text-red-200"
          >
            <X size={18} />
          </button>
        </div>
      )}

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
                  {t('payroll.stats.monthlyReports')}
                </h3>
                <p className="text-slate-400 text-sm mt-1">{t('payroll.stats.exportDescription')}</p>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-3 bg-white/5 px-5 py-2 rounded-xl border border-white/5">
                  <button onClick={handlePrevMonth} className="text-slate-400 hover:text-white transition-colors">
                    <ChevronRight size={20} />
                  </button>
                  <span className="text-white font-bold min-w-[100px] text-center">
                    {currentDate.toLocaleDateString(i18n.language === 'ar' ? 'ar-EG' : 'en-US', { month: 'long', year: 'numeric' })}
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
                    {isDownloading ? '...' : t('attendanceGrid.exportPdf')}
                  </button>
                  <button 
                    onClick={() => handleDownloadPayroll('excel')}
                    disabled={isDownloading}
                    className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-800 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all text-sm"
                  >
                    <FileSpreadsheet size={16} />
                    {isDownloading ? '...' : t('attendanceGrid.exportExcel')}
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
              {t('payroll.tabs.advances')}
            </button>
            <button
              onClick={() => setActiveTab('recruitment')}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
                activeTab === 'recruitment' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' : 'text-slate-400 hover:text-white'
              }`}
            >
              <UserPlus size={18} />
              {t('payroll.tabs.recruitment')}
            </button>
            <button
              onClick={() => setActiveTab('calculate')}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
                activeTab === 'calculate' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Calculator size={18} />
              {t('payroll.tabs.calculate')}
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
                activeTab === 'history' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' : 'text-slate-400 hover:text-white'
              }`}
            >
              <History size={18} />
              {t('payroll.tabs.history')}
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
	                    {t('payroll.advances.pendingTab')} ({pendingTotalCount})
	                  </button>
	                  <button
	                    onClick={() => setAdvancesSubTab('approved')}
	                    className={`pb-4 px-4 font-bold transition-all ${advancesSubTab === 'approved' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-slate-500'}`}
	                  >
	                    {t('payroll.advances.approved')} ({approvedTotalCount})
	                  </button>
	                  <button
	                    onClick={() => setAdvancesSubTab('delivered')}
	                    className={`pb-4 px-4 font-bold transition-all ${advancesSubTab === 'delivered' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-slate-500'}`}
	                  >
	                    {t('payroll.advances.delivered')} ({deliveredTotalCount})
	                  </button>
	                  <button
	                    onClick={() => setAdvancesSubTab('all')}
	                    className={`pb-4 px-4 font-bold transition-all ${advancesSubTab === 'all' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-slate-500'}`}
	                  >
	                    {t('payroll.advances.all')} ({allTotalCount})
	                  </button>
	                </div>
	
	                <div className="bg-luxury-surface rounded-[2.5rem] border border-white/5 overflow-hidden">
	                  {advancesSubTab === 'pending' ? (
	                    pendingAdvances.length === 0 ? (
	                      <div className="p-20 text-center text-slate-500">{t('payroll.advances.pending')}</div>
	                    ) : (
	                      <div className="divide-y divide-white/5">
	                        {pendingAdvances.map(advance => (
	                          <div key={advance.advanceId} className="p-8 hover:bg-white/[0.02] transition-all">
	                            <div className="flex justify-between items-start">
	                              <div className="flex gap-4">
	                                <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-400 font-black text-xl">
	                                  {advance.employeeName?.[0] || t('common.unknown')}
	                                </div>
	                                <div>
	                                  <h4 className="text-xl font-bold text-white">{advance.employeeName}</h4>
	                                  <p className="text-slate-500 text-sm flex items-center gap-2 mt-1">
	                                    <Clock size={14} /> {advance.requestedAt ? new Date(advance.requestedAt).toLocaleDateString('ar-SA') : ''}
	                                  </p>
	                                  <div className="mt-4 flex gap-8">
	                                    <div>
	                                      <p className="text-slate-500 text-xs font-bold uppercase mb-1">{t('payroll.advances.amount')}</p>
	                                      <p className="text-purple-300 font-black text-lg">{advance.amount} {t('advanceRequest.currencySymbol')}</p>
	                                    </div>
	                                    <div>
	                                      <p className="text-slate-500 text-xs font-bold uppercase mb-1">{t('payroll.advances.reason')}</p>
	                                      <p className="text-slate-300 text-sm">{advance.reason || '—'}</p>
	                                    </div>
	                                  </div>
	                                </div>
	                              </div>
		                              <div className="min-w-[250px]">
		                                {selectedAdvanceId === advance.advanceId ? (
		                                  <div className="space-y-3 p-4 bg-white/5 rounded-2xl border border-white/5">
		                                    <input
		                                      type="number"
		                                      inputMode="decimal"
		                                      placeholder={t('payroll.advances.amount')}
		                                      value={adjustedAdvanceAmount}
		                                      onChange={(e) => setAdjustedAdvanceAmount(e.target.value)}
		                                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white"
		                                    />
		                                    <input
		                                      type="text"
		                                      placeholder={t('payroll.advances.reason')}
		                                      value={adjustedAdvanceReason}
		                                      onChange={(e) => setAdjustedAdvanceReason(e.target.value)}
		                                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white"
		                                    />
		                                    <textarea
		                                      placeholder={t('payroll.recruitment.notePlaceholder')}
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
	                                        {t('payroll.recruitment.approveFinal')}
	                                      </button>
	                                      <button
	                                        onClick={() => handleProcessAdvance(advance.advanceId!, 'Rejected')}
	                                        disabled={processingAdvance === advance.advanceId}
	                                        className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded-xl text-sm disabled:opacity-50"
	                                      >
	                                        {t('payroll.recruitment.reject')}
	                                      </button>
	                                    </div>
	                                  </div>
		                                ) : (
		                                  <button
		                                    onClick={() => {
		                                      setSelectedAdvanceId(advance.advanceId!);
		                                      setAdvanceNote('');
		                                      setAdjustedAdvanceAmount(String(advance.amount ?? ''));
		                                      setAdjustedAdvanceReason(advance.reason ?? '');
		                                    }}
		                                    className="w-full bg-white/5 hover:bg-white/10 text-white font-bold py-4 rounded-2xl border border-white/5 transition-all"
		                                  >
		                                    {t('payroll.advances.decision')}
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
	                          <p className="text-white font-bold">{t('payroll.advances.approved')}</p>
	                          <p className="text-slate-400 text-xs mt-1">{t('payroll.advances.approved')}</p>
	                        </div>
	                        <div className="flex flex-wrap gap-2">
	                          <button
	                            onClick={handleDownloadAdvanceReportCsv}
	                            className="bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-xl font-bold border border-white/10 text-sm"
	                          >
	                            {t('attendanceGrid.downloading', 'Download Report')}
	                          </button>
	                          <button
	                            onClick={handleDeliverAllApproved}
	                            disabled={approvedTotalCount === 0 || processingAdvance !== null}
	                            className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-900 text-white px-4 py-2 rounded-xl font-bold text-sm"
	                          >
	                            {t('payroll.calculate.payAll', { month: reportMonth, year: reportYear })}
	                          </button>
	                        </div>
	                      </div>

                      {approvedAdvances.length === 0 ? (
		                        <div className="p-20 text-center text-slate-500">{t('payroll.advances.noDelivered')}</div>
		                      ) : (
		                        <div className="divide-y divide-white/5">
		                          {approvedAdvances.slice(approvedPage * 10, approvedPage * 10 + 10).map((adv) => (
		                            <div key={adv.advanceId} className="p-8 hover:bg-white/[0.02] transition-all flex flex-col md:flex-row md:items-center justify-between gap-6">
		                              <div className="flex items-start gap-4">
		                                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-300 font-black text-xl">
		                                  {adv.employeeName?.[0] || t('common.unknown')}
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
	                                  <p className="text-slate-500 text-xs font-bold uppercase mb-1">{t('payroll.advances.amount')}</p>
	                                  <p className="text-emerald-200 font-black text-xl">{adv.amount} {t('advanceRequest.currencySymbol')}</p>
	                                </div>
	                                <button
	                                  onClick={() => handleDeliverAdvance(adv.advanceId!)}
	                                  disabled={processingAdvance === adv.advanceId}
	                                  className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-900 text-white font-bold px-6 py-3 rounded-2xl"
	                                >
	                                  {processingAdvance === adv.advanceId ? '...' : t('payroll.advances.deliver')}
	                                </button>
	                              </div>
	                            </div>
	                          ))}
	                        </div>
	                      )}
                    </>
                  ) : advancesSubTab === 'delivered' ? (
                    <>
                      <div className="p-6 border-b border-white/5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div>
                          <p className="text-white font-bold">{t('payroll.advances.deliveryLog')}</p>
                          <p className="text-slate-400 text-xs mt-1">{t('payroll.advances.deliveryLogSubtitle', { month: reportMonth, year: reportYear })}</p>
                        </div>
                      </div>

                      {deliveredAdvances.length === 0 ? (
                        <div className="p-20 text-center text-slate-500">{t('payroll.advances.noDelivered')}</div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-right">
                            <thead className="bg-white/5 text-slate-400 text-[11px] font-black uppercase tracking-wider">
                              <tr>
                                <th className="p-6">{t('payroll.advances.employee')}</th>
                                <th className="p-6">{t('payroll.advances.amount')}</th>
                                <th className="p-6">{t('payroll.advances.deliveryDate')}</th>
                                <th className="p-6">{t('payroll.advances.note')}</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 text-sm">
                              {deliveredAdvances.map((adv) => (
                                <tr key={adv.advanceId} className="hover:bg-white/[0.02]">
                                  <td className="p-6 font-bold text-slate-100">{adv.employeeName}</td>
                                  <td className="p-6 text-blue-300 font-bold">{adv.amount} {t('advanceRequest.currencySymbol')}</td>
                                  <td className="p-6 text-slate-500">{adv.paidAt ? new Date(adv.paidAt).toLocaleString('ar-SA') : '—'}</td>
                                  <td className="p-6 text-slate-400">{adv.hrNote || '—'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-right">
	                        <thead className="bg-white/5 text-slate-400 text-[11px] font-black uppercase tracking-wider">
	                          <tr>
	                            <th className="p-6">{t('payroll.advances.employee')}</th>
	                            <th className="p-6">{t('payroll.advances.amount')}</th>
	                            <th className="p-6">{t('payroll.advances.status')}</th>
	                            <th className="p-6">{t('payroll.advances.date')}</th>
	                            <th className="p-6">{t('payroll.advances.processor')}</th>
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
	                            const statusLabel = t(`payroll.advances.statusLabels.${status || 'PENDING_MANAGER'}`);
	                            return (
	                              <tr key={adv.advanceId} className="hover:bg-white/[0.02]">
	                                <td className="p-6 font-bold text-slate-100">{adv.employeeName}</td>
	                                <td className="p-6 text-purple-300 font-bold">{adv.amount} {t('advanceRequest.currencySymbol')}</td>
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
                  ) : advancesSubTab === 'delivered' ? (
                    <PaginationControls page={deliveredPage} totalPages={deliveredTotalPages} totalCount={deliveredTotalCount} onPageChange={setDeliveredPage} />
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
                    <h3 className="text-xl font-bold text-white arabic-text">{t('payroll.recruitment.title')}</h3>
                    <p className="text-slate-400 text-sm mt-1">{t('payroll.recruitment.subtitle')}</p>
                  </div>
                  <div className="text-slate-400 text-sm">
                    {t('payroll.recruitment.totalRequests', { count: recruitmentTotalCount })}
                  </div>
                </div>

                {pendingRecruitment.length === 0 ? (
                  <div className="p-20 text-center text-slate-500">{t('payroll.recruitment.noRequests')}</div>
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
                                <p className="text-slate-500 text-xs font-bold uppercase mb-1">{t('payroll.recruitment.job')}</p>
                                <p className="text-slate-200 font-bold">{req.jobDescription}</p>
                              </div>
                              <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                                <p className="text-slate-500 text-xs font-bold uppercase mb-1">{t('payroll.recruitment.department')}</p>
                                <p className="text-slate-200 font-bold">{req.department}</p>
                              </div>
                              <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                                <p className="text-slate-500 text-xs font-bold uppercase mb-1">{t('payroll.recruitment.expectedSalary')}</p>
                                <p className="text-purple-200 font-black text-lg">
                                  {typeof req.expectedSalary === 'number' ? req.expectedSalary.toLocaleString() : req.expectedSalary} {t('advanceRequest.currencySymbol')}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="min-w-[320px]">
                            {selectedRecruitmentId === req.requestId ? (
                              <div className="space-y-3 p-4 bg-white/5 rounded-2xl border border-white/5">
                                <input
                                  placeholder={t('payroll.recruitment.finalSalaryPlaceholder')}
                                  value={adjustedSalary}
                                  onChange={(e) => setAdjustedSalary(e.target.value)}
                                  className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white"
                                />
                                <textarea
                                  placeholder={t('payroll.recruitment.notePlaceholder')}
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
                                    {t('payroll.recruitment.approveFinal')}
                                  </button>
                                  <button
                                    onClick={() => handleProcessRecruitment(req.requestId!, 'Rejected')}
                                    disabled={processingRecruitment === req.requestId}
                                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded-xl text-sm disabled:opacity-50"
                                  >
                                    {t('payroll.recruitment.reject')}
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
                                  {t('common.cancel')}
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
                                {t('payroll.recruitment.decision')}
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
                    <h4 className="text-white font-bold text-lg">{t('payroll.calculate.bannerTitle')}</h4>
                    <p className="text-slate-400 text-sm mt-1">{t('payroll.calculate.bannerSubtitle')}</p>
                  </div>
                  <button
                    onClick={() => setShowConfirmCalc({ name: t('payroll.calculate.bannerTitle') })}
                    disabled={calculatingId !== null}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-8 py-4 rounded-2xl shadow-xl shadow-purple-500/20 disabled:opacity-50 disabled:bg-slate-800 transition-all flex items-center gap-3"
                  >
                    {calculatingId === -1 ? <Clock className="animate-spin" /> : <Calculator />}
                    {t('payroll.calculate.calculateAll', { month: reportMonth, year: reportYear })}
                  </button>
                </div>

                {/* Export Buttons */}
                <div className="bg-luxury-surface border border-white/5 p-6 rounded-3xl">
                  <h4 className="text-white font-bold text-lg">{t('payroll.calculate.exportSection')}</h4>
                  <p className="text-slate-400 text-sm mt-1">{t('payroll.calculate.exportDescription')}</p>
                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={() => handleDownloadPayroll('excel')}
                      disabled={isDownloading}
                      className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-900 disabled:opacity-50 text-white font-bold px-6 py-3 rounded-2xl shadow-lg transition-all flex items-center gap-2"
                    >
                      {isDownloading ? <Clock className="animate-spin" /> : <FileSpreadsheet size={18} />}
                      {isDownloading ? t('payroll.calculate.exporting') : t('payroll.calculate.exportExcel')}
                    </button>
                    <button
                      onClick={() => handleDownloadPayroll('pdf')}
                      disabled={isDownloading}
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-900 disabled:opacity-50 text-white font-bold px-6 py-3 rounded-2xl shadow-lg transition-all flex items-center gap-2"
                    >
                      {isDownloading ? <Clock className="animate-spin" /> : <FileText size={18} />}
                      {isDownloading ? t('payroll.calculate.exporting') : t('payroll.calculate.exportPdf')}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-luxury-surface rounded-3xl border border-white/5 p-6">
                    <p className="text-slate-400 text-xs font-black uppercase">{t('payroll.calculate.totalBaseSalary')}</p>
                    <p className="text-white font-black text-2xl mt-2">
                      {employees.reduce((sum, e) => sum + Number(e.baseSalary ?? 0), 0).toLocaleString()} {t('advanceRequest.currencySymbol')}
                    </p>
                    <p className="text-slate-500 text-xs mt-2">{t('payroll.calculate.totalBaseSalarySub')}</p>
                  </div>
                  <div className="bg-luxury-surface rounded-3xl border border-white/5 p-6">
                    <p className="text-slate-400 text-xs font-black uppercase">{t('payroll.calculate.totalNetSalary')}</p>
                    <p className="text-emerald-200 font-black text-2xl mt-2">
                      {(monthlySummary?.totalNetSalary ?? 0).toLocaleString()} {t('advanceRequest.currencySymbol')}
                    </p>
                    <p className="text-slate-500 text-xs mt-2">{t('payroll.calculate.totalNetSalarySub')}</p>
                  </div>
                  <div className="bg-luxury-surface rounded-3xl border border-white/5 p-6 flex flex-col justify-between">
                    <div>
                      <p className="text-slate-400 text-xs font-black uppercase">{t('payroll.calculate.disbursement')}</p>
                      <p className="text-white font-black text-2xl mt-2">
                        {monthlySummary ? `${monthlySummary.paidSlips}/${monthlySummary.totalSlips}` : '—'}
                      </p>
                      <p className="text-slate-500 text-xs mt-2">{t('payroll.calculate.disbursementSub')}</p>
                    </div>
                    <button
                      onClick={handlePayAllPayroll}
                      disabled={payingId !== null || !monthlySummary || monthlySummary.totalSlips === 0 || monthlySummary.paidSlips === monthlySummary.totalSlips}
                      className="mt-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-900 text-white font-black py-3 rounded-2xl"
                    >
                      {payingId === -1 ? '...' : t('payroll.calculate.payAll', { month: reportMonth, year: reportYear })}
                    </button>
                  </div>
                </div>

                {calcFeedback && (
                  <div className={`p-4 rounded-2xl font-bold text-sm ${calcFeedback.type === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                    {calcFeedback.msg}
                  </div>
                )}

                <div className="bg-luxury-surface rounded-[2.5rem] border border-white/5 overflow-hidden">
                  <div className="p-6 border-b border-white/5 flex justify-between items-center">
                    <h5 className="text-white font-bold">{t('payroll.calculate.individualTitle')}</h5>
                    <div className="relative w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                      <input
                        type="text"
                        placeholder={t('payroll.calculate.searchPlaceholder')}
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
                          <th className="p-6">{t('payroll.calculate.tableEmployee')}</th>
                          <th className="p-6">{t('payroll.calculate.tableSalary')}</th>
                          <th className="p-6">{t('payroll.calculate.tableStatus')}</th>
                          <th className="p-6">{t('payroll.calculate.tableAction')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {employees
                          .filter(emp => !searchTerm || emp.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || emp.email.toLowerCase().includes(searchTerm.toLowerCase()))
                          .map(emp => (
                          <tr key={emp.employeeId} className="hover:bg-white/[0.02]">
                            <td className="p-6 font-bold text-slate-100">{emp.fullName}</td>
                            <td className="p-6 text-slate-300 font-bold">{emp.baseSalary} {t('advanceRequest.currencySymbol')}</td>
                            <td className="p-6">
                              <span className="bg-green-500/10 text-green-400 px-2 py-1 rounded-md text-[10px] font-bold">{t('status.Active')}</span>
                            </td>
	                            <td className="p-6">
	                              <div className="flex items-center gap-4">
	                                <button
	                                  onClick={() => setShowConfirmCalc({ id: emp.employeeId, name: emp.fullName })}
	                                  disabled={calculatingId !== null}
	                                  className="text-purple-400 hover:text-purple-300 font-bold text-sm flex items-center gap-2 disabled:opacity-50"
	                                >
	                                  {calculatingId === emp.employeeId ? <Clock size={16} className="animate-spin" /> : <Calculator size={16} />}
	                                  {t('payroll.calculate.calculate')}
	                                </button>
		                                {(() => {
		                                  const slip = monthlyPayrollMap[emp.employeeId];
		                                  if (!slip) {
		                                    return (
		                                      <span className="text-slate-600 text-xs font-bold">
		                                        {t('payroll.calculate.notCalculated')}
		                                      </span>
		                                    );
		                                  }
		                                  if (slip.paid) {
		                                    return <span className="text-emerald-400 text-xs font-black">{t('payroll.calculate.delivered')}</span>;
		                                  }
		                                  return (
		                                    <button
		                                      type="button"
		                                      onClick={() => handlePayPayroll(emp.employeeId)}
		                                      disabled={payingId !== null}
		                                      className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-900 text-white font-black px-4 py-2 rounded-xl text-xs shadow-lg shadow-emerald-500/10 disabled:opacity-60"
		                                    >
		                                      {payingId === emp.employeeId ? '...' : t('payroll.calculate.paySalary')}
		                                    </button>
		                                  );
		                                })()}
		                              </div>
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
                      placeholder={t('payroll.history.searchPlaceholder')}
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
                          <th className="p-6">{t('payroll.history.tableEmployee')}</th>
                          <th className="p-6">{t('payroll.history.tableMonth')}</th>
                          <th className="p-6">{t('payroll.history.tableWorkHours')}</th>
                          <th className="p-6">{t('payroll.history.tableOvertime')}</th>
                           <th className="p-6">{t('payroll.history.tableDeductions')}</th>
                           <th className="p-6">{t('payroll.history.tableNet')}</th>
                          <th className="p-6">{t('payroll.history.tableDetails')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {slips.filter(s => s.employeeName?.includes(searchTerm)).map(slip => (
                          <tr key={slip.payrollId} className="hover:bg-white/[0.02] group">
                            <td className="p-6 font-bold text-slate-100">{slip.employeeName}</td>
                            <td className="p-6 text-slate-400 text-xs">
                              {new Date(slip.year, slip.month - 1).toLocaleDateString('ar-SA', { month: 'long', year: 'numeric' })}
                            </td>
                            <td className="p-6 text-slate-300 font-bold">{slip.totalWorkHours} {t('attendanceGrid.hours')}</td>
                            <td className="p-6 text-blue-400 font-bold">{slip.overtimeHours} {t('attendanceGrid.hours')}</td>
                            <td className="p-6 text-red-400 font-bold">{slip.deductions} {t('advanceRequest.currencySymbol')}</td>
                            <td className="p-6 text-green-400 font-black text-lg">{slip.netSalary?.toLocaleString()} {t('advanceRequest.currencySymbol')}</td>
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
                        <h3 className="text-2xl font-black text-white arabic-text">{t('payroll.slip.title')}</h3>
                        <p className="text-slate-400 text-sm">{t('payroll.slip.subtitle', { name: selectedSlip.employeeName, date: new Date(selectedSlip.year, selectedSlip.month - 1).toLocaleDateString('ar-SA', { month: 'long', year: 'numeric' }) })}</p>
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
                          <TrendingUp size={14} className="text-green-500" /> {t('payroll.slip.entitlements')}
                        </p>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400 text-sm">{t('payroll.slip.basicHours')}</span>
                            <span className="text-white font-bold">{selectedSlip.totalWorkHours} {t('attendanceGrid.hours')}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400 text-sm">{t('payroll.slip.overtime')}</span>
                            <span className="text-blue-400 font-bold">+{selectedSlip.overtimeHours} {t('attendanceGrid.hours')}</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white/5 p-6 rounded-3xl border border-white/5">
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                          <TrendingDown size={14} className="text-red-500" /> {t('payroll.slip.deductions')}
                        </p>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400 text-sm">{t('payroll.slip.advanceDeductions')}</span>
                            <span className="text-red-400 font-bold">{selectedSlip.deductions?.toLocaleString()} {t('advanceRequest.currencySymbol')}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400 text-sm">{t('payroll.slip.insurance')}</span>
                            <span className="text-slate-500 font-bold">0 {t('advanceRequest.currencySymbol')}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-purple-600/10 p-8 rounded-[2rem] border border-purple-500/20 text-center relative overflow-hidden">
                       <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl" />
                       <p className="text-purple-400 text-xs font-black uppercase tracking-[0.2em] mb-2">{t('payroll.slip.netAmount')}</p>
                       <p className="text-5xl font-black text-white tracking-tight">{selectedSlip.netSalary?.toLocaleString()} <span className="text-lg font-bold text-purple-400">{t('advanceRequest.currencySymbol')}</span></p>
                    </div>

                    <div className="flex items-center gap-2 text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                      <Clock size={12} /> {t('payroll.slip.issuedAt', { date: new Date(selectedSlip.generatedAt).toLocaleString('ar-SA') })}
                    </div>
                  </div>

                  <div className="p-8 border-t border-white/5 bg-white/5 flex justify-between gap-4">
                    <button className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold py-4 rounded-2xl border border-white/5 transition-all flex items-center justify-center gap-2">
                      <Printer size={18} /> {t('payroll.slip.print')}
                    </button>
                    <button onClick={() => setSelectedSlip(null)} className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 rounded-2xl shadow-xl shadow-purple-600/20 transition-all">
                      {t('userManagement.done')}
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
                  <h3 className="text-2xl font-black text-white arabic-text mb-2">{t('payroll.recruitment.employeeCreated')}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    {t('payroll.recruitment.employeeCreatedSubtitle', { name: createdCredentials.employeeName || '—' })}
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
                      {t('userManagement.done')}
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
                  <h3 className="text-2xl font-black text-white arabic-text mb-2">{t('payroll.calculate.confirmTitle')}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    {t('payroll.calculate.confirmMessage', { name: showConfirmCalc.name, month: reportMonth, year: reportYear })}
                  </p>
                  
                  <div className="mt-8 space-y-3">
                    <button
                      onClick={() => handleRunCalculation(showConfirmCalc.id)}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 rounded-2xl shadow-xl shadow-purple-600/20 transition-all flex items-center justify-center gap-2"
                    >
                      <Calculator size={18} />
                      {t('payroll.calculate.confirmButton')}
                    </button>
                    <button
                      onClick={() => setShowConfirmCalc(null)}
                      className="w-full bg-white/5 hover:bg-white/10 text-white font-bold py-4 rounded-2xl transition-all"
                    >
                      {t('common.cancel')}
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
