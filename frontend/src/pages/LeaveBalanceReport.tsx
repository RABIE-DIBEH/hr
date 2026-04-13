import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Calendar,
  Search,
  Filter,
  ArrowRight,
  Download,
} from 'lucide-react';
import { getLeaveBalanceReport } from '../services/api';
import { queryKeys } from '../services/queryKeys';
import { getRole } from '../services/auth';

const LeaveBalanceReport = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const userRole = getRole() || '';
  const isHighRole = ['HR', 'ADMIN', 'SUPER_ADMIN'].includes(userRole);

  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('ALL');

  // React Query: fetch leave balance report from dedicated endpoint
  const { data: employees = [], isLoading } = useQuery({
    queryKey: queryKeys.users.leaveBalanceReport,
    queryFn: async () => {
      const res = await getLeaveBalanceReport();
      return res.data;
    },
    enabled: isHighRole,
  });

  if (!isHighRole) {
    navigate('/dashboard');
    return null;
  }

  const filtered = employees.filter((emp) => {
    const matchesSearch =
      search === '' ||
      emp.fullName.toLowerCase().includes(search.toLowerCase()) ||
      emp.email.toLowerCase().includes(search.toLowerCase());
    const matchesDept = deptFilter === 'ALL' || emp.departmentName === deptFilter;
    return matchesSearch && matchesDept;
  });

  const departments = Array.from(new Set(employees.map(e => e.departmentName).filter(Boolean)));

  return (
    <div className="min-h-screen bg-zinc-950 text-white" dir={i18n.dir()}>
      {/* Header */}
      <div className="bg-gradient-to-l from-indigo-900 via-zinc-900 to-zinc-950 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate(-1)}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              >
                <ArrowRight size={20} />
              </button>
              <div className="bg-purple-500/10 p-3 rounded-xl">
                <Calendar size={28} className="text-purple-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">{t('leaves.reportTitle')}</h1>
                <p className="text-slate-400 mt-1">{t('leaves.reportSubtitle')}</p>
              </div>
            </div>
            <button className="flex items-center gap-2 px-5 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-bold transition-colors">
              <Download size={18} />
              {t('leaveBalanceReport.exportButton')}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="relative flex-1 min-w-[250px]">
            <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('common.searchPlaceholder')}
              className="w-full pr-10 pl-4 py-3 bg-zinc-900 border border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder:text-slate-600"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-slate-500" />
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="px-4 py-3 bg-zinc-900 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-purple-500"
            >
              <option value="ALL">{t('leaveBalanceReport.allDepartments')}</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="text-center py-12 text-slate-500">{t('common.loading')}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-500">{t('common.noResults')}</div>
        ) : (
          <div className="bg-zinc-900 border border-white/5 rounded-2xl overflow-hidden">
            <table className="w-full text-sm text-right">
              <thead className="bg-white/5 text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 font-bold">{t('leaves.tableName')}</th>
                  <th className="px-6 py-4 font-bold">{t('leaves.tableDept')}</th>
                  <th className="px-6 py-4 font-bold text-center">{t('leaves.tableBalance')}</th>
                  <th className="px-6 py-4 font-bold text-center">{t('leaves.tableStatus')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((emp) => (
                  <tr key={emp.employeeId} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400 font-bold text-xs">
                          {emp.fullName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-100">{emp.fullName}</p>
                          <p className="text-xs text-slate-500">{emp.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-300">
                      {emp.departmentName || '—'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`text-lg font-black ${emp.leaveBalanceDays < 5 ? 'text-red-400' : 'text-green-400'}`}>
                        {emp.leaveBalanceDays?.toFixed(1) ?? '0.0'}
                      </span>
                      <span className="text-[10px] text-slate-500 mr-1">{t('common.days')}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        emp.leaveBalanceDays < 5 
                          ? 'bg-red-500/10 text-red-400' 
                          : 'bg-green-500/10 text-green-400'
                      }`}>
                        {emp.leaveBalanceDays < 5 ? t('leaves.lowBalance') : t('leaves.normalBalance')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Legend */}
        <div className="mt-8 flex gap-6 text-xs text-slate-500 font-medium bg-white/5 w-fit px-6 py-3 rounded-full border border-white/5">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400" />
            {t('leaveBalanceReport.legend.normal')}
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-400" />
            {t('leaveBalanceReport.legend.critical')}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaveBalanceReport;
