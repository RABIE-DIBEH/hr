import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  UserCheck,
  AlertTriangle,
  CheckCircle2,
  Check,
  Search,
  RefreshCcw,
  Calendar,
} from 'lucide-react';
import PaginationControls from '../components/PaginationControls';
import CurrentDateTimePanel from '../components/CurrentDateTimePanel';
import {
  getManagerTodayAttendancePage,
  verifyAttendance,
  reportFraud,
} from '../services/api';
import { queryKeys } from '../services/queryKeys';
import { extractApiError } from '../utils/errorHandler';
import {
  getLegacyAttendanceStatusMeta,
  getPayrollStatusMeta,
  getReviewStatusMeta,
} from '../components/attendanceStatus';

const TeamAttendance = () => {
  const queryClient = useQueryClient();
  const [verifyingRecord, setVerifyingRecord] = useState<number | null>(null);
  const [page, setPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  const {
    data: attendanceData,
    isLoading: loading,
    error: queryError,
    refetch: refetchAttendance,
  } = useQuery({
    queryKey: queryKeys.manager.todayAttendance(page),
    queryFn: () => getManagerTodayAttendancePage({ page, size: 20 }),
  });

  const todayAttendance = attendanceData?.data?.items ?? [];
  const totalPages = attendanceData?.data?.totalPages ?? 0;
  const totalCount = attendanceData?.data?.totalCount ?? 0;
  const error = queryError ? extractApiError(queryError).message : null;

  const verifyMutation = useMutation({
    mutationFn: (recordId: number) => verifyAttendance(recordId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.manager.todayAttendanceRoot });
    },
  });

  const fraudMutation = useMutation({
    mutationFn: ({ recordId, note }: { recordId: number; note: string }) =>
      reportFraud(recordId, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.manager.todayAttendanceRoot });
    },
  });

  const handleVerifyAttendance = async (recordId: number) => {
    setVerifyingRecord(recordId);
    try {
      await verifyMutation.mutateAsync(recordId);
    } catch {
      alert('فشل تأكيد الحضور');
    } finally {
      setVerifyingRecord(null);
    }
  };

  const handleReportFraud = async (recordId: number) => {
    const note = prompt('يرجى إدخال تفاصيل التلاعب أو ملاحظتك:');
    if (!note) return;

    setVerifyingRecord(recordId);
    try {
      await fraudMutation.mutateAsync({ recordId, note });
    } catch {
      alert('فشل الإبلاغ عن تلاعب');
    } finally {
      setVerifyingRecord(null);
    }
  };

  const handleRefresh = useCallback(() => {
    refetchAttendance();
  }, [refetchAttendance]);

  const filteredAttendance = todayAttendance.filter(r => 
    r.employeeName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <header className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-3xl font-black text-white arabic-text flex items-center gap-3">
            <UserCheck className="text-orange-400" size={32} />
            المراجعة اليومية (دوام الفريق)
          </h1>
          <p className="text-slate-400 mt-1">
            تحقق من وجود موظفيك الفعلي في المكتب لليوم {new Date().toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={handleRefresh}
            className="p-3 bg-white/5 rounded-2xl text-slate-400 hover:bg-white/10 hover:text-white transition-all border border-white/5"
            title="تحديث البيانات"
          >
            <RefreshCcw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
          <CurrentDateTimePanel />
        </div>
      </header>

      <div className="bg-luxury-surface rounded-[2.5rem] shadow-sm border border-white/5 overflow-hidden mb-10">
        <div className="p-8 border-b border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-500/10 w-10 h-10 rounded-xl flex items-center justify-center text-blue-400">
              <Calendar size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">سجلات اليوم</h2>
              <p className="text-xs text-slate-500">{totalCount} موظف سجلوا دخولهم</p>
            </div>
          </div>
          
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input
              type="text"
              placeholder="بحث عن موظف..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 focus:border-orange-500/50 rounded-xl text-sm transition-all text-white outline-none"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-20 text-center text-slate-500 flex flex-col items-center">
            <RefreshCcw className="animate-spin mb-4" size={40} />
            <p className="text-lg font-medium">جاري جلب سجلات الفريق...</p>
          </div>
        ) : error ? (
          <div className="p-20 text-center text-red-400 bg-red-500/5 border-y border-red-500/10">
            <AlertTriangle className="mx-auto mb-4" size={40} />
            <p className="text-lg font-bold">{error}</p>
            <button onClick={handleRefresh} className="mt-4 px-6 py-2 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-all">إعادة المحاولة</button>
          </div>
        ) : filteredAttendance.length === 0 ? (
          <div className="p-20 text-center text-slate-500">
            <CheckCircle2 className="mx-auto mb-4 opacity-20" size={60} />
            <p className="text-xl font-medium">لا توجد سجلات مطابقة للبحث</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead className="bg-white/5 text-slate-400 text-[10px] font-black uppercase tracking-[0.15em]">
                <tr>
                  <th className="p-6">الموظف</th>
                  <th className="p-6">وقت الدخول</th>
                  <th className="p-6">وقت الخروج</th>
                  <th className="p-6">الحالة العامة</th>
                  <th className="p-6">المراجعة</th>
                  <th className="p-6">الرواتب</th>
                  <th className="p-6">الإجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredAttendance.map((record) => {
                  const summaryMeta = getLegacyAttendanceStatusMeta(record);
                  const reviewMeta = getReviewStatusMeta(record.reviewStatus);
                  const payrollMeta = getPayrollStatusMeta(record.payrollStatus);

                  return (
                    <tr key={record.recordId} className="hover:bg-white/5 transition-all group">
                      <td className="p-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center font-bold text-slate-400 text-xs">
                            {record.employeeName.charAt(0)}
                          </div>
                          <span className="font-bold text-slate-100">{record.employeeName}</span>
                        </div>
                      </td>
                      <td className="p-6 font-mono text-slate-400 text-sm">
                        {new Date(record.checkIn).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="p-6 font-mono text-slate-400 text-sm">
                        {record.checkOut ? new Date(record.checkOut).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : '—'}
                      </td>
                      <td className="p-6">
                        <span className={`inline-flex rounded-lg px-3 py-1 text-[10px] font-black ${summaryMeta.className}`}>
                          {summaryMeta.label}
                        </span>
                      </td>
                      <td className="p-6">
                        <span className={`inline-flex rounded-lg px-3 py-1 text-[10px] font-black ${reviewMeta.className}`}>
                          {reviewMeta.label}
                        </span>
                      </td>
                      <td className="p-6">
                        <span className={`inline-flex rounded-lg px-3 py-1 text-[10px] font-black ${payrollMeta.className}`}>
                          {payrollMeta.label}
                        </span>
                      </td>
                      <td className="p-6">
                        {(record.reviewStatus !== 'VERIFIED' && record.reviewStatus !== 'FRAUD') ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleVerifyAttendance(record.recordId)}
                              disabled={verifyingRecord === record.recordId}
                              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-[10px] font-black transition-all disabled:opacity-50 flex items-center gap-1.5 shadow-lg shadow-green-900/20"
                            >
                              <Check size={14} /> تأكيد
                            </button>
                            <button
                              onClick={() => handleReportFraud(record.recordId)}
                              disabled={verifyingRecord === record.recordId}
                              className="bg-red-600/10 hover:bg-red-600 text-red-400 hover:text-white px-4 py-2 rounded-xl text-[10px] font-black transition-all disabled:opacity-50 flex items-center gap-1.5 border border-red-500/20"
                            >
                              <AlertTriangle size={14} /> تلاعب
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-1">
                            <span className="text-xs text-slate-500 font-bold flex items-center gap-1">
                              <CheckCircle2 size={12} className="text-emerald-500" /> تم الاجراء
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
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        
        <div className="p-6 bg-white/[0.02] border-t border-white/5">
          <PaginationControls
            page={page}
            totalPages={totalPages}
            totalCount={totalCount}
            onPageChange={setPage}
          />
        </div>
      </div>
    </>
  );
};

export default TeamAttendance;
