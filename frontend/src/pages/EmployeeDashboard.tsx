import { useEffect, useEffectEvent, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Clock,
  Calendar,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  ArrowUpRight,
  Monitor,
  HandCoins,
  DollarSign,
  User,
  X,
  Save,
} from 'lucide-react';
import PaginationControls from '../components/PaginationControls';
import Sidebar from '../components/Sidebar';
import AdvanceRequestForm from '../components/AdvanceRequestForm';
import LeaveRequestForm from '../components/LeaveRequestForm';
import { getCurrentEmployee, updateProfileMe, getMyAdvanceRequests, getMyPayrollSlipsPage, type EmployeeProfile, type EmployeeProfileUpdatePayload, type AdvanceRequest, type PayrollSlip } from '../services/api';

const EmployeeDashboard = () => {
  const [status] = useState('Checked In');
  const [me, setMe] = useState<EmployeeProfile | null>(null);
  const [showAdvanceForm, setShowAdvanceForm] = useState(false);
  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [myAdvances, setMyAdvances] = useState<AdvanceRequest[]>([]);
  const [loadingAdvances, setLoadingAdvances] = useState(false);
  const [myPayrollSlips, setMyPayrollSlips] = useState<PayrollSlip[]>([]);
  const [loadingPayroll, setLoadingPayroll] = useState(false);
  const [payrollPage, setPayrollPage] = useState(0);
  const [payrollTotalPages, setPayrollTotalPages] = useState(0);
  const [payrollTotalCount, setPayrollTotalCount] = useState(0);

  // Profile edit state
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [profileForm, setProfileForm] = useState<EmployeeProfileUpdatePayload>({
    fullName: '',
    email: '',
    mobileNumber: '',
    address: '',
    nationalId: '',
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState(false);

  const loadEmployeeData = useEffectEvent(async () => {
    if (!me) {
      return;
    }

    setLoadingAdvances(true);
    setLoadingPayroll(true);

    const [advancesResult, payrollResult] = await Promise.allSettled([
      getMyAdvanceRequests(),
      getMyPayrollSlipsPage({ page: payrollPage, size: 6 }),
    ]);

    if (advancesResult.status === 'fulfilled') {
      setMyAdvances(advancesResult.value.data);
    }

    if (payrollResult.status === 'fulfilled') {
      setMyPayrollSlips(payrollResult.value.data.items);
      setPayrollTotalPages(payrollResult.value.data.totalPages);
      setPayrollTotalCount(payrollResult.value.data.totalCount);
    }

    setLoadingAdvances(false);
    setLoadingPayroll(false);
  });

  useEffect(() => {
    getCurrentEmployee()
      .then((res) => setMe(res.data))
      .catch(() => setMe(null));
  }, []);

  useEffect(() => {
    void loadEmployeeData();
  }, [me, showAdvanceForm, payrollPage]);

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

  const handleAdvanceSuccess = () => {
    setShowAdvanceForm(false);
  };

  const openProfileEdit = () => {
    if (!me) return;
    setProfileForm({
      fullName: me.fullName,
      email: me.email,
      mobileNumber: me.mobileNumber ?? '',
      address: me.address ?? '',
      nationalId: me.nationalId ?? '',
    });
    setProfileError(null);
    setProfileSuccess(false);
    setShowProfileEdit(true);
  };

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileForm(prev => ({ ...prev, [name]: value }));
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(false);
    setProfileSaving(true);

    try {
      await updateProfileMe(profileForm);
      setProfileSuccess(true);
      const refreshed = await getCurrentEmployee();
      setMe(refreshed.data);
      setTimeout(() => setShowProfileEdit(false), 1500);
    } catch (err: unknown) {
      let msg = 'فشل تحديث الملف الشخصي';
      if (typeof err === 'object' && err !== null && 'response' in err) {
        const axiosErr = err as { response?: { data?: { message?: string } } };
        if (axiosErr.response?.data?.message) {
          msg = axiosErr.response.data.message;
        }
      }
      setProfileError(msg);
    } finally {
      setProfileSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-black" dir="rtl">
      <Sidebar />
      
      <main className="mr-64 flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <header className="flex justify-between items-end mb-10">
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight arabic-text">
                مرحباً، {me?.fullName ?? '…'} 👋
              </h1>
              <p className="text-slate-400 mt-1">
                {[me?.teamName, me?.roleName].filter(Boolean).join(' | ') || 'عرض تقرير الدوام'}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={openProfileEdit}
                className="bg-luxury-surface border border-white/5 p-3 rounded-xl shadow-sm hover:bg-white/5 transition-all flex items-center gap-2 text-slate-300"
                title="تعديل الملف الشخصي"
              >
                <User size={18} />
                <span className="text-sm font-medium">تعديل الملف</span>
              </button>
              <button
                onClick={() => alert('التقويم قيد التطوير')}
                className="bg-luxury-surface border border-white/5 p-3 rounded-xl shadow-sm hover:bg-white/5 transition-all"
              >
                <Calendar size={20} className="text-slate-300" />
              </button>
              <button 
                onClick={() => alert('إحصائيات الشهر قيد التطوير')}
                className="bg-blue-600 text-white px-5 py-3 rounded-xl shadow-lg shadow-blue-900/20 font-semibold flex items-center gap-2 hover:bg-blue-700 transition-all cursor-pointer"
              >
                <TrendingUp size={18} />
                <span>إحصائيات الشهر</span>
              </button>
            </div>
          </header>

          <motion.div 
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            {/* Status Card */}
            <motion.div variants={item} className="lg:col-span-2 bg-luxury-surface rounded-[2rem] p-8 shadow-sm border border-white/5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-bl-[5rem] -mr-10 -mt-10 transition-all group-hover:scale-110 duration-500"></div>
              
              <div className="relative z-10">
                <div className="flex justify-between items-center mb-10">
                  <div className="bg-blue-600/10 p-3 rounded-2xl">
                    <Monitor className="text-blue-400" size={28} />
                  </div>
                  <span className={`px-4 py-1.5 rounded-full text-sm font-bold border ${
                    status === 'Checked In' 
                      ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                      : 'bg-white/5 text-slate-500 border-white/10'
                  }`}>
                    {status === 'Checked In' ? '• متواجد حالياً' : '• غير متواجد'}
                  </span>
                </div>

                <div className="flex flex-col md:flex-row md:items-end gap-10">
                  <div className="flex-1">
                    <h3 className="text-slate-500 text-sm font-semibold uppercase tracking-wider mb-2">ساعات دوام اليوم</h3>
                    <p className="text-5xl font-black text-white tabular-nums">08:15 <span className="text-slate-700 font-light">—</span> --:--</p>
                  </div>
                  <div className="flex-1 border-r border-white/5 pr-8">
                    <h3 className="text-slate-500 text-sm font-semibold mb-2">إجمالي الوقت الفعلي</h3>
                    <p className="text-3xl font-bold text-white">04 <span className="text-slate-400 text-xl font-medium">ساعة</span> 30 <span className="text-slate-400 text-xl font-medium">دقيقة</span></p>
                  </div>
                </div>

                <div className="mt-12 flex items-center gap-4">
                  <button 
                    onClick={() => alert("قريباً - قيد التطوير")}
                    className="bg-white text-black px-8 py-4 rounded-2xl font-bold hover:bg-slate-200 transition-all shadow-xl shadow-white/5"
                  >
                    عرض تفاصيل اليوم
                  </button>
                  <p className="text-sm text-slate-500 font-medium">تم التحديث منذ دقيقتين</p>
                </div>
              </div>
            </motion.div>

            {/* Quick Stats Column */}
            <div className="flex flex-col gap-6">
              <motion.div variants={item} className="bg-luxury-surface p-6 rounded-3xl shadow-sm border border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="bg-purple-500/10 p-3 rounded-2xl">
                    <Calendar className="text-purple-400" size={24} />
                  </div>
                  <div>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">ساعات الشهر</p>
                    <p className="text-xl font-bold text-white">172 / 180</p>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-full border-4 border-white/5 border-t-purple-500 flex items-center justify-center text-[10px] font-bold text-white">
                  95%
                </div>
              </motion.div>

              <motion.div variants={item} className="bg-luxury-surface p-6 rounded-3xl shadow-sm border border-white/5">
                <div className="flex items-center gap-4 mb-6">
                  <div className="bg-orange-500/10 p-3 rounded-2xl">
                    <AlertCircle className="text-orange-400" size={24} />
                  </div>
                  <div>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">ساعات التأخير</p>
                    <p className="text-xl font-bold text-orange-400">45 دقيقة</p>
                  </div>
                </div>
                <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                  <div className="bg-orange-500 h-full w-1/3"></div>
                </div>
              </motion.div>

              <motion.div variants={item} className="bg-blue-600 p-8 rounded-[2rem] shadow-xl shadow-blue-900/20 text-white flex flex-col justify-between aspect-square lg:aspect-auto h-48">
                <div className="flex justify-between items-start">
                  <p className="font-bold text-lg leading-tight">طلب إجازة<br/>سريع</p>
                  <ArrowUpRight size={24} />
                </div>
                <button 
                  onClick={() => setShowLeaveForm(true)}
                  className="bg-white/20 backdrop-blur-md hover:bg-white/30 transition-all py-3 rounded-xl font-bold text-sm"
                >
                  إنشاء طلب جديد
                </button>
              </motion.div>

              {/* Request Advance Card */}
              <motion.div variants={item} className="bg-gradient-to-br from-purple-600 to-purple-700 p-8 rounded-[2rem] shadow-xl shadow-purple-900/20 text-white flex flex-col justify-between aspect-square lg:aspect-auto h-48">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold text-lg leading-tight">طلب سلفة<br/>مالية</p>
                    <p className="text-purple-200 text-xs mt-1">خصم من الراتب الشهري</p>
                  </div>
                  <HandCoins size={24} className="text-purple-200" />
                </div>
                <button
                  onClick={() => setShowAdvanceForm(true)}
                  className="bg-white/20 backdrop-blur-md hover:bg-white/30 transition-all py-3 rounded-xl font-bold text-sm"
                >
                  تقديم الطلب
                </button>
              </motion.div>
            </div>
          </motion.div>

          {/* My Advances Section */}
          <motion.section
            initial={{ opacity: 1, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-12 bg-luxury-surface rounded-[2rem] p-8 shadow-sm border border-white/5"
          >
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-bold text-white tracking-tight">سلفي المالية</h2>
              <button
                onClick={() => setShowAdvanceForm(true)}
                className="text-purple-400 text-sm font-bold hover:underline"
              >
                طلب سلفة جديدة
              </button>
            </div>

            {loadingAdvances ? (
              <div className="p-8 text-center text-slate-500">
                <p>جاري تحميل السلف...</p>
              </div>
            ) : myAdvances.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <HandCoins size={40} className="mx-auto mb-3 opacity-40 text-slate-600" />
                <p className="font-medium">لا توجد سلف مالية حالياً</p>
                <p className="text-sm mt-1 text-slate-600">يمكنك طلب سلفة جديدة من الزر أعلاه</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse">
                  <thead className="bg-white/5 text-slate-400 text-[10px] font-black uppercase tracking-[0.15em]">
                    <tr>
                      <th className="p-4">المبلغ</th>
                      <th className="p-4">السبب</th>
                      <th className="p-4">الحالة</th>
                      <th className="p-4">تاريخ الطلب</th>
                      <th className="p-4">ملاحظات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {myAdvances.map((adv) => (
                      <tr key={adv.advanceId} className="hover:bg-white/5 transition-all">
                        <td className="p-4 font-bold text-purple-300">{adv.amount?.toLocaleString() || 0} ر.س</td>
                        <td className="p-4 text-slate-300 text-sm">{adv.reason || '—'}</td>
                        <td className="p-4">
                          <span
                            className={`px-3 py-1 rounded-lg text-xs font-bold ${
                              adv.status === 'Approved'
                                ? 'bg-green-500/10 text-green-400'
                                : adv.status === 'Rejected'
                                ? 'bg-red-500/10 text-red-400'
                                : adv.status === 'Delivered'
                                ? 'bg-blue-500/10 text-blue-400'
                                : 'bg-orange-500/10 text-orange-400'
                            }`}
                          >
                            {adv.status === 'Approved'
                              ? 'موافق'
                              : adv.status === 'Rejected'
                              ? 'مرفوض'
                              : adv.status === 'Delivered'
                              ? 'تم التسليم'
                              : 'معلق'}
                          </span>
                        </td>
                        <td className="p-4 text-slate-400 text-sm">
                          {adv.requestedAt
                            ? new Date(adv.requestedAt).toLocaleDateString('ar-SA')
                            : '—'}
                        </td>
                        <td className="p-4 text-slate-500 text-sm">{adv.hrNote || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <PaginationControls
              page={payrollPage}
              totalPages={payrollTotalPages}
              totalCount={payrollTotalCount}
              onPageChange={setPayrollPage}
            />
          </motion.section>

          {/* Payroll Slips Section */}
          <motion.section
            initial={{ opacity: 1, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="mt-12 bg-luxury-surface rounded-[2rem] p-8 shadow-sm border border-white/5"
          >
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-bold text-white tracking-tight">قسائم الراتب</h2>
            </div>

            {loadingPayroll ? (
              <div className="p-8 text-center text-slate-500">
                <p>جاري تحميل قسائم الراتب...</p>
              </div>
            ) : myPayrollSlips.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <DollarSign size={40} className="mx-auto mb-3 opacity-40 text-slate-600" />
                <p className="font-medium">لا توجد قسائم راتب حالياً</p>
                <p className="text-sm mt-1 text-slate-600">سيتم إنشاء قسيمة الراتب عند معالجة الرواتب من قبل HR</p>
              </div>
            ) : (
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
            )}
          </motion.section>

          {/* Activity Table Mockup */}
          <motion.section 
            initial={{ opacity: 1, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-12 bg-luxury-surface rounded-[2rem] p-8 shadow-sm border border-white/5"
          >
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-bold text-white tracking-tight">آخر عمليات الحضور</h2>
              <button 
                onClick={() => alert('عرض جميع السجلات قيد التطوير')}
                className="text-blue-400 text-sm font-bold hover:underline"
              >
                مشاهدة الكل
              </button>
            </div>
            
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-2xl hover:bg-white/5 transition-all border border-transparent hover:border-white/5 group">
                  <div className="flex items-center gap-4">
                    <div className="bg-white/5 p-3 rounded-xl group-hover:bg-white/10 transition-all">
                      <Clock className="text-slate-400" size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-100">يوم الثلاثاء، {20 - i} مايو</p>
                      <p className="text-xs text-slate-500 font-medium">دوام كامل (8 ساعات)</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-bold text-slate-200">08:00 — 16:30</p>
                    <p className="text-[10px] text-green-400 font-bold uppercase tracking-widest mt-1 flex items-center justify-end gap-1">
                      <CheckCircle size={10} /> Verified
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.section>
        </div>
      </main>

      {/* Profile Edit Modal */}
      {showProfileEdit && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          onClick={() => setShowProfileEdit(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            dir="rtl"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-2xl flex justify-between items-center">
              <div className="flex items-center gap-3">
                <User size={22} />
                <h2 className="text-xl font-bold">تعديل الملف الشخصي</h2>
              </div>
              <button
                onClick={() => setShowProfileEdit(false)}
                className="text-white hover:text-gray-200 text-2xl font-bold"
              >
                <X size={24} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleProfileSubmit} className="p-6 space-y-5">
              {profileError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm" role="alert">
                  {profileError}
                </div>
              )}
              {profileSuccess && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm" role="alert">
                  ✓ تم تحديث الملف الشخصي بنجاح
                </div>
              )}

              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  الاسم الكامل <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={profileForm.fullName}
                  onChange={handleProfileChange}
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  البريد الإلكتروني <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={profileForm.email}
                  onChange={handleProfileChange}
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Mobile Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  رقم الجوال
                </label>
                <input
                  type="text"
                  name="mobileNumber"
                  value={profileForm.mobileNumber ?? ''}
                  onChange={handleProfileChange}
                  placeholder="05XXXXXXXX"
                  maxLength={10}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* National ID */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  رقم الهوية
                </label>
                <input
                  type="text"
                  name="nationalId"
                  value={profileForm.nationalId ?? ''}
                  onChange={handleProfileChange}
                  placeholder="10 أرقام"
                  maxLength={10}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  العنوان
                </label>
                <input
                  type="text"
                  name="address"
                  value={profileForm.address ?? ''}
                  onChange={handleProfileChange}
                  placeholder="المدينة، الحي"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 justify-end pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowProfileEdit(false)}
                  className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={profileSaving}
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                  disabled={profileSaving}
                >
                  {profileSaving ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      جاري الحفظ...
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      حفظ التغييرات
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      )}

      {/* Advance Request Modal */}
      {showAdvanceForm && (
        <AdvanceRequestForm
          onClose={() => setShowAdvanceForm(false)}
          onSuccess={handleAdvanceSuccess}
        />
      )}

      {/* Leave Request Modal */}
      {showLeaveForm && (
        <LeaveRequestForm
          onClose={() => setShowLeaveForm(false)}
          onSuccess={() => setShowLeaveForm(false)}
        />
      )}
    </div>
  );
};

export default EmployeeDashboard;
