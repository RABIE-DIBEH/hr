import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingDown,
  Wallet,
  ChevronLeft,
  DollarSign,
  RefreshCcw,
  AlertCircle,
  Download,
  Search,
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { calculatePayroll, listEmployees, type EmployeeSummary } from '../services/api';

const Expenses = () => {
  const [employees, setEmployees] = useState<EmployeeSummary[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | ''>('');
  const [payrollLoading, setPayrollLoading] = useState(false);
  const [payrollMessage, setPayrollMessage] = useState<string | null>(null);
  const now = new Date();
  const [payrollMonth, setPayrollMonth] = useState(now.getMonth() + 1);
  const [payrollYear, setPayrollYear] = useState(now.getFullYear());

  useEffect(() => {
    listEmployees()
      .then((res) => setEmployees(res.data))
      .catch(() => {});
  }, []);

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

  const transactions = [
    { id: 1, label: 'أحمد محمد - راتب مارس', date: 'اليوم، 10:30 ص', amount: '8,500.00', icon: Wallet, category: 'رواتب' },
    { id: 2, label: 'سارة خالد - راتب مارس', date: 'أمس، 08:15 م', amount: '9,250.00', icon: Wallet, category: 'رواتب' },
    { id: 3, label: 'خالد عبد الله - مكافأة', date: '20 مايو، 02:45 م', amount: '1,500.00', icon: Wallet, category: 'مكافآت' },
  ];

  return (
    <div className="flex min-h-screen bg-luxury-bg" dir="rtl">
      <Sidebar />
      <main className="mr-64 flex-1 p-8 pb-32">
        <header className="flex justify-between items-center mb-10">
          <h1 className="text-2xl font-bold tracking-tight text-white">إدارة المرتبات</h1>
          <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center">
            <ChevronLeft size={20} className="text-white/60" />
          </div>
        </header>

        <div className="space-y-10">
          {/* Total Balance Card */}
          <motion.div 
            animate={{ opacity: 1, scale: 1 }}
            className="purple-gradient p-8 rounded-[32px] shadow-[0_20px_50px_rgba(106,13,173,0.3)] relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl" />
            <div className="relative z-10">
              <p className="text-white/60 text-sm font-medium mb-2">إجمالي الرواتب المصروفة هذا الشهر</p>
              <h2 className="text-4xl font-black tabular-nums tracking-tighter mb-8">14,250.00 <span className="text-xl font-medium opacity-60">ر.س</span></h2>
              
              <div className="flex justify-between items-center">
                <div className="bg-black/20 backdrop-blur-md px-4 py-2 rounded-xl flex items-center gap-2">
                  <TrendingDown size={16} className="text-red-400" />
                  <span className="text-xs font-bold text-red-100">أعلى بنسبة 12%</span>
                </div>
                <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">تحديث: منذ ساعة</p>
              </div>
            </div>
          </motion.div>

          {/* ── Payroll Calculator (moved from HR Dashboard) ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-luxury-surface rounded-[2.5rem] p-8 shadow-sm border border-white/5"
          >
            <div className="flex justify-between items-start mb-6">
              <div className="bg-emerald-600 w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-900/20">
                <DollarSign size={24} />
              </div>
              <span className="bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-widest">
                Payroll
              </span>
            </div>
            <h2 className="text-xl font-bold mb-2 text-white">احتساب راتب موظف</h2>
            <p className="text-slate-400 text-sm mb-8 leading-relaxed">
              يُحتسب الراتب من سجل الحضور ومرتب الأساس المخزّن في قاعدة البيانات لنفس الموظف.
            </p>

            {/* Employee Selector */}
            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <select
                className="w-full bg-white/5 border-white/5 rounded-xl py-4 pl-12 pr-4 text-sm text-white focus:ring-2 focus:ring-emerald-500/20 appearance-none"
                value={selectedEmployeeId === '' ? '' : String(selectedEmployeeId)}
                onChange={(e) =>
                  setSelectedEmployeeId(e.target.value ? Number(e.target.value) : '')
                }
              >
                <option value="" className="bg-slate-900">اختر الموظف من القائمة...</option>
                {employees.map((emp) => (
                  <option key={emp.employeeId} value={emp.employeeId} className="bg-slate-900">
                    {emp.fullName} ({emp.teamName ?? '—'})
                  </option>
                ))}
              </select>
            </div>

            {/* Month / Year */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-white/5 p-4 rounded-2xl">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">الشهر</p>
                <input
                  type="number"
                  min={1}
                  max={12}
                  className="w-full bg-transparent font-bold border-none focus:ring-0 text-white"
                  value={payrollMonth}
                  onChange={(e) => setPayrollMonth(Number(e.target.value))}
                />
              </div>
              <div className="bg-white/5 p-4 rounded-2xl">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">السنة</p>
                <input
                  type="number"
                  min={2000}
                  max={2100}
                  className="w-full bg-transparent font-bold border-none focus:ring-0 text-white"
                  value={payrollYear}
                  onChange={(e) => setPayrollYear(Number(e.target.value))}
                />
              </div>
            </div>

            {payrollMessage && (
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-sm text-slate-300 mb-4">
                {payrollMessage}
              </div>
            )}

            <div className="p-5 bg-orange-500/10 border border-orange-500/10 rounded-2xl flex gap-4 items-start mb-8">
              <AlertCircle className="text-orange-400 shrink-0" size={20} />
              <p className="text-orange-200 text-xs leading-relaxed font-medium">
                اختر موظفاً من القائمة أعلاه ثم نفّذ الاحتسال. البيانات مأخوذة من الجداول الفعلية للنظام.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={handlePayroll}
                disabled={payrollLoading || selectedEmployeeId === ''}
                className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black shadow-xl shadow-emerald-900/20 hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {payrollLoading ? <RefreshCcw className="animate-spin" size={20} /> : <RefreshCcw size={20} />}
                <span>احتساب الراتب للموظف المحدد</span>
              </button>
              <button
                type="button"
                className="w-full bg-luxury-surface border border-white/5 text-slate-300 py-3 rounded-2xl font-bold hover:bg-white/5 transition-all flex items-center justify-center gap-2"
              >
                <Download size={18} />
                <span>تصدير (قريباً)</span>
              </button>
            </div>
          </motion.div>

          {/* Transactions List */}
          <section className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-white/90">أحدث العمليات</h3>
              <button className="text-luxury-accent text-xs font-bold hover:underline">مشاهدة الكل</button>
            </div>

            <div className="space-y-4">
              {transactions.map((t, idx) => (
                <motion.div 
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  key={t.id} 
                  className="card-luxury p-5 flex justify-between items-center group hover:bg-white/5 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-luxury-gold-soft flex items-center justify-center text-luxury-accent group-hover:bg-luxury-accent group-hover:text-black transition-all">
                      <t.icon size={24} />
                    </div>
                    <div>
                      <p className="font-bold text-white tracking-tight">{t.label}</p>
                      <p className="text-[10px] text-white/40 font-medium mt-1">{t.date} • {t.category}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-black tabular-nums text-white tracking-tighter">-{t.amount}</p>
                    <p className="text-[10px] text-white/20 font-bold">ر.س</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default Expenses;
