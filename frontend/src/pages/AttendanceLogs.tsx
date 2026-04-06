import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Clock, ChevronRight, RefreshCcw } from 'lucide-react';
import PaginationControls from '../components/PaginationControls';
import CurrentDateTimePanel from '../components/CurrentDateTimePanel';
import { getMyAttendancePage, type AttendanceRecord } from '../services/api';
import { queryKeys } from '../services/queryKeys';
import { extractApiError } from '../utils/errorHandler';
import {
  getLegacyAttendanceStatusMeta,
  getPayrollStatusMeta,
  getReviewStatusMeta,
} from '../components/attendanceStatus';

const AttendanceLogs = () => {
  const [page, setPage] = useState(0);
  const { data, isLoading: loading, error, refetch } = useQuery({
    queryKey: queryKeys.attendance.logs(page),
    queryFn: async () => (await getMyAttendancePage({ page, size: 20 })).data,
  });

  const logs: AttendanceRecord[] = data?.items ?? [];
  const totalPages = data?.totalPages ?? 0;
  const totalCount = data?.totalCount ?? 0;
  const errorMessage = error ? extractApiError(error).message : null;

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
  };
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <div className="w-full">
      <header className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-3xl font-black text-white arabic-text">سجل دوامي</h1>
          <p className="text-slate-400 mt-1">عرض تفاصيل الحضور والانصراف اليومية</p>
        </div>
        <CurrentDateTimePanel />
      </header>

      <div className="bg-luxury-surface rounded-[2rem] shadow-sm border border-white/5 overflow-hidden">
        <div className="divide-y divide-white/5">
          {loading ? (
            <div className="p-12 text-center text-slate-500 flex flex-col items-center">
              <RefreshCcw className="animate-spin mb-4" size={32} />
              <p>جاري تحميل السجل...</p>
            </div>
          ) : error ? (
            <div className="p-12 text-center">
              <p className="text-red-400 mb-4">{errorMessage}</p>
              <button 
                onClick={() => void refetch()}
                className="bg-white/5 hover:bg-white/10 text-white px-6 py-2 rounded-xl border border-white/10 transition-all font-bold"
              >
                إعادة المحاولة
              </button>
            </div>
          ) : logs.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <p>لا يوجد سجل دوام متاح بعد</p>
            </div>
          ) : (
            logs.map((log, idx) => {
              const summaryMeta = getLegacyAttendanceStatusMeta(log);
              const reviewMeta = getReviewStatusMeta(log.reviewStatus);
              const payrollMeta = getPayrollStatusMeta(log.payrollStatus);

              return (
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

                  <div className="flex items-center gap-8">
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
                    <div className="flex items-center gap-3">
                      <span className={`rounded-lg px-3 py-1 text-[10px] font-black ${summaryMeta.className}`}>
                        {summaryMeta.label}
                      </span>
                      <span className={`rounded-lg px-3 py-1 text-[10px] font-black ${reviewMeta.className}`}>
                        {reviewMeta.label}
                      </span>
                      <span className={`rounded-lg px-3 py-1 text-[10px] font-black ${payrollMeta.className}`}>
                        {payrollMeta.label}
                      </span>
                      <ChevronRight className="text-slate-600 group-hover:text-slate-300 transition-all" size={20} />
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
        <PaginationControls
          page={page}
          totalPages={totalPages}
          totalCount={totalCount}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
};

export default AttendanceLogs;
