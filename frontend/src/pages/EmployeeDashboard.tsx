import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Clock, 
  Calendar, 
  CheckCircle, 
  AlertCircle, 
  Send, 
  TrendingUp,
  ArrowUpRight,
  Monitor
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { getCurrentEmployee, type EmployeeProfile } from '../services/api';

const EmployeeDashboard = () => {
  const [status, setStatus] = useState('Checked In');
  const [me, setMe] = useState<EmployeeProfile | null>(null);

  useEffect(() => {
    getCurrentEmployee()
      .then((res) => setMe(res.data))
      .catch(() => setMe(null));
  }, []);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      
      <main className="ml-64 flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <header className="flex justify-between items-end mb-10">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight arabic-text">
                مرحباً، {me?.fullName ?? '…'} 👋
              </h1>
              <p className="text-slate-500 mt-1">
                {[me?.teamName, me?.roleName].filter(Boolean).join(' | ') || 'عرض تقرير الدوام'}
              </p>
            </div>
            <div className="flex gap-3">
              <button className="bg-white border p-3 rounded-xl shadow-sm hover:bg-slate-50 transition-all">
                <Calendar size={20} className="text-slate-600" />
              </button>
              <div className="bg-blue-600 text-white px-5 py-3 rounded-xl shadow-lg shadow-blue-200 font-semibold flex items-center gap-2">
                <TrendingUp size={18} />
                <span>إحصائيات الشهر</span>
              </div>
            </div>
          </header>

          <motion.div 
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            {/* Status Card */}
            <motion.div variants={item} className="lg:col-span-2 bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-[5rem] -mr-10 -mt-10 transition-all group-hover:scale-110 duration-500"></div>
              
              <div className="relative z-10">
                <div className="flex justify-between items-center mb-10">
                  <div className="bg-blue-600/10 p-3 rounded-2xl">
                    <Monitor className="text-blue-600" size={28} />
                  </div>
                  <span className={`px-4 py-1.5 rounded-full text-sm font-bold border ${
                    status === 'Checked In' 
                      ? 'bg-green-50 text-green-600 border-green-100' 
                      : 'bg-slate-50 text-slate-500 border-slate-100'
                  }`}>
                    {status === 'Checked In' ? '• متواجد حالياً' : '• غير متواجد'}
                  </span>
                </div>

                <div className="flex flex-col md:flex-row md:items-end gap-10">
                  <div className="flex-1">
                    <h3 className="text-slate-400 text-sm font-semibold uppercase tracking-wider mb-2">ساعات دوام اليوم</h3>
                    <p className="text-5xl font-black text-slate-900 tabular-nums">08:15 <span className="text-slate-300 font-light">—</span> --:--</p>
                  </div>
                  <div className="flex-1 border-r border-slate-100 pr-8">
                    <h3 className="text-slate-400 text-sm font-semibold mb-2">إجمالي الوقت الفعلي</h3>
                    <p className="text-3xl font-bold text-slate-900">04 <span className="text-slate-400 text-xl font-medium">ساعة</span> 30 <span className="text-slate-400 text-xl font-medium">دقيقة</span></p>
                  </div>
                </div>

                <div className="mt-12 flex items-center gap-4">
                  <button className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-xl shadow-slate-200">
                    عرض تفاصيل اليوم
                  </button>
                  <p className="text-sm text-slate-400 font-medium">تم التحديث منذ دقيقتين</p>
                </div>
              </div>
            </motion.div>

            {/* Quick Stats Column */}
            <div className="flex flex-col gap-6">
              <motion.div variants={item} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="bg-purple-50 p-3 rounded-2xl">
                    <Calendar className="text-purple-600" size={24} />
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">ساعات الشهر</p>
                    <p className="text-xl font-bold">172 / 180</p>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-full border-4 border-slate-100 border-t-purple-500 flex items-center justify-center text-[10px] font-bold">
                  95%
                </div>
              </motion.div>

              <motion.div variants={item} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                <div className="flex items-center gap-4 mb-6">
                  <div className="bg-orange-50 p-3 rounded-2xl">
                    <AlertCircle className="text-orange-600" size={24} />
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">ساعات التأخير</p>
                    <p className="text-xl font-bold text-orange-600">45 دقيقة</p>
                  </div>
                </div>
                <div className="w-full bg-slate-50 h-2 rounded-full overflow-hidden">
                  <div className="bg-orange-500 h-full w-1/3"></div>
                </div>
              </motion.div>

              <motion.div variants={item} className="bg-blue-600 p-8 rounded-[2rem] shadow-xl shadow-blue-200 text-white flex flex-col justify-between aspect-square lg:aspect-auto h-48">
                <div className="flex justify-between items-start">
                  <p className="font-bold text-lg leading-tight">طلب إجازة<br/>سريع</p>
                  <ArrowUpRight size={24} />
                </div>
                <button className="bg-white/20 backdrop-blur-md hover:bg-white/30 transition-all py-3 rounded-xl font-bold text-sm">
                  إنشاء طلب جديد
                </button>
              </motion.div>
            </div>
          </motion.div>

          {/* Activity Table Mockup */}
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-12 bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100"
          >
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">آخر عمليات الحضور</h2>
              <button className="text-blue-600 text-sm font-bold hover:underline">مشاهدة الكل</button>
            </div>
            
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100 group">
                  <div className="flex items-center gap-4">
                    <div className="bg-slate-100 p-3 rounded-xl group-hover:bg-white transition-all">
                      <Clock className="text-slate-500" size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">يوم الثلاثاء، {20 - i} مايو</p>
                      <p className="text-xs text-slate-400 font-medium">دوام كامل (8 ساعات)</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-bold text-slate-700">08:00 — 16:30</p>
                    <p className="text-[10px] text-green-500 font-bold uppercase tracking-widest mt-1 flex items-center justify-end gap-1">
                      <CheckCircle size={10} /> Verified
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.section>
        </div>
      </main>
    </div>
  );
};

export default EmployeeDashboard;
