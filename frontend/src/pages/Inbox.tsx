import { useEffect, useEffectEvent, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, Archive, Check, CheckCheck, AlertCircle, Trash2,
  FolderOpen, Square, SquareCheck, Reply, Send, X, ChevronDown,
  ChevronUp, MessageSquare
} from 'lucide-react';
import PaginationControls from '../components/PaginationControls';
import {
  getInboxPage,
  getUnreadMessagesPage,
  getHighPriorityMessagesPage,
  getArchivedMessagesPage,
  getSentMessagesPage,
  markMessageAsRead,
  markAllAsRead,
  archiveMessage,
  deleteMessage,
  replyToMessage,
  getMessageThread,
  sendToEmployee,
  getCurrentEmployee,
  searchEmployees,
  type InboxMessage,
  type EmployeeProfile
} from '../services/api';

type FilterType = 'all' | 'unread' | 'high-priority' | 'archived' | 'sent';

const Inbox = () => {
  const filters: Array<{ value: FilterType; label: string; icon?: React.ReactNode }> = [
    { value: 'all', label: 'الكل' },
    { value: 'unread', label: 'غير المقروءة' },
    { value: 'high-priority', label: 'ذات الأولوية' },
    { value: 'sent', label: 'المرسلة', icon: <Send size={14} /> },
    { value: 'archived', label: 'الأرشيف', icon: <FolderOpen size={14} /> },
  ];

  const [messages, setMessages] = useState<InboxMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  // Thread / reply state
  const [expandedMessage, setExpandedMessage] = useState<number | null>(null);
  const [threadReplies, setThreadReplies] = useState<InboxMessage[]>([]);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  // Compose modal state
  const [showCompose, setShowCompose] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<{ id: number; name: string; email: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ employeeId: number; fullName: string; email: string; status: string }>>([]);
  const [searching, setSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [composeTitle, setComposeTitle] = useState('');
  const [composeMessage, setComposeMessage] = useState('');
  const [composePriority, setComposePriority] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [currentUser, setCurrentUser] = useState<EmployeeProfile | null>(null);

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
      } else if (filter === 'sent') {
        response = await getSentMessagesPage({ page, size: 20 });
      } else {
        response = await getInboxPage({ page, size: 20 });
      }
      setTotalPages(response.data.totalPages);
      setTotalCount(response.data.totalCount);
      setMessages(response.data.items);
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

  // Load current user for compose
  useEffect(() => {
    const loadUser = async () => {
      try {
        const res = await getCurrentEmployee();
        setCurrentUser(res.data);
      } catch { /* ignore */ }
    };
    void loadUser();
  }, []);

  const handleMarkAsRead = async (messageId: number) => {
    try {
      await markMessageAsRead(messageId);
      setMessages(messages.map((m) =>
        m.messageId === messageId ? { ...m, readAt: new Date().toISOString(), isRead: true } : m
      ));
    } catch (err) {
      console.error('خطأ في تحديث الرسالة:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      setMessages(messages.map((m) => ({ ...m, readAt: new Date().toISOString(), isRead: true })));
    } catch (err) {
      console.error('خطأ في تحديث جميع الرسائل:', err);
    }
  };

  const handleArchive = async (messageId: number) => {
    try {
      await archiveMessage(messageId);
      setMessages(messages.filter((m) => m.messageId !== messageId));
    } catch (err) {
      console.error('خطأ في أرشفة الرسالة:', err);
    }
  };

  const handleDelete = async (messageId: number) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه الرسالة نهائياً؟')) return;
    try {
      await deleteMessage(messageId);
      setMessages(messages.filter((m) => m.messageId !== messageId));
    } catch (err) {
      console.error('خطأ في حذف الرسالة:', err);
    }
  };

  // Thread / reply handlers
  const loadThread = async (messageId: number) => {
    if (expandedMessage === messageId) {
      setExpandedMessage(null);
      setThreadReplies([]);
      return;
    }
    try {
      const res = await getMessageThread(messageId);
      setThreadReplies(res.data);
      setExpandedMessage(messageId);
      // Auto mark as read
      if (!messages.find(m => m.messageId === messageId)?.readAt) {
        await markMessageAsRead(messageId);
      }
    } catch (err) {
      console.error('خطأ في تحميل الردود:', err);
    }
  };

  const handleReply = async (messageId: number) => {
    if (!replyText.trim()) return;
    setSendingReply(true);
    try {
      await replyToMessage(messageId, replyText.trim());
      setReplyText('');
      // Reload thread
      const res = await getMessageThread(messageId);
      setThreadReplies(res.data);
    } catch (err) {
      console.error('خطأ في إرسال الرد:', err);
    } finally {
      setSendingReply(false);
    }
  };

  // Compose handlers
  const handleSearchEmployees = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }
    setSearching(true);
    try {
      const res = await searchEmployees(query);
      setSearchResults(res.data);
      setShowDropdown(true);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const selectEmployee = (emp: { employeeId: number; fullName: string; email: string }) => {
    setSelectedEmployee({ id: emp.employeeId, name: emp.fullName, email: emp.email });
    setSearchQuery(emp.fullName);
    setShowDropdown(false);
  };

  const handleCompose = async () => {
    if (!selectedEmployee || !composeTitle.trim() || !composeMessage.trim()) return;
    setSendingMessage(true);
    try {
      await sendToEmployee({
        targetEmployeeId: selectedEmployee.id,
        title: composeTitle.trim(),
        message: composeMessage.trim(),
        priority: composePriority,
      });
      setShowCompose(false);
      setSelectedEmployee(null);
      setSearchQuery('');
      setComposeTitle('');
      setComposeMessage('');
      setComposePriority('MEDIUM');
      if (filter === 'sent') void loadMessages();
    } catch (err) {
      console.error('خطأ في إرسال الرسالة:', err);
      alert('فشل في إرسال الرسالة.');
    } finally {
      setSendingMessage(false);
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
    if (selectedIds.size === messages.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(messages.map((m) => m.messageId)));
    }
  };

  const handleBulkArchive = async () => {
    if (selectedIds.size === 0) return;
    try {
      await Promise.all(Array.from(selectedIds).map((id) => archiveMessage(id)));
      setMessages(messages.filter((m) => !selectedIds.has(m.messageId)));
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
      setSelectedIds(new Set());
    } catch (err) {
      console.error('خطأ في حذف الرسائل المحددة:', err);
    }
  };

  const unreadCount = messages.filter((m) => !m.readAt && !m.isRead).length;
  const allSelected = messages.length > 0 && selectedIds.size === messages.length;
  const someSelected = selectedIds.size > 0;

  const priorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'bg-red-500/10 border-red-500/20 text-red-400';
      case 'MEDIUM': return 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400';
      case 'LOW': return 'bg-green-500/10 border-green-500/20 text-green-400';
      default: return 'bg-gray-500/10 border-gray-500/20 text-gray-400';
    }
  };

  const priorityLabel = (priority: string) => {
    switch (priority) {
      case 'HIGH': return '⚠️ عالية';
      case 'MEDIUM': return '📌 متوسطة';
      case 'LOW': return '✓ منخفضة';
      default: return priority;
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ar-EG', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  };

  return (
    <div className="w-full">
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
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="bg-luxury-primary/20 hover:bg-luxury-primary/30 text-luxury-primary border border-luxury-primary/30 px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2"
              >
                <CheckCheck size={16} />
                <span>تحديد الكل كمقروء</span>
              </button>
            )}
            <button
              onClick={() => setShowCompose(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2"
            >
              <MessageSquare size={16} />
              <span>رسالة جديدة</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-3 flex-wrap">
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                filter === f.value
                  ? 'bg-luxury-primary/20 text-luxury-primary border border-luxury-primary/30'
                  : 'bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10'
              }`}
            >
              {f.icon}
              {f.value === 'unread' ? `${f.label} (${unreadCount})` : f.label}
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
            <button onClick={toggleSelectAll} className="text-luxury-primary hover:text-luxury-primary/80 transition-colors">
              {allSelected ? <SquareCheck size={20} /> : <Square size={20} />}
            </button>
            <span className="text-luxury-primary text-sm font-semibold">
              {selectedIds.size} رسالة محددة
            </span>
          </div>
          <div className="flex gap-2">
            {filter !== 'archived' && filter !== 'sent' && (
              <button onClick={handleBulkArchive}
                className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all">
                <Archive size={16} /> أرشفة
              </button>
            )}
            <button onClick={handleBulkDelete}
              className="bg-red-500/20 hover:bg-red-500/30 text-red-400 px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all">
              <Trash2 size={16} /> حذف
            </button>
            <button onClick={() => setSelectedIds(new Set())}
              className="bg-white/5 hover:bg-white/10 text-slate-400 px-3 py-2 rounded-lg text-sm transition-all">
              إلغاء
            </button>
          </div>
        </motion.div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg mb-6 flex items-center gap-2">
          <AlertCircle size={20} /> {error}
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border border-luxury-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-slate-400">جاري تحميل الرسائل...</p>
        </div>
      ) : messages.length === 0 ? (
        <div className="text-center py-12">
          <Bell size={48} className="text-slate-500 mx-auto mb-4 opacity-50" />
          <p className="text-slate-400 text-lg">لا توجد رسائل</p>
        </div>
      ) : (
        <div className="space-y-3">
          {messages.map((message) => {
            const isSelected = selectedIds.has(message.messageId);
            const isExpanded = expandedMessage === message.messageId;
            const isSent = filter === 'sent';

            return (
              <div key={message.messageId}>
                <motion.div
                  layout
                  className={`p-4 rounded-2xl border transition-all group ${
                    isSelected
                      ? 'bg-luxury-primary/10 border-luxury-primary/30'
                      : message.readAt || message.isRead
                      ? 'bg-white/5 border-white/10'
                      : 'bg-luxury-primary/5 border-luxury-primary/20 shadow-[0_0_15px_rgba(106,13,173,0.1)]'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Checkbox */}
                    <div className="mt-1 shrink-0">
                      <button onClick={() => toggleSelect(message.messageId)} className="text-slate-600 group-hover:text-slate-400 transition-colors">
                        {isSelected ? <SquareCheck size={20} className="text-luxury-primary" /> : <Square size={20} />}
                      </button>
                    </div>

                    {/* Priority Badge */}
                    <div className={`px-3 py-1 rounded-full text-xs font-bold border mt-1 shrink-0 ${priorityColor(message.priority)}`}>
                      {priorityLabel(message.priority)}
                    </div>

                    {/* Message Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-bold text-white text-lg">{message.title}</h3>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {isSent ? (
                              <>إلى: <span className="text-slate-300 font-semibold">موظف #{message.replyTo || message.messageId}</span></>
                            ) : (
                              <>من: <span className="text-slate-300 font-semibold">{message.senderName}</span></>
                            )}
                          </p>
                        </div>
                        {!message.readAt && !message.isRead && (
                          <div className="w-3 h-3 bg-luxury-primary rounded-full shrink-0 mt-1"></div>
                        )}
                      </div>

                      <p className="text-slate-300 text-sm leading-relaxed mb-3 break-words line-clamp-2">
                        {message.message}
                      </p>

                      {/* Footer */}
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-slate-500">{formatDate(message.createdAt)}</p>
                        {message.replyCount != null && message.replyCount > 0 && (
                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            <Reply size={12} /> {message.replyCount} ردود
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Thread toggle */}
                      {!isSent && (
                        <button
                          onClick={() => loadThread(message.messageId)}
                          className="p-2 hover:bg-blue-500/20 rounded-lg text-slate-400 hover:text-blue-400 transition-all"
                          title="عرض الردود"
                        >
                          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </button>
                      )}
                      {!message.readAt && !message.isRead && (
                        <button onClick={() => handleMarkAsRead(message.messageId)}
                          className="p-2 hover:bg-luxury-primary/20 rounded-lg text-slate-400 hover:text-luxury-primary transition-all" title="مقروء">
                          <Check size={18} />
                        </button>
                      )}
                      {filter !== 'archived' && filter !== 'sent' && (
                        <button onClick={() => handleArchive(message.messageId)}
                          className="p-2 hover:bg-blue-500/20 rounded-lg text-slate-400 hover:text-blue-400 transition-all" title="أرشفة">
                          <Archive size={18} />
                        </button>
                      )}
                      <button onClick={() => handleDelete(message.messageId)}
                        className="p-2 hover:bg-red-500/20 rounded-lg text-slate-400 hover:text-red-400 transition-all" title="حذف">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </motion.div>

                {/* Thread / Replies */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mr-8 ml-4 mt-2 mb-3 space-y-2 border-r-2 border-luxury-primary/20 pr-4">
                        {threadReplies.length === 0 && (
                          <p className="text-slate-500 text-sm py-2">لا توجد ردود بعد</p>
                        )}
                        {threadReplies.map((reply) => (
                          <div key={reply.messageId} className="bg-white/5 rounded-xl p-3 border border-white/5">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-slate-400">
                                {reply.senderName} • {formatDate(reply.createdAt)}
                              </span>
                              {reply.senderEmployeeId === currentUser?.employeeId && (
                                <span className="text-xs text-emerald-400">أنت</span>
                              )}
                            </div>
                            <p className="text-slate-300 text-sm break-words">{reply.message}</p>
                          </div>
                        ))}

                        {/* Reply input */}
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter' && replyText.trim()) handleReply(message.messageId); }}
                            placeholder="اكتب ردك..."
                            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-luxury-primary/50"
                          />
                          <button
                            onClick={() => handleReply(message.messageId)}
                            disabled={sendingReply || !replyText.trim()}
                            className="bg-luxury-primary/20 hover:bg-luxury-primary/30 disabled:opacity-50 text-luxury-primary px-3 py-2 rounded-lg transition-all"
                          >
                            <Reply size={16} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}

      <PaginationControls
        page={page}
        totalPages={totalPages}
        totalCount={totalCount}
        onPageChange={setPage}
        className="mt-6 rounded-2xl"
      />

      {/* Compose Modal */}
      <AnimatePresence>
        {showCompose && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
            onClick={() => setShowCompose(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-[#1a1520] border border-white/10 rounded-2xl w-full max-w-lg p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <MessageSquare size={20} className="text-luxury-primary" />
                  رسالة جديدة
                </h2>
                <button onClick={() => setShowCompose(false)} className="text-slate-400 hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                {/* Employee Search */}
                <div className="relative">
                  <label className="block text-sm font-medium text-slate-300 mb-1">المستلم</label>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearchEmployees(e.target.value)}
                    onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
                    placeholder="ابحث بالاسم أو البريد..."
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:border-luxury-primary/50"
                  />
                  {selectedEmployee && (
                    <button
                      onClick={() => { setSelectedEmployee(null); setSearchQuery(''); }}
                      className="absolute left-2 top-8 text-slate-400 hover:text-white"
                    >
                      <X size={16} />
                    </button>
                  )}

                  {/* Search Dropdown */}
                  {showDropdown && searchResults.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full bg-[#1a1520] border border-white/10 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                      {searchResults.map((emp) => (
                        <button
                          key={emp.employeeId}
                          onClick={() => selectEmployee(emp)}
                          className="w-full text-right px-3 py-2 hover:bg-white/10 transition-colors flex items-center justify-between"
                        >
                          <div>
                            <p className="text-sm text-white font-medium">{emp.fullName}</p>
                            <p className="text-xs text-slate-400">{emp.email}</p>
                          </div>
                          <span className="text-xs text-slate-500">#{emp.employeeId}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {searching && (
                    <p className="text-xs text-slate-500 mt-1">جاري البحث...</p>
                  )}
                  {selectedEmployee && (
                    <p className="text-xs text-emerald-400 mt-1">
                      ✓ {selectedEmployee.name} (#{selectedEmployee.id})
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">العنوان</label>
                  <input
                    type="text"
                    value={composeTitle}
                    onChange={(e) => setComposeTitle(e.target.value)}
                    placeholder="عنوان الرسالة"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:border-luxury-primary/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">الأولوية</label>
                  <div className="flex gap-2">
                    {(['LOW', 'MEDIUM', 'HIGH'] as const).map((p) => (
                      <button
                        key={p}
                        onClick={() => setComposePriority(p)}
                        className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                          composePriority === p
                            ? p === 'HIGH' ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                              : p === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                              : 'bg-green-500/20 text-green-400 border border-green-500/30'
                            : 'bg-white/5 text-slate-400 border border-white/10'
                        }`}
                      >
                        {p === 'HIGH' ? 'عالية' : p === 'MEDIUM' ? 'متوسطة' : 'منخفضة'}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">الرسالة</label>
                  <textarea
                    value={composeMessage}
                    onChange={(e) => setComposeMessage(e.target.value)}
                    placeholder="محتوى الرسالة..."
                    rows={4}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:border-luxury-primary/50 resize-none"
                  />
                </div>
                <div className="flex gap-3 justify-end pt-2">
                  <button onClick={() => setShowCompose(false)}
                    className="px-4 py-2 border border-white/10 text-slate-400 rounded-lg hover:bg-white/5 transition-all">
                    إلغاء
                  </button>
                  <button onClick={handleCompose} disabled={sendingMessage || !selectedEmployee || !composeTitle || !composeMessage}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg transition-all flex items-center gap-2">
                    <Send size={16} />
                    {sendingMessage ? 'جاري الإرسال...' : 'إرسال'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Inbox;
