import { useEffect, useState } from 'react';
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
  Star,
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
    { path: '/finance', icon: Wallet, label: 'إدارة المرتبات' },
    { path: '/goals', icon: Star, label: 'النقاط' },
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
    <aside className="fixed inset-y-0 right-0 w-64 bg-luxury-surface text-white flex flex-col z-50 border-l border-white/5">
      <div className="p-6 flex items-center gap-3 border-b border-white/5">
        <div className="bg-luxury-primary p-2 rounded-lg shadow-[0_0_15px_rgba(106,13,173,0.4)]">
          <ShieldCheck size={24} className="text-white" />
        </div>
        <span className="font-bold text-xl tracking-tight text-white">نظام الموارد</span>
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
                  ? 'bg-luxury-primary/10 text-luxury-primary font-semibold border border-luxury-primary/20 shadow-[inset_0_0_10px_rgba(106,13,173,0.05)]'
                  : 'text-white/40 hover:bg-white/5 hover:text-white'
              }
            `}
          >
            <item.icon size={20} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-white/5">
        <div className="bg-white/5 p-4 rounded-2xl mb-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-luxury-primary flex items-center justify-center font-bold text-sm text-white shrink-0 shadow-lg">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate text-white">{me?.fullName ?? 'جاري التحميل…'}</p>
              <p className="text-xs text-white/40 truncate">
                {me?.teamName ?? me?.roleName ?? '—'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-2 text-xs text-red-400/80 hover:text-red-400 transition-colors w-full justify-start"
          >
            <LogOut size={14} /> تسجيل الخروج
          </button>
        </div>
        <button
          type="button"
          className="w-full flex items-center gap-2 text-white/40 hover:text-white text-sm p-2 justify-start"
        >
          <Settings size={18} /> الإعدادات
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
