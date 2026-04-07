import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Wallet,
  ChevronLeft,
  DollarSign,
  RefreshCcw,
  AlertCircle,
  Search,
  Users,
  Clock,
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { calculatePayroll, listEmployees, getAllPayrollHistory } from '../services/api';
import { queryKeys } from '../services/queryKeys';
import { extractApiError } from '../utils/errorHandler';

const Expenses = () => {
  const queryClient = useQueryClient();
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | ''>('');
  const [payrollMessage, setPayrollMessage] = useState<string | null>(null);
  const now = new Date();
  const [payrollMonth, setPayrollMonth] = useState(now.getMonth() + 1);
  const [payrollYear, setPayrollYear] = useState(now.getFullYear());

  const { data: employees = [] } = useQuery({
    queryKey: queryKeys.expenses.employees,
    queryFn: () => listEmployees().then((res) => res.data),
  });

  const { data: payrollHistory = [], isLoading: loadingHistory } = useQuery({
    queryKey: queryKeys.expenses.payrollHistory,
    queryFn: () => getAllPayrollHistory().then((res) => res.data),
  });

  const calculatePayrollMutation = useMutation({
    mutationFn: ({ month, year, employeeId }: { month: number; year: number; employeeId: number }) =>
      calculatePayroll(month, year, employeeId),
    onSuccess: (data) => {
      setPayrollMessage(
        `تم احتساب الراتب: ${data.data.netSalary} (ساعات: ${data.data.totalWorkHours ?? '—'}) للموظف ${selectedEmployeeId}`
      );
      void queryClient.invalidateQueries({ queryKey: queryKeys.expenses.payrollHistory });
    },
    onError: (err) => {
      const apiError = extractApiError(err);
      setPayrollMessage(apiError.message || 'فشل احتساب الراتب. تحقق من البيانات أو الصلاحيات.');
    },
  });

  const handlePayroll = () => {
    if (selectedEmployeeId === '') {
      setPayrollMessage('اختر موظفاً أولاً');
      return;
    }
    setPayrollMessage(null);
    calculatePayrollMutation.mutate({
      month: payrollMonth,
      year: payrollYear,
      employeeId: selectedEmployeeId as number,
    });
  };

  // Calculate real totals from payroll history
  const currentMonthPayroll = payrollHistory.filter(
    (p) => p.month === payrollMonth && p.year === payrollYear
  );
  const totalMonthlySalary = currentMonthPayroll.reduce((sum, p) => sum + (p.netSalary || 0), 0);
  const totalEmployees = currentMonthPayroll.length;
  const totalHours = currentMonthPayroll.reduce((sum, p) => sum + (p.totalWorkHours || 0), 0);

  return (
    <div className="flex min-h-screen bg-black" dir="rtl">
      <Sidebar />
      <main className="mr-64 flex-1 p-8 pb-32">
        <header className="flex justify-between items-center mb-10">
          <h1 className="text-2xl font-bold tracking-tight text-white">إدارة المرتبات</h1>
          <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center">
            <ChevronLeft size={20} className="text-white/60" />
          </div>
        </header>

        <div className="space-y-10">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div
              animate={{ opacity: 1, scale: 1 }}
              className="bg-luxury-surface p-6 rounded-3xl shadow-sm border border-white/5"
            >
              <div className="bg-green-500/10 text-green-400 w-12 h-12 rounded-2xl flex items-center justify-center mb-4">
                <DollarSign size={24} />
              </div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">إجمالي الرواتب</p>
              <p className="text-2xl font-black text-white">{totalMonthlySalary.toLocaleString()} ر.س</p>
              <p className="text-[10px] text-slate-500 mt-1">
                {new Date(payrollYear, payrollMonth - 1).toLocaleDateString('ar-SA', { month: 'long', year: 'numeric' })}
              </p>
            </motion.div>

            <motion.div
              animate={{ opacity: 1, scale: 1 }}
              className="bg-luxury-surface p-6 rounded-3xl shadow-sm border border-white/5"
            >
              <div className="bg-blue-500/10 text-blue-400 w-12 h-12 rounded-2xl flex items-center justify-center mb-4">
                <Users size={24} />
              </div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">الموظفون المصروف لهم</p>
              <p className="text-2xl font-black text-white">{totalEmployees}</p>
              <p className="text-[10px] text-slate-500 mt-1">من أصل {employees.length} موظف</p>
            </motion.div>

            <motion.div
              animate={{ opacity: 1, scale: 1 }}
              className="bg-luxury-surface p-6 rounded-3xl shadow-sm border border-white/5"
            >
              <div className="bg-purple-500/10 text-purple-400 w-12 h-12 rounded-2xl flex items-center justify-center mb-4">
                <Clock size={24} />
              </div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">إجمالي الساعات</p>
              <p className="text-2xl font-black text-white">{totalHours.toFixed(1)}</p>
              <p className="text-[10px] text-slate-500 mt-1">ساعة عمل</p>
            </motion.div>
          </div>

          {/* ── Payroll Calculator ── */}
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
                اختر موظفاً من القائمة أعلاه ثم نفّذ الاحتساب. البيانات مأخوذة من الجداول الفعلية للنظام.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={handlePayroll}
                disabled={calculatePayrollMutation.isPending || selectedEmployeeId === ''}
                className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black shadow-xl shadow-emerald-900/20 hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {calculatePayrollMutation.isPending ? <RefreshCcw className="animate-spin" size={20} /> : <RefreshCcw size={20} />}
                <span>احتساب الراتب للموظف المحدد</span>
              </button>
            </div>
          </motion.div>

          {/* Recent Payroll Records */}
          <section className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-white/90">أحدث عمليات صرف الرواتب</h3>
            </div>

            {loadingHistory ? (
              <div className="text-center py-12 text-slate-500">
                <p>جاري تحميل سجل الرواتب...</p>
              </div>
            ) : payrollHistory.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <Wallet size={48} className="mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">لا توجد عمليات صرف رواتب بعد</p>
                <p className="text-sm mt-2 text-slate-600">قم باحتساب رواتب الموظفين أولاً</p>
              </div>
            ) : (
              <div className="space-y-4">
                {payrollHistory.slice(0, 10).map((slip, idx) => (
                  <motion.div
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    key={slip.payrollId}
                    className="bg-luxury-surface p-5 rounded-2xl border border-white/5 flex justify-between items-center group hover:bg-white/5 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500/20 transition-all">
                        <Wallet size={24} />
                      </div>
                      <div>
                        <p className="font-bold text-white tracking-tight">{slip.employeeName}</p>
                        <p className="text-[10px] text-slate-400 font-medium mt-1">
                          {new Date(slip.year, slip.month - 1).toLocaleDateString('ar-SA', { month: 'long', year: 'numeric' })}
                          {' • '}
                          {slip.totalWorkHours ?? 0} ساعة عمل
                          {slip.overtimeHours ? ` • ${slip.overtimeHours} ساعة إضافية` : ''}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-black tabular-nums text-green-400 tracking-tighter">{slip.netSalary?.toLocaleString() ?? 0}</p>
                      <p className="text-[10px] text-slate-500 font-bold">ر.س</p>
                      {slip.deductions ? (
                        <p className="text-[10px] text-red-400 font-medium">
                          خصم: {slip.deductions.toLocaleString()} ر.س
                        </p>
                      ) : null}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
};

export default Expenses;
