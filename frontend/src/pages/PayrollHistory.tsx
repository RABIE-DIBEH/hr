import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  DollarSign,
  TrendingUp,
  Users,
  Clock,
  Download,
  Search,
} from 'lucide-react';
import PaginationControls from '../components/PaginationControls';
import Sidebar from '../components/Sidebar';
import { getAllPayrollHistoryPage, type PayrollSlip } from '../services/api';

const PayrollHistory = () => {
  const [slips, setSlips] = useState<PayrollSlip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMonth, setFilterMonth] = useState<string>('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    setLoading(true);
    getAllPayrollHistoryPage({ page, size: 12 })
      .then((res) => {
        setSlips(res.data.items);
        setTotalPages(res.data.totalPages);
        setTotalCount(res.data.totalCount);
      })
      .catch(() => setError('تعذر تحميل سجل الرواتب'))
      .finally(() => setLoading(false));
  }, [page]);

  const filteredSlips = slips.filter((slip) => {
    const matchesSearch = slip.employeeName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMonth = filterMonth === '' || `${slip.year}-${String(slip.month).padStart(2, '0')}` === filterMonth;
    return matchesSearch && matchesMonth;
  });

  const totalNetSalary = filteredSlips.reduce((sum, s) => sum + (s.netSalary || 0), 0);
  const totalHours = filteredSlips.reduce((sum, s) => sum + (s.totalWorkHours || 0), 0);
  const totalDeductions = filteredSlips.reduce((sum, s) => sum + (s.deductions || 0), 0);

  // Get unique months for filter
  const uniqueMonths = [...new Set(slips.map((s) => `${s.year}-${String(s.month).padStart(2, '0')}`))].sort().reverse();

  const stats = [
    {
      label: 'إجمالي الرواتب',
      value: totalNetSalary.toLocaleString() + ' ر.س',
      icon: DollarSign,
      color: 'text-green-400',
      bg: 'bg-green-500/10',
    },
    {
      label: 'إجمالي الساعات',
      value: totalHours.toFixed(1) + ' ساعة',
      icon: Clock,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
    },
    {
      label: 'إجمالي الخصومات',
      value: totalDeductions.toLocaleString() + ' ر.س',
      icon: TrendingUp,
      color: 'text-red-400',
      bg: 'bg-red-500/10',
    },
    {
      label: 'عدد القسائم',
      value: String(filteredSlips.length),
      icon: Users,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
    },
  ];

  return (
    <div className="flex min-h-screen bg-black" dir="rtl">
      <Sidebar />

      <main className="mr-64 flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <header className="mb-10">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-white tracking-tight arabic-text">
                  سجل الرواتب
                </h1>
                <p className="text-slate-400 mt-1">
                  عرض جميع قسائم الرواتب المحسوبة لجميع الموظفين
                </p>
              </div>
              <div className="flex items-center gap-3 bg-green-500/10 px-4 py-2 rounded-xl">
                <DollarSign size={20} className="text-green-400" />
                <span className="text-green-300 font-medium text-sm">قسم الرواتب</span>
              </div>
            </div>
          </header>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 text-red-200 text-sm font-medium">
              {error}
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
            {stats.map((stat, idx) => (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                key={stat.label}
                className="bg-luxury-surface p-6 rounded-3xl shadow-sm border border-white/5"
              >
                <div className={stat.bg + ' ' + stat.color + ' w-12 h-12 rounded-2xl flex items-center justify-center mb-4'}>
                  <stat.icon size={24} />
                </div>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">{stat.label}</p>
                <p className="text-2xl font-black text-white">{stat.value}</p>
              </motion.div>
            ))}
          </div>

          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input
                type="text"
                placeholder="بحث باسم الموظف..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-sm text-white placeholder:text-slate-500 focus:ring-2 focus:ring-green-500/20"
              />
            </div>
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:ring-2 focus:ring-green-500/20 appearance-none"
            >
              <option value="" className="bg-slate-900">كل الأشهر</option>
              {uniqueMonths.map((m) => {
                const [year, month] = m.split('-');
                const label = new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('ar-SA', { month: 'long', year: 'numeric' });
                return (
                  <option key={m} value={m} className="bg-slate-900">{label}</option>
                );
              })}
            </select>
            <button className="bg-white/5 border border-white/10 px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-white/10 transition-all text-white">
              <Download size={16} /> تصدير
            </button>
          </div>

          {/* Table */}
          <div className="bg-luxury-surface rounded-[2.5rem] shadow-sm border border-white/5 overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-slate-500">
                <p>جاري تحميل سجل الرواتب...</p>
              </div>
            ) : filteredSlips.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <DollarSign size={48} className="mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">لا توجد قسائم راتب</p>
                <p className="text-sm mt-2">قم باحتساب رواتب الموظفين أولاً من صفحة إدارة المرتبات</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse">
                  <thead className="bg-white/5 text-slate-400 text-[10px] font-black uppercase tracking-[0.15em]">
                    <tr>
                      <th className="p-6">الموظف</th>
                      <th className="p-6">الشهر / السنة</th>
                      <th className="p-6">ساعات العمل</th>
                      <th className="p-6">ساعات إضافية</th>
                      <th className="p-6">الخصومات</th>
                      <th className="p-6">صافي الراتب</th>
                      <th className="p-6">تاريخ الإصدار</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredSlips.map((slip) => (
                      <tr key={slip.payrollId} className="hover:bg-white/5 transition-all">
                        <td className="p-6 font-bold text-slate-100">{slip.employeeName || '—'}</td>
                        <td className="p-6 text-slate-300 text-sm">
                          {new Date(slip.year, slip.month - 1).toLocaleDateString('ar-SA', { month: 'long', year: 'numeric' })}
                        </td>
                        <td className="p-6 text-slate-300 text-sm">{slip.totalWorkHours ?? 0} ساعة</td>
                        <td className="p-6 text-blue-400 text-sm">{slip.overtimeHours ?? 0} ساعة</td>
                        <td className="p-6 text-red-400 text-sm">{slip.deductions ?? 0} ر.س</td>
                        <td className="p-6 font-bold text-green-400">{slip.netSalary?.toLocaleString() ?? 0} ر.س</td>
                        <td className="p-6 text-slate-500 text-sm">
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
            <PaginationControls
              page={page}
              totalPages={totalPages}
              totalCount={totalCount}
              onPageChange={setPage}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default PayrollHistory;
