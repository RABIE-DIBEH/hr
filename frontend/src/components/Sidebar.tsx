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
  HandCoins,
  Bell,
  DollarSign,
} from 'lucide-react';
import { AUTH_TOKEN_KEY, getCurrentEmployee, logout, type EmployeeProfile } from '../services/api';
import { getRole, isSuperAdmin } from '../services/auth';
import NotificationBadge from './NotificationBadge';
import type { UserRole } from '../services/auth';

interface MenuItem {
  path: string;
  icon: React.ComponentType<{ size?: number }>;
  label: string;
  /** Which roles can see this link. Empty = everyone who's logged in. */
  roles?: UserRole[];
}

const allMenuItems: MenuItem[] = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'لوحة التحكم',     roles: ['EMPLOYEE', 'SUPER_ADMIN'] },
  { path: '/finance',   icon: Wallet,          label: 'إدارة المرتبات',   roles: ['HR', 'ADMIN', 'SUPER_ADMIN'] },
  { path: '/payroll',   icon: HandCoins,       label: 'السلف المالية',    roles: ['HR', 'ADMIN', 'SUPER_ADMIN'] },
  { path: '/payroll/history', icon: DollarSign, label: 'سجل الرواتب',     roles: ['HR', 'ADMIN', 'SUPER_ADMIN'] },
  { path: '/goals',     icon: Star,            label: 'النقاط' },
  { path: '/manager',   icon: Users,           label: 'إدارة الفريق',    roles: ['MANAGER', 'SUPER_ADMIN'] },
  { path: '/hr',        icon: ShieldCheck,     label: 'الموارد البشرية',  roles: ['HR', 'SUPER_ADMIN'] },
  { path: '/admin',     icon: Settings,        label: 'مدير النظام',     roles: ['ADMIN', 'SUPER_ADMIN'] },
  { path: '/clock',     icon: CreditCard,      label: 'جهاز البصمة' },
  { path: '/attendance', icon: Clock,           label: 'سجل حضوري' },
  { path: '/inbox',     icon: Bell,            label: 'صندوق الرسائل' },
];

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

  const role = getRole();
  const superAdmin = isSuperAdmin();

  // Filter menu items based on the current user's role
  const visibleItems = allMenuItems.filter((item) => {
    if (!item.roles || item.roles.length === 0) return true; // visible to everyone
    if (superAdmin) return true; // SUPER_ADMIN sees everything
    return role ? item.roles.includes(role) : false;
  });

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
      <div className="p-6 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="bg-luxury-primary p-2 rounded-lg shadow-[0_0_15px_rgba(106,13,173,0.4)]">
            <ShieldCheck size={24} className="text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight text-white">نظام الموارد</span>
        </div>
        <NavLink to="/inbox" className="p-2 rounded-lg hover:bg-white/10 transition-all">
          <NotificationBadge />
        </NavLink>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {visibleItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/payroll'}
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
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-luxury-primary flex items-center justify-center font-bold text-sm text-white shrink-0 shadow-lg">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate text-white">{me?.fullName ?? 'جاري التحميل…'}</p>
              <p className="text-xs text-white/40 truncate">
                {superAdmin ? '🔑 Super Admin' : (me?.roleName ?? '—')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-2 text-xs text-red-400/80 hover:text-red-400 transition-colors w-full justify-start mt-1 py-1.5 px-2 rounded-lg hover:bg-red-500/10"
          >
            <LogOut size={14} /> تسجيل الخروج
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
