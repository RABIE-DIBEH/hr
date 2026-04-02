import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  IdCard,
  CreditCard,
  DollarSign,
  RefreshCcw,
  CheckCircle2,
  AlertCircle,
  Link,
  Search,
  Download,
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { calculatePayroll, listEmployees, type EmployeeSummary } from '../services/api';

const HRDashboard = () => {
  const [bindingStatus, setBindingStatus] = useState<'Idle' | 'Reading' | 'Success'>('Idle');
  const [payrollLoading, setPayrollLoading] = useState(false);
  const [payrollMessage, setPayrollMessage] = useState<string | null>(null);
  const [employees, setEmployees] = useState<EmployeeSummary[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | ''>('');
  const now = new Date();
  const [payrollMonth, setPayrollMonth] = useState(now.getMonth() + 1);
  const [payrollYear, setPayrollYear] = useState(now.getFullYear());

  useEffect(() => {
    listEmployees()
      .then((res) => {
        setEmployees(res.data);
        setLoadError(null);
      })
      .catch(() => setLoadError('تعذر تحميل قائمة الموظفين. تأكد من صلاحيات HR والاتصال بالخادم.'));
  }, []);

  const handleBind = () => {
    setBindingStatus('Reading');
    setTimeout(() => {
      setBindingStatus('Success');
      setTimeout(() => setBindingStatus('Idle'), 3000);
    }, 2000);
  };

  const handlePayroll = async () => {
    if (selectedEmployeeId === '') {
      setPayrollMessage('اختر موظفاً أولاً');
      return;
    }
    setPayrollLoading(true);
    setPayrollMessage(null);
    try {
      const { data } = await calculatePayroll(payrollMonth, payrollYear, selectedEmployeeId);
      setPayrollMessage(
        `تم احتساب الراتب: ${data.netSalary} (ساعات: ${data.totalWorkHours ?? '—'}) للموظف ${selectedEmployeeId}`
      );
    } catch {
      setPayrollMessage('فشل احتساب الراتب. تحقق من البيانات أو الصلاحيات.');
    } finally {
      setPayrollLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      <Sidebar />

      <main className="ml-64 flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <header className="mb-10">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight arabic-text">
              إدارة الموارد البشرية (HR)
            </h1>
            <p className="text-slate-500 mt-1">إدارة البطاقات الذكية ومعالجة الرواتب الشهرية</p>
          </header>

          {loadError && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 text-red-800 text-sm font-medium">{loadError}</div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-6">
                  <div className="bg-blue-600 w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                    <CreditCard size={24} />
                  </div>
                  <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-widest">
                    NFC Pairing
                  </span>
                </div>
                <h2 className="text-xl font-bold mb-2">ربط بطاقة NFC بموظف</h2>
                <p className="text-slate-500 text-sm mb-8 leading-relaxed">
                  اختر موظفاً من القائمة المستوردة من الخادم، ثم أكمل عملية الربط عند توفر واجهة القارئ.
                </p>

                <div className="space-y-4 mb-8">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <select
                      className="w-full bg-slate-50 border-none rounded-xl py-4 pl-12 pr-4 text-sm focus:ring-2 focus:ring-blue-500/20 appearance-none"
                      value={selectedEmployeeId === '' ? '' : String(selectedEmployeeId)}
                      onChange={(e) =>
                        setSelectedEmployeeId(e.target.value ? Number(e.target.value) : '')
                      }
                    >
                      <option value="">اختر الموظف من القائمة...</option>
                      {employees.map((e) => (
                        <option key={e.employeeId} value={e.employeeId}>
                          {e.fullName} ({e.teamName ?? '—'})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div
                    className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center gap-4 transition-all duration-300 ${
                      bindingStatus === 'Reading'
                        ? 'border-blue-500 bg-blue-50/50'
                        : bindingStatus === 'Success'
                          ? 'border-green-500 bg-green-50/50'
                          : 'border-slate-100'
                    }`}
                  >
                    {bindingStatus === 'Reading' ? (
                      <>
                        <RefreshCcw className="text-blue-500 animate-spin" size={32} />
                        <p className="text-blue-600 font-bold text-sm">جاري القراءة...</p>
                      </>
                    ) : bindingStatus === 'Success' ? (
                      <>
                        <CheckCircle2 className="text-green-500" size={32} />
                        <p className="text-green-600 font-bold text-sm">محاكاة: تم الربط (لا يوجد API قارئ بعد)</p>
                      </>
                    ) : (
                      <>
                        <IdCard className="text-slate-300" size={40} />
                        <p className="text-slate-400 font-medium text-sm">جاهز لقراءة البطاقة</p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleBind}
                disabled={bindingStatus !== 'Idle'}
                className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
              >
                <Link size={18} />
                <span>تأكيد عملية الربط (واجهة تجريبية)</span>
              </button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-6">
                  <div className="bg-emerald-600 w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                    <DollarSign size={24} />
                  </div>
                  <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-widest">
                    Payroll
                  </span>
                </div>
                <h2 className="text-xl font-bold mb-2">احتساب راتب موظف</h2>
                <p className="text-slate-500 text-sm mb-8 leading-relaxed">
                  يُحتسب الراتب من سجل الحضور ومرتب الأساس المخزّن في قاعدة البيانات لنفس الموظف.
                </p>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-slate-50 p-4 rounded-2xl">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">الشهر</p>
                    <input
                      type="number"
                      min={1}
                      max={12}
                      className="w-full bg-transparent font-bold border-none focus:ring-0"
                      value={payrollMonth}
                      onChange={(e) => setPayrollMonth(Number(e.target.value))}
                    />
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">السنة</p>
                    <input
                      type="number"
                      min={2000}
                      max={2100}
                      className="w-full bg-transparent font-bold border-none focus:ring-0"
                      value={payrollYear}
                      onChange={(e) => setPayrollYear(Number(e.target.value))}
                    />
                  </div>
                </div>

                {payrollMessage && (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-sm text-slate-700 mb-4">
                    {payrollMessage}
                  </div>
                )}

                <div className="p-5 bg-orange-50 border border-orange-100 rounded-2xl flex gap-4 items-start mb-8">
                  <AlertCircle className="text-orange-600 shrink-0" size={20} />
                  <p className="text-orange-800 text-xs leading-relaxed font-medium">
                    اختر موظفاً من القائمة أعلاه ثم نفّذ الاحتسال. البيانات مأخوذة من الجداول الفعلية للنظام.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={handlePayroll}
                  disabled={payrollLoading || selectedEmployeeId === ''}
                  className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {payrollLoading ? <RefreshCcw className="animate-spin" size={20} /> : <RefreshCcw size={20} />}
                  <span>احتساب الراتب للموظف المحدد</span>
                </button>
                <button
                  type="button"
                  className="w-full bg-white border border-slate-200 text-slate-600 py-3 rounded-2xl font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                >
                  <Download size={18} />
                  <span>تصدير (قريباً)</span>
                </button>
              </div>
            </motion.div>
          </div>

          <section className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-8 border-b border-slate-50 flex justify-between items-center flex-wrap gap-4">
              <h3 className="font-bold text-xl">قائمة الموظفين (قاعدة البيانات)</h3>
              <span className="text-sm text-slate-500">{employees.length} موظف</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-[0.15em]">
                  <tr>
                    <th className="p-6">الموظف</th>
                    <th className="p-6">البريد</th>
                    <th className="p-6">الفريق</th>
                    <th className="p-6">معرف البطاقة UID</th>
                    <th className="p-6">حالة الربط</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {employees.length === 0 && !loadError ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-500 text-sm">
                        لا يوجد موظفون في النظام. أضف موظفين عبر قاعدة البيانات أو أداة الإدارة.
                      </td>
                    </tr>
                  ) : (
                    employees.map((emp) => (
                      <tr key={emp.employeeId} className="hover:bg-slate-50/50 transition-all">
                        <td className="p-6 font-bold text-slate-800">{emp.fullName}</td>
                        <td className="p-6 text-slate-500 text-sm font-medium">{emp.email}</td>
                        <td className="p-6 text-slate-500 text-sm font-medium">{emp.teamName ?? '—'}</td>
                        <td className="p-6 font-mono text-slate-600 text-sm">{emp.cardUid ?? '—'}</td>
                        <td className="p-6">
                          <span
                            className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${
                              emp.nfcLinked ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'
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
        </div>
      </main>
    </div>
  );
};

export default HRDashboard;
