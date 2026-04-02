import React from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  UserCheck, 
  UserX, 
  AlertTriangle, 
  FileText, 
  Search, 
  Filter,
  MoreVertical,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import Sidebar from '../components/Sidebar';

const ManagerDashboard = () => {
  const team = [
    { id: 1, name: 'سارة محمد', status: 'Present', checkIn: '08:15', hours: 168, late: 0.5, verified: true, avatar: 'SM' },
    { id: 2, name: 'خالد علي', status: 'Late', checkIn: '09:45', hours: 150, late: 2.0, verified: false, avatar: 'KA' },
    { id: 3, name: 'نورا سمير', status: 'Absent', checkIn: '--:--', hours: 168, late: 0.0, verified: false, avatar: 'NS' },
    { id: 4, name: 'سامر حسن', status: 'Present', checkIn: '08:00', hours: 172, late: 0.0, verified: true, avatar: 'SH' },
  ];

  const stats = [
    { label: 'إجمالي الفريق', value: '12', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'حاضرون الآن', value: '10', icon: UserCheck, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'متأخرون', value: '1', icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'غائبون', value: '1', icon: UserX, color: 'text-red-600', bg: 'bg-red-50' },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50" dir="rtl">
      <Sidebar />
      <main className="mr-64 flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <header className="flex justify-between items-center mb-10">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight arabic-text">إدارة الفريق</h1>
              <p className="text-slate-500 mt-1">قسم التسويق | مراجعة الالتزام اليومي</p>
            </div>
            <button className="flex items-center gap-2 bg-white border px-4 py-2.5 rounded-xl shadow-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all">
              <FileText size={18} />
              <span>تصدير تقرير Excel</span>
            </button>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
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
              <h2 className="text-xl font-bold text-slate-900">مراقبة الحضور المباشر</h2>
              <div className="flex gap-3 w-full md:w-auto">
                <div className="relative flex-1 md:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text" 
                    placeholder="بحث عن موظف..." 
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 rounded-xl text-sm transition-all"
                  />
                </div>
                <button className="bg-slate-50 p-2.5 rounded-xl text-slate-500 hover:bg-slate-100 transition-all border border-slate-100">
                  <Filter size={20} />
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-[0.15em]">
                    <th className="p-6">الموظف</th>
                    <th className="p-6">الحالة</th>
                    <th className="p-6">وقت الدخول</th>
                    <th className="p-6 text-center">ساعات الشهر</th>
                    <th className="p-6 text-center">التأخير</th>
                    <th className="p-6 text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {team.map((emp) => (
                    <tr key={emp.id} className="hover:bg-slate-50/50 transition-all group">
                      <td className="p-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 text-sm group-hover:bg-blue-600 group-hover:text-white transition-all">
                            {emp.avatar}
                          </div>
                          <span className="font-bold text-slate-800">{emp.name}</span>
                        </div>
                      </td>
                      <td className="p-6">
                        <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 w-fit ${
                          emp.status === 'Present' ? 'bg-green-50 text-green-600' :
                          emp.status === 'Late' ? 'bg-orange-50 text-orange-600' : 'bg-red-50 text-red-600'
                        }`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${
                            emp.status === 'Present' ? 'bg-green-500' :
                            emp.status === 'Late' ? 'bg-orange-500' : 'bg-red-500'
                          }`} />
                          {emp.status === 'Present' ? 'حاضر' : emp.status === 'Late' ? 'متأخر' : 'غائب'}
                        </span>
                      </td>
                      <td className="p-6 font-mono font-bold text-slate-600 text-sm">{emp.checkIn}</td>
                      <td className="p-6 text-center">
                        <span className="font-black text-slate-900">{emp.hours}</span>
                        <span className="text-slate-400 text-xs ml-1 font-medium">ساعة</span>
                      </td>
                      <td className="p-6 text-center">
                        <span className={`font-bold ${emp.late > 0 ? 'text-orange-600' : 'text-slate-400'}`}>
                          {emp.late} <span className="text-[10px] font-medium">ساعة</span>
                        </span>
                      </td>
                      <td className="p-6">
                        <div className="flex items-center justify-center gap-2">
                          {!emp.verified ? (
                            <button className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-700 transition-all shadow-md shadow-blue-100">
                              تأكيد الحضور
                            </button>
                          ) : (
                            <div className="text-green-500 flex items-center gap-1 text-xs font-bold">
                              <CheckCircle2 size={16} /> معتمد
                            </div>
                          )}
                          <button className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                            <XCircle size={20} />
                          </button>
                          <button className="p-2 text-slate-300 hover:text-slate-600 transition-all">
                            <MoreVertical size={20} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="p-6 bg-slate-50/30 border-t border-slate-50 flex justify-between items-center text-xs text-slate-400 font-medium">
              <p>عرض 4 من أصل 12 موظف</p>
              <div className="flex gap-2">
                <button className="px-3 py-1.5 rounded-lg border bg-white disabled:opacity-50">السابق</button>
                <button className="px-3 py-1.5 rounded-lg border bg-white">التالي</button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ManagerDashboard;
