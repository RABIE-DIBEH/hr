import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, Archive, Check, CheckCheck, AlertCircle } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { 
  getInbox, 
  getUnreadMessages,
  getHighPriorityMessages,
  markMessageAsRead, 
  markAllAsRead, 
  archiveMessage, 
  type InboxMessage 
} from '../services/api';

const Inbox = () => {
  const [messages, setMessages] = useState<InboxMessage[]>([]);
  const [filteredMessages, setFilteredMessages] = useState<InboxMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread' | 'high-priority'>('all');

  useEffect(() => {
    loadMessages();
  }, [filter]);

  const loadMessages = async () => {
    setLoading(true);
    setError(null);
    try {
      let response;
      if (filter === 'unread') {
        response = await getUnreadMessages();
      } else if (filter === 'high-priority') {
        response = await getHighPriorityMessages();
      } else {
        response = await getInbox();
      }
      const sorted = response.data.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setMessages(sorted);
      setFilteredMessages(sorted);
    } catch (err) {
      setError('خطأ في تحميل الرسائل');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (messageId: number) => {
    try {
      await markMessageAsRead(messageId);
      setMessages(
        messages.map((m) =>
          m.messageId === messageId ? { ...m, readAt: new Date().toISOString() } : m
        )
      );
      setFilteredMessages(
        filteredMessages.map((m) =>
          m.messageId === messageId ? { ...m, readAt: new Date().toISOString() } : m
        )
      );
    } catch (err) {
      console.error('خطأ في تحديث الرسالة:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      const updated = messages.map((m) => ({
        ...m,
        readAt: new Date().toISOString(),
      }));
      setMessages(updated);
      setFilteredMessages(updated);
    } catch (err) {
      console.error('خطأ في تحديث جميع الرسائل:', err);
    }
  };

  const handleArchive = async (messageId: number) => {
    try {
      await archiveMessage(messageId);
      setMessages(messages.filter((m) => m.messageId !== messageId));
      setFilteredMessages(filteredMessages.filter((m) => m.messageId !== messageId));
    } catch (err) {
      console.error('خطأ في أرشفة الرسالة:', err);
    }
  };

  const unreadCount = messages.filter((m) => !m.readAt).length;

  const priorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return 'bg-red-500/10 border-red-500/20 text-red-400';
      case 'MEDIUM':
        return 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400';
      case 'LOW':
        return 'bg-green-500/10 border-green-500/20 text-green-400';
      default:
        return 'bg-gray-500/10 border-gray-500/20 text-gray-400';
    }
  };

  const container = {
    hidden: { opacity: 1 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  };

  return (
    <div className="flex min-h-screen bg-black" dir="rtl">
      <Sidebar />

      <main className="mr-64 flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <header className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="bg-luxury-primary/20 p-3 rounded-xl border border-luxury-primary/30">
                  <Bell size={28} className="text-luxury-primary" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">صندوق الرسائل</h1>
                  <p className="text-slate-400 text-sm mt-1">
                    {unreadCount} رسالة غير مقروءة
                  </p>
                </div>
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="bg-luxury-primary/20 hover:bg-luxury-primary/30 text-luxury-primary border border-luxury-primary/30 px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2"
                >
                  <CheckCheck size={16} />
                  <span>تحديد الكل كمقروء</span>
                </button>
              )}
            </div>

            {/* Filters */}
            <div className="flex gap-3 flex-wrap">
              {['all', 'unread', 'high-priority'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f as any)}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                    filter === f
                      ? 'bg-luxury-primary/20 text-luxury-primary border border-luxury-primary/30'
                      : 'bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10'
                  }`}
                >
                  {f === 'all' && 'الكل'}
                  {f === 'unread' && `غير المقروءة (${unreadCount})`}
                  {f === 'high-priority' && 'ذات الأولوية'}
                </button>
              ))}
            </div>
          </header>

          {/* Messages */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg mb-6 flex items-center gap-2">
              <AlertCircle size={20} />
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border border-luxury-primary border-t-transparent mx-auto mb-4"></div>
              <p className="text-slate-400">جاري تحميل الرسائل...</p>
            </div>
          ) : filteredMessages.length === 0 ? (
            <div className="text-center py-12">
              <Bell size={48} className="text-slate-500 mx-auto mb-4 opacity-50" />
              <p className="text-slate-400 text-lg">لا توجد رسائل</p>
              <p className="text-slate-500 text-sm mt-1">
                {filter === 'unread' && 'جميع رسائلك مقروءة'}
                {filter === 'high-priority' && 'لا توجد رسائل ذات أولوية عالية'}
                {filter === 'all' && 'لم تتلق أي رسائل بعد'}
              </p>
            </div>
          ) : (
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="space-y-3"
            >
              {filteredMessages.map((message) => (
                <motion.div
                  key={message.messageId}
                  variants={item}
                  className={`p-4 rounded-2xl border transition-all group ${
                    message.readAt
                      ? 'bg-white/5 border-white/10'
                      : 'bg-luxury-primary/5 border-luxury-primary/20 shadow-[0_0_15px_rgba(106,13,173,0.1)]'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Priority Badge */}
                    <div className={`px-3 py-1 rounded-full text-xs font-bold border mt-1 shrink-0 ${priorityColor(message.priority)}`}>
                      {message.priority === 'HIGH' && '⚠️ عالية'}
                      {message.priority === 'MEDIUM' && '📌 متوسطة'}
                      {message.priority === 'LOW' && '✓ منخفضة'}
                    </div>

                    {/* Message Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-bold text-white text-lg">{message.title}</h3>
                          <p className="text-xs text-slate-400 mt-0.5">
                            من: <span className="text-slate-300 font-semibold">{message.senderName}</span>
                          </p>
                        </div>
                        {!message.readAt && (
                          <div className="w-3 h-3 bg-luxury-primary rounded-full shrink-0 mt-1"></div>
                        )}
                      </div>

                      <p className="text-slate-300 text-sm leading-relaxed mb-3 break-words">
                        {message.message}
                      </p>

                      {/* Timestamp */}
                      <p className="text-xs text-slate-500">
                        {new Date(message.createdAt).toLocaleDateString('ar-EG', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!message.readAt && (
                        <button
                          onClick={() => handleMarkAsRead(message.messageId)}
                          className="p-2 hover:bg-luxury-primary/20 rounded-lg text-slate-400 hover:text-luxury-primary transition-all"
                          title="تحديد كمقروء"
                        >
                          <Check size={18} />
                        </button>
                      )}
                      <button
                        onClick={() => handleArchive(message.messageId)}
                        className="p-2 hover:bg-blue-500/20 rounded-lg text-slate-400 hover:text-blue-400 transition-all"
                        title="أرشفة"
                      >
                        <Archive size={18} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Inbox;
