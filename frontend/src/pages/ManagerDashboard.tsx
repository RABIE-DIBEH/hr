import { useEffect, useState } from 'react';
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
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import {
  getCurrentEmployee,
  listMyTeam,
  getPendingRecruitmentRequests,
  processRecruitmentRequest,
  getPendingLeavesForManager,
  processLeaveRequest,
  getManagerTodayAttendance,
  verifyAttendance,
  reportFraud,
  type EmployeeProfile,
  type EmployeeSummary,
  type RecruitmentRequest,
  type LeaveRequest,
  type AttendanceRecord,
} from '../services/api';

const ManagerDashboard = () => {
  const [me, setMe] = useState<EmployeeProfile | null>(null);
  const [team, setTeam] = useState<EmployeeSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pendingRequests, setPendingRequests] = useState<RecruitmentRequest[]>([]);
  const [processingRequest, setProcessingRequest] = useState<number | null>(null);
  const [processNote, setProcessNote] = useState<string>('');
  const [adjustedSalary, setAdjustedSalary] = useState<string>('');
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null);

  // Leaves & Attendance State
  const [pendingLeaves, setPendingLeaves] = useState<LeaveRequest[]>([]);
  const [processingLeave, setProcessingLeave] = useState<number | null>(null);
  
  const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord[]>([]);
  const [verifyingRecord, setVerifyingRecord] = useState<number | null>(null);
  const [leaveNote, setLeaveNote] = useState<string>('');
  const [selectedLeaveId, setSelectedLeaveId] = useState<number | null>(null);

  useEffect(() => {
    getCurrentEmployee()
      .then((res) => setMe(res.data))
      .catch(() => setMe(null));
  }, []);

  useEffect(() => {
    if (me?.roleName === 'MANAGER' || me?.roleName === 'HR' || me?.roleName === 'ADMIN') {
      getPendingRecruitmentRequests()
        .then((res) => setPendingRequests(res.data))
        .catch(() => setError('تعذر تحميل طلبات التوظيف المعلقة'));

      getManagerTodayAttendance()
        .then((res) => setTodayAttendance(res.data))
        .catch(() => console.error('Failed to load attendance for today'));
    }
  }, [me?.roleName]);

  useEffect(() => {
    if (me?.roleName !== 'MANAGER') {
      setTeam([]);
      return;
    }
    listMyTeam()
      .then((res) => {
        setTeam(res.data);
        setError(null);
      })
      .catch(() => setError('تعذر تحميل فريقك. تحقق من أن حسابك بصلاحية مدير.'));

    // Fetch leaves
    if (me?.employeeId) {
      getPendingLeavesForManager(me.employeeId)
        .then((res) => setPendingLeaves(res.data))
        .catch(() => console.error('Failed to load leaves'));
    }
  }, [me?.roleName, me?.employeeId]);

  const stats = [
    {
      label: 'إجمالي الفريق',
      value: String(team.length),
      icon: Users,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
    },
    {
      label: 'بطاقة NFC مفعّلة',
      value: String(team.filter((m) => m.nfcLinked).length),
      icon: UserCheck,
      color: 'text-green-400',
      bg: 'bg-green-500/10',
    },
    {
      label: 'بدون بطاقة',
      value: String(team.filter((m) => !m.nfcLinked).length),
      icon: AlertTriangle,
      color: 'text-orange-400',
      bg: 'bg-orange-500/10',
    },
  ];

  const headerTeam = me?.teamName ?? 'فريقك';

  const handleProcessRequest = async (requestId: number, status: 'Approved' | 'Rejected') => {
    setProcessingRequest(requestId);
    try {
      const salaryNum = adjustedSalary ? parseFloat(adjustedSalary) : undefined;
      await processRecruitmentRequest(requestId, status, processNote || undefined, salaryNum);
      setPendingRequests((prev) => prev.filter((r) => r.requestId !== requestId));
      setProcessNote('');
      setAdjustedSalary('');
      setSelectedRequestId(null);
    } catch {
      setError('فشل معالجة الطلب');
    } finally {
      setProcessingRequest(null);
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
      setError('فشل معالجة طلب الإجازة');
    } finally {
      setProcessingLeave(null);
    }
  };

  const handleVerifyAttendance = async (recordId: number) => {
    setVerifyingRecord(recordId);
    try {
      await verifyAttendance(recordId);
      setTodayAttendance(prev => 
        prev.map(r => r.recordId === recordId ? { ...r, status: 'Verified', isVerifiedByManager: true } : r)
      );
    } catch {
      alert("فشل تأكيد الدوام");
    } finally {
      setVerifyingRecord(null);
    }
  };

  const handleReportFraud = async (recordId: number) => {
    const note = prompt('يرجى إدخال تفاصيل التلاعب أو ملاحظتك:');
    if (!note) return;
    
    setVerifyingRecord(recordId);
    try {
      await reportFraud(recordId, note);
      setTodayAttendance(prev => 
        prev.map(r => r.recordId === recordId ? { ...r, status: 'Fraud', isVerifiedByManager: true, managerNotes: note } : r)
      );
    } catch {
      alert("فشل الإبلاغ عن تلاعب");
    } finally {
      setVerifyingRecord(null);
    }
  };

  return (
    <div className="flex min-h-screen bg-black" dir="rtl">
      <Sidebar />

      <main className="mr-64 flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <header className="flex justify-between items-center mb-10">
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight arabic-text">إدارة الفريق</h1>
              <p className="text-slate-400 mt-1">
                {headerTeam} • بيانات مباشرة من الخادم
              </p>
            </div>
            <button
              type="button"
              className="flex items-center gap-2 bg-luxury-surface border border-white/5 px-4 py-2.5 rounded-xl shadow-sm font-semibold text-slate-200 hover:bg-white/5 transition-all"
            >
              <FileText size={18} />
              <span>تصدير تقرير Excel</span>
            </button>
          </header>

          {me?.roleName !== 'MANAGER' && (
            <div className="mb-6 p-4 rounded-xl bg-amber-500/10 text-amber-200 text-sm">
              عرض القائمة مخصص لحسابات <strong>MANAGER</strong>. حسابك الحالي: {me?.roleName ?? '—'}.
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 text-red-200 text-sm font-medium">{error}</div>
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
                <div className={`${stat.bg} ${stat.color} w-12 h-12 rounded-2xl flex items-center justify-center mb-4`}>
                  <stat.icon size={24} />
                </div>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">{stat.label}</p>
                <p className="text-3xl font-black text-white">{stat.value}</p>
              </motion.div>
            ))}
          </div>

          {/* Pending Recruitment Requests Section */}
          {(me?.roleName === 'MANAGER' || me?.roleName === 'HR' || me?.roleName === 'ADMIN') && (
            <div className="bg-luxury-surface rounded-[2.5rem] shadow-sm border border-white/5 overflow-hidden mb-10">
              <div className="p-8 border-b border-white/5 flex items-center gap-3">
                <div className="bg-orange-500/10 w-12 h-12 rounded-2xl flex items-center justify-center text-orange-400">
                  <ClipboardList size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">طلبات التوظيف المعلقة</h2>
                  <p className="text-slate-400 text-sm">
                    {pendingRequests.length} طلب في انتظار المراجعة
                  </p>
                </div>
              </div>

              {pendingRequests.length === 0 ? (
                <div className="p-12 text-center text-slate-500">
                  <ClipboardList size={48} className="mx-auto mb-4 opacity-50" />
                  <p>لا توجد طلبات توظيف معلقة</p>
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
                              قيد المراجعة
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

                        <div className="flex flex-col gap-2 min-w-[200px]">
                          {selectedRequestId === request.requestId ? (
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
                                  موافقة
                                </button>
                                <button
                                  onClick={() => handleProcessRequest(request.requestId!, 'Rejected')}
                                  disabled={processingRequest === request.requestId}
                                  className="flex-1 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1 disabled:opacity-50"
                                >
                                  <X size={14} />
                                  رفض
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
                              مراجعة الطلب
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
                  <h2 className="text-xl font-bold text-white">المراجعة اليومية (دوام الفريق اليوم)</h2>
                  <p className="text-slate-400 text-sm">
                    تحقق جسدياً من وجود موظفيك الذين سجلوا دخولهم عبر الـ NFC
                  </p>
                </div>
              </div>
            </div>

            {todayAttendance.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <CheckCircle2 size={48} className="mx-auto mb-4 opacity-50" />
                <p>لا توجد سجلات دوام ناشطة للفريق اليوم حتى الآن</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse">
                  <thead className="bg-white/5 text-slate-400 text-[10px] font-black uppercase tracking-[0.15em]">
                    <tr>
                      <th className="p-6">الموظف</th>
                      <th className="p-6">وقت الدخول</th>
                      <th className="p-6">وقت الخروج</th>
                      <th className="p-6">حالة التأكيد</th>
                      <th className="p-6">إجراءات المراجعة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {todayAttendance.map((record) => (
                      <tr key={record.recordId} className="hover:bg-white/5 transition-all">
                        <td className="p-6 font-bold text-slate-100">{record.employee.fullName}</td>
                        <td className="p-6 font-mono text-slate-400 text-sm">{new Date(record.checkIn).toLocaleTimeString('ar-EG', {hour: '2-digit', minute: '2-digit'})}</td>
                        <td className="p-6 font-mono text-slate-400 text-sm">{record.checkOut ? new Date(record.checkOut).toLocaleTimeString('ar-EG', {hour: '2-digit', minute: '2-digit'}) : '—'}</td>
                        <td className="p-6">
                          {record.isVerifiedByManager ? (
                            <span className={`px-3 py-1 rounded-lg text-xs font-bold ${
                              record.status === 'Fraud' ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'
                            }`}>
                              {record.status === 'Fraud' ? 'مبلغ كتلاعب' : 'تم التأكيد'}
                            </span>
                          ) : (
                            <span className="bg-orange-500/10 text-orange-400 px-3 py-1 rounded-lg text-xs font-bold">
                              بانتظار مراجعتك
                            </span>
                          )}
                        </td>
                        <td className="p-6">
                          {!record.isVerifiedByManager && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleVerifyAttendance(record.recordId)}
                                disabled={verifyingRecord === record.recordId}
                                className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                              >
                                تأكيد التواجد
                              </button>
                              <button
                                onClick={() => handleReportFraud(record.recordId)}
                                disabled={verifyingRecord === record.recordId}
                                className="bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white px-3 py-2 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                              >
                                تلاعب (لم يحضر)
                              </button>
                            </div>
                          )}
                          {record.managerNotes && (
                            <p className="text-xs text-slate-500 mt-2">ملاحظتك: {record.managerNotes}</p>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Pending Leave Requests Section */}
          {(me?.roleName === 'MANAGER' || me?.roleName === 'SUPER_ADMIN') && (
            <div className="bg-luxury-surface rounded-[2.5rem] shadow-sm border border-white/5 overflow-hidden mb-10">
              <div className="p-8 border-b border-white/5 flex items-center gap-3">
                <div className="bg-blue-500/10 w-12 h-12 rounded-2xl flex items-center justify-center text-blue-400">
                  <FileText size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">طلبات الإجازة للفريق</h2>
                  <p className="text-slate-400 text-sm">
                    {pendingLeaves.length} طلب بانتظار موافقتك
                  </p>
                </div>
              </div>

              {pendingLeaves.length === 0 ? (
                <div className="p-12 text-center text-slate-500">
                  <FileText size={48} className="mx-auto mb-4 opacity-50" />
                  <p>لا توجد طلبات إجازة معلقة للفريق</p>
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
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 min-w-[200px]">
                          {selectedLeaveId === leave.requestId ? (
                            <div className="space-y-2">
                              <input
                                type="text"
                                placeholder="ملاحظة للموظف/لـHR (اختياري)"
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
                                  <Check size={14} /> موافقة
                                </button>
                                <button
                                  onClick={() => handleProcessLeave(leave.requestId!, 'REJECTED')}
                                  disabled={processingLeave === leave.requestId}
                                  className="flex-1 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1 disabled:opacity-50"
                                >
                                  <X size={14} /> رفض
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
                              مراجعة الطلب
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="bg-luxury-surface rounded-[2.5rem] shadow-sm border border-white/5 overflow-hidden">
            <div className="p-8 border-b border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <h2 className="text-xl font-bold text-white">المرؤوسون المباشرون</h2>
              <div className="flex gap-3 w-full md:w-auto">
                <div className="relative flex-1 md:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text"
                    placeholder="بحث عن موظف..."
                    className="w-full pl-10 pr-4 py-2.5 bg-white/5 border-transparent focus:bg-white/10 focus:border-blue-500/50 rounded-xl text-sm transition-all text-white placeholder:text-slate-500"
                  />
                </div>
                <button
                  type="button"
                  className="bg-white/5 p-2.5 rounded-xl text-slate-400 hover:bg-white/10 transition-all border border-white/5"
                >
                  <Filter size={20} />
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="bg-white/5 text-slate-400 text-[10px] font-black uppercase tracking-[0.15em]">
                    <th className="p-6">الموظف</th>
                    <th className="p-6">البريد</th>
                    <th className="p-6">الفريق</th>
                    <th className="p-6">NFC</th>
                    <th className="p-6 text-center">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {team.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-500 text-sm">
                        {me?.roleName === 'MANAGER'
                          ? 'لا يوجد مرؤوسون مسجّلون لك (managerId) في قاعدة البيانات.'
                          : '—'}
                      </td>
                    </tr>
                  ) : (
                    team.map((emp) => (
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
                              {emp.nfcLinked ? 'بطاقة مرتبطة' : 'بدون بطاقة'}
                            </span>
                            <span className="text-slate-500 flex items-center gap-1 text-[10px] font-bold">
                              <CheckCircle2 size={14} /> بيانات حية
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
              <p>إجمالي {team.length} موظفاً في فريقك</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ManagerDashboard;
