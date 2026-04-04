import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { getUnreadCount } from '../services/api';

const NotificationBadge = () => {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const response = await getUnreadCount();
        setUnreadCount(response.data.count);
      } catch (err) {
        // Silently fail - don't break the entire UI if inbox endpoint is unavailable
        console.debug('Inbox check failed (this is OK):', (err as Error)?.message);
        setUnreadCount(0);
      }
    };

    fetchUnreadCount();
    
    // Poll every 30 seconds (only refetch, don't block render)
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

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
