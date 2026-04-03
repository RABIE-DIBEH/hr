import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  IdCard,
  CreditCard,
  RefreshCcw,
  CheckCircle2,
  Link,
  Search,
  UserPlus,
  HandCoins,
  Check,
  X,
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import RecruitmentRequestForm from '../components/RecruitmentRequestForm';
import {
  listEmployees,
  getPendingAdvanceRequests,
  processAdvanceRequest,
  type EmployeeSummary,
  type AdvanceRequest,
} from '../services/api';

const HRDashboard = () => {
  const [bindingStatus, setBindingStatus] = useState<'Idle' | 'Reading' | 'Success'>('Idle');
  const [employees, setEmployees] = useState<EmployeeSummary[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | ''>('');
  const [showRecruitmentForm, setShowRecruitmentForm] = useState(false);
  const [pendingAdvances, setPendingAdvances] = useState<AdvanceRequest[]>([]);
  const [processingAdvance, setProcessingAdvance] = useState<number | null>(null);
  const [advanceNote, setAdvanceNote] = useState<string>('');
  const [selectedAdvanceId, setSelectedAdvanceId] = useState<number | null>(null);

  useEffect(() => {
    listEmployees()
      .then((res) => {
        setEmployees(res.data);
        setLoadError(null);
      })
      .catch(() => setLoadError('تعذر تحميل قائمة الموظفين. تأكد من صلاحيات HR والاتصال بالخادم.'));
  }, []);

  useEffect(() => {
    getPendingAdvanceRequests()
      .then((res) => setPendingAdvances(res.data))
      .catch(() => setLoadError('تعذر تحميل طلبات السلفة المعلقة'));
  }, []);

  const handleBind = () => {
    setBindingStatus('Reading');
    setTimeout(() => {
      setBindingStatus('Success');
      setTimeout(() => setBindingStatus('Idle'), 3000);
    }, 2000);
  };



  const handleRecruitmentSuccess = () => {
    setShowRecruitmentForm(false);
  };

  const handleProcessAdvance = async (advanceId: number, status: 'Approved' | 'Rejected') => {
    setProcessingAdvance(advanceId);
    try {
      await processAdvanceRequest(advanceId, status, advanceNote || undefined);
      setPendingAdvances((prev) => prev.filter((a) => a.advanceId !== advanceId));
      setAdvanceNote('');
      setSelectedAdvanceId(null);
    } catch {
      setLoadError('فشل معالجة طلب السلفة');
    } finally {
      setProcessingAdvance(null);
    }
  };

  return (
    <div className="flex min-h-screen bg-black font-sans" dir="rtl">
      <Sidebar />

      <main className="mr-64 flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <header className="mb-10">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-black text-white tracking-tight arabic-text">
                  إدارة الموارد البشرية (HR)
                </h1>
                <p className="text-slate-400 mt-1">إدارة البطاقات الذكية ومعالجة الرواتب الشهرية</p>
              </div>
              <button
                onClick={() => setShowRecruitmentForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-600/20"
              >
                <UserPlus size={20} />
                <span>طلب توظيف جديد</span>
              </button>
            </div>
          </header>

          {loadError && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 text-red-200 text-sm font-medium">{loadError}</div>
          )}

          <div className="grid grid-cols-1 gap-8 mb-10">
            <motion.div
              initial={{ opacity: 1, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-luxury-surface rounded-[2.5rem] p-8 shadow-sm border border-white/5 flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-6">
                  <div className="bg-blue-600 w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-900/20">
                    <CreditCard size={24} />
                  </div>
                  <span className="bg-blue-500/10 text-blue-400 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-widest">
                    NFC Pairing
                  </span>
                </div>
                <h2 className="text-xl font-bold mb-2 text-white">ربط بطاقة NFC بموظف</h2>
                <p className="text-slate-400 text-sm mb-8 leading-relaxed">
                  اختر موظفاً من القائمة المستوردة من الخادم، ثم أكمل عملية الربط عند توفر واجهة القارئ.
                </p>

                <div className="space-y-4 mb-8">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <select
                      className="w-full bg-white/5 border-white/5 rounded-xl py-4 pl-12 pr-4 text-sm text-white focus:ring-2 focus:ring-blue-500/20 appearance-none"
                      value={selectedEmployeeId === '' ? '' : String(selectedEmployeeId)}
                      onChange={(e) =>
                        setSelectedEmployeeId(e.target.value ? Number(e.target.value) : '')
                      }
                    >
                      <option value="" className="bg-slate-900">اختر الموظف من القائمة...</option>
                      {employees.map((e) => (
                        <option key={e.employeeId} value={e.employeeId} className="bg-slate-900">
                          {e.fullName} ({e.teamName ?? '—'})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div
                    className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center gap-4 transition-all duration-300 ${
                      bindingStatus === 'Reading'
                        ? 'border-blue-500 bg-blue-500/5'
                        : bindingStatus === 'Success'
                          ? 'border-green-500 bg-green-500/5'
                          : 'border-white/5'
                    }`}
                  >
                    {bindingStatus === 'Reading' ? (
                      <>
                        <RefreshCcw className="text-blue-400 animate-spin" size={32} />
                        <p className="text-blue-400 font-bold text-sm">جاري القراءة...</p>
                      </>
                    ) : bindingStatus === 'Success' ? (
                      <>
                        <CheckCircle2 className="text-green-400" size={32} />
                        <p className="text-green-400 font-bold text-sm">محاكاة: تم الربط (لا يوجد API قارئ بعد)</p>
                      </>
                    ) : (
                      <>
                        <IdCard className="text-slate-600" size={40} />
                        <p className="text-slate-500 font-medium text-sm">جاهز لقراءة البطاقة</p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleBind}
                disabled={bindingStatus !== 'Idle'}
                className="w-full bg-white text-black py-4 rounded-2xl font-bold hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
              >
                <Link size={18} />
                <span>تأكيد عملية الربط (واجهة تجريبية)</span>
              </button>
            </motion.div>


          </div>

          <section className="bg-luxury-surface rounded-[2.5rem] shadow-sm border border-white/5 overflow-hidden">
            <div className="p-8 border-b border-white/5 flex justify-between items-center flex-wrap gap-4">
              <h3 className="font-bold text-xl text-white">قائمة الموظفين (قاعدة البيانات)</h3>
              <span className="text-sm text-slate-500">{employees.length} موظ</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead className="bg-white/5 text-slate-400 text-[10px] font-black uppercase tracking-[0.15em]">
                  <tr>
                    <th className="p-6">الموظف</th>
                    <th className="p-6">البريد</th>
                    <th className="p-6">الفريق</th>
                    <th className="p-6">معرف البطاقة UID</th>
                    <th className="p-6">حالة الربط</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {employees.length === 0 && !loadError ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-500 text-sm">
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
                              emp.nfcLinked ? 'bg-green-500/10 text-green-400' : 'bg-orange-500/10 text-orange-400'
                            }`}
                          >
                            {emp.nfcLinked ? 'مرتبط' : 'بدون بطاقة'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Pending Advance Requests Section */}
          <section className="mt-10 bg-luxury-surface rounded-[2.5rem] shadow-sm border border-white/5 overflow-hidden">
            <div className="p-8 border-b border-white/5 flex items-center gap-3">
              <div className="bg-purple-500/10 w-12 h-12 rounded-2xl flex items-center justify-center text-purple-400">
                <HandCoins size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">طلبات السلفة المعلقة</h3>
                <p className="text-slate-400 text-sm">
                  {pendingAdvances.length} طلب في انتظار المراجعة
                </p>
              </div>
            </div>

            {pendingAdvances.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <HandCoins size={48} className="mx-auto mb-4 opacity-50" />
                <p>لا توجد طلبات سلفة معلقة</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {pendingAdvances.map((advance) => (
                  <div key={advance.advanceId} className="p-6 hover:bg-white/5 transition-all">
                    <div className="flex justify-between items-start gap-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h4 className="text-lg font-bold text-white">{advance.employeeName}</h4>
                          <span className="bg-purple-500/10 text-purple-400 px-3 py-1 rounded-lg text-xs font-bold">
                            قيد المراجعة
                          </span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-slate-500 text-xs mb-1">المبلغ المطلوب</p>
                            <p className="text-purple-300 font-bold text-lg">{advance.amount} ر.س</p>
                          </div>
                          <div>
                            <p className="text-slate-500 text-xs mb-1">السبب</p>
                            <p className="text-slate-200">{advance.reason || '—'}</p>
                          </div>
                          <div>
                            <p className="text-slate-500 text-xs mb-1">تاريخ الطلب</p>
                            <p className="text-slate-200">
                              {advance.requestedAt
                                ? new Date(advance.requestedAt).toLocaleDateString('ar-SA')
                                : '—'}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 min-w-[200px]">
                        {selectedAdvanceId === advance.advanceId ? (
                          <div className="space-y-2">
                            <input
                              type="text"
                              placeholder="ملاحظة (اختياري)"
                              value={advanceNote}
                              onChange={(e) => setAdvanceNote(e.target.value)}
                              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-slate-500 focus:ring-2 focus:ring-purple-500/20"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleProcessAdvance(advance.advanceId!, 'Approved')}
                                disabled={processingAdvance === advance.advanceId}
                                className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1 disabled:opacity-50"
                              >
                                <Check size={14} />
                                موافقة
                              </button>
                              <button
                                onClick={() => handleProcessAdvance(advance.advanceId!, 'Rejected')}
                                disabled={processingAdvance === advance.advanceId}
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
                              setSelectedAdvanceId(advance.advanceId!);
                              setAdvanceNote('');
                            }}
                            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all"
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
          </section>
        </div>
      </main>

      {/* Recruitment Request Modal */}
      {showRecruitmentForm && (
        <RecruitmentRequestForm
          onClose={() => setShowRecruitmentForm(false)}
          onSuccess={handleRecruitmentSuccess}
        />
      )}
    </div>
  );
};

export default HRDashboard;
