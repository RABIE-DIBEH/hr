import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../services/queryKeys';
import {
  Bell,
  Briefcase,
  CalendarRange,
  Download,
  FileSpreadsheet,
  HandCoins,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import CurrentDateTimePanel from '../components/CurrentDateTimePanel';
import {
  downloadAttendanceExcel,
  downloadAttendancePdf,
  downloadLeaveExcel,
  downloadLeavePdf,
  downloadPayrollExcel,
  downloadPayrollPdf,
  downloadRecruitmentExcel,
  downloadRecruitmentPdf,
  getAllAdvanceRequests,
  getAllPayrollHistory,
  getCurrentEmployee,
  getHighPriorityMessages,
  getHrMonthlyAttendance,
  listEmployees,
  type AdvanceRequest,
  type AttendanceRecord,
  type EmployeeSummary,
  type InboxMessage,
} from '../services/api';
import { extractApiError } from '../utils/errorHandler';

type HeadStatus = 'present' | 'late' | 'absent';

type DepartmentStats = {
  department: string;
  employees: number;
  monthlySalary: number;
  payrollIssued: number;
  advances: number;
};

const chartColors = ['#d4af37', '#0891b2', '#10b981', '#f97316', '#8b5cf6', '#ef4444', '#3b82f6'];

const toNumber = (value: number | string | null | undefined | readonly (string | number)[]) => {
  if (Array.isArray(value)) return toNumber(value[0]);
  return typeof value === 'number' ? value : Number(value ?? 0) || 0;
};

const formatMoney = (value: number, language: string) =>
  new Intl.NumberFormat(language === 'ar' ? 'ar-EG' : 'en-US', {
    maximumFractionDigits: 0,
  }).format(value);

const formatMonthYear = (date: Date, language: string) =>
  date.toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', {
    month: 'long',
    year: 'numeric',
  });

const formatDateTime = (value: string | undefined, language: string, fallback: string) => {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return date.toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US');
};

const formatDateOnly = (value: string | undefined, language: string, fallback: string) => {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return date.toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US');
};

const getDepartmentName = (employee: EmployeeSummary, fallback: string) => employee.departmentName?.trim() || employee.teamName?.trim() || fallback;

const getMonthKey = (value?: string) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};

const saveBlob = (blob: Blob, fileName: string) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

const saveCsv = (fileName: string, rows: Array<Array<string | number>>) => {
  const csv = rows
    .map((cols) => cols.map((col) => `"${String(col ?? '').replaceAll('"', '""')}"`).join(','))
    .join('\n');
  saveBlob(new Blob([csv], { type: 'text/csv;charset=utf-8' }), fileName);
};

const getHeadStatus = (record?: AttendanceRecord): HeadStatus => {
  if (!record?.checkIn) return 'absent';
  const checkIn = new Date(record.checkIn);
  return checkIn.getHours() > 9 || (checkIn.getHours() === 9 && checkIn.getMinutes() > 15) ? 'late' : 'present';
};

const headStatusLabel = (status: HeadStatus, t: (key: string) => string) => ({
  present: t('ceoDashboard.attendance.present'),
  late: t('ceoDashboard.attendance.late'),
  absent: t('ceoDashboard.attendance.absent'),
}[status]);

const headStatusClass = (status: HeadStatus) => ({
  present: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
  late: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
  absent: 'bg-rose-500/10 text-rose-300 border-rose-500/20',
}[status]);

const CEODashboard = () => {
  const { t, i18n } = useTranslation();
  const [reportDate, setReportDate] = useState(new Date());
  const [exporting, setExporting] = useState<string | null>(null);

  const reportMonth = reportDate.getMonth() + 1;
  const reportYear = reportDate.getFullYear();
  const reportMonthId = `${reportYear}-${String(reportMonth).padStart(2, '0')}`;

  const meQuery = useQuery({ queryKey: queryKeys.me, queryFn: async () => (await getCurrentEmployee()).data });
  const employeesQuery = useQuery({ queryKey: queryKeys.hr.employeesRoot, queryFn: async () => (await listEmployees()).data });
  const attendanceQuery = useQuery({ queryKey: queryKeys.attendance.hrMonthly(reportMonth, reportYear, 0), queryFn: async () => (await getHrMonthlyAttendance(reportMonth, reportYear)).data });
  const payrollQuery = useQuery({ queryKey: queryKeys.payroll.history(0), queryFn: async () => (await getAllPayrollHistory()).data });
  const advancesQuery = useQuery({ queryKey: ['payroll', 'advances'], queryFn: async () => (await getAllAdvanceRequests('DELIVERED')).data });
  const alertsQuery = useQuery({ queryKey: queryKeys.inbox.list('HIGH', 0), queryFn: async () => (await getHighPriorityMessages()).data });

  const loading = meQuery.isLoading || employeesQuery.isLoading || attendanceQuery.isLoading || payrollQuery.isLoading || advancesQuery.isLoading || alertsQuery.isLoading;
  const error = meQuery.error || employeesQuery.error || attendanceQuery.error || payrollQuery.error || advancesQuery.error || alertsQuery.error;

  const data = useMemo(() => {
    const employees = employeesQuery.data ?? [];
    const attendance = attendanceQuery.data ?? [];
    const payroll = payrollQuery.data ?? [];
    const advances = advancesQuery.data ?? [];
    const alerts = alertsQuery.data ?? [];

    const today = new Date().toISOString().slice(0, 10);
    const activeEmployees = employees.filter((employee) => employee.employmentStatus === 'Active');
    const managers = activeEmployees.filter((employee) => employee.roleName === 'MANAGER');
    const employeeById = new Map(activeEmployees.map((employee) => [employee.employeeId, employee]));

    const latestAttendance = new Map<number, AttendanceRecord>();
    for (const record of attendance) {
      const oldRecord = latestAttendance.get(record.employeeId);
      const currentTime = record.checkIn ? new Date(record.checkIn).getTime() : -1;
      const oldTime = oldRecord?.checkIn ? new Date(oldRecord.checkIn).getTime() : -1;
      if (!oldRecord || currentTime > oldTime) {
        latestAttendance.set(record.employeeId, record);
      }
    }

    const headRows = managers.map((manager) => {
      const todayRecord = attendance.find(
        (record) => record.employeeId === manager.employeeId && record.checkIn?.slice(0, 10) === today,
      );
      const status = getHeadStatus(todayRecord);

      return {
        employeeId: manager.employeeId,
        name: manager.fullName,
        department: getDepartmentName(manager, t('ceoDashboard.fallback.unspecified')),
        status,
        checkIn: (todayRecord ?? latestAttendance.get(manager.employeeId))?.checkIn,
      };
    });

    const headTotals = headRows.reduce(
      (acc, row) => {
        acc[row.status] += 1;
        return acc;
      },
      { present: 0, late: 0, absent: 0 },
    );

    const salaryTotal = activeEmployees.reduce((sum, employee) => sum + toNumber(employee.baseSalary), 0);
    const advancesThisMonth = advances.filter(
      (item) => getMonthKey(item.paidAt ?? item.processedAt ?? item.requestedAt) === reportMonthId,
    );
    const advanceTotal = advancesThisMonth.reduce((sum, item) => sum + toNumber(item.amount), 0);

    const departmentMap = new Map<string, DepartmentStats>();
    for (const employee of activeEmployees) {
      const key = getDepartmentName(employee, t('ceoDashboard.fallback.unspecified'));
      const current = departmentMap.get(key) ?? {
        department: key,
        employees: 0,
        monthlySalary: 0,
        payrollIssued: 0,
        advances: 0,
      };
      current.employees += 1;
      current.monthlySalary += toNumber(employee.baseSalary);
      departmentMap.set(key, current);
    }

    for (const slip of payroll.filter((item) => item.month === reportMonth && item.year === reportYear)) {
      const employee = employeeById.get(slip.employeeId);
      if (!employee) continue;
      const current = departmentMap.get(getDepartmentName(employee, t('ceoDashboard.fallback.unspecified')));
      if (current) current.payrollIssued += toNumber(slip.netSalary);
    }

    for (const advance of advancesThisMonth) {
      const employee = employeeById.get(advance.employeeId ?? -1);
      if (!employee) continue;
      const current = departmentMap.get(getDepartmentName(employee, t('ceoDashboard.fallback.unspecified')));
      if (current) current.advances += toNumber(advance.amount);
    }

    const departments = [...departmentMap.values()].sort((a, b) => b.monthlySalary - a.monthlySalary);

    const trendSeed = new Map<string, number>();
    for (let index = 5; index >= 0; index -= 1) {
      const date = new Date(reportYear, reportMonth - 1 - index, 1);
      trendSeed.set(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`, 0);
    }
    for (const advance of advances) {
      const key = getMonthKey(advance.paidAt ?? advance.processedAt ?? advance.requestedAt);
      if (trendSeed.has(key)) {
        trendSeed.set(key, (trendSeed.get(key) ?? 0) + toNumber(advance.amount));
      }
    }

    const recentAlerts = alerts
      .slice()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);

    const paymentHistory = advances
      .slice()
      .sort((a, b) => new Date(b.paidAt ?? b.processedAt ?? b.requestedAt ?? 0).getTime() - new Date(a.paidAt ?? a.processedAt ?? a.requestedAt ?? 0).getTime())
      .slice(0, 8);

    return {
      activeEmployees,
      headRows,
      headTotals,
      salaryTotal,
      advanceTotal,
      departments,
      salaryDistribution: departments.map((item) => ({
        name: item.department,
        value: item.monthlySalary,
      })),
      trend: [...trendSeed.entries()].map(([key, amount]) => {
        const [year, month] = key.split('-').map(Number);
        return {
          month: new Date(year, month - 1, 1).toLocaleDateString(i18n.language === 'ar' ? 'ar-EG' : 'en-US', { month: 'short' }),
          amount,
        };
      }),
      paymentHistory,
      recentAlerts,
    };
  }, [
    advancesQuery.data,
    alertsQuery.data,
    attendanceQuery.data,
    employeesQuery.data,
    payrollQuery.data,
    reportMonth,
    reportMonthId,
    reportYear,
    t,
    i18n.language,
  ]);

  const downloadReport = async (
    key: string,
    fileName: string,
    loader: () => Promise<{ data: BlobPart }>,
  ) => {
    setExporting(key);
    try {
      const response = await loader();
      saveBlob(new Blob([response.data]), fileName);
    } finally {
      setExporting(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="rounded-[2rem] border border-white/10 bg-white/5 px-8 py-6 text-lg font-bold text-white">
          {t('ceoDashboard.loading')}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-[2rem] border border-rose-500/20 bg-rose-500/10 p-8 text-rose-100">
        {extractApiError(error).message}
      </div>
    );
  }

  const summaryCards = [
    { label: t('ceoDashboard.summary.employees'), value: data.activeEmployees.length, subLabel: t('ceoDashboard.summary.employeesSub'), icon: Users, tone: 'text-sky-300 bg-sky-500/10 border-sky-500/20' },
    { label: t('ceoDashboard.summary.salary'), value: `${formatMoney(data.salaryTotal, i18n.language)}${t('ceoDashboard.fallback.currency')}`, subLabel: t('ceoDashboard.summary.salarySub'), icon: Wallet, tone: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20' },
    { label: t('ceoDashboard.summary.advances'), value: `${formatMoney(data.advanceTotal, i18n.language)}${t('ceoDashboard.fallback.currency')}`, subLabel: t('ceoDashboard.summary.advancesSub'), icon: HandCoins, tone: 'text-amber-300 bg-amber-500/10 border-amber-500/20' },
    { label: t('ceoDashboard.summary.alerts'), value: data.recentAlerts.length, subLabel: t('ceoDashboard.summary.alertsSub'), icon: Bell, tone: 'text-rose-300 bg-rose-500/10 border-rose-500/20' },
  ];

  return (
    <div className="space-y-8" dir="rtl">
      <header className="relative overflow-hidden rounded-[2.75rem] border border-white/7 bg-[linear-gradient(135deg,rgba(18,18,18,0.98),rgba(18,18,18,0.82)),radial-gradient(circle_at_top_right,rgba(212,175,55,0.18),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(8,145,178,0.16),transparent_30%)] p-8 lg:p-10 shadow-[0_30px_80px_rgba(0,0,0,0.35)]">
        <div className="absolute -top-12 left-10 h-40 w-40 rounded-full bg-amber-400/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-48 w-48 rounded-full bg-cyan-400/10 blur-3xl" />

        <div className="relative flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-4 py-2 text-xs font-bold text-amber-300">
              <Sparkles size={14} />
              {t('ceoDashboard.title')}
            </div>
            <h1 className="mt-5 text-4xl font-black leading-tight text-white lg:text-5xl">
              {t('ceoDashboard.heroTitle')}
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-8 text-slate-300 lg:text-lg">
              {t('ceoDashboard.heroSubtitle')}
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <div className="rounded-2xl border border-white/8 bg-white/[0.04] px-5 py-4">
                <p className="text-xs text-slate-500">المستخدم الحالي</p>
                <p className="mt-1 text-sm font-bold text-white">{meQuery.data?.fullName ?? '—'}</p>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/[0.04] px-5 py-4">
                <p className="text-xs text-slate-500">{t('ceoDashboard.periodLabel')}</p>
                <p className="mt-1 text-sm font-bold text-white">{formatMonthYear(reportDate, i18n.language)}</p>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/[0.04] px-5 py-4">
                <p className="text-xs text-slate-500">{t('ceoDashboard.statusLabel')}</p>
                <p className="mt-1 text-sm font-bold text-emerald-300">{t('ceoDashboard.statusUpdated')}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4 xl:min-w-[360px]">
            <CurrentDateTimePanel />
            <div className="rounded-[2rem] border border-white/8 bg-black/30 p-4 backdrop-blur-xl">
              <div className="mb-3 flex items-center gap-2 text-sm font-bold text-white">
                <CalendarRange size={16} className="text-amber-300" />
                {t('ceoDashboard.monthPicker')}
              </div>
              <div className="flex items-center justify-between gap-3">
                <button type="button" onClick={() => setReportDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))} className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-slate-200 transition hover:bg-white/10">{t('ceoDashboard.prevMonth')}</button>
                <span className="text-sm font-black text-white">{formatMonthYear(reportDate, i18n.language)}</span>
                <button type="button" onClick={() => setReportDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))} disabled={reportDate >= new Date(new Date().getFullYear(), new Date().getMonth(), 1)} className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-slate-200 transition hover:bg-white/10 disabled:opacity-40">{t('ceoDashboard.nextMonth')}</button>
              </div>
            </div>
            </div>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-5 md:grid-cols-2 2xl:grid-cols-4">
        {summaryCards.map((card) => (
          <div key={card.label} className="group rounded-[2rem] border border-white/6 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-6 shadow-[0_18px_40px_rgba(0,0,0,0.24)] transition duration-300 hover:-translate-y-1 hover:border-white/12">
            <div className={`inline-flex rounded-2xl border p-3 ${card.tone}`}><card.icon size={22} /></div>
            <p className="mt-5 text-sm font-medium text-slate-400">{card.label}</p>
            <p className="mt-2 text-3xl font-black text-white">{card.value}</p>
            <p className="mt-2 text-xs text-slate-500">{card.subLabel}</p>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.25fr_0.95fr]">
        <div className="rounded-[2.5rem] border border-white/6 bg-luxury-surface p-7 shadow-[0_24px_70px_rgba(0,0,0,0.28)]">
          <div className="flex flex-col gap-3 border-b border-white/6 pb-5 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-2xl font-black text-white">{t('ceoDashboard.attendance.title')}</h2>
              <p className="mt-2 text-sm leading-7 text-slate-400">{t('ceoDashboard.attendance.subtitle')}</p>
            </div>
            <div className="flex flex-wrap gap-2 text-sm font-bold">
              <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-emerald-300">{t('ceoDashboard.attendance.present')}: {data.headTotals.present}</span>
              <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-4 py-2 text-amber-300">{t('ceoDashboard.attendance.late')}: {data.headTotals.late}</span>
              <span className="rounded-full border border-rose-500/20 bg-rose-500/10 px-4 py-2 text-rose-300">{t('ceoDashboard.attendance.absent')}: {data.headTotals.absent}</span>
            </div>
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[720px] text-right">
              <thead className="text-xs font-bold text-slate-500">
                <tr><th className="pb-4">{t('ceoDashboard.attendance.table.head')}</th><th className="pb-4">{t('ceoDashboard.attendance.table.department')}</th><th className="pb-4">{t('ceoDashboard.attendance.table.status')}</th><th className="pb-4">{t('ceoDashboard.attendance.table.lastCheckIn')}</th></tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {data.headRows.map((item) => (
                  <tr key={item.employeeId} className="transition hover:bg-white/[0.03]">
                    <td className="py-4 text-sm font-bold text-white">{item.name}</td>
                    <td className="py-4 text-sm text-slate-300">{item.department}</td>
                    <td className="py-4"><span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${headStatusClass(item.status)}`}>{headStatusLabel(item.status, t)}</span></td>
                    <td className="py-4 text-sm text-slate-400">{formatDateTime(item.checkIn, i18n.language, '—')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-[2.5rem] border border-white/6 bg-luxury-surface p-7 shadow-[0_24px_70px_rgba(0,0,0,0.28)]">
          <div className="flex items-center gap-3 border-b border-white/6 pb-5">
            <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-3 text-rose-300"><ShieldAlert size={20} /></div>
            <div>
              <h2 className="text-2xl font-black text-white">{t('ceoDashboard.alerts.title')}</h2>
              <p className="mt-1 text-sm text-slate-400">{t('ceoDashboard.alerts.subtitle')}</p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {data.recentAlerts.length === 0 && <div className="rounded-2xl border border-white/5 bg-black/20 p-5 text-sm text-slate-400">{t('ceoDashboard.alerts.empty')}</div>}
            {data.recentAlerts.map((alert: InboxMessage) => (
              <div key={alert.messageId} className="rounded-[1.6rem] border border-white/5 bg-black/20 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-black text-white">{alert.title}</p>
                    <p className="mt-2 text-sm leading-7 text-slate-400">{alert.message}</p>
                  </div>
                  <span className="rounded-full border border-rose-500/20 bg-rose-500/10 px-3 py-1 text-[11px] font-bold text-rose-300">{alert.priority === 'HIGH' ? t('ceoDashboard.alerts.priority.high') : alert.priority === 'MEDIUM' ? t('ceoDashboard.alerts.priority.medium') : t('ceoDashboard.alerts.priority.low')}</span>
                </div>
                <div className="mt-4 text-xs text-slate-500">{t('ceoDashboard.alerts.sender')}{alert.senderName} | {formatDateTime(alert.createdAt, i18n.language, '—')}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-[2.5rem] border border-white/6 bg-luxury-surface p-7 shadow-[0_24px_70px_rgba(0,0,0,0.28)]">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black text-white">{t('ceoDashboard.trends.title')}</h2>
              <p className="mt-1 text-sm text-slate-400">{t('ceoDashboard.trends.subtitle')}</p>
            </div>
            <TrendingUp className="text-amber-300" size={22} />
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.trend}>
                <CartesianGrid stroke="#ffffff10" strokeDasharray="4 4" vertical={false} />
                <XAxis dataKey="month" stroke="#94a3b8" axisLine={false} tickLine={false} />
                <YAxis stroke="#94a3b8" axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0f1115', border: '1px solid #ffffff10', borderRadius: '14px' }} formatter={(value) => [`${formatMoney(toNumber(value), i18n.language)}${t('ceoDashboard.fallback.currency')}`, t('ceoDashboard.trends.tooltip')]} />
                <Legend />
                <Line type="monotone" dataKey="amount" name={t('ceoDashboard.trends.name')} stroke="#d4af37" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-[2.5rem] border border-white/6 bg-luxury-surface p-7 shadow-[0_24px_70px_rgba(0,0,0,0.28)]">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black text-white">{t('ceoDashboard.distribution.title')}</h2>
              <p className="mt-1 text-sm text-slate-400">{t('ceoDashboard.distribution.subtitle')}</p>
            </div>
            <Wallet className="text-emerald-300" size={22} />
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data.salaryDistribution} dataKey="value" nameKey="name" innerRadius={60} outerRadius={102} paddingAngle={3}>
                  {data.salaryDistribution.map((item, index) => <Cell key={item.name} fill={chartColors[index % chartColors.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0f1115', border: '1px solid #ffffff10', borderRadius: '14px' }} formatter={(value) => [`${formatMoney(toNumber(value), i18n.language)}${t('ceoDashboard.fallback.currency')}`, t('ceoDashboard.distribution.tooltip')]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[2.5rem] border border-white/6 bg-luxury-surface p-7 shadow-[0_24px_70px_rgba(0,0,0,0.28)]">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black text-white">{t('ceoDashboard.departments.title')}</h2>
              <p className="mt-1 text-sm text-slate-400">{t('ceoDashboard.departments.subtitle')}</p>
            </div>
            <Briefcase className="text-sky-300" size={22} />
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.departments}>
                <CartesianGrid stroke="#ffffff10" strokeDasharray="4 4" vertical={false} />
                <XAxis dataKey="department" stroke="#94a3b8" axisLine={false} tickLine={false} />
                <YAxis stroke="#94a3b8" axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0f1115', border: '1px solid #ffffff10', borderRadius: '14px' }} formatter={(value, name) => [`${formatMoney(toNumber(value), i18n.language)}${t('ceoDashboard.fallback.currency')}`, String(name)]} />
                <Legend />
                <Bar dataKey="monthlySalary" name={t('ceoDashboard.departments.table.budget')} fill="#0891b2" radius={[8, 8, 0, 0]} />
                <Bar dataKey="payrollIssued" name={t('ceoDashboard.departments.table.actual')} fill="#10b981" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[760px] text-right">
              <thead className="text-xs font-bold text-slate-500">
                <tr><th className="pb-4">{t('ceoDashboard.departments.table.department')}</th><th className="pb-4">{t('ceoDashboard.departments.table.count')}</th><th className="pb-4">{t('ceoDashboard.departments.table.budget')}</th><th className="pb-4">{t('ceoDashboard.departments.table.actual')}</th><th className="pb-4">{t('ceoDashboard.departments.table.advances')}</th></tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {data.departments.map((item) => (
                  <tr key={item.department} className="transition hover:bg-white/[0.03]">
                    <td className="py-4 text-sm font-bold text-white">{item.department}</td>
                    <td className="py-4 text-sm text-slate-300">{item.employees}</td>
                    <td className="py-4 text-sm text-slate-300">{formatMoney(item.monthlySalary, i18n.language)}{t('ceoDashboard.fallback.currency')}</td>
                    <td className="py-4 text-sm text-slate-300">{formatMoney(item.payrollIssued, i18n.language)}{t('ceoDashboard.fallback.currency')}</td>
                    <td className="py-4 text-sm text-slate-300">{formatMoney(item.advances, i18n.language)}{t('ceoDashboard.fallback.currency')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[2.5rem] border border-white/6 bg-luxury-surface p-7 shadow-[0_24px_70px_rgba(0,0,0,0.28)]">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-white">{t('ceoDashboard.history.title')}</h2>
                <p className="mt-1 text-sm text-slate-400">{t('ceoDashboard.history.subtitle')}</p>
              </div>
              <HandCoins className="text-amber-300" size={22} />
            </div>

            <div className="space-y-3">
              {data.paymentHistory.map((item: AdvanceRequest) => (
                <div key={item.advanceId} className="rounded-[1.6rem] border border-white/5 bg-black/20 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-bold text-white">{item.employeeName ?? t('ceoDashboard.history.fallback', { id: item.employeeId ?? '—' })}</p>
                      <p className="mt-2 text-sm text-slate-400">{item.reason || t('ceoDashboard.history.reasonFallback')}</p>
                    </div>
                    <div className="text-left">
                      <p className="font-black text-amber-300">{formatMoney(toNumber(item.amount), i18n.language)}{t('ceoDashboard.fallback.currency')}</p>
                      <p className="mt-2 text-xs text-slate-500">{formatDateOnly(item.paidAt ?? item.processedAt ?? item.requestedAt, i18n.language, t('ceoDashboard.fallback.unspecified'))}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2.5rem] border border-white/6 bg-luxury-surface p-7 shadow-[0_24px_70px_rgba(0,0,0,0.28)]">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-white">{t('ceoDashboard.reports.title')}</h2>
                <p className="mt-1 text-sm text-slate-400">{t('ceoDashboard.reports.subtitle')}</p>
              </div>
              <Download className="text-slate-300" size={22} />
            </div>

            <div className="space-y-4">
              <div className="rounded-[1.6rem] border border-white/5 bg-black/20 p-4">
                <p className="font-bold text-white">{t('ceoDashboard.reports.advanceCsv.title')}</p>
                <p className="mt-1 text-sm text-slate-400">{t('ceoDashboard.reports.advanceCsv.subtitle')}</p>
                <button type="button" onClick={() => saveCsv(`${t('ceoDashboard.reports.advanceCsv.title')}-${reportMonth}-${reportYear}.csv`, [['Employee ID', 'Name', 'Amount', 'Date'], ...data.paymentHistory.map((item) => [item.employeeId ?? '', item.employeeName ?? '', toNumber(item.amount), item.paidAt ?? item.processedAt ?? item.requestedAt ?? ''])])} className="mt-3 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/10"><FileSpreadsheet size={16} />{t('ceoDashboard.reports.advanceCsv.button')}</button>
              </div>
              <div className="rounded-[1.6rem] border border-white/5 bg-black/20 p-4">
                <p className="font-bold text-white">{t('ceoDashboard.reports.ops.title')}</p>
                <p className="mt-1 text-sm text-slate-400">{t('ceoDashboard.reports.ops.subtitle')}</p>
                <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <button type="button" onClick={() => downloadReport('payroll-pdf', `payroll-report-${reportMonth}-${reportYear}.pdf`, () => downloadPayrollPdf(reportMonth, reportYear))} className="rounded-xl bg-purple-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-purple-700">{exporting === 'payroll-pdf' ? t('ceoDashboard.reports.ops.downloading') : t('ceoDashboard.reports.ops.payrollPdf')}</button>
                  <button type="button" onClick={() => downloadReport('payroll-xlsx', `payroll-report-${reportMonth}-${reportYear}.xlsx`, () => downloadPayrollExcel(reportMonth, reportYear))} className="rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-700">{exporting === 'payroll-xlsx' ? t('ceoDashboard.reports.ops.downloading') : t('ceoDashboard.reports.ops.payrollExcel')}</button>
                  <button type="button" onClick={() => downloadReport('attendance-pdf', `attendance-report-${reportMonth}-${reportYear}.pdf`, () => downloadAttendancePdf(reportMonth, reportYear))} className="rounded-xl bg-sky-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-sky-700">{exporting === 'attendance-pdf' ? t('ceoDashboard.reports.ops.downloading') : t('ceoDashboard.reports.ops.attendancePdf')}</button>
                  <button type="button" onClick={() => downloadReport('attendance-xlsx', `attendance-report-${reportMonth}-${reportYear}.xlsx`, () => downloadAttendanceExcel(reportMonth, reportYear))} className="rounded-xl bg-cyan-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-cyan-700">{exporting === 'attendance-xlsx' ? t('ceoDashboard.reports.ops.downloading') : t('ceoDashboard.reports.ops.attendanceExcel')}</button>
                  <button type="button" onClick={() => downloadReport('leave-pdf', `leave-report-${reportMonth}-${reportYear}.pdf`, () => downloadLeavePdf(reportMonth, reportYear))} className="rounded-xl bg-orange-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-orange-700">{exporting === 'leave-pdf' ? t('ceoDashboard.reports.ops.downloading') : t('ceoDashboard.reports.ops.leavePdf')}</button>
                  <button type="button" onClick={() => downloadReport('leave-xlsx', `leave-report-${reportMonth}-${reportYear}.xlsx`, () => downloadLeaveExcel(reportMonth, reportYear))} className="rounded-xl bg-amber-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-amber-700">{exporting === 'leave-xlsx' ? t('ceoDashboard.reports.ops.downloading') : t('ceoDashboard.reports.ops.leaveExcel')}</button>
                  <button type="button" onClick={() => downloadReport('recruitment-pdf', `recruitment-report-${reportMonth}-${reportYear}.pdf`, () => downloadRecruitmentPdf(reportMonth, reportYear))} className="rounded-xl bg-fuchsia-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-fuchsia-700">{exporting === 'recruitment-pdf' ? t('ceoDashboard.reports.ops.downloading') : t('ceoDashboard.reports.ops.recruitmentPdf')}</button>
                  <button type="button" onClick={() => downloadReport('recruitment-xlsx', `recruitment-report-${reportMonth}-${reportYear}.xlsx`, () => downloadRecruitmentExcel(reportMonth, reportYear))} className="rounded-xl bg-rose-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-rose-700">{exporting === 'recruitment-xlsx' ? t('ceoDashboard.reports.ops.downloading') : t('ceoDashboard.reports.ops.recruitmentExcel')}</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default CEODashboard;
