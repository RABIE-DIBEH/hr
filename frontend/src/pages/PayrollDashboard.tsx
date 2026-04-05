import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  HandCoins,
  Check,
  X,
  DollarSign,
  TrendingUp,
  Clock,
} from 'lucide-react';
import PaginationControls from '../components/PaginationControls';
import Sidebar from '../components/Sidebar';
import {
  getCurrentEmployee,
  getPendingAdvanceRequestsPage,
  processAdvanceRequest,
  getAllAdvanceRequestsPage,
  type EmployeeProfile,
  type AdvanceRequest,
} from '../services/api';

const PayrollDashboard = () => {
  const [me, setMe] = useState<EmployeeProfile | null>(null);
  const [pendingAdvances, setPendingAdvances] = useState<AdvanceRequest[]>([]);
  const [allAdvances, setAllAdvances] = useState<AdvanceRequest[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [processingAdvance, setProcessingAdvance] = useState<number | null>(null);
  const [advanceNote, setAdvanceNote] = useState<string>('');
  const [selectedAdvanceId, setSelectedAdvanceId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'all'>('pending');
  const [pendingPage, setPendingPage] = useState(0);
  const [pendingTotalPages, setPendingTotalPages] = useState(0);
  const [pendingTotalCount, setPendingTotalCount] = useState(0);
  const [allPage, setAllPage] = useState(0);
  const [allTotalPages, setAllTotalPages] = useState(0);
  const [allTotalCount, setAllTotalCount] = useState(0);

  useEffect(() => {
    getCurrentEmployee()
      .then((res) => setMe(res.data))
      .catch(() => setMe(null));
  }, []);

  const canManageAdvances = me?.roleName === 'HR'
    || me?.roleName === 'ADMIN'
    || me?.roleName === 'SUPER_ADMIN';

  const loadPendingAdvances = async (page: number) => {
    try {
      const res = await getPendingAdvanceRequestsPage({ page, size: 10 });
      setPendingAdvances(res.data.items);
      setPendingTotalPages(res.data.totalPages);
      setPendingTotalCount(res.data.totalCount);
    } catch {
      setLoadError('تعذر تحميل طلبات السلفة المعلقة');
    }
  };

  const loadAllAdvances = async (page: number) => {
    try {
      const res = await getAllAdvanceRequestsPage({ page, size: 10 });
      setAllAdvances(res.data.items);
      setAllTotalPages(res.data.totalPages);
      setAllTotalCount(res.data.totalCount);
    } catch {
      setLoadError('تعذر تحميل جميع طلبات السلفة');
    }
  };

  useEffect(() => {
    if (canManageAdvances) {
      void loadPendingAdvances(pendingPage);
    }
  }, [canManageAdvances, pendingPage]);

  useEffect(() => {
    if (canManageAdvances) {
      void loadAllAdvances(allPage);
    }
  }, [canManageAdvances, allPage]);

  const handleProcessAdvance = async (advanceId: number, status: 'Approved' | 'Rejected') => {
    setProcessingAdvance(advanceId);
    try {
      await processAdvanceRequest(advanceId, status, advanceNote || undefined);
      setAdvanceNote('');
      setSelectedAdvanceId(null);
      await Promise.all([
        loadPendingAdvances(pendingPage),
        loadAllAdvances(allPage),
      ]);
    } catch {
      setLoadError('فشل معالجة طلب السلفة');
    } finally {
      setProcessingAdvance(null);
    }
  };

  const totalPendingAmount = pendingAdvances.reduce((sum, a) => sum + (a.amount || 0), 0);
  const totalApprovedAmount = allAdvances
    .filter((a) => a.status === 'Approved')
    .reduce((sum, a) => sum + (a.amount || 0), 0);

  const stats = [
    {
      label: 'طلبات معلقة',
      value: String(pendingAdvances.length),
      icon: Clock,
      color: 'text-orange-400',
      bg: 'bg-orange-500/10',
    },
    {
      label: 'إجمالي المعلق',
      value: totalPendingAmount.toLocaleString() + ' ر.س',
      icon: HandCoins,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
    },
    {
      label: 'تمت الموافقة',
      value: totalApprovedAmount.toLocaleString() + ' ر.س',
      icon: TrendingUp,
      color: 'text-green-400',
      bg: 'bg-green-500/10',
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
                  إدارة السلف المالية
                </h1>
                <p className="text-slate-400 mt-1">
                  مراجعة والموافقة على طلبات السلفة من الموظفين
                </p>
              </div>
              <div className="flex items-center gap-3 bg-purple-500/10 px-4 py-2 rounded-xl">
                <DollarSign size={20} className="text-purple-400" />
                <span className="text-purple-300 font-medium text-sm">قسم الرواتب</span>
              </div>
            </div>
          </header>

          {loadError && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 text-red-200 text-sm font-medium">
              {loadError}
            </div>
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
                <div className={stat.bg + ' ' + stat.color + ' w-12 h-12 rounded-2xl flex items-center justify-center mb-4'}>
                  <stat.icon size={24} />
                </div>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">{stat.label}</p>
                <p className="text-2xl font-black text-white">{stat.value}</p>
              </motion.div>
            ))}
          </div>

          <div className="flex gap-4 mb-6 border-b border-white/10">
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-6 py-3 font-medium transition-all ${
                activeTab === 'pending'
                  ? 'text-purple-400 border-b-2 border-purple-400'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              الطلبات المعلقة ({pendingAdvances.length})
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`px-6 py-3 font-medium transition-all ${
                activeTab === 'all'
                  ? 'text-purple-400 border-b-2 border-purple-400'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              جميع الطلبات ({allAdvances.length})
            </button>
          </div>

          {activeTab === 'pending' && (
            <div className="bg-luxury-surface rounded-[2.5rem] shadow-sm border border-white/5 overflow-hidden">
              {pendingAdvances.length === 0 ? (
                <div className="p-12 text-center text-slate-500">
                  <HandCoins size={48} className="mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">لا توجد طلبات سلفة معلقة</p>
                  <p className="text-sm mt-2">سيتم عرض الطلبات الجديدة هنا عند تقديمها</p>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {pendingAdvances.map((advance) => (
                    <div key={advance.advanceId} className="p-6 hover:bg-white/5 transition-all">
                      <div className="flex justify-between items-start gap-6">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400 font-bold">
                              {advance.employeeName
                                ?.split(/\s+/)
                                .filter(Boolean)
                                .slice(0, 2)
                                .map((w) => w[0])
                                .join('') || '؟'}
                            </div>
                            <div>
                              <h4 className="text-lg font-bold text-white">{advance.employeeName}</h4>
                              <p className="text-slate-400 text-xs">
                                {advance.requestedAt
                                  ? new Date(advance.requestedAt).toLocaleDateString('ar-SA')
                                  : ''}
                              </p>
                            </div>
                            <span className="bg-orange-500/10 text-orange-400 px-3 py-1 rounded-lg text-xs font-bold mr-auto">
                              قيد المراجعة
                            </span>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                            <div className="bg-white/5 p-4 rounded-xl">
                              <p className="text-slate-500 text-xs mb-1">المبلغ المطلوب</p>
                              <p className="text-purple-300 font-bold text-xl">{advance.amount} ر.س</p>
                            </div>
                            <div className="bg-white/5 p-4 rounded-xl md:col-span-2">
                              <p className="text-slate-500 text-xs mb-1">السبب</p>
                              <p className="text-slate-200 text-sm">{advance.reason || '—'}</p>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 min-w-[220px]">
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
                              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-lg text-sm font-medium transition-all"
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
              <PaginationControls
                page={pendingPage}
                totalPages={pendingTotalPages}
                totalCount={pendingTotalCount}
                onPageChange={setPendingPage}
              />
            </div>
          )}

          {activeTab === 'all' && (
            <div className="bg-luxury-surface rounded-[2.5rem] shadow-sm border border-white/5 overflow-hidden">
              {allAdvances.length === 0 ? (
                <div className="p-12 text-center text-slate-500">
                  <HandCoins size={48} className="mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">لا توجد طلبات سلفة</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-right border-collapse">
                    <thead className="bg-white/5 text-slate-400 text-[10px] font-black uppercase tracking-[0.15em]">
                      <tr>
                        <th className="p-6">الموظف</th>
                        <th className="p-6">المبلغ</th>
                        <th className="p-6">السبب</th>
                        <th className="p-6">الحالة</th>
                        <th className="p-6">تاريخ الطلب</th>
                        <th className="p-6">تمت المعالجة بواسطة</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {allAdvances.map((advance) => (
                        <tr key={advance.advanceId} className="hover:bg-white/5 transition-all">
                          <td className="p-6 font-bold text-slate-100">{advance.employeeName || '—'}</td>
                          <td className="p-6 font-bold text-purple-300">{advance.amount} ر.س</td>
                          <td className="p-6 text-slate-300 text-sm">{advance.reason || '—'}</td>
                          <td className="p-6">
                            <span
                              className={`px-3 py-1 rounded-lg text-xs font-bold ${
                                advance.status === 'Approved'
                                  ? 'bg-green-500/10 text-green-400'
                                  : advance.status === 'Rejected'
                                  ? 'bg-red-500/10 text-red-400'
                                  : 'bg-orange-500/10 text-orange-400'
                              }`}
                            >
                              {advance.status === 'Approved'
                                ? 'موافق'
                                : advance.status === 'Rejected'
                                ? 'مرفوض'
                                : 'معلق'}
                            </span>
                          </td>
                          <td className="p-6 text-slate-400 text-sm">
                            {advance.requestedAt
                              ? new Date(advance.requestedAt).toLocaleDateString('ar-SA')
                              : '—'}
                          </td>
                          <td className="p-6 text-slate-400 text-sm">{advance.processedByName || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <PaginationControls
                page={allPage}
                totalPages={allTotalPages}
                totalCount={allTotalCount}
                onPageChange={setAllPage}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default PayrollDashboard;
