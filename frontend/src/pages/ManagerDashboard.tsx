import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  UserCheck,
  AlertTriangle,
  FileText,
  Search,
  Filter,
  CheckCircle2,
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { getCurrentEmployee, listMyTeam, type EmployeeProfile, type EmployeeSummary } from '../services/api';

const ManagerDashboard = () => {
  const [me, setMe] = useState<EmployeeProfile | null>(null);
  const [team, setTeam] = useState<EmployeeSummary[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getCurrentEmployee()
      .then((res) => setMe(res.data))
      .catch(() => setMe(null));
  }, []);

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
  }, [me?.roleName]);

  const stats = [
    {
      label: 'إجمالي الفريق',
      value: String(team.length),
      icon: Users,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: 'بطاقة NFC مفعّلة',
      value: String(team.filter((m) => m.nfcLinked).length),
      icon: UserCheck,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      label: 'بدون بطاقة',
      value: String(team.filter((m) => !m.nfcLinked).length),
      icon: AlertTriangle,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
    },
  ];

  const headerTeam = me?.teamName ?? 'فريقك';

  return (
    <div className="flex min-h-screen bg-slate-50" dir="rtl">
      <Sidebar />
<<<<<<< HEAD
      <main className="mr-64 flex-1 p-8">
=======

      <main className="ml-64 flex-1 p-8">
>>>>>>> 1083b464f3ade98fc9e05d7fba9e03f3abd54a26
        <div className="max-w-7xl mx-auto">
          <header className="flex justify-between items-center mb-10">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight arabic-text">إدارة الفريق</h1>
              <p className="text-slate-500 mt-1">
                {headerTeam} • بيانات مباشرة من الخادم
              </p>
            </div>
            <button
              type="button"
              className="flex items-center gap-2 bg-white border px-4 py-2.5 rounded-xl shadow-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all"
            >
              <FileText size={18} />
              <span>تصدير تقرير Excel</span>
            </button>
          </header>

          {me?.roleName !== 'MANAGER' && (
            <div className="mb-6 p-4 rounded-xl bg-amber-50 text-amber-900 text-sm">
              عرض القائمة مخصص لحسابات <strong>MANAGER</strong>. حسابك الحالي: {me?.roleName ?? '—'}.
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 text-red-800 text-sm font-medium">{error}</div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {stats.map((stat, idx) => (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                key={stat.label}
                className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100"
              >
                <div className={`${stat.bg} ${stat.color} w-12 h-12 rounded-2xl flex items-center justify-center mb-4`}>
                  <stat.icon size={24} />
                </div>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">{stat.label}</p>
                <p className="text-3xl font-black text-slate-900">{stat.value}</p>
              </motion.div>
            ))}
          </div>

          <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <h2 className="text-xl font-bold text-slate-900">المرؤوسون المباشرون</h2>
              <div className="flex gap-3 w-full md:w-auto">
                <div className="relative flex-1 md:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text"
                    placeholder="بحث عن موظف..."
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 rounded-xl text-sm transition-all"
                  />
                </div>
                <button
                  type="button"
                  className="bg-slate-50 p-2.5 rounded-xl text-slate-500 hover:bg-slate-100 transition-all border border-slate-100"
                >
                  <Filter size={20} />
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-[0.15em]">
                    <th className="p-6">الموظف</th>
                    <th className="p-6">البريد</th>
                    <th className="p-6">الفريق</th>
                    <th className="p-6">NFC</th>
                    <th className="p-6 text-center">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
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
                      <tr key={emp.employeeId} className="hover:bg-slate-50/50 transition-all group">
                        <td className="p-6">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 text-sm group-hover:bg-blue-600 group-hover:text-white transition-all">
                              {emp.fullName
                                .split(/\s+/)
                                .filter(Boolean)
                                .slice(0, 2)
                                .map((w) => w[0])
                                .join('')}
                            </div>
                            <span className="font-bold text-slate-800">{emp.fullName}</span>
                          </div>
                        </td>
                        <td className="p-6 text-slate-600 text-sm">{emp.email}</td>
                        <td className="p-6 text-slate-500 text-sm font-medium">{emp.teamName ?? '—'}</td>
                        <td className="p-6 font-mono text-slate-600 text-sm">{emp.cardUid ?? '—'}</td>
                        <td className="p-6 text-center">
                          <div className="flex flex-col items-center gap-2">
                            <span
                              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1.5 ${
                                emp.nfcLinked ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-500'
                              }`}
                            >
                              <div
                                className={`w-1.5 h-1.5 rounded-full ${emp.nfcLinked ? 'bg-green-500' : 'bg-slate-400'}`}
                              />
                              {emp.nfcLinked ? 'بطاقة مرتبطة' : 'بدون بطاقة'}
                            </span>
                            <span className="text-slate-400 flex items-center gap-1 text-[10px] font-bold">
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

            <div className="p-6 bg-slate-50/30 border-t border-slate-50 flex justify-between items-center text-xs text-slate-400 font-medium">
              <p>إجمالي {team.length} موظفاً في فريقك</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ManagerDashboard;
