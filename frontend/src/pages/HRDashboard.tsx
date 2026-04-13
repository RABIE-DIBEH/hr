import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
  Calendar,
} from 'lucide-react';
import PaginationControls from '../components/PaginationControls';
import CurrentDateTimePanel from '../components/CurrentDateTimePanel';
import RecruitmentRequestForm from '../components/RecruitmentRequestForm';
import {
  assignEmployeeNfcCard,
  getEmployeeNfcCard,
  getPendingLeavesForHrPage,
  getPendingRecruitmentRequestsPage,
  listEmployeesPage,
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
import { queryKeys } from '../services/queryKeys';
import { extractApiError } from '../utils/errorHandler';

const HRDashboard = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const employeePage = 0;
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | ''>('');
  const [cardUidInput, setCardUidInput] = useState('');
  const [cardActionLoading, setCardActionLoading] = useState(false);
  const [cardFeedback, setCardFeedback] = useState<string | null>(null);
  const [showRecruitmentForm, setShowRecruitmentForm] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [reportDate, setReportDate] = useState(new Date());

  const reportMonth = reportDate.getMonth() + 1;
  const reportYear = reportDate.getFullYear();

  // Leave Requests state
  const [processingLeave, setProcessingLeave] = useState<number | null>(null);
  const [leaveNote, setLeaveNote] = useState<string>('');
  const [selectedLeaveId, setSelectedLeaveId] = useState<number | null>(null);

  // Recruitment Requests state
  const [processingRecruitment, setProcessingRecruitment] = useState<number | null>(null);
  const [recruitmentNote, setRecruitmentNote] = useState<string>('');
  const [adjustedSalary, setAdjustedSalary] = useState<string>('');
  const [selectedRecruitmentId, setSelectedRecruitmentId] = useState<number | null>(null);
  const [recruitmentPage, setRecruitmentPage] = useState(0);
  const [leavePage, setLeavePage] = useState(0);

  const cardSectionRef = useRef<HTMLDivElement>(null);

  const employeesQuery = useQuery({
    queryKey: queryKeys.hr.employees(employeePage),
    queryFn: async () => (await listEmployeesPage({ page: employeePage, size: 10 })).data,
  });

  const selectedCardQuery = useQuery<NfcCard | null>({
    queryKey: queryKeys.hr.employeeCard(selectedEmployeeId),
    queryFn: async () => {
      if (selectedEmployeeId === '') return null;
      try {
        const res = await getEmployeeNfcCard(selectedEmployeeId);
        return res.data;
      } catch (error: unknown) {
        const message = extractApiError(error).message;
        if (message.includes('404') || message.includes('Not Found')) {
          return null;
        }
        throw error;
      }
    },
    enabled: selectedEmployeeId !== '',
  });

  const leavesQuery = useQuery({
    queryKey: queryKeys.hr.leaves(leavePage),
    queryFn: async () => (await getPendingLeavesForHrPage({ page: leavePage, size: 10 })).data,
  });

  const recruitmentQuery = useQuery({
    queryKey: queryKeys.hr.recruitment(recruitmentPage),
    queryFn: async () => (await getPendingRecruitmentRequestsPage({ page: recruitmentPage, size: 10 })).data,
  });

  const employees: EmployeeSummary[] = employeesQuery.data?.items ?? [];
  const selectedCard = selectedCardQuery.data ?? null;
  const pendingLeaves: LeaveRequest[] = leavesQuery.data?.items ?? [];
  const leaveTotalPages = leavesQuery.data?.totalPages ?? 0;
  const leaveTotalCount = leavesQuery.data?.totalCount ?? 0;
  const pendingRecruitment: RecruitmentRequest[] = recruitmentQuery.data?.items ?? [];
  const recruitmentTotalPages = recruitmentQuery.data?.totalPages ?? 0;
  const recruitmentTotalCount = recruitmentQuery.data?.totalCount ?? 0;

  const selectedEmployee = selectedEmployeeId === ''
    ? null
    : employees.find((employee) => employee.employeeId === selectedEmployeeId) ?? null;

  const getErrorMessage = (error: unknown, fallback: string) => {
    return extractApiError(error).message || fallback;
  };

  const queryError = employeesQuery.error || leavesQuery.error || recruitmentQuery.error || selectedCardQuery.error;
  const pageError = loadError || (queryError ? extractApiError(queryError).message : null);

  const handleAssignOrReplace = async () => {
    if (selectedEmployeeId === '' || !cardUidInput.trim()) {
      setCardFeedback(t('hrDashboard.feedback.selectEmployeeUid'));
      return;
    }

    setCardActionLoading(true);
    try {
      if (selectedCard) {
        await replaceEmployeeNfcCard(selectedEmployeeId, cardUidInput.trim());
        setCardFeedback(t('hrDashboard.feedback.replaceSuccess'));
      } else {
        await assignEmployeeNfcCard(selectedEmployeeId, cardUidInput.trim());
        setCardFeedback(t('hrDashboard.feedback.assignSuccess'));
      }
      setCardUidInput('');
      await queryClient.invalidateQueries({ queryKey: queryKeys.hr.employeesRoot });
      await queryClient.invalidateQueries({ queryKey: queryKeys.hr.employeeCardRoot });
      setLoadError(null);
    } catch (error: unknown) {
      setCardFeedback(getErrorMessage(error, t('hrDashboard.errors.saveCard')));
    } finally {
      setCardActionLoading(false);
    }
  };

  const handleStatusUpdate = async (status: 'ACTIVE' | 'INACTIVE' | 'BLOCKED') => {
    if (selectedEmployeeId === '') {
      setCardFeedback(t('hrDashboard.feedback.selectEmployee'));
      return;
    }

    setCardActionLoading(true);
    try {
      await updateEmployeeNfcCardStatus(selectedEmployeeId, status);
      await queryClient.invalidateQueries({ queryKey: queryKeys.hr.employeesRoot });
      await queryClient.invalidateQueries({ queryKey: queryKeys.hr.employeeCardRoot });
      setCardFeedback(t('hrDashboard.feedback.statusUpdateSuccess'));
      setLoadError(null);
    } catch (error: unknown) {
      setCardFeedback(getErrorMessage(error, t('hrDashboard.errors.updateStatus')));
    } finally {
      setCardActionLoading(false);
    }
  };

  const handleUnassign = async () => {
    if (selectedEmployeeId === '') {
      setCardFeedback(t('hrDashboard.feedback.selectEmployee'));
      return;
    }

    setCardActionLoading(true);
    try {
      await unassignEmployeeNfcCard(selectedEmployeeId);
      await queryClient.invalidateQueries({ queryKey: queryKeys.hr.employeesRoot });
      await queryClient.invalidateQueries({ queryKey: queryKeys.hr.employeeCardRoot });
      setCardUidInput('');
      setCardFeedback(t('hrDashboard.feedback.unassignSuccess'));
      setLoadError(null);
    } catch (error: unknown) {
      setCardFeedback(getErrorMessage(error, t('hrDashboard.errors.unassign')));
    } finally {
      setCardActionLoading(false);
    }
  };

  const cardStatusBadge = selectedCard
    ? selectedCard.status === 'Active'
      ? 'bg-green-500/10 text-green-400'
      : selectedCard.status === 'Blocked'
        ? 'bg-red-500/10 text-red-400'
        : 'bg-amber-500/10 text-amber-300'
    : 'bg-slate-500/10 text-slate-400';

  const handleRecruitmentSuccess = () => {
    setShowRecruitmentForm(false);
    void queryClient.invalidateQueries({ queryKey: queryKeys.hr.recruitmentRoot });
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
      if (!(response.data instanceof Blob)) throw new Error('Invalid response');
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
      alert(t('hrDashboard.errors.downloadRecruitment'));
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
      if (!(response.data instanceof Blob)) throw new Error('Invalid response');
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
      alert(t('hrDashboard.errors.downloadAttendance'));
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
      if (!(response.data instanceof Blob)) throw new Error('Invalid response');
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
      alert(t('hrDashboard.errors.downloadPayroll'));
    } finally {
      setIsDownloading(false);
    }
  };

  const handleProcessRecruitment = async (requestId: number, status: 'Approved' | 'Rejected') => {
    setProcessingRecruitment(requestId);
    try {
      const salaryNum = adjustedSalary ? parseFloat(adjustedSalary) : undefined;
      await processRecruitmentRequest(requestId, status, recruitmentNote || undefined, salaryNum);
      await queryClient.invalidateQueries({ queryKey: queryKeys.hr.recruitmentRoot });
      setRecruitmentNote('');
      setAdjustedSalary('');
      setSelectedRecruitmentId(null);
    } catch (err: unknown) {
      setLoadError(extractApiError(err).message || t('hrDashboard.errors.processRecruitment'));
    } finally {
      setProcessingRecruitment(null);
    }
  };

  const handleProcessLeave = async (requestId: number, status: 'APPROVED' | 'REJECTED') => {
    setProcessingLeave(requestId);
    try {
      await processLeaveRequest(requestId, status, leaveNote || undefined);
      await queryClient.invalidateQueries({ queryKey: queryKeys.hr.leavesRoot });
      setLeaveNote('');
      setSelectedLeaveId(null);
    } catch (err: unknown) {
      setLoadError(extractApiError(err).message || t('hrDashboard.errors.processLeave'));
    } finally {
      setProcessingLeave(null);
    }
  };

  return (
    <>
      <header className="mb-10">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight arabic-text">
              {t('hrDashboard.title')}
            </h1>
            <p className="text-slate-400 mt-1">{t('hrDashboard.subtitle')}</p>
          </div>
          <div className="flex items-center gap-4">
            <CurrentDateTimePanel />
            <button
              onClick={() => window.location.href = '/hr/grid'}
              className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all border border-white/10"
            >
              <Search size={20} />
              <span>{t('hrDashboard.actions.attendanceGrid')}</span>
            </button>
            <button
              onClick={() => setShowRecruitmentForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-600/20"
            >
              <UserPlus size={20} />
              <span>{t('hrDashboard.actions.newRecruitment')}</span>
            </button>
          </div>
        </div>
      </header>

      {pageError && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 text-red-200 text-sm font-medium">{pageError}</div>
      )}

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
                <h2 className="text-xl font-bold text-white">{t('hrDashboard.reports.title')}</h2>
                <p className="text-slate-400 text-sm">{t('hrDashboard.reports.subtitle', { date: reportDate.toLocaleDateString(i18n.language === 'ar' ? 'ar-EG' : 'en-US', { month: 'long', year: 'numeric' }) })}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-xl border border-white/10">
              <button onClick={handlePrevMonth} className="text-slate-400 hover:text-white transition-colors">
                <ChevronRight size={18} />
              </button>
              <span className="text-white font-bold text-xs min-w-[100px] text-center">
                {reportDate.toLocaleDateString(i18n.language === 'ar' ? 'ar-EG' : 'en-US', { month: 'long', year: 'numeric' })}
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

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Attendance Reports */}
            <div className="bg-white/5 p-6 rounded-2xl border border-white/5">
              <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                <CheckCircle2 size={16} className="text-blue-400" />
                {t('hrDashboard.reports.attendance.title')}
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
                {t('hrDashboard.reports.payroll.title')}
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
                {t('hrDashboard.reports.recruitment.title')}
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

            {/* Leave Balance Report */}
            <div className="bg-white/5 p-6 rounded-2xl border border-white/5">
              <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                <Calendar size={16} className="text-purple-400" />
                {t('hrDashboard.reports.leaveBalance.title')}
              </h3>
              <button 
                onClick={() => navigate('/hr/leave-report')}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg font-bold transition-all text-xs"
              >
                {t('hrDashboard.reports.leaveBalance.button')}
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* NFC Card Management Section */}
      {pageError && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 text-red-200 text-sm font-medium">{pageError}</div>
      )}

      <div className="grid grid-cols-1 gap-8 mb-10">
        <motion.div
          ref={cardSectionRef}
          initial={{ opacity: 1, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-luxury-surface rounded-[2.5rem] p-8 shadow-sm border border-white/5"
        >
          <div className="flex justify-between items-start mb-6 gap-4 flex-wrap">
            <div>
              <div className="bg-blue-600 w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-900/20 mb-4">
                <CreditCard size={24} />
              </div>
              <h2 className="text-xl font-bold mb-2 text-white">{t('hrDashboard.nfc.title')}</h2>
              <p className="text-slate-400 text-sm leading-relaxed">
                {t('hrDashboard.nfc.subtitle')}
              </p>
            </div>
            <span className="bg-blue-500/10 text-blue-400 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-widest">
              {t('hrDashboard.nfc.liveControl')}
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
                  <option value="" className="bg-slate-900">{t('hrDashboard.nfc.selectEmployee')}</option>
                  {employees.map((employee) => (
                    <option key={employee.employeeId} value={employee.employeeId} className="bg-slate-900">
                      {employee.fullName} ({employee.teamName ?? '—'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                  <p className="text-slate-500 text-xs mb-1">{t('hrDashboard.nfc.stats.employee')}</p>
                  <p className="text-white font-bold">{selectedEmployee?.fullName ?? '—'}</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                  <p className="text-slate-500 text-xs mb-1">{t('hrDashboard.nfc.stats.uid')}</p>
                  <p className="text-slate-200 font-mono text-sm break-all">{selectedCard?.uid ?? '—'}</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                  <p className="text-slate-500 text-xs mb-1">{t('hrDashboard.nfc.stats.status')}</p>
                  <span className={`inline-flex px-3 py-1 rounded-lg text-[11px] font-black uppercase ${cardStatusBadge}`}>
                    {selectedCard?.status ?? t('hrDashboard.nfc.summary.noCard')}
                  </span>
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-2 text-white font-bold">
                  <IdCard size={18} />
                  <span>{selectedCard ? t('hrDashboard.nfc.form.titleReplace') : t('hrDashboard.nfc.form.titleAssign')}</span>
                </div>
                <input
                  type="text"
                  value={cardUidInput}
                  onChange={(e) => setCardUidInput(e.target.value)}
                  placeholder={selectedCard ? t('hrDashboard.nfc.form.placeholderReplace') : t('hrDashboard.nfc.form.placeholderAssign')}
                  className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-sm text-white placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500/20"
                />
                <button
                  type="button"
                  onClick={handleAssignOrReplace}
                  disabled={cardActionLoading || selectedEmployeeId === ''}
                  className="w-full bg-white text-black py-3 rounded-xl font-bold hover:bg-slate-200 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {cardActionLoading ? <RefreshCcw className="animate-spin" size={18} /> : <LinkIcon size={18} />}
                  <span>{selectedCard ? t('hrDashboard.nfc.form.buttonReplace') : t('hrDashboard.nfc.form.buttonAssign')}</span>
                </button>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-[2rem] p-6 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-white font-bold">{t('hrDashboard.nfc.actions.title')}</p>
                  <p className="text-slate-500 text-xs mt-1">{t('hrDashboard.nfc.actions.subtitle')}</p>
                </div>
                <span className="text-xs text-slate-500">{selectedEmployee?.fullName ?? ''}</span>
              </div>

              <button
                type="button"
                onClick={() => handleStatusUpdate('ACTIVE')}
                disabled={cardActionLoading || !selectedCard}
                className="w-full bg-green-500/10 text-green-300 border border-green-500/20 py-3 rounded-xl font-bold hover:bg-green-500/15 transition-all disabled:opacity-40"
              >
                {t('hrDashboard.nfc.actions.activate')}
              </button>
              <button
                type="button"
                onClick={() => handleStatusUpdate('INACTIVE')}
                disabled={cardActionLoading || !selectedCard}
                className="w-full bg-amber-500/10 text-amber-200 border border-amber-500/20 py-3 rounded-xl font-bold hover:bg-amber-500/15 transition-all disabled:opacity-40"
              >
                <span className="inline-flex items-center gap-2">
                  <Power size={16} />
                  {t('hrDashboard.nfc.actions.deactivate')}
                </span>
              </button>
              <button
                type="button"
                onClick={() => handleStatusUpdate('BLOCKED')}
                disabled={cardActionLoading || !selectedCard}
                className="w-full bg-red-500/10 text-red-300 border border-red-500/20 py-3 rounded-xl font-bold hover:bg-red-500/15 transition-all disabled:opacity-40"
              >
                {t('hrDashboard.nfc.actions.block')}
              </button>
              <button
                type="button"
                onClick={handleUnassign}
                disabled={cardActionLoading || !selectedCard}
                className="w-full bg-white/5 text-slate-300 border border-white/10 py-3 rounded-xl font-bold hover:bg-white/10 transition-all disabled:opacity-40"
              >
                <span className="inline-flex items-center gap-2">
                  <Trash2 size={16} />
                  {t('hrDashboard.nfc.actions.unassign')}
                </span>
              </button>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4 min-h-28">
                <p className="text-slate-500 text-xs mb-2">{t('hrDashboard.nfc.summary.title')}</p>
                {selectedCard ? (
                  <div className="space-y-2 text-sm">
                    <p className="text-slate-200">{t('hrDashboard.nfc.summary.uid')}<span className="font-mono">{selectedCard.uid}</span></p>
                    <p className="text-slate-200">{t('hrDashboard.nfc.summary.status')}{selectedCard.status}</p>
                    <p className="text-slate-400 text-xs">{t('hrDashboard.nfc.summary.issuedDate')}{selectedCard.issuedDate ? new Date(selectedCard.issuedDate).toLocaleString(i18n.language === 'ar' ? 'ar-SA' : 'en-US') : '—'}</p>
                  </div>
                ) : (
                  <p className="text-slate-500 text-sm">{t('hrDashboard.nfc.summary.empty')}</p>
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

      <div className="bg-luxury-surface rounded-[2.5rem] shadow-sm border border-white/5 overflow-hidden mb-10">
        <div className="p-8 border-b border-white/5 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-orange-500/10 w-12 h-12 rounded-2xl flex items-center justify-center text-orange-400">
              <UserPlus size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{t('hrDashboard.recruitment.title')}</h2>
              <p className="text-slate-400 text-sm">
                {t('hrDashboard.recruitment.subtitle', { count: pendingRecruitment.length })}
              </p>
            </div>
          </div>
        </div>

        {pendingRecruitment.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <UserPlus size={48} className="mx-auto mb-4 opacity-50" />
            <p>{t('hrDashboard.recruitment.empty')}</p>
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
                        {request.status === 'PENDING_MANAGER' ? t('hrDashboard.recruitment.underReview') : request.status?.replace('_', ' ') || t('hrDashboard.recruitment.underReview')}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-slate-500 text-xs mb-1">{t('hrDashboard.recruitment.job')}</p>
                        <p className="text-slate-200 font-medium">{request.jobDescription}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-xs mb-1">{t('hrDashboard.recruitment.department')}</p>
                        <p className="text-slate-200 font-medium">{request.department}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-xs mb-1">{t('hrDashboard.recruitment.expectedSalary')}</p>
                        <p className="text-slate-200 font-medium">{request.expectedSalary} {t('hrDashboard.recruitment.currency')}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-xs mb-1">{t('hrDashboard.recruitment.nationalId')}</p>
                        <p className="text-slate-200 font-mono">{request.nationalId}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-xs mb-1">{t('hrDashboard.recruitment.mobile')}</p>
                        <p className="text-slate-200 font-mono">{request.mobileNumber}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-xs mb-1">{t('hrDashboard.recruitment.requestDate')}</p>
                        <p className="text-slate-200">
                          {request.requestedAt
                            ? new Date(request.requestedAt).toLocaleDateString(i18n.language === 'ar' ? 'ar-SA' : 'en-US')
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
                          placeholder={t('hrDashboard.recruitment.salaryPlaceholder')}
                          value={adjustedSalary}
                          onChange={(e) => setAdjustedSalary(e.target.value)}
                          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500/20"
                        />
                        <input
                          type="text"
                          placeholder={t('hrDashboard.recruitment.notePlaceholder')}
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
                            {t('hrDashboard.recruitment.approve')}
                          </button>
                          <button
                            onClick={() => handleProcessRecruitment(request.requestId!, 'Rejected')}
                            disabled={processingRecruitment === request.requestId}
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1 disabled:opacity-50"
                          >
                            {t('hrDashboard.recruitment.reject')}
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
                        {t('hrDashboard.recruitment.reviewRequest')}
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
            <h2 className="text-xl font-bold text-white uppercase tracking-tight arabic-text">{t('hrDashboard.leaves.title')}</h2>
            <p className="text-slate-400 text-sm">
              {t('hrDashboard.leaves.subtitle', { count: pendingLeaves.length })}
            </p>
          </div>
        </div>

        {pendingLeaves.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <CheckCircle2 size={48} className="mx-auto mb-4 opacity-50" />
            <p>{t('hrDashboard.leaves.empty')}</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {pendingLeaves.map((leave) => (
              <div key={leave.requestId} className="p-6 hover:bg-white/5 transition-all">
                <div className="flex justify-between items-start gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-lg font-bold text-white">{leave.employeeName ?? t('hrDashboard.leaves.employeeFallback', { id: leave.employeeId })}</h3>
                      <span className="bg-blue-500/10 text-blue-400 px-3 py-1 rounded-lg text-xs font-bold">
                        {leave.leaveType === 'Hourly' ? t('hrDashboard.leaves.hourly') : t('hrDashboard.leaves.advance')}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-slate-500 text-xs mb-1">{t('hrDashboard.leaves.duration')}</p>
                        <p className="text-slate-200 font-medium">{leave.duration} {leave.leaveType === 'Hourly' ? t('hrDashboard.leaves.hours') : t('hrDashboard.leaves.days')}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-xs mb-1">{t('hrDashboard.leaves.date')}</p>
                        <p className="text-slate-200 font-medium">{leave.startDate}</p>
                      </div>
                      {leave.reason && (
                        <div className="col-span-2">
                          <p className="text-slate-500 text-xs mb-1">{t('hrDashboard.leaves.reason')}</p>
                          <p className="text-slate-200 text-xs">{leave.reason}</p>
                        </div>
                      )}
                      {leave.managerNote && (
                        <div className="col-span-2">
                          <p className="text-orange-400 text-xs mb-1">{t('hrDashboard.leaves.managerNote')}</p>
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
                          placeholder={t('hrDashboard.leaves.notePlaceholder')}
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
                            {processingLeave === leave.requestId ? '...' : t('hrDashboard.leaves.approve')}
                          </button>
                          <button
                            onClick={() => handleProcessLeave(leave.requestId!, 'REJECTED')}
                            disabled={processingLeave === leave.requestId}
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1 disabled:opacity-50"
                          >
                            {t('hrDashboard.leaves.reject')}
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
                        {t('hrDashboard.leaves.reviewRequest')}
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
