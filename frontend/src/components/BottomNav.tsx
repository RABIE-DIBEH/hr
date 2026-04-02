import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Wallet, 
  PiggyBank, 
  Target, 
  Plus,
  LayoutGrid
} from 'lucide-react';
import { motion } from 'framer-motion';

const BottomNav = () => {
  const navItems = [
    { path: '/dashboard', icon: Wallet, label: 'المصاريف' },
    { path: '/savings', icon: PiggyBank, label: 'الادخار' },
    { path: '/', icon: null, label: '' }, // Placeholder for FAB
    { path: '/goals', icon: Target, label: 'الأهداف' },
    { path: '/hrms-dashboard', icon: LayoutGrid, label: 'الموارد' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 px-6 pb-8 pt-4 glass-luxury rounded-t-[32px] border-t border-white/5">
      <div className="max-w-md mx-auto flex justify-between items-center relative">
        {/* Floating Action Button */}
        <div className="absolute left-1/2 -top-12 -translate-x-1/2">
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="w-16 h-16 rounded-full gold-gradient shadow-[0_8px_30px_rgb(212,175,55,0.3)] flex items-center justify-center text-black border-4 border-luxury-bg"
          >
            <Plus size={32} strokeWidth={3} />
          </motion.button>
        </div>

        {navItems.map((item, idx) => {
          if (!item.icon) return <div key={idx} className="w-16" />;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `
                flex flex-col items-center gap-1 transition-all duration-300
                ${isActive ? 'text-luxury-accent' : 'text-white/40 hover:text-white/60'}
              `}
            >
              <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-bold tracking-wide">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
