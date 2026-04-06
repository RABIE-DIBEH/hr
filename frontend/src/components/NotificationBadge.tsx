import { useQuery } from '@tanstack/react-query';
import { Bell } from 'lucide-react';
import { getUnreadCount } from '../services/api';

const NotificationBadge = () => {
  const { data } = useQuery({
    queryKey: ['unreadCount'],
    queryFn: async () => (await getUnreadCount()).data,
    refetchInterval: 30000, // Still poll every 30s as fallback
    staleTime: 5000,
  });

  const unreadCount = data?.unreadCount ?? 0;

  return (
    <div className="relative inline-block">
      <Bell size={20} className="text-slate-300" />
      {unreadCount > 0 && (
        <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg shadow-red-900/50">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </div>
  );
};

export default NotificationBadge;
