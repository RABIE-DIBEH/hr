import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Clock,
  Calendar,
  CheckCircle,
  TrendingUp,
  ArrowUpRight,
  Monitor,
  HandCoins,
  DollarSign,
  User,
  X,
  ChevronRight,
} from 'lucide-react';
import PaginationControls from '../components/PaginationControls';
import CurrentDateTimePanel from '../components/CurrentDateTimePanel';
import AdvanceRequestForm from '../components/AdvanceRequestForm';
import LeaveRequestForm from '../components/LeaveRequestForm';
import ProfileEditModal from '../components/ProfileEditModal';
import { 
  getCurrentEmployee, 
  getMyAdvanceRequests, 
  getMyPayrollSlipsPage, 
  getMyAttendancePage, 
  getMyLeaveRequests
} from '../services/api';

const EmployeeDashboard = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showAdvanceForm, setShowAdvanceForm] = useState(false);
  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [showDayDetails, setShowDayDetails] = useState(false);
  const [payrollPage, setPayrollPage] = useState(0);

  // Queries
  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: async () => (await getCurrentEmployee()).data,
  });

  const { data: myAdvances = [], isLoading: loadingAdvances } = useQuery({
    queryKey: ['myAdvances'],
    queryFn: async () => (await getMyAdvanceRequests()).data,
    enabled: !!me,
  });

  const { data: myLeaves = [], isLoading: loadingLeaves } = useQuery({
    queryKey: ['myLeaves'],
    queryFn: async () => (await getMyLeaveRequests()).data,
    enabled: !!me,
  });

  const { data: payrollData, isLoading: loadingPayroll } = useQuery({
    queryKey: ['myPayroll', payrollPage],
    queryFn: async () => (await getMyPayrollSlipsPage({ page: payrollPage, size: 6 })).data,
    enabled: !!me,
  });

  const { data: attendanceData, isLoading: loadingAttendance } = useQuery({
    queryKey: ['myAttendanceLatest'],
    queryFn: async () => (await getMyAttendancePage({ page: 0, size: 3 })).data,
    enabled: !!me,
  });

  const { data: todayAttendance, isLoading: loadingDayDetails } = useQuery({
    queryKey: ['myAttendanceToday'],
    queryFn: async () => (await getMyAttendancePage({ page: 0, size: 1 })).data,
    enabled: showDayDetails,
  });

  const myPayrollSlips = payrollData?.items || [];
  const payrollTotalPages = payrollData?.totalPages || 0;
  const payrollTotalCount = payrollData?.totalCount || 0;
  const latestAttendance = attendanceData?.items || [];
  const todayRecord = todayAttendance?.items?.[0] || null;

  const handleAdvanceSuccess = () => {
    setShowAdvanceForm(false);
    queryClient.invalidateQueries({ queryKey: ['myAdvances'] });
  };

  const handleLeaveSuccess = () => {
    setShowLeaveForm(false);
    queryClient.invalidateQueries({ queryKey: ['myLeaves'] });
  };

  const handleProfileUpdate = () => {
    setShowProfileEdit(false);
    queryClient.invalidateQueries({ queryKey: ['me'] });
  };

  const container = {
    hidden: { opacity: 1 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { y: 20, opacity: 1 },
    show: { y: 0, opacity: 1 }
  };

  return (
    <>
      {/* Header */}
      <header className="flex justify-between items-end mb-10">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-2xl bg-luxury-surface border border-white/5 overflow-hidden flex items-center justify-center text-3xl font-bold text-white shadow-2xl">
            {me?.avatarUrl ? (
              <img src={me.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              me?.fullName?.charAt(0) || '?'
            )}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight arabic-text">
              مرحباً، {me?.fullName ?? '…'} 👋
            </h1>
            <p className="text-slate-400 mt-1">
              {[me?.teamName, me?.roleName].filter(Boolean).join(' | ') || 'عرض تقرير الدوام'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <CurrentDateTimePanel />
          <button
            onClick={() => setShowProfileEdit(true)}
            className="bg-luxury-surface border border-white/5 p-3 rounded-xl shadow-sm hover:bg-white/5 transition-all flex items-center gap-2 text-slate-300"
            title="تعديل الملف الشخصي"
          >
            <User size={18} />
          </button>
        </div>
      </header>

      {/* Hero Stats */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12"
      >
        <motion.div variants={item} className="bg-luxury-surface p-6 rounded-[2rem] border border-white/5 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-3xl -mr-8 -mt-8" />
          <div className="relative z-10">
            <div className="w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center mb-4 text-blue-400 group-hover:scale-110 transition-transform">
              <Clock size={24} />
            </div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">ساعات الشهر</p>
            <h3 className="text-2xl font-black text-white">160 ساعة</h3>
            <div className="mt-3 flex items-center gap-1.5 text-[10px] font-bold text-blue-400 bg-blue-500/10 w-fit px-2.5 py-1 rounded-full uppercase">
              <TrendingUp size={10} /> +12% vs last month
            </div>
          </div>
        </motion.div>

        <motion.div variants={item} className="bg-luxury-surface p-6 rounded-[2rem] border border-white/5 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-3xl -mr-8 -mt-8" />
          <div className="relative z-10">
            <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center mb-4 text-emerald-400 group-hover:scale-110 transition-transform">
              <CheckCircle size={24} />
            </div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">الحضور اليومي</p>
            <h3 className="text-2xl font-black text-white">منتظم</h3>
            <div className="mt-3 flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 w-fit px-2.5 py-1 rounded-full uppercase tracking-tighter">
              98% Reliability Score
            </div>
          </div>
        </motion.div>

        <motion.div variants={item} className="bg-luxury-surface p-6 rounded-[2rem] border border-white/5 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-3xl -mr-8 -mt-8" />
          <div className="relative z-10">
            <div className="w-12 h-12 bg-purple-500/20 rounded-2xl flex items-center justify-center mb-4 text-purple-400 group-hover:scale-110 transition-transform">
              <DollarSign size={24} />
            </div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">الراتب المتوقع</p>
            <h3 className="text-2xl font-black text-white">{me?.baseSalary?.toLocaleString() ?? 0} ر.س</h3>
            <div className="mt-3 flex items-center gap-1.5 text-[10px] font-bold text-purple-400 bg-purple-500/10 w-fit px-2.5 py-1 rounded-full uppercase">
              Current Cycle
            </div>
          </div>
        </motion.div>

        <motion.div variants={item} className="bg-luxury-surface p-6 rounded-[2rem] border border-white/5 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/10 rounded-full blur-3xl -mr-8 -mt-8" />
          <div className="relative z-10">
            <div className="w-12 h-12 bg-orange-500/20 rounded-2xl flex items-center justify-center mb-4 text-orange-400 group-hover:scale-110 transition-transform">
              <ArrowUpRight size={24} />
            </div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">رصيد الإجازات</p>
            <h3 className="text-2xl font-black text-white">14 يوم</h3>
            <div className="mt-3 flex items-center gap-1.5 text-[10px] font-bold text-orange-400 bg-orange-500/10 w-fit px-2.5 py-1 rounded-full uppercase">
              Valid until Dec 2026
            </div>
          </div>
        </motion.div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Quick Actions & Requests */}
        <div className="lg:col-span-1 space-y-10">
          <section className="bg-luxury-surface rounded-[2.5rem] p-8 shadow-sm border border-white/5">
            <h2 className="text-xl font-bold text-white mb-6 tracking-tight arabic-text">إجراءات سريعة</h2>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setShowLeaveForm(true)}
                className="bg-white/5 hover:bg-white/10 p-5 rounded-3xl flex flex-col items-center gap-3 transition-all border border-white/5 active:scale-95 group"
              >
                <div className="bg-purple-600/20 p-3 rounded-2xl text-purple-400 group-hover:scale-110 transition-all">
                  <Calendar size={24} />
                </div>
                <span className="text-sm font-bold text-slate-100">طلب إجازة</span>
              </button>
              <button
                onClick={() => setShowAdvanceForm(true)}
                className="bg-white/5 hover:bg-white/10 p-5 rounded-3xl flex flex-col items-center gap-3 transition-all border border-white/5 active:scale-95 group"
              >
                <div className="bg-emerald-600/20 p-3 rounded-2xl text-emerald-400 group-hover:scale-110 transition-all">
                  <HandCoins size={24} />
                </div>
                <span className="text-sm font-bold text-slate-100">طلب سلفة</span>
              </button>
              <button
                onClick={() => navigate('/clock')}
                className="bg-white/5 hover:bg-white/10 p-5 rounded-3xl flex flex-col items-center gap-3 transition-all border border-white/5 active:scale-95 group"
              >
                <div className="bg-blue-600/20 p-3 rounded-2xl text-blue-400 group-hover:scale-110 transition-all">
                  <Monitor size={24} />
                </div>
                <span className="text-sm font-bold text-slate-100">تسجيل الدوام</span>
              </button>
              <button
                onClick={() => navigate('/goals')}
                className="bg-white/5 hover:bg-white/10 p-5 rounded-3xl flex flex-col items-center gap-3 transition-all border border-white/5 active:scale-95 group"
              >
                <div className="bg-orange-600/20 p-3 rounded-2xl text-orange-400 group-hover:scale-110 transition-all">
                  <TrendingUp size={24} />
                </div>
                <span className="text-sm font-bold text-slate-100">أهدافي</span>
              </button>
            </div>
          </section>

          {/* Pending Advance Requests */}
          <section className="bg-luxury-surface rounded-[2.5rem] p-8 shadow-sm border border-white/5 overflow-hidden">
            <h2 className="text-xl font-bold text-white mb-6 tracking-tight arabic-text">طلبات السلف الحالية</h2>
            {loadingAdvances ? (
              <div className="text-center py-6 text-slate-500">جاري التحميل...</div>
            ) : myAdvances.length === 0 ? (
              <div className="text-center py-10 opacity-40">
                <HandCoins size={40} className="mx-auto mb-3" />
                <p className="text-sm font-medium">لا توجد طلبات سلف معلقة</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {myAdvances.map((adv) => (
                  <div key={adv.advanceId} className="bg-white/5 p-5 rounded-[2rem] border border-white/5">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-purple-400 font-black text-lg">{adv.amount} ر.س</span>
                      <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                        adv.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-400' : 
                        adv.status === 'Rejected' ? 'bg-red-500/10 text-red-400' : 
                        'bg-orange-500/10 text-orange-400'
                      }`}>
                        {adv.status === 'Approved' ? 'مقبول' : adv.status === 'Rejected' ? 'مرفوض' : 'معلق'}
                      </span>
                    </div>
                    <p className="text-slate-400 text-[10px] font-medium leading-relaxed italic">{adv.reason || 'لا يوجد سبب مكتوب'}</p>
                    <div className="mt-3 flex items-center gap-2 text-[10px] text-slate-600 font-bold uppercase">
                      <Clock size={12} /> {adv.requestedAt ? new Date(adv.requestedAt).toLocaleDateString('ar-SA') : '—'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Pending Leave Requests */}
          <section className="bg-luxury-surface rounded-[2.5rem] p-8 shadow-sm border border-white/5 overflow-hidden">
            <h2 className="text-xl font-bold text-white mb-6 tracking-tight arabic-text">طلبات الإجازة</h2>
            {loadingLeaves ? (
              <div className="text-center py-6 text-slate-500">جاري التحميل...</div>
            ) : myLeaves.length === 0 ? (
              <div className="text-center py-10 opacity-40">
                <Calendar size={40} className="mx-auto mb-3" />
                <p className="text-sm font-medium">لا توجد طلبات إجازة حالية</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {myLeaves.map((leave) => (
                  <div key={leave.requestId} className="bg-white/5 p-5 rounded-[2rem] border border-white/5">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-blue-400 font-bold text-sm">{leave.leaveType === 'Hourly' ? 'إجازة ساعية' : 'إجازة أيام'}</span>
                      <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                        leave.status === 'APPROVED' ? 'bg-green-500/10 text-green-400' : 
                        leave.status === 'REJECTED' ? 'bg-red-500/10 text-red-400' : 
                        leave.status === 'PENDING_HR' ? 'bg-purple-500/10 text-purple-400' :
                        'bg-orange-500/10 text-orange-400'
                      }`}>
                        {leave.status === 'APPROVED' ? 'مقبول' : 
                         leave.status === 'REJECTED' ? 'مرفوض' : 
                         leave.status === 'PENDING_HR' ? 'بانتظار HR' :
                         'بانتظار المدير'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-300 font-bold">
                      <span>{new Date(leave.startDate).toLocaleDateString('ar-SA')}</span>
                      <ChevronRight size={12} className="opacity-20" />
                      <span>{leave.duration} {leave.leaveType === 'Hourly' ? 'ساعة' : 'يوم'}</span>
                    </div>
                    {leave.reason && <p className="text-slate-500 text-[10px] mt-2 italic truncate">{leave.reason}</p>}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Payroll History */}
        <section className="lg:col-span-2 bg-luxury-surface rounded-[2.5rem] p-10 shadow-sm border border-white/5 overflow-hidden flex flex-col">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight arabic-text">سجل الرواتب (Pay Slips)</h2>
              <p className="text-slate-400 text-sm mt-1">تاريخ صرف المستحقات والخصومات</p>
            </div>
            <div className="p-3 bg-white/5 rounded-2xl">
              <DollarSign className="text-purple-500" size={24} />
            </div>
          </div>

          {loadingPayroll ? (
            <div className="text-center py-20 text-slate-500 flex flex-col items-center gap-4">
              <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
              جاري جلب سجلات الرواتب...
            </div>
          ) : myPayrollSlips.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-20 text-slate-500">
              <DollarSign size={40} className="mx-auto mb-3 opacity-40 text-slate-600" />
              <p className="font-medium">لا توجد قسائم راتب حالياً</p>
              <p className="text-sm mt-1 text-slate-600">سيتم إنشاء قسيمة الراتب عند معالجة الرواتب من قبل HR</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse">
                  <thead className="bg-white/5 text-slate-400 text-[10px] font-black uppercase tracking-[0.15em]">
                    <tr>
                      <th className="p-4">الشهر / السنة</th>
                      <th className="p-4">ساعات العمل</th>
                      <th className="p-4">ساعات إضافية</th>
                      <th className="p-4">الخصومات</th>
                      <th className="p-4">صافي الراتب</th>
                      <th className="p-4">تاريخ الإصدار</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {myPayrollSlips.map((slip) => (
                      <tr key={slip.payrollId} className="hover:bg-white/5 transition-all">
                        <td className="p-4 font-bold text-slate-100">
                          {new Date(slip.year, slip.month - 1).toLocaleDateString('ar-SA', { month: 'long', year: 'numeric' })}
                        </td>
                        <td className="p-4 text-slate-300 text-sm">{slip.totalWorkHours ?? 0} ساعة</td>
                        <td className="p-4 text-slate-300 text-sm">{slip.overtimeHours ?? 0} ساعة</td>
                        <td className="p-4 text-red-400 text-sm">{slip.deductions ?? 0} ر.س</td>
                        <td className="p-4 font-bold text-green-400">{slip.netSalary?.toLocaleString() ?? 0} ر.س</td>
                        <td className="p-4 text-slate-500 text-sm">
                          {slip.generatedAt
                            ? new Date(slip.generatedAt).toLocaleDateString('ar-SA')
                            : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <PaginationControls
                page={payrollPage}
                totalPages={payrollTotalPages}
                totalCount={payrollTotalCount}
                onPageChange={setPayrollPage}
                className="mt-auto pt-6"
              />
            </>
          )}
        </section>
      </div>

      {/* Activity Table */}
      <motion.section
        initial={{ opacity: 1, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-12 bg-luxury-surface rounded-[2rem] p-8 shadow-sm border border-white/5"
      >
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-xl font-bold text-white tracking-tight">آخر عمليات الحضور</h2>
          <button
            onClick={() => navigate('/attendance')}
            className="text-blue-400 text-sm font-bold hover:underline"
          >
            مشاهدة الكل
          </button>
        </div>

        <div className="space-y-4">
          {loadingAttendance ? (
            <div className="text-center py-8 text-slate-500">جاري التحميل...</div>
          ) : latestAttendance.length === 0 ? (
            <div className="text-center py-8 text-slate-500">لا يوجد سجلات حضور حتى الآن</div>
          ) : (
            latestAttendance.map((log) => (
              <div key={log.recordId} className="flex items-center justify-between p-4 rounded-2xl hover:bg-white/5 transition-all border border-transparent hover:border-white/5 group">
                <div className="flex items-center gap-4">
                  <div className="bg-white/5 p-3 rounded-xl group-hover:bg-white/10 transition-all">
                    <Clock className="text-slate-400" size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-slate-100">
                      {new Date(log.checkIn).toLocaleDateString('ar-SA', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </p>
                    <p className="text-xs text-slate-500 font-medium">
                      {log.workHours ? `دوام (${log.workHours} ساعة)` : 'جاري العمل...'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-mono font-bold text-slate-200">
                    {new Date(log.checkIn).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })} — {log.checkOut ? new Date(log.checkOut).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }) : '...'}
                  </p>
                  <p className="text-[10px] text-green-400 font-bold uppercase tracking-widest mt-1 flex items-center justify-end gap-1">
                    <CheckCircle size={10} /> Verified
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </motion.section>

      {/* Modals */}
      <AnimatePresence>
        {showProfileEdit && me && (
          <ProfileEditModal
            me={me}
            onClose={() => setShowProfileEdit(false)}
            onSuccess={handleProfileUpdate}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAdvanceForm && (
          <AdvanceRequestForm
            onClose={() => setShowAdvanceForm(false)}
            onSuccess={handleAdvanceSuccess}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showLeaveForm && (
          <LeaveRequestForm
            onClose={() => setShowLeaveForm(false)}
            onSuccess={handleLeaveSuccess}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDayDetails && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
            onClick={() => setShowDayDetails(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-[#1a1520] border border-white/10 rounded-2xl w-full max-w-md p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Clock size={20} className="text-luxury-primary" />
                  تفاصيل دوام اليوم
                </h2>
                <button onClick={() => setShowDayDetails(false)} className="text-slate-400 hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>

              {loadingDayDetails ? (
                <div className="text-center py-8 text-slate-400">جاري التحميل...</div>
              ) : !todayRecord ? (
                <div className="text-center py-8 text-slate-400">لا توجد بيانات دوام لهذا اليوم</div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">تسجيل الدخول</p>
                    <p className="text-2xl font-bold text-white">
                      {new Date(todayRecord.checkIn).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">تسجيل الخروج</p>
                    <p className="text-2xl font-bold text-white">
                      {todayRecord.checkOut
                        ? new Date(todayRecord.checkOut).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })
                        : 'لم يتم بعد'}
                    </p>
                  </div>
                  {todayRecord.workHours != null && (
                    <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                      <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">إجمالي ساعات العمل</p>
                      <p className="text-2xl font-bold text-luxury-primary">
                        {Math.floor(todayRecord.workHours)} ساعة {Math.round((todayRecord.workHours % 1) * 60)} دقيقة
                      </p>
                    </div>
                  )}
                  <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">الحالة</p>
                    <span className={`inline-block px-3 py-1 rounded-lg text-sm font-bold ${
                      todayRecord.status === 'Present'
                        ? 'bg-green-500/10 text-green-400'
                        : todayRecord.status === 'Absent'
                        ? 'bg-red-500/10 text-red-400'
                        : 'bg-yellow-500/10 text-yellow-400'
                    }`}>
                      {todayRecord.status === 'Present' ? 'حاضر' : todayRecord.status === 'Absent' ? 'غائب' : todayRecord.status}
                    </span>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default EmployeeDashboard;
