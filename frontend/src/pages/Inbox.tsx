import { useEffect, useEffectEvent, useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, Archive, Check, CheckCheck, AlertCircle, Trash2, FolderOpen, Square, SquareCheck } from 'lucide-react';
import PaginationControls from '../components/PaginationControls';
import Sidebar from '../components/Sidebar';
import {
  getInboxPage,
  getUnreadMessagesPage,
  getHighPriorityMessagesPage,
  getArchivedMessagesPage,
  markMessageAsRead,
  markAllAsRead,
  archiveMessage,
  deleteMessage,
  type InboxMessage
} from '../services/api';

const Inbox = () => {
  const filters: Array<{ value: 'all' | 'unread' | 'high-priority' | 'archived'; label: string }> = [
    { value: 'all', label: 'الكل' },
    { value: 'unread', label: 'غير المقروءة' },
    { value: 'high-priority', label: 'ذات الأولوية' },
    { value: 'archived', label: 'الأرشيف' },
  ];

  const [messages, setMessages] = useState<InboxMessage[]>([]);
  const [filteredMessages, setFilteredMessages] = useState<InboxMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread' | 'high-priority' | 'archived'>('all');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const loadMessages = useEffectEvent(async () => {
    setLoading(true);
    setError(null);
    setSelectedIds(new Set());
    try {
      let response;
      if (filter === 'unread') {
        response = await getUnreadMessagesPage({ page, size: 20 });
      } else if (filter === 'high-priority') {
        response = await getHighPriorityMessagesPage({ page, size: 20 });
      } else if (filter === 'archived') {
        response = await getArchivedMessagesPage({ page, size: 20 });
      } else {
        response = await getInboxPage({ page, size: 20 });
      }
      const sorted = response.data.items.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setTotalPages(response.data.totalPages);
      setTotalCount(response.data.totalCount);
      setMessages(sorted);
      setFilteredMessages(sorted);
    } catch (err) {
      setError('خطأ في تحميل الرسائل');
      console.error(err);
    } finally {
      setLoading(false);
    }
  });

  useEffect(() => {
    void loadMessages();
  }, [filter, page]);

  useEffect(() => {
    setPage(0);
  }, [filter]);

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

  const handleDelete = async (messageId: number) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه الرسالة نهائياً؟')) return;
    try {
      await deleteMessage(messageId);
      setMessages(messages.filter((m) => m.messageId !== messageId));
      setFilteredMessages(filteredMessages.filter((m) => m.messageId !== messageId));
    } catch (err) {
      console.error('خطأ في حذف الرسالة:', err);
    }
  };

  // Bulk selection
  const toggleSelect = (messageId: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(messageId)) next.delete(messageId);
      else next.add(messageId);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredMessages.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredMessages.map((m) => m.messageId)));
    }
  };

  const handleBulkArchive = async () => {
    if (selectedIds.size === 0) return;
    try {
      await Promise.all(Array.from(selectedIds).map((id) => archiveMessage(id)));
      setMessages(messages.filter((m) => !selectedIds.has(m.messageId)));
      setFilteredMessages(filteredMessages.filter((m) => !selectedIds.has(m.messageId)));
      setSelectedIds(new Set());
    } catch (err) {
      console.error('خطأ في أرشفة الرسائل المحددة:', err);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`هل أنت متأكد من حذف ${selectedIds.size} رسالة نهائياً؟`)) return;
    try {
      await Promise.all(Array.from(selectedIds).map((id) => deleteMessage(id)));
      setMessages(messages.filter((m) => !selectedIds.has(m.messageId)));
      setFilteredMessages(filteredMessages.filter((m) => !selectedIds.has(m.messageId)));
      setSelectedIds(new Set());
    } catch (err) {
      console.error('خطأ في حذف الرسائل المحددة:', err);
    }
  };

  const unreadCount = messages.filter((m) => !m.readAt).length;
  const allSelected = filteredMessages.length > 0 && selectedIds.size === filteredMessages.length;
  const someSelected = selectedIds.size > 0;

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
              {filters.map((item) => (
                <button
                  key={item.value}
                  onClick={() => setFilter(item.value)}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                    filter === item.value
                      ? 'bg-luxury-primary/20 text-luxury-primary border border-luxury-primary/30'
                      : 'bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10'
                  }`}
                >
                  {item.value === 'all' && item.label}
                  {item.value === 'unread' && `${item.label} (${unreadCount})`}
                  {item.value === 'high-priority' && item.label}
                  {item.value === 'archived' && <><FolderOpen size={14} /> {item.label}</>}
                </button>
              ))}
            </div>
          </header>

          {/* Bulk Actions Bar */}
          {someSelected && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 bg-luxury-primary/10 border border-luxury-primary/20 rounded-xl flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <button
                  onClick={toggleSelectAll}
                  className="text-luxury-primary hover:text-luxury-primary/80 transition-colors"
                >
                  {allSelected ? <SquareCheck size={20} /> : <Square size={20} />}
                </button>
                <span className="text-luxury-primary text-sm font-semibold">
                  {selectedIds.size} رسالة محددة
                </span>
              </div>
              <div className="flex gap-2">
                {filter !== 'archived' && (
                  <button
                    onClick={handleBulkArchive}
                    className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all"
                  >
                    <Archive size={16} />
                    <span>أرشفة المحددة</span>
                  </button>
                )}
                <button
                  onClick={handleBulkDelete}
                  className="bg-red-500/20 hover:bg-red-500/30 text-red-400 px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all"
                >
                  <Trash2 size={16} />
                  <span>حذف المحددة</span>
                </button>
                <button
                  onClick={() => setSelectedIds(new Set())}
                  className="bg-white/5 hover:bg-white/10 text-slate-400 px-3 py-2 rounded-lg text-sm transition-all"
                >
                  إلغاء
                </button>
              </div>
            </motion.div>
          )}

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
                {filter === 'archived' && 'لا توجد رسائل مؤرشفة'}
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
              {filteredMessages.map((message) => {
                const isSelected = selectedIds.has(message.messageId);
                return (
                  <motion.div
                    key={message.messageId}
                    variants={item}
                    className={`p-4 rounded-2xl border transition-all group cursor-pointer ${
                      isSelected
                        ? 'bg-luxury-primary/10 border-luxury-primary/30'
                        : message.readAt
                        ? 'bg-white/5 border-white/10'
                        : 'bg-luxury-primary/5 border-luxury-primary/20 shadow-[0_0_15px_rgba(106,13,173,0.1)]'
                    }`}
                    onClick={() => toggleSelect(message.messageId)}
                  >
                    <div className="flex items-start gap-4">
                      {/* Checkbox */}
                      <div className="mt-1 shrink-0">
                        {isSelected ? (
                          <SquareCheck size={20} className="text-luxury-primary" />
                        ) : (
                          <Square size={20} className="text-slate-600 group-hover:text-slate-400 transition-colors" />
                        )}
                      </div>

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
                      <div className="flex items-center gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {!message.readAt && (
                          <button
                            onClick={() => handleMarkAsRead(message.messageId)}
                            className="p-2 hover:bg-luxury-primary/20 rounded-lg text-slate-400 hover:text-luxury-primary transition-all"
                            title="تحديد كمقروء"
                          >
                            <Check size={18} />
                          </button>
                        )}
                        {filter !== 'archived' && (
                          <button
                            onClick={() => handleArchive(message.messageId)}
                            className="p-2 hover:bg-blue-500/20 rounded-lg text-slate-400 hover:text-blue-400 transition-all"
                            title="أرشفة"
                          >
                            <Archive size={18} />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(message.messageId)}
                          className="p-2 hover:bg-red-500/20 rounded-lg text-slate-400 hover:text-red-400 transition-all"
                          title="حذف نهائي"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
          <PaginationControls
            page={page}
            totalPages={totalPages}
            totalCount={totalCount}
            onPageChange={setPage}
            className="mt-6 rounded-2xl"
          />
        </div>
      </main>
    </div>
  );
};

export default Inbox;
