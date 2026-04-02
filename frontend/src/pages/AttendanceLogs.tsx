import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Download, ChevronRight, CheckCircle } from 'lucide-react';
import Sidebar from '../components/Sidebar';

const AttendanceLogs = () => {
  const logs = [
    { date: 'الأربعاء، 22 مايو', in: '08:00', out: '16:30', hours: '8.5', status: 'Verified' },
    { date: 'الثلاثاء، 21 مايو', in: '08:15', out: '17:00', hours: '8.75', status: 'Verified' },
    { date: 'الاثنين، 20 مايو', in: '09:00', out: '16:00', hours: '7.0', status: 'Late' },
  ];

  return (
    <div className="flex min-h-screen bg-luxury-bg" dir="rtl">
      <Sidebar />
      <main className="mr-64 flex-1 p-8">
        <div className="max-w-5xl mx-auto">
          <header className="flex justify-between items-center mb-10">
            <div>
              <h1 className="text-3xl font-black text-slate-900 arabic-text">سجل دوامي</h1>
              <p className="text-slate-500 mt-1">عرض تفاصيل الحضور والانصراف اليومية</p>
            </div>
            <button className="bg-white border px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-slate-50 transition-all">
              <Download size={16} /> تصدير PDF
            </button>
          </header>

          <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
            <div className="divide-y divide-slate-50">
              {logs.map((log, idx) => (
                <motion.div
                  initial={{ opacity: 1, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}                  transition={{ delay: idx * 0.05 }}
                  key={idx} 
                  className="p-6 flex items-center justify-between hover:bg-slate-50/50 transition-all group"
                >
                  <div className="flex items-center gap-6">
                    <div className="bg-slate-100 p-3 rounded-2xl text-slate-500 group-hover:bg-blue-600 group-hover:text-white transition-all">
                      <Clock size={24} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-lg">{log.date}</p>
                      <p className="text-sm text-slate-400 font-medium">إجمالي ساعات العمل: {log.hours} ساعة</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-12">
                    <div className="flex gap-8 text-center">
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Entry</p>
                        <p className="font-mono font-bold text-slate-700">{log.in}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Exit</p>
                        <p className="font-mono font-bold text-slate-700">{log.out}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${
                        log.status === 'Verified' ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'
                      }`}>
                        {log.status}
                      </span>
                      <ChevronRight className="text-slate-300 group-hover:text-slate-600 transition-all" size={20} />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AttendanceLogs;
