import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Users,
  UserCheck,
  AlertTriangle,
  FileText,
  Search,
  Filter,
  CheckCircle2,
  ClipboardList,
  Check,
  X,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import PaginationControls from '../components/PaginationControls';
import CurrentDateTimePanel from '../components/CurrentDateTimePanel';
import {
  getCurrentEmployee,
  listEmployeesPage,
  listMyTeamPage,
  getPendingRecruitmentRequestsPage,
  processRecruitmentRequest,
  getPendingAdvanceRequestsPage,
  processAdvanceRequest,
  getPendingLeavesForManagerPage,
  getPendingLeavesForHrPage,
  processLeaveRequest,
  getManagerTodayAttendancePage,
  verifyAttendance,
  reportFraud,
  downloadAttendancePdf,
  downloadAttendanceExcel,
  getMyDepartment,
  type EmployeeSummary,
  type RecruitmentRequest,
  type AdvanceRequest,
  type LeaveRequest,
  type AttendanceRecord,
} from '../services/api';
import { queryKeys } from '../services/queryKeys';
import { extractApiError } from '../utils/errorHandler';
import {
  getLegacyAttendanceStatusMeta,
  getPayrollStatusMeta,
  getReviewStatusMeta,
} from '../components/attendanceStatus';

const ManagerDashboard = () => {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [processingRequest, setProcessingRequest] = useState<number | null>(null);
  const [processNote, setProcessNote] = useState<string>('');
  const [adjustedSalary, setAdjustedSalary] = useState<string>('');
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null);

  // Reports state
  const [isDownloading, setIsDownloading] = useState(false);
  const [reportDate, setReportDate] = useState(new Date());
  const reportMonth = reportDate.getMonth() + 1;
  const reportYear = reportDate.getFullYear();

  // Leaves & Attendance State
  const [processingLeave, setProcessingLeave] = useState<number | null>(null);
  const [verifyingRecord, setVerifyingRecord] = useState<number | null>(null);
  const [leaveNote, setLeaveNote] = useState<string>('');
  const [selectedLeaveId, setSelectedLeaveId] = useState<number | null>(null);
  const [advancePage, setAdvancePage] = useState(0);
  const [processingAdvance, setProcessingAdvance] = useState<number | null>(null);
  const [advanceNote, setAdvanceNote] = useState<string>('');
  const [selectedAdvanceId, setSelectedAdvanceId] = useState<number | null>(null);
  const [adjustedAdvanceAmount, setAdjustedAdvanceAmount] = useState<string>('');
  const [adjustedAdvanceReason, setAdjustedAdvanceReason] = useState<string>('');
  const [requestPage, setRequestPage] = useState(0);
  const [attendancePage, setAttendancePage] = useState(0);
  const [leavePage, setLeavePage] = useState(0);
  const [teamPage, setTeamPage] = useState(0);
  const [teamSearch, setTeamSearch] = useState('');
  const [teamStatusFilter, setTeamStatusFilter] = useState<'ALL' | 'LINKED' | 'NOT_LINKED'>('ALL');

  const { data: meData } = useQuery({
    queryKey: queryKeys.me,
    queryFn: async () => (await getCurrentEmployee()).data,
  });
  const me = meData ?? null;

  const { data: myDepartment } = useQuery({
    queryKey: queryKeys.employee.myDepartment,
    queryFn: async () => await getMyDepartment(),
    enabled: !!me,
  });

  const canReviewCompanyRequests = me?.roleName === 'MANAGER'
    || me?.roleName === 'HR'
    || me?.roleName === 'ADMIN'
    || me?.roleName === 'SUPER_ADMIN';
  const canViewCompanyWideTeam = me?.roleName === 'SUPER_ADMIN';
  const canViewManagerScopedTeam = me?.roleName === 'MANAGER';

  const teamQuery = useQuery({
    queryKey: queryKeys.manager.team(canViewCompanyWideTeam ? 'all' : 'mine', teamPage),
    queryFn: async () => {
      const response = canViewCompanyWideTeam
        ? await listEmployeesPage({ page: teamPage, size: 10 })
        : await listMyTeamPage({ page: teamPage, size: 10 });
      return response.data;
    },
    enabled: canViewManagerScopedTeam || canViewCompanyWideTeam,
  });

  const recruitmentQuery = useQuery({
    queryKey: queryKeys.manager.recruitment(requestPage),
    queryFn: async () => (await getPendingRecruitmentRequestsPage({ page: requestPage, size: 10 })).data,
    enabled: canReviewCompanyRequests,
  });

  const advancesQuery = useQuery({
    queryKey: queryKeys.manager.advances(advancePage),
    queryFn: async () => (await getPendingAdvanceRequestsPage({ page: advancePage, size: 10 })).data,
    enabled: canViewManagerScopedTeam,
  });

  const attendanceQuery = useQuery({
    queryKey: queryKeys.manager.todayAttendance(attendancePage),
    queryFn: async () => (await getManagerTodayAttendancePage({ page: attendancePage, size: 10 })).data,
    enabled: canReviewCompanyRequests,
  });

  const leavesQuery = useQuery({
    queryKey: queryKeys.manager.leaves(
      canViewCompanyWideTeam ? 'hr' : 'manager',
      canViewCompanyWideTeam ? null : (me?.employeeId ?? null),
      leavePage
    ),
    queryFn: async () => {
      if (canViewCompanyWideTeam) {
        return (await getPendingLeavesForHrPage({ page: leavePage, size: 10 })).data;
      }
      return (await getPendingLeavesForManagerPage(me!.employeeId, { page: leavePage, size: 10 })).data;
    },
    enabled: canViewCompanyWideTeam || (canViewManagerScopedTeam && !!me?.employeeId),
  });

  const team: EmployeeSummary[] = teamQuery.data?.items ?? [];
  const teamTotalPages = teamQuery.data?.totalPages ?? 0;
  const teamTotalCount = teamQuery.data?.totalCount ?? 0;

  const pendingRequests: RecruitmentRequest[] = recruitmentQuery.data?.items ?? [];
  const requestTotalPages = recruitmentQuery.data?.totalPages ?? 0;
  const requestTotalCount = recruitmentQuery.data?.totalCount ?? 0;

  const todayAttendance: AttendanceRecord[] = attendanceQuery.data?.items ?? [];
  const attendanceTotalPages = attendanceQuery.data?.totalPages ?? 0;
  const attendanceTotalCount = attendanceQuery.data?.totalCount ?? 0;

  const pendingAdvances: AdvanceRequest[] = advancesQuery.data?.items ?? [];
  const advancesTotalPages = advancesQuery.data?.totalPages ?? 0;
  const advancesTotalCount = advancesQuery.data?.totalCount ?? 0;

  const pendingLeaves: LeaveRequest[] = leavesQuery.data?.items ?? [];
  const leaveTotalPages = leavesQuery.data?.totalPages ?? 0;
  const leaveTotalCount = leavesQuery.data?.totalCount ?? 0;

  const queryError =
    teamQuery.error || recruitmentQuery.error || advancesQuery.error || attendanceQuery.error || leavesQuery.error;
  const queryErrorMessage = queryError ? extractApiError(queryError).message : null;
  const pageError = error || queryErrorMessage;

  const stats = [
    {
      label: t('managerDashboard.stats.totalTeam'),
      value: String(teamTotalCount),
      icon: Users,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
    },
    {
      label: t('managerDashboard.stats.pendingRecruitment'),
      value: String(requestTotalCount),
      icon: UserCheck,
      color: 'text-green-400',
      bg: 'bg-green-500/10',
    },
    {
      label: t('managerDashboard.stats.pendingLeaves'),
      value: String(leaveTotalCount),
      icon: AlertTriangle,
      color: 'text-orange-400',
      bg: 'bg-orange-500/10',
    },
    {
      label: t('managerDashboard.stats.pendingAdvances'),
      value: String(advancesTotalCount),
      icon: ClipboardList,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
    },
  ];

  const headerTeam = me?.teamName ?? t('managerDashboard.team.title');

  const handleProcessRequest = async (requestId: number, status: 'Approved' | 'Rejected') => {
    setProcessingRequest(requestId);
    try {
      const salaryNum = adjustedSalary ? parseFloat(adjustedSalary) : undefined;
      await processRecruitmentRequest(requestId, status, processNote || undefined, salaryNum);
      await queryClient.invalidateQueries({ queryKey: queryKeys.manager.recruitmentRoot });
      setProcessNote('');
      setAdjustedSalary('');
      setSelectedRequestId(null);
    } catch (err: unknown) {
      setError(extractApiError(err).message || t('managerDashboard.errors.processRequest'));
    } finally {
      setProcessingRequest(null);
    }
  };

  const handleProcessLeave = async (requestId: number, status: 'APPROVED' | 'REJECTED') => {
    setProcessingLeave(requestId);
    try {
      await processLeaveRequest(requestId, status, leaveNote || undefined);
      await queryClient.invalidateQueries({ queryKey: queryKeys.manager.leavesRoot });
      setLeaveNote('');
      setSelectedLeaveId(null);
    } catch (err: unknown) {
      setError(extractApiError(err).message || t('managerDashboard.errors.processLeave'));
    } finally {
      setProcessingLeave(null);
    }
  };

  const handleProcessAdvance = async (advanceId: number, status: 'Approved' | 'Rejected') => {
    setProcessingAdvance(advanceId);
    try {
      const amountNum = adjustedAdvanceAmount.trim() ? Number(adjustedAdvanceAmount) : undefined;
      await processAdvanceRequest(
        advanceId,
        status,
        advanceNote || undefined,
        Number.isFinite(amountNum) ? amountNum : undefined,
        adjustedAdvanceReason || undefined,
      );
      await queryClient.invalidateQueries({ queryKey: queryKeys.manager.advancesRoot });
      setAdvanceNote('');
      setAdjustedAdvanceAmount('');
      setAdjustedAdvanceReason('');
      setSelectedAdvanceId(null);
    } catch (err: unknown) {
      setError(extractApiError(err).message || t('managerDashboard.errors.processAdvance'));
    } finally {
      setProcessingAdvance(null);
    }
  };

  const handleVerifyAttendance = async (recordId: number) => {
    setVerifyingRecord(recordId);
    try {
      await verifyAttendance(recordId);
      await queryClient.invalidateQueries({ queryKey: queryKeys.manager.todayAttendanceRoot });
    } catch (err: unknown) {
      alert(extractApiError(err).message || t('managerDashboard.attendance.verifyFailed'));
    } finally {
      setVerifyingRecord(null);
    }
  };

  const handleReportFraud = async (recordId: number) => {
    const note = prompt(t('managerDashboard.attendance.fraudPrompt'));
    if (!note) return;
    
    setVerifyingRecord(recordId);
    try {
      await reportFraud(recordId, note);
      await queryClient.invalidateQueries({ queryKey: queryKeys.manager.todayAttendanceRoot });
    } catch (err: unknown) {
      alert(extractApiError(err).message || t('managerDashboard.attendance.fraudFailed'));
    } finally {
      setVerifyingRecord(null);
    }
  };

  const filteredTeam = team.filter((emp) => {
    const matchesSearch =
      teamSearch === '' ||
      emp.fullName.toLowerCase().includes(teamSearch.toLowerCase()) ||
      emp.email.toLowerCase().includes(teamSearch.toLowerCase());
    
    const matchesStatus =
      teamStatusFilter === 'ALL' ||
      (teamStatusFilter === 'LINKED' && emp.nfcLinked) ||
      (teamStatusFilter === 'NOT_LINKED' && !emp.nfcLinked);

    return matchesSearch && matchesStatus;
  });

  const handlePrevMonth = () => {
    setReportDate((prev: Date) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setReportDate((prev: Date) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleDownloadAttendance = async (type: 'pdf' | 'excel') => {
    setIsDownloading(true);
    try {
      const response = type === 'pdf'
        ? await downloadAttendancePdf(reportMonth, reportYear)
        : await downloadAttendanceExcel(reportMonth, reportYear);

      // Check if the response is actually a blob (not an error object)
      if (!(response.data instanceof Blob)) {
        throw new Error('Invalid response from server');
      }

      // Check if the response is an error JSON (blob with wrong content type)
      if (response.data.type === 'application/json') {
        const text = await response.data.text();
        const json = JSON.parse(text);
        throw new Error(json.message || 'Server returned an error');
      }

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
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t('managerDashboard.errors.downloadReport');
      alert(msg);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <>
      <header className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight arabic-text">{t('managerDashboard.title')}</h1>
          <p className="text-slate-400 mt-1">
            {t('managerDashboard.subtitle', { items: [myDepartment?.departmentName, headerTeam].filter(Boolean).join(' • ') })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <CurrentDateTimePanel />
        </div>
      </header>

      {!canViewManagerScopedTeam && !canViewCompanyWideTeam && (
        <div className="mb-6 p-4 rounded-xl bg-amber-500/10 text-amber-200 text-sm">
          <span dangerouslySetInnerHTML={{ __html: t('managerDashboard.managerOnly', { role: me?.roleName ?? '—' }) }} />
        </div>
      )}

      {pageError && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 text-red-200 text-sm font-medium">{pageError}</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        {stats.map((stat, idx) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            key={stat.label}
            className="bg-luxury-surface p-6 rounded-3xl shadow-sm border border-white/5"
          >
            <div className={`${stat.bg} ${stat.color} w-12 h-12 rounded-2xl flex items-center justify-center mb-4`}>
              <stat.icon size={24} />
            </div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">{stat.label}</p>
            <p className="text-3xl font-black text-white">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="mb-10">
        <motion.div
          initial={{ opacity: 1, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-luxury-surface rounded-[2.5rem] p-8 shadow-sm border border-white/5"
        >
          <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-6">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-500/10 w-12 h-12 rounded-2xl flex items-center justify-center text-emerald-400">
                <FileText size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{t('managerDashboard.reportCenter.title')}</h2>
                <p className="text-slate-400 text-sm">{t('managerDashboard.reportCenter.subtitle', { date: reportDate.toLocaleDateString(i18n.language === 'ar' ? 'ar-EG' : 'en-US', { month: 'long', year: 'numeric' }) })}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-xl border border-white/10">
              <button onClick={handlePrevMonth} className="text-slate-400 hover:text-white transition-colors">
                {i18n.language === 'ar' ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
              </button>
              <span className="text-white font-bold text-xs min-w-[100px] text-center">
                {reportDate.toLocaleDateString(i18n.language === 'ar' ? 'ar-EG' : 'en-US', { month: 'long', year: 'numeric' })}
              </span>
              <button 
                onClick={handleNextMonth} 
                disabled={reportDate >= new Date()} 
                className="text-slate-400 hover:text-white disabled:opacity-30 transition-colors"
              >
                {i18n.language === 'ar' ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white/5 p-6 rounded-2xl border border-white/5 flex items-center justify-between">
              <div>
                <h3 className="text-white font-bold mb-1">{t('managerDashboard.reportCenter.pdf.title')}</h3>
                <p className="text-slate-500 text-xs">{t('managerDashboard.reportCenter.pdf.desc')}</p>
              </div>
              <button 
                onClick={() => handleDownloadAttendance('pdf')}
                disabled={isDownloading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold transition-all text-xs disabled:opacity-50"
              >
                {t('managerDashboard.reportCenter.pdf.button')}
              </button>
            </div>
            <div className="bg-white/5 p-6 rounded-2xl border border-white/5 flex items-center justify-between">
              <div>
                <h3 className="text-white font-bold mb-1">{t('managerDashboard.reportCenter.excel.title')}</h3>
                <p className="text-slate-500 text-xs">{t('managerDashboard.reportCenter.excel.desc')}</p>
              </div>
              <button 
                onClick={() => handleDownloadAttendance('excel')}
                disabled={isDownloading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg font-bold transition-all text-xs disabled:opacity-50"
              >
                {t('managerDashboard.reportCenter.excel.button')}
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Pending Recruitment Requests Section */}
      {canReviewCompanyRequests && (
        <div className="bg-luxury-surface rounded-[2.5rem] shadow-sm border border-white/5 overflow-hidden mb-10">
          <div className="p-8 border-b border-white/5 flex items-center gap-3">
            <div className="bg-orange-500/10 w-12 h-12 rounded-2xl flex items-center justify-center text-orange-400">
              <ClipboardList size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{t('managerDashboard.recruitment.title')}</h2>
              <p className="text-slate-400 text-sm">
                {t('managerDashboard.recruitment.subtitle', { count: pendingRequests.length })}
              </p>
            </div>
          </div>

          {pendingRequests.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <ClipboardList size={48} className="mx-auto mb-4 opacity-50" />
              <p>{t('managerDashboard.recruitment.empty')}</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {pendingRequests.map((request) => (
                <div key={request.requestId} className="p-6 hover:bg-white/5 transition-all">
                  <div className="flex justify-between items-start gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-lg font-bold text-white">{request.fullName}</h3>
                        <span className="bg-orange-500/10 text-orange-400 px-3 py-1 rounded-lg text-xs font-bold">
                          {t('managerDashboard.recruitment.underReview')}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-slate-500 text-xs mb-1">{t('managerDashboard.recruitment.job')}</p>
                          <p className="text-slate-200 font-medium">{request.jobDescription}</p>
                        </div>
                        <div>
                          <p className="text-slate-500 text-xs mb-1">{t('managerDashboard.recruitment.department')}</p>
                          <p className="text-slate-200 font-medium">{request.department}</p>
                        </div>
                        <div>
                          <p className="text-slate-500 text-xs mb-1">{t('managerDashboard.recruitment.expectedSalary')}</p>
                          <p className="text-slate-200 font-medium">{request.expectedSalary} {t('managerDashboard.recruitment.currency')}</p>
                        </div>
                        <div>
                          <p className="text-slate-500 text-xs mb-1">{t('managerDashboard.recruitment.nationalId')}</p>
                          <p className="text-slate-200 font-mono">{request.nationalId}</p>
                        </div>
                        <div>
                          <p className="text-slate-500 text-xs mb-1">{t('managerDashboard.recruitment.mobile')}</p>
                          <p className="text-slate-200 font-mono">{request.mobileNumber}</p>
                        </div>
                        <div>
                          <p className="text-slate-500 text-xs mb-1">{t('managerDashboard.recruitment.requestDate')}</p>
                          <p className="text-slate-200">
                            {request.requestedAt
                              ? new Date(request.requestedAt).toLocaleDateString(i18n.language === 'ar' ? 'ar-SA' : 'en-US')
                              : '—'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 min-w-[200px]">
                      {selectedRequestId === request.requestId ? (
                        <div className="space-y-2">
                          <input
                            type="number"
                            placeholder={t('managerDashboard.recruitment.salaryPlaceholder')}
                            value={adjustedSalary}
                            onChange={(e) => setAdjustedSalary(e.target.value)}
                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500/20"
                          />
                          <input
                            type="text"
                            placeholder={t('managerDashboard.recruitment.notePlaceholder')}
                            value={processNote}
                            onChange={(e) => setProcessNote(e.target.value)}
                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500/20"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleProcessRequest(request.requestId!, 'Approved')}
                              disabled={processingRequest === request.requestId}
                              className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1 disabled:opacity-50"
                            >
                              <Check size={14} />
                              {t('managerDashboard.recruitment.approve')}
                            </button>
                            <button
                              onClick={() => handleProcessRequest(request.requestId!, 'Rejected')}
                              disabled={processingRequest === request.requestId}
                              className="flex-1 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1 disabled:opacity-50"
                            >
                              <X size={14} />
                              {t('managerDashboard.recruitment.reject')}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setSelectedRequestId(request.requestId!);
                            setProcessNote('');
                          }}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all"
                        >
                          {t('managerDashboard.recruitment.reviewRequest')}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <PaginationControls
            page={requestPage}
            totalPages={requestTotalPages}
            totalCount={requestTotalCount}
            onPageChange={setRequestPage}
          />
        </div>
      )}

      {/* Daily Attendance Check Section */}
      <div className="bg-luxury-surface rounded-[2.5rem] shadow-sm border border-white/5 overflow-hidden mb-10">
        <div className="p-8 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-orange-500/10 w-12 h-12 rounded-2xl flex items-center justify-center text-orange-400">
              <UserCheck size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white uppercase tracking-tight arabic-text">{t('managerDashboard.attendance.title')}</h2>
              <p className="text-slate-400 text-sm">{t('managerDashboard.attendance.subtitle')}</p>
            </div>
          </div>
        </div>

        {todayAttendance.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <CheckCircle2 size={48} className="mx-auto mb-4 opacity-50" />
            <p>{t('managerDashboard.attendance.empty')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead className="bg-white/5 text-slate-400 text-[10px] font-black uppercase tracking-[0.15em]">
                <tr>
                  <th className="p-6">{t('managerDashboard.attendance.headers.employee')}</th>
                  <th className="p-6">{t('managerDashboard.attendance.headers.checkIn')}</th>
                  <th className="p-6">{t('managerDashboard.attendance.headers.checkOut')}</th>
                  <th className="p-6">{t('managerDashboard.attendance.headers.status')}</th>
                  <th className="p-6">{t('managerDashboard.attendance.headers.review')}</th>
                  <th className="p-6">{t('managerDashboard.attendance.headers.payroll')}</th>
                  <th className="p-6">{t('managerDashboard.attendance.headers.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {todayAttendance.map((record) => {
                  const summaryMeta = getLegacyAttendanceStatusMeta(record);
                  const reviewMeta = getReviewStatusMeta(record.reviewStatus);
                  const payrollMeta = getPayrollStatusMeta(record.payrollStatus);

                  return (
                  <tr key={record.recordId} className="hover:bg-white/5 transition-all">
                    <td className="p-6 font-bold text-slate-100">{record.employeeName}</td>
                    <td className="p-6 font-mono text-slate-400 text-sm">{new Date(record.checkIn).toLocaleTimeString(i18n.language === 'ar' ? 'ar-EG' : 'en-US', {hour: '2-digit', minute: '2-digit'})}</td>
                    <td className="p-6 font-mono text-slate-400 text-sm">{record.checkOut ? new Date(record.checkOut).toLocaleTimeString(i18n.language === 'ar' ? 'ar-EG' : 'en-US', {hour: '2-digit', minute: '2-digit'}) : '—'}</td>
                    <td className="p-6">
                      <span className={`inline-flex rounded-lg px-3 py-1 text-xs font-bold ${summaryMeta.className}`}>
                        {t(summaryMeta.label)}
                      </span>
                    </td>
                    <td className="p-6">
                      <span className={`inline-flex rounded-lg px-3 py-1 text-xs font-bold ${reviewMeta.className}`}>
                        {t(reviewMeta.label)}
                      </span>
                    </td>
                    <td className="p-6">
                      <span className={`inline-flex rounded-lg px-3 py-1 text-xs font-bold ${payrollMeta.className}`}>
                        {t(payrollMeta.label)}
                      </span>
                    </td>
                    <td className="p-6">
                      {(record.isVerifiedByManager !== true && record.reviewStatus !== 'VERIFIED' && record.reviewStatus !== 'FRAUD') ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleVerifyAttendance(record.recordId)}
                            disabled={verifyingRecord === record.recordId}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1.5 shadow-lg shadow-green-900/20"
                          >
                            <Check size={14} /> {t('managerDashboard.attendance.confirmAttendance')}
                          </button>
                          <button
                            onClick={() => handleReportFraud(record.recordId)}
                            disabled={verifyingRecord === record.recordId}
                            className="bg-red-600/10 hover:bg-red-600 text-red-400 hover:text-white px-4 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1.5 border border-red-500/20"
                          >
                            <AlertTriangle size={14} /> {t('managerDashboard.attendance.reportFraud')}
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-1">
                          <span className="text-xs text-slate-500 font-bold flex items-center gap-1">
                            <CheckCircle2 size={12} className="text-emerald-500" /> {t('managerDashboard.attendance.actionDone')}
                          </span>
                          {record.managerNotes && (
                            <p className="text-[10px] text-slate-400 italic max-w-[150px] truncate" title={record.managerNotes}>
                              {record.managerNotes}
                            </p>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>
        )}
        <PaginationControls
          page={attendancePage}
          totalPages={attendanceTotalPages}
          totalCount={attendanceTotalCount}
          onPageChange={setAttendancePage}
        />
      </div>

      {/* Pending Leave Requests Section */}
      {(canViewManagerScopedTeam || canViewCompanyWideTeam) && (
        <div className="bg-luxury-surface rounded-[2.5rem] shadow-sm border border-white/5 overflow-hidden mb-10">
          <div className="p-8 border-b border-white/5 flex items-center gap-3">
            <div className="bg-blue-500/10 w-12 h-12 rounded-2xl flex items-center justify-center text-blue-400">
              <FileText size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{t('managerDashboard.leaves.title')}</h2>
              <p className="text-slate-400 text-sm">
                {t('managerDashboard.leaves.subtitle', { count: pendingLeaves.length })}
              </p>
            </div>
          </div>

          {pendingLeaves.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <FileText size={48} className="mx-auto mb-4 opacity-50" />
              <p>{t('managerDashboard.leaves.empty')}</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {pendingLeaves.map((leave) => (
                <div key={leave.requestId} className="p-6 hover:bg-white/5 transition-all">
                  <div className="flex justify-between items-start gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-lg font-bold text-white">{leave.employeeName ?? t('managerDashboard.leaves.employeeFallback', { id: leave.employeeId })}</h3>
                        <span className="bg-blue-500/10 text-blue-400 px-3 py-1 rounded-lg text-xs font-bold">
                          {leave.leaveType === 'Hourly' ? t('managerDashboard.leaves.hourly') : t('managerDashboard.leaves.advance')}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-slate-500 text-xs mb-1">{t('managerDashboard.leaves.duration')}</p>
                          <p className="text-slate-200 font-medium">{leave.duration} {leave.leaveType === 'Hourly' ? t('managerDashboard.leaves.hours') : t('managerDashboard.leaves.days')}</p>
                        </div>
                        <div>
                          <p className="text-slate-500 text-xs mb-1">{t('managerDashboard.leaves.leaveDate')}</p>
                          <p className="text-slate-200 font-medium">{leave.startDate}</p>
                        </div>
                        {leave.reason && (
                          <div className="col-span-2">
                            <p className="text-slate-500 text-xs mb-1">{t('managerDashboard.leaves.reason')}</p>
                            <p className="text-slate-200 text-xs">{leave.reason}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 min-w-[200px]">
                      {selectedLeaveId === leave.requestId ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            placeholder={t('managerDashboard.leaves.notePlaceholder')}
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
                              <Check size={14} /> {t('managerDashboard.leaves.approve')}
                            </button>
                            <button
                              onClick={() => handleProcessLeave(leave.requestId!, 'REJECTED')}
                              disabled={processingLeave === leave.requestId}
                              className="flex-1 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1 disabled:opacity-50"
                            >
                              <X size={14} /> {t('managerDashboard.leaves.reject')}
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
                          {t('managerDashboard.leaves.reviewRequest')}
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
      )}

      {/* Pending Advance Requests Section (Manager Stage) */}
      {canViewManagerScopedTeam && (
        <div className="bg-luxury-surface rounded-[2.5rem] shadow-sm border border-white/5 overflow-hidden mb-10">
          <div className="p-8 border-b border-white/5 flex items-center gap-3">
            <div className="bg-purple-500/10 w-12 h-12 rounded-2xl flex items-center justify-center text-purple-400">
              <ClipboardList size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{t('managerDashboard.advances.title')}</h2>
              <p className="text-slate-400 text-sm">
                {t('managerDashboard.advances.subtitle', { count: pendingAdvances.length })}
              </p>
            </div>
          </div>

          {pendingAdvances.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <ClipboardList size={48} className="mx-auto mb-4 opacity-50" />
              <p>{t('managerDashboard.advances.empty')}</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {pendingAdvances.map((adv) => (
                <div key={adv.advanceId} className="p-6 hover:bg-white/5 transition-all">
                  <div className="flex justify-between items-start gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-lg font-bold text-white">{adv.employeeName ?? t('managerDashboard.advances.employeeFallback', { id: adv.employeeId })}</h3>
                        <span className="bg-purple-500/10 text-purple-300 px-3 py-1 rounded-lg text-xs font-bold">
                          {adv.amount} {t('managerDashboard.advances.currency')}
                        </span>
                      </div>
                      {adv.reason && (
                        <p className="text-slate-400 text-xs">{adv.reason}</p>
                      )}
                      <p className="text-slate-500 text-xs mt-2">
                        {adv.requestedAt ? new Date(adv.requestedAt).toLocaleString(i18n.language === 'ar' ? 'ar-SA' : 'en-US') : ''}
                      </p>
                    </div>

                    <div className="flex flex-col gap-2 min-w-[260px]">
                      {selectedAdvanceId === adv.advanceId ? (
                        <div className="space-y-2">
                          <input
                            type="number"
                            inputMode="decimal"
                            placeholder={t('managerDashboard.advances.amountPlaceholder')}
                            value={adjustedAdvanceAmount}
                            onChange={(e) => setAdjustedAdvanceAmount(e.target.value)}
                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-slate-500 focus:ring-2 focus:ring-purple-500/20"
                          />
                          <input
                            type="text"
                            placeholder={t('managerDashboard.advances.reasonPlaceholder')}
                            value={adjustedAdvanceReason}
                            onChange={(e) => setAdjustedAdvanceReason(e.target.value)}
                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-slate-500 focus:ring-2 focus:ring-purple-500/20"
                          />
                          <input
                            type="text"
                            placeholder={t('managerDashboard.advances.notePlaceholder')}
                            value={advanceNote}
                            onChange={(e) => setAdvanceNote(e.target.value)}
                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-slate-500 focus:ring-2 focus:ring-purple-500/20"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleProcessAdvance(adv.advanceId!, 'Approved')}
                              disabled={processingAdvance === adv.advanceId}
                              className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1 disabled:opacity-50"
                            >
                              <Check size={14} /> {t('managerDashboard.advances.approve')}
                            </button>
                            <button
                              onClick={() => handleProcessAdvance(adv.advanceId!, 'Rejected')}
                              disabled={processingAdvance === adv.advanceId}
                              className="flex-1 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1 disabled:opacity-50"
                            >
                              <X size={14} /> {t('managerDashboard.advances.reject')}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setSelectedAdvanceId(adv.advanceId!);
                            setAdvanceNote('');
                            setAdjustedAdvanceAmount(String(adv.amount ?? ''));
                            setAdjustedAdvanceReason(adv.reason ?? '');
                          }}
                          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all"
                        >
                          {t('managerDashboard.advances.reviewRequest')}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <PaginationControls
            page={advancePage}
            totalPages={advancesTotalPages}
            totalCount={advancesTotalCount}
            onPageChange={setAdvancePage}
          />
        </div>
      )}

      <div className="bg-luxury-surface rounded-[2.5rem] shadow-sm border border-white/5 overflow-hidden">
        <div className="p-8 border-b border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h2 className="text-xl font-bold text-white">{t('managerDashboard.team.title')}</h2>
          <div className="flex gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder={t('managerDashboard.team.searchPlaceholder')}
                value={teamSearch}
                onChange={(e) => setTeamSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white/5 border-transparent focus:bg-white/10 focus:border-blue-500/50 rounded-xl text-sm transition-all text-white placeholder:text-slate-500"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                const states: Array<'ALL' | 'LINKED' | 'NOT_LINKED'> = ['ALL', 'LINKED', 'NOT_LINKED'];
                const next = states[(states.indexOf(teamStatusFilter) + 1) % states.length];
                setTeamStatusFilter(next);
              }}
              className={`p-2.5 rounded-xl transition-all border flex items-center gap-2 text-xs font-bold ${
                teamStatusFilter === 'ALL' 
                  ? 'bg-white/5 text-slate-400 border-white/5' 
                  : 'bg-blue-600/10 text-blue-400 border-blue-500/20'
              }`}
              title={t('managerDashboard.team.filterTitle')}
            >
              <Filter size={18} />
              {teamStatusFilter === 'LINKED' && <span>{t('managerDashboard.team.withCard')}</span>}
              {teamStatusFilter === 'NOT_LINKED' && <span>{t('managerDashboard.team.withoutCard')}</span>}
              {teamStatusFilter === 'ALL' && <span>{t('managerDashboard.team.all')}</span>}
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-white/5 text-slate-400 text-[10px] font-black uppercase tracking-[0.15em]">
                <th className="p-6">{t('managerDashboard.team.headers.employee')}</th>
                <th className="p-6">{t('managerDashboard.team.headers.email')}</th>
                <th className="p-6">{t('managerDashboard.team.headers.team')}</th>
                <th className="p-6">{t('managerDashboard.team.headers.nfc')}</th>
                <th className="p-6 text-center">{t('managerDashboard.team.headers.status')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredTeam.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500 text-sm">
                    {teamSearch || teamStatusFilter !== 'ALL'
                      ? t('managerDashboard.team.emptyResults')
                      : canViewCompanyWideTeam
                      ? t('managerDashboard.team.emptyCompanyScale')
                      : me?.roleName === 'MANAGER'
                      ? t('managerDashboard.team.emptyManagerScale')
                      : '—'}
                  </td>
                </tr>
              ) : (
                filteredTeam.map((emp) => (
                  <tr key={emp.employeeId} className="hover:bg-white/5 transition-all group">
                    <td className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center font-bold text-slate-400 text-sm group-hover:bg-blue-600 group-hover:text-white transition-all">
                          {emp.fullName
                            .split(/\s+/)
                            .filter(Boolean)
                            .slice(0, 2)
                            .map((w) => w[0])
                            .join('')}
                        </div>
                        <span className="font-bold text-slate-100">{emp.fullName}</span>
                      </div>
                    </td>
                    <td className="p-6 text-slate-400 text-sm">{emp.email}</td>
                    <td className="p-6 text-slate-400 text-sm font-medium">{emp.teamName ?? '—'}</td>
                    <td className="p-6 font-mono text-slate-400 text-sm">{emp.cardUid ?? '—'}</td>
                    <td className="p-6 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <span
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1.5 ${
                            emp.nfcLinked ? 'bg-green-500/10 text-green-400' : 'bg-white/5 text-slate-500'
                          }`}
                        >
                          <div
                            className={`w-1.5 h-1.5 rounded-full ${emp.nfcLinked ? 'bg-green-400' : 'bg-slate-500'}`}
                          />
                          {emp.nfcLinked ? t('managerDashboard.team.cardLinked') : t('managerDashboard.team.noCard')}
                        </span>
                        <span className="text-slate-500 flex items-center gap-1 text-[10px] font-bold">
                          <CheckCircle2 size={14} /> {t('managerDashboard.team.liveData')}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-6 bg-white/[0.02] border-t border-white/5 flex justify-between items-center text-xs text-slate-500 font-medium">
          <p>{t('managerDashboard.team.footer', { count: filteredTeam.length, total: teamTotalCount })}</p>
        </div>
        <PaginationControls
          page={teamPage}
          totalPages={teamTotalPages}
          totalCount={teamTotalCount}
          onPageChange={setTeamPage}
        />
      </div>
    </>
  );
};

export default ManagerDashboard;
