import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Clock, 
  Calendar, 
  CreditCard, 
  LogOut, 
  ShieldCheck,
  Settings
} from 'lucide-react';

const Sidebar = () => {
  const menuItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'لوحة التحكم' },
    { path: '/manager', icon: Users, label: 'إدارة الفريق' },
    { path: '/hr', icon: ShieldCheck, label: 'الموارد البشرية' },
    { path: '/admin', icon: Settings, label: 'مدير النظام' },
    { path: '/clock', icon: CreditCard, label: 'جهاز البصمة' },
    { path: '/attendance', icon: Clock, label: 'سجل حضوري' },
  ];

  return (
    <aside className="fixed inset-y-0 right-0 w-64 bg-slate-900 text-white flex flex-col z-50">
      <div className="p-6 flex items-center gap-3 border-b border-slate-800">
        <div className="bg-blue-600 p-2 rounded-lg">
          <ShieldCheck size={24} className="text-white" />
        </div>
        <span className="font-bold text-xl tracking-tight">نظام الموارد</span>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `
              flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
              ${isActive 
                ? 'bg-blue-600/10 text-blue-400 font-semibold border border-blue-600/20' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'}
            `}
          >
            <item.icon size={20} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <div className="bg-slate-800/50 p-4 rounded-2xl mb-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold text-lg text-white">أ خ</div>
            <div>
              <p className="text-sm font-semibold truncate">أحمد خالد</p>
              <p className="text-xs text-slate-400 truncate">قسم التسويق</p>
            </div>
          </div>
          <button className="flex items-center gap-2 text-xs text-red-400 hover:text-red-300 transition-colors w-full justify-start">
            <LogOut size={14} /> تسجيل الخروج
          </button>
        </div>
        <button className="w-full flex items-center gap-2 text-slate-400 hover:text-white text-sm p-2 justify-start">
          <Settings size={18} /> الإعدادات
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
