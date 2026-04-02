import React from 'react';
import { motion } from 'framer-motion';
import { PiggyBank, Landmark, ShieldCheck, ArrowUpRight, Plus } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import BottomNav from '../components/BottomNav';

const Savings = () => {
  const accounts = [
    { id: 1, title: 'حساب الطوارئ', balance: '25,000', progress: 75, icon: ShieldCheck },
    { id: 2, title: 'مدخرات التقاعد', balance: '120,400', progress: 40, icon: Landmark },
  ];

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="mr-64 flex-1 p-8 pb-32">
        <header className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight">الادخار</h1>
          <p className="text-white/40 text-sm mt-1">إجمالي ثروتك تنمو بذكاء</p>
        </header>

        <div className="space-y-8">
          {/* Quick Summary */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-luxury-purple-soft border border-luxury-primary/20 p-6 rounded-3xl">
              <p className="text-luxury-primary text-[10px] font-black uppercase tracking-widest mb-1">العائد السنوي</p>
              <p className="text-2xl font-black text-white">4.5%</p>
            </div>
            <div className="bg-luxury-gold-soft border border-luxury-accent/20 p-6 rounded-3xl">
              <p className="text-luxury-accent text-[10px] font-black uppercase tracking-widest mb-1">الربح المتوقع</p>
              <p className="text-2xl font-black text-white">540 <span className="text-xs">ر.س</span></p>
            </div>
          </div>

          {/* Savings Accounts */}
          <section className="space-y-6">
            <h3 className="text-lg font-bold text-white/90">حساباتك الادخارية</h3>
            
            <div className="space-y-6">
              {accounts.map((acc, idx) => (
                <motion.div 
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  key={acc.id} 
                  className="card-luxury p-8"
                >
                  <div className="flex justify-between items-start mb-8">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl gold-gradient flex items-center justify-center text-black">
                        <acc.icon size={24} />
                      </div>
                      <div>
                        <h4 className="font-bold text-lg">{acc.title}</h4>
                        <p className="text-white/40 text-xs font-medium">الرصيد المتاح</p>
                      </div>
                    </div>
                    <ArrowUpRight className="text-luxury-accent" size={20} />
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-end">
                      <p className="text-3xl font-black tabular-nums">{acc.balance} <span className="text-sm font-medium opacity-40">ر.س</span></p>
                      <p className="text-luxury-accent font-bold text-sm">{acc.progress}%</p>
                    </div>
                    
                    <div className="w-full bg-white/5 h-3 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${acc.progress}%` }}
                        transition={{ duration: 1, delay: 0.5 }}
                        className="gold-gradient h-full rounded-full shadow-[0_0_15px_rgba(212,175,55,0.4)]"
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Action Card */}
          <div className="bg-luxury-surface border border-white/5 p-8 rounded-[32px] flex items-center justify-between group cursor-pointer hover:border-luxury-accent/30 transition-all">
            <div className="flex items-center gap-4">
              <div className="bg-white/5 p-4 rounded-2xl text-white group-hover:text-luxury-accent transition-all">
                <PiggyBank size={28} />
              </div>
              <div>
                <p className="font-bold text-white tracking-tight">فتح حساب ادخار جديد</p>
                <p className="text-[10px] text-white/40 font-medium">ابدأ في بناء مستقبلك اليوم</p>
              </div>
            </div>
            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
              <Plus size={20} className="text-white/40" />
            </div>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default Savings;
