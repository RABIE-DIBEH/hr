import React from 'react';
import { motion } from 'framer-motion';
import { Plane, Car, Home, Watch, Plus } from 'lucide-react';
import BottomNav from '../components/BottomNav';

const Goals = () => {
  const goals = [
    { id: 1, title: 'رحلة المالديف', target: '15,000', current: '12,500', icon: Plane, color: 'bg-blue-500' },
    { id: 2, title: 'سيارة أحلامي', target: '250,000', current: '45,000', icon: Car, color: 'bg-luxury-primary' },
    { id: 3, title: 'دفعة المنزل', target: '500,000', current: '150,000', icon: Home, color: 'bg-emerald-500' },
    { id: 4, title: 'ساعة فاخرة', target: '35,000', current: '35,000', icon: Watch, color: 'bg-luxury-accent' },
  ];

  return (
    <div className="min-h-screen pb-32">
      <header className="p-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">أهدافك</h1>
          <p className="text-white/40 text-sm mt-1">تتبع إنجازاتك المالية</p>
        </div>
        <button className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-luxury-accent">
          <Plus size={24} />
        </button>
      </header>

      <main className="px-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        {goals.map((goal, idx) => {
          const progress = (parseFloat(goal.current.replace(/,/g, '')) / parseFloat(goal.target.replace(/,/g, ''))) * 100;
          const isCompleted = progress >= 100;

          return (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.1 }}
              key={goal.id} 
              className="card-luxury p-6 relative overflow-hidden"
            >
              {isCompleted && (
                <div className="absolute top-0 right-0 gold-gradient px-4 py-1 rounded-bl-2xl z-20">
                  <span className="text-[8px] font-black text-black uppercase tracking-widest">إكتمل</span>
                </div>
              )}

              <div className="flex items-center gap-4 mb-6">
                <div className={`w-12 h-12 rounded-2xl ${goal.color} flex items-center justify-center text-white shadow-lg`}>
                  <goal.icon size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-white/90">{goal.title}</h4>
                  <p className="text-[10px] text-white/40 font-medium">الهدف: {goal.target} ر.س</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <p className="text-xl font-black tabular-nums">{goal.current} <span className="text-[10px] opacity-40">ر.س</span></p>
                  <p className={`text-xs font-bold ${isCompleted ? 'text-luxury-accent' : 'text-white/40'}`}>
                    {Math.round(progress)}%
                  </p>
                </div>
                <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className={`h-full rounded-full ${isCompleted ? 'gold-gradient shadow-[0_0_15px_rgba(212,175,55,0.4)]' : 'bg-luxury-primary'}`}
                  />
                </div>
              </div>
            </motion.div>
          );
        })}
      </main>

      <BottomNav />
    </div>
  );
};

export default Goals;
