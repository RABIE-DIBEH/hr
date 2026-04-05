import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  HandCoins,
  DollarSign,
  Clock,
  FileText,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  Search,
  Calculator,
  History,
} from 'lucide-react';
import PaginationControls from '../components/PaginationControls';
import Sidebar from '../components/Sidebar';
import {
  getCurrentEmployee,
  getPendingAdvanceRequestsPage,
  processAdvanceRequest,
  getAllAdvanceRequestsPage,
  downloadPayrollPdf,
  downloadPayrollExcel,
  getAllPayrollHistoryPage,
  calculatePayroll,
  listEmployees,
  type EmployeeProfile,
  type AdvanceRequest,
  type PayrollSlip,
  type EmployeeSummary,
} from '../services/api';

const PayrollDashboard = () => {
  const [me, setMe] = useState<EmployeeProfile | null>(null);
  const [activeTab, setActiveTab] = useState<'advances' | 'history' | 'calculate'>('advances');
  const [, setLoadError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());

  // Advances State
  const [pendingAdvances, setPendingAdvances] = useState<AdvanceRequest[]>([]);
  const [allAdvances, setAllAdvances] = useState<AdvanceRequest[]>([]);
  const [processingAdvance, setProcessingAdvance] = useState<number | null>(null);
  const [advanceNote, setAdvanceNote] = useState<string>('');
  const [selectedAdvanceId, setSelectedAdvanceId] = useState<number | null>(null);
  const [advancesSubTab, setAdvancesSubTab] = useState<'pending' | 'all'>('pending');
  const [pendingPage, setPendingPage] = useState(0);
  const [pendingTotalPages, setPendingTotalPages] = useState(0);
  const [pendingTotalCount, setPendingTotalCount] = useState(0);
  const [allPage, setAllPage] = useState(0);
  const [allTotalPages, setAllTotalPages] = useState(0);
  const [allTotalCount, setAllTotalCount] = useState(0);

  // History State
  const [slips, setSlips] = useState<PayrollSlip[]>([]);
  const [historyPage, setHistoryPage] = useState(0);
  const [historyTotalPages, setHistoryTotalPages] = useState(0);
  const [historyTotalCount, setHistoryTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  // Calculate State
  const [employees, setEmployees] = useState<EmployeeSummary[]>([]);
  const [calculatingId, setCalculatingId] = useState<number | null>(null);
  const [calcFeedback, setCalcFeedback] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const reportMonth = currentDate.getMonth() + 1;
  const reportYear = currentDate.getFullYear();

  useEffect(() => {
    getCurrentEmployee()
      .then((res) => setMe(res.data))
      .catch(() => setMe(null));
  }, []);

  const canManagePayroll = me?.roleName === 'HR'
    || me?.roleName === 'ADMIN'
    || me?.roleName === 'SUPER_ADMIN';

  // Load Advances
  const loadAdvancesData = async () => {
    if (!canManagePayroll) return;
    try {
      const [pendingRes, allRes] = await Promise.all([
        getPendingAdvanceRequestsPage({ page: pendingPage, size: 10 }),
        getAllAdvanceRequestsPage({ page: allPage, size: 10 }),
      ]);
      setPendingAdvances(pendingRes.data.items);
      setPendingTotalPages(pendingRes.data.totalPages);
      setPendingTotalCount(pendingRes.data.totalCount);
      setAllAdvances(allRes.data.items);
      setAllTotalPages(allRes.data.totalPages);
      setAllTotalCount(allRes.data.totalCount);
    } catch {
      setLoadError('تعذر تحميل بيانات السلف');
    }
  };

  // Load History
  const loadHistoryData = async () => {
    if (!canManagePayroll) return;
    try {
      const res = await getAllPayrollHistoryPage({ page: historyPage, size: 10 });
      setSlips(res.data.items);
      setHistoryTotalPages(res.data.totalPages);
      setHistoryTotalCount(res.data.totalCount);
    } catch {
      setLoadError('تعذر تحميل سجل الرواتب');
    }
  };

  // Load Employees for Calculation
  const loadEmployeesForCalc = async () => {
    if (!canManagePayroll) return;
    try {
      const res = await listEmployees();
      setEmployees(res.data);
    } catch {
      setLoadError('تعذر تحميل قائمة الموظفين');
    }
  };

  useEffect(() => {
    if (activeTab === 'advances') void loadAdvancesData();
    if (activeTab === 'history') void loadHistoryData();
    if (activeTab === 'calculate') void loadEmployeesForCalc();
  }, [activeTab, pendingPage, allPage, historyPage, canManagePayroll]);

  const handlePrevMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleDownloadPayroll = async (type: 'pdf' | 'excel') => {
    setIsDownloading(true);
    try {
      const response = type === 'pdf' 
        ? await downloadPayrollPdf(reportMonth, reportYear)
        : await downloadPayrollExcel(reportMonth, reportYear);
      
      const blob = new Blob([response.data], { 
        type: type === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `payroll_report_${reportMonth}_${reportYear}.${type === 'pdf' ? 'pdf' : 'xlsx'}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      alert('فشل تحميل تقرير الرواتب');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleProcessAdvance = async (advanceId: number, status: 'Approved' | 'Rejected') => {
    setProcessingAdvance(advanceId);
    try {
      await processAdvanceRequest(advanceId, status, advanceNote || undefined);
      setAdvanceNote('');
      setSelectedAdvanceId(null);
      void loadAdvancesData();
    } catch {
      setLoadError('فشل معالجة طلب السلفة');
    } finally {
      setProcessingAdvance(null);
    }
  };

  const handleRunCalculation = async (empId?: number) => {
    setCalculatingId(empId ?? -1); // -1 for "All"
    setCalcFeedback(null);
    try {
      await calculatePayroll(reportMonth, reportYear, empId);
      setCalcFeedback({ msg: 'تم احتساب الراتب بنجاح', type: 'success' });
      if (activeTab === 'history') void loadHistoryData();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'فشل احتساب الراتب';
      setCalcFeedback({ msg, type: 'error' });
    } finally {
      setCalculatingId(null);
    }
  };

  const totalApprovedAmount = allAdvances
    .filter((a) => a.status === 'Approved')
    .reduce((sum, a) => sum + (a.amount || 0), 0);

  const stats = [
    { label: 'سلف معلقة', value: String(pendingTotalCount), icon: Clock, color: 'text-orange-400', bg: 'bg-orange-500/10' },
    { label: 'إجمالي السلف', value: totalApprovedAmount.toLocaleString() + ' ر.س', icon: HandCoins, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { label: 'سجلات الرواتب', value: String(historyTotalCount), icon: History, color: 'text-green-400', bg: 'bg-green-500/10' },
  ];

  return (
    <div className="flex min-h-screen bg-black" dir="rtl">
      <Sidebar />

      <main className="mr-64 flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <header className="mb-10 flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-black text-white tracking-tight arabic-text">
                قسم الرواتب والتعويضات
              </h1>
              <p className="text-slate-400 mt-2">
                إدارة شاملة للسلف المالية، احتساب الرواتب، وسجلات الصرف
              </p>
            </div>
            <div className="flex items-center gap-3 bg-purple-500/10 px-6 py-3 rounded-2xl border border-purple-500/20">
              <DollarSign size={24} className="text-purple-400" />
              <span className="text-purple-100 font-black text-lg">Payroll Department</span>
            </div>
          </header>

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

          {/* Monthly Report Quick Export */}
          <div className="mb-10 bg-luxury-surface p-8 rounded-[2.5rem] border border-white/5 shadow-sm">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-3">
                  <FileText className="text-purple-500" size={24} />
                  تقارير الرواتب الشهرية
                </h3>
                <p className="text-slate-400 text-sm mt-1">تصدير ملخص الرواتب لجميع الموظفين حسب الشهر</p>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-3 bg-white/5 px-5 py-2 rounded-xl border border-white/5">
                  <button onClick={handlePrevMonth} className="text-slate-400 hover:text-white transition-colors">
                    <ChevronRight size={20} />
                  </button>
                  <span className="text-white font-bold min-w-[100px] text-center">
                    {currentDate.toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' })}
                  </span>
                  <button 
                    onClick={handleNextMonth} 
                    disabled={currentDate >= new Date()} 
                    className="text-slate-400 hover:text-white disabled:opacity-30 transition-colors"
                  >
                    <ChevronLeft size={20} />
                  </button>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleDownloadPayroll('pdf')}
                    disabled={isDownloading}
                    className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all text-sm"
                  >
                    <FileText size={16} />
                    {isDownloading ? '...' : 'تصدير PDF'}
                  </button>
                  <button 
                    onClick={() => handleDownloadPayroll('excel')}
                    disabled={isDownloading}
                    className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-800 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all text-sm"
                  >
                    <FileSpreadsheet size={16} />
                    {isDownloading ? '...' : 'تصدير Excel'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Main Tabs */}
          <div className="flex gap-2 mb-8 bg-white/5 p-1.5 rounded-2xl w-fit">
            <button
              onClick={() => setActiveTab('advances')}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
                activeTab === 'advances' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' : 'text-slate-400 hover:text-white'
              }`}
            >
              <HandCoins size={18} />
              السلف المالية
            </button>
            <button
              onClick={() => setActiveTab('calculate')}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
                activeTab === 'calculate' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Calculator size={18} />
              احتساب الرواتب
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
                activeTab === 'history' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' : 'text-slate-400 hover:text-white'
              }`}
            >
              <History size={18} />
              سجل الرواتب
            </button>
          </div>

          {/* Tab Content */}
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {activeTab === 'advances' && (
              <>
                <div className="flex gap-4 mb-4 border-b border-white/5">
                  <button
                    onClick={() => setAdvancesSubTab('pending')}
                    className={`pb-4 px-4 font-bold transition-all ${advancesSubTab === 'pending' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-slate-500'}`}
                  >
                    طلبات معلقة ({pendingTotalCount})
                  </button>
                  <button
                    onClick={() => setAdvancesSubTab('all')}
                    className={`pb-4 px-4 font-bold transition-all ${advancesSubTab === 'all' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-slate-500'}`}
                  >
                    جميع السجلات ({allTotalCount})
                  </button>
                </div>

                <div className="bg-luxury-surface rounded-[2.5rem] border border-white/5 overflow-hidden">
                  {advancesSubTab === 'pending' ? (
                    pendingAdvances.length === 0 ? (
                      <div className="p-20 text-center text-slate-500">لا توجد طلبات سلفة معلقة حالياً.</div>
                    ) : (
                      <div className="divide-y divide-white/5">
                        {pendingAdvances.map(advance => (
                          <div key={advance.advanceId} className="p-8 hover:bg-white/[0.02] transition-all">
                            <div className="flex justify-between items-start">
                              <div className="flex gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-400 font-black text-xl">
                                  {advance.employeeName?.[0] || '؟'}
                                </div>
                                <div>
                                  <h4 className="text-xl font-bold text-white">{advance.employeeName}</h4>
                                  <p className="text-slate-500 text-sm flex items-center gap-2 mt-1">
                                    <Clock size={14} /> {advance.requestedAt ? new Date(advance.requestedAt).toLocaleDateString('ar-SA') : ''}
                                  </p>
                                  <div className="mt-4 flex gap-8">
                                    <div>
                                      <p className="text-slate-500 text-xs font-bold uppercase mb-1">المبلغ</p>
                                      <p className="text-purple-300 font-black text-lg">{advance.amount} ر.س</p>
                                    </div>
                                    <div>
                                      <p className="text-slate-500 text-xs font-bold uppercase mb-1">السبب</p>
                                      <p className="text-slate-300 text-sm">{advance.reason || '—'}</p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="min-w-[250px]">
                                {selectedAdvanceId === advance.advanceId ? (
                                  <div className="space-y-3 p-4 bg-white/5 rounded-2xl border border-white/5">
                                    <textarea
                                      placeholder="ملاحظة المراجعة..."
                                      value={advanceNote}
                                      onChange={(e) => setAdvanceNote(e.target.value)}
                                      className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white resize-none h-20"
                                    />
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => handleProcessAdvance(advance.advanceId!, 'Approved')}
                                        disabled={processingAdvance === advance.advanceId}
                                        className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-xl text-sm disabled:opacity-50"
                                      >
                                        موافقة
                                      </button>
                                      <button
                                        onClick={() => handleProcessAdvance(advance.advanceId!, 'Rejected')}
                                        disabled={processingAdvance === advance.advanceId}
                                        className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded-xl text-sm disabled:opacity-50"
                                      >
                                        رفض
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => setSelectedAdvanceId(advance.advanceId!)}
                                    className="w-full bg-white/5 hover:bg-white/10 text-white font-bold py-4 rounded-2xl border border-white/5 transition-all"
                                  >
                                    اتخاذ قرار
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-right">
                        <thead className="bg-white/5 text-slate-400 text-[11px] font-black uppercase tracking-wider">
                          <tr>
                            <th className="p-6">الموظف</th>
                            <th className="p-6">المبلغ</th>
                            <th className="p-6">الحالة</th>
                            <th className="p-6">التاريخ</th>
                            <th className="p-6">المعالج</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-sm">
                          {allAdvances.map(adv => (
                            <tr key={adv.advanceId} className="hover:bg-white/[0.02]">
                              <td className="p-6 font-bold text-slate-100">{adv.employeeName}</td>
                              <td className="p-6 text-purple-300 font-bold">{adv.amount} ر.س</td>
                              <td className="p-6">
                                <span className={`px-3 py-1 rounded-lg font-bold text-xs ${
                                  adv.status === 'Approved' ? 'bg-green-500/10 text-green-400' :
                                  adv.status === 'Rejected' ? 'bg-red-500/10 text-red-400' : 'bg-orange-500/10 text-orange-400'
                                }`}>
                                  {adv.status === 'Approved' ? 'مقبول' : adv.status === 'Rejected' ? 'مرفوض' : 'معلق'}
                                </span>
                              </td>
                              <td className="p-6 text-slate-500">{adv.requestedAt ? new Date(adv.requestedAt).toLocaleDateString('ar-SA') : ''}</td>
                              <td className="p-6 text-slate-400">{adv.processedByName || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  {advancesSubTab === 'pending' ? (
                    <PaginationControls page={pendingPage} totalPages={pendingTotalPages} totalCount={pendingTotalCount} onPageChange={setPendingPage} />
                  ) : (
                    <PaginationControls page={allPage} totalPages={allTotalPages} totalCount={allTotalCount} onPageChange={setAllPage} />
                  )}
                </div>
              </>
            )}

            {activeTab === 'calculate' && (
              <div className="space-y-6">
                <div className="bg-purple-600/10 border border-purple-500/20 p-6 rounded-3xl flex justify-between items-center">
                  <div>
                    <h4 className="text-white font-bold text-lg">احتساب رواتب الشهر لجميع الموظفين</h4>
                    <p className="text-slate-400 text-sm mt-1">سيتم معالجة ساعات العمل المعتمدة وتحويلها إلى رواتب قابلة للصرف</p>
                  </div>
                  <button
                    onClick={() => handleRunCalculation()}
                    disabled={calculatingId !== null}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-8 py-4 rounded-2xl shadow-xl shadow-purple-500/20 disabled:opacity-50 transition-all flex items-center gap-3"
                  >
                    {calculatingId === -1 ? <Clock className="animate-spin" /> : <Calculator />}
                    احتساب الكل ({reportMonth}/{reportYear})
                  </button>
                </div>

                {calcFeedback && (
                  <div className={`p-4 rounded-2xl font-bold text-sm ${calcFeedback.type === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                    {calcFeedback.msg}
                  </div>
                )}

                <div className="bg-luxury-surface rounded-[2.5rem] border border-white/5 overflow-hidden">
                  <div className="p-6 border-b border-white/5 flex justify-between items-center">
                    <h5 className="text-white font-bold">احتساب فردي للموظفين</h5>
                    <div className="relative w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                      <input 
                        type="text" 
                        placeholder="بحث عن موظف..." 
                        className="bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-xs text-white w-full"
                      />
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-right">
                      <thead className="bg-white/5 text-slate-400 text-[11px] font-black uppercase">
                        <tr>
                          <th className="p-6">الموظف</th>
                          <th className="p-6">الراتب الأساسي</th>
                          <th className="p-6">الحالة</th>
                          <th className="p-6">الإجراء</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {employees.map(emp => (
                          <tr key={emp.employeeId} className="hover:bg-white/[0.02]">
                            <td className="p-6 font-bold text-slate-100">{emp.fullName}</td>
                            <td className="p-6 text-slate-300 font-bold">{emp.baseSalary} ر.س</td>
                            <td className="p-6">
                              <span className="bg-green-500/10 text-green-400 px-2 py-1 rounded-md text-[10px] font-bold">نشط</span>
                            </td>
                            <td className="p-6">
                              <button
                                onClick={() => handleRunCalculation(emp.employeeId)}
                                disabled={calculatingId !== null}
                                className="text-purple-400 hover:text-purple-300 font-bold text-sm flex items-center gap-2 disabled:opacity-50"
                              >
                                {calculatingId === emp.employeeId ? <Clock size={16} className="animate-spin" /> : <Calculator size={16} />}
                                احتساب الآن
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'history' && (
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input
                      type="text"
                      placeholder="بحث باسم الموظف في السجلات..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm text-white placeholder:text-slate-500 focus:ring-2 focus:ring-purple-500/20"
                    />
                  </div>
                </div>

                <div className="bg-luxury-surface rounded-[2.5rem] border border-white/5 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-right">
                      <thead className="bg-white/5 text-slate-400 text-[11px] font-black uppercase">
                        <tr>
                          <th className="p-6">الموظف</th>
                          <th className="p-6">الشهر</th>
                          <th className="p-6">ساعات العمل</th>
                          <th className="p-6">إضافي</th>
                          <th className="p-6">سلف مخصومة</th>
                          <th className="p-6">الصافي</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {slips.filter(s => s.employeeName?.includes(searchTerm)).map(slip => (
                          <tr key={slip.payrollId} className="hover:bg-white/[0.02]">
                            <td className="p-6 font-bold text-slate-100">{slip.employeeName}</td>
                            <td className="p-6 text-slate-400 text-xs">
                              {new Date(slip.year, slip.month - 1).toLocaleDateString('ar-SA', { month: 'long', year: 'numeric' })}
                            </td>
                            <td className="p-6 text-slate-300 font-bold">{slip.totalWorkHours} س</td>
                            <td className="p-6 text-blue-400 font-bold">{slip.overtimeHours} س</td>
                            <td className="p-6 text-red-400 font-bold">{slip.deductions} ر.س</td>
                            <td className="p-6 text-green-400 font-black text-lg">{slip.netSalary?.toLocaleString()} ر.س</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <PaginationControls page={historyPage} totalPages={historyTotalPages} totalCount={historyTotalCount} onPageChange={setHistoryPage} />
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default PayrollDashboard;
