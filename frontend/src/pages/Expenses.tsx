import React from 'react';
import { motion } from 'framer-motion';
import { TrendingDown, Coffee, ShoppingBag, Car, ChevronLeft } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import BottomNav from '../components/BottomNav';

const Expenses = () => {
  const transactions = [
    { id: 1, label: 'ستاربكس كافيه', date: 'اليوم، 10:30 ص', amount: '45.00', icon: Coffee, category: 'طعام' },
    { id: 2, label: 'أمازون للتسوق', date: 'أمس، 08:15 م', amount: '1,250.00', icon: ShoppingBag, category: 'تسوق' },
    { id: 3, label: 'تعبئة وقود', date: '20 مايو، 02:45 م', amount: '220.00', icon: Car, category: 'نقل' },
  ];

  return (
    <div className="flex min-h-screen bg-luxury-bg">
      <Sidebar />
      <main className="mr-64 flex-1 p-8 pb-32">
        <header className="flex justify-between items-center mb-10">
          <h1 className="text-2xl font-bold tracking-tight">المصاريف</h1>
          <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center">
            <ChevronLeft size={20} className="text-white/60" />
          </div>
        </header>

        <div className="space-y-10">
          {/* Total Balance Card */}
          <motion.div 
            animate={{ opacity: 1, scale: 1 }}
            className="purple-gradient p-8 rounded-[32px] shadow-[0_20px_50px_rgba(106,13,173,0.3)] relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl" />
            <div className="relative z-10">
              <p className="text-white/60 text-sm font-medium mb-2">إجمالي المصاريف هذا الشهر</p>
              <h2 className="text-4xl font-black tabular-nums tracking-tighter mb-8">14,250.00 <span className="text-xl font-medium opacity-60">ر.س</span></h2>
              
              <div className="flex justify-between items-center">
                <div className="bg-black/20 backdrop-blur-md px-4 py-2 rounded-xl flex items-center gap-2">
                  <TrendingDown size={16} className="text-red-400" />
                  <span className="text-xs font-bold text-red-100">أعلى بنسبة 12%</span>
                </div>
                <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">تحديث: منذ ساعة</p>
              </div>
            </div>
          </motion.div>

          {/* Transactions List */}
          <section className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-white/90">أحدث العمليات</h3>
              <button className="text-luxury-accent text-xs font-bold hover:underline">مشاهدة الكل</button>
            </div>

            <div className="space-y-4">
              {transactions.map((t, idx) => (
                <motion.div 
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  key={t.id} 
                  className="card-luxury p-5 flex justify-between items-center group hover:bg-white/5 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-luxury-gold-soft flex items-center justify-center text-luxury-accent group-hover:bg-luxury-accent group-hover:text-black transition-all">
                      <t.icon size={24} />
                    </div>
                    <div>
                      <p className="font-bold text-white tracking-tight">{t.label}</p>
                      <p className="text-[10px] text-white/40 font-medium mt-1">{t.date} • {t.category}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-black tabular-nums text-white tracking-tighter">-{t.amount}</p>
                    <p className="text-[10px] text-white/20 font-bold">ر.س</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default Expenses;
