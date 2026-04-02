import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Wallet,
  Users,
  Clock,
  CreditCard,
  LogOut,
  ShieldCheck,
  Settings,
} from 'lucide-react';
import { AUTH_TOKEN_KEY, getCurrentEmployee, logout, type EmployeeProfile } from '../services/api';

const Sidebar = () => {
  const navigate = useNavigate();
  const [me, setMe] = useState<EmployeeProfile | null>(null);

  useEffect(() => {
    if (!localStorage.getItem(AUTH_TOKEN_KEY)) {
      return;
    }
    getCurrentEmployee()
      .then((res) => setMe(res.data))
      .catch(() => setMe(null));
  }, []);

  const menuItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'لوحة التحكم' },
    { path: '/finance', icon: Wallet, label: 'المصاريف والمالية' },
    { path: '/manager', icon: Users, label: 'إدارة الفريق' },
    { path: '/hr', icon: ShieldCheck, label: 'الموارد البشرية' },
    { path: '/admin', icon: Settings, label: 'مدير النظام' },
    { path: '/clock', icon: CreditCard, label: 'جهاز البصمة' },
    { path: '/attendance', icon: Clock, label: 'سجل حضوري' },
  ];

  const initials = me?.fullName
    ? me.fullName
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0])
        .join('')
    : '—';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

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
              ${
                isActive
                  ? 'bg-blue-600/10 text-blue-400 font-semibold border border-blue-600/20'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }
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
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold text-sm text-white shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">{me?.fullName ?? 'جاري التحميل…'}</p>
              <p className="text-xs text-slate-400 truncate">
                {me?.teamName ?? me?.roleName ?? '—'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-2 text-xs text-red-400 hover:text-red-300 transition-colors w-full justify-start"
          >
            <LogOut size={14} /> تسجيل الخروج
          </button>
        </div>
        <button
          type="button"
          className="w-full flex items-center gap-2 text-slate-400 hover:text-white text-sm p-2 justify-start"
        >
          <Settings size={18} /> الإعدادات
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
