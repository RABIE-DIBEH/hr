import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  searchEmployees
} from '../services/api';

type FilterType = 'all' | 'unread' | 'high-priority' | 'archived' | 'sent';

const Inbox = () => {
  const queryClient = useQueryClient();
  const filters: Array<{ value: FilterType; label: string; icon?: React.ReactNode }> = [
    { value: 'all', label: 'الكل' },
    { value: 'unread', label: 'غير المقروءة' },
    { value: 'high-priority', label: 'ذات الأولوية' },
    { value: 'sent', label: 'المرسلة', icon: <Send size={14} /> },
    { value: 'archived', label: 'الأرشيف', icon: <FolderOpen size={14} /> },
  ];

  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [page, setPage] = useState(0);

  // Thread / reply state
  const [expandedMessage, setExpandedMessage] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');

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

  // Queries
  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: async () => (await getCurrentEmployee()).data,
  });

  const { data: inboxData, isLoading: loading, isError } = useQuery({
    queryKey: ['inbox', filter, page],
    queryFn: async () => {
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
      return response.data;
    },
  });

  const { data: threadReplies = [] } = useQuery({
    queryKey: ['thread', expandedMessage],
    queryFn: async () => (await getMessageThread(expandedMessage!)).data,
    enabled: !!expandedMessage,
  });

  const messages = inboxData?.items || [];
  const totalPages = inboxData?.totalPages || 0;
  const totalCount = inboxData?.totalCount || 0;

  // Mutations
  const markReadMutation = useMutation({
    mutationFn: (id: number) => markMessageAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inbox'] });
      queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inbox'] });
      queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
    },
  });

  const archiveMutation = useMutation({
    mutationFn: (id: number) => archiveMessage(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inbox'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteMessage(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inbox'] });
      queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
    },
  });

  const replyMutation = useMutation({
    mutationFn: ({ id, text }: { id: number; text: string }) => replyToMessage(id, text),
    onSuccess: (_, variables) => {
      setReplyText('');
      queryClient.invalidateQueries({ queryKey: ['thread', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['inbox'] });
    },
  });

  const sendMutation = useMutation({
    mutationFn: sendToEmployee,
    onSuccess: () => {
      setShowCompose(false);
      setSelectedEmployee(null);
      setSearchQuery('');
      setComposeTitle('');
      setComposeMessage('');
      setComposePriority('MEDIUM');
      queryClient.invalidateQueries({ queryKey: ['inbox', 'sent'] });
    },
  });

  const handleMarkAsRead = (messageId: number) => markReadMutation.mutate(messageId);
  const handleMarkAllAsRead = () => markAllReadMutation.mutate();
  const handleArchive = (messageId: number) => archiveMutation.mutate(messageId);
  const handleDelete = (messageId: number) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه الرسالة نهائياً؟')) return;
    deleteMutation.mutate(messageId);
  };

  const handleReply = (messageId: number) => {
    if (!replyText.trim()) return;
    replyMutation.mutate({ id: messageId, text: replyText.trim() });
  };

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

  const handleCompose = () => {
    if (!selectedEmployee || !composeTitle.trim() || !composeMessage.trim()) return;
    sendMutation.mutate({
      targetEmployeeId: selectedEmployee.id,
      title: composeTitle.trim(),
      message: composeMessage.trim(),
      priority: composePriority,
    });
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
      setSelectedIds(new Set());
      queryClient.invalidateQueries({ queryKey: ['inbox'] });
    } catch {
      alert('فشل في أرشفة الرسائل المحددة.');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`هل أنت متأكد من حذف ${selectedIds.size} رسالة نهائياً؟`)) return;
    try {
      await Promise.all(Array.from(selectedIds).map((id) => deleteMessage(id)));
      setSelectedIds(new Set());
      queryClient.invalidateQueries({ queryKey: ['inbox'] });
      queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
    } catch {
      alert('فشل في حذف الرسائل المحددة.');
    }
  };

  const someSelected = selectedIds.size > 0;
  const allSelected = messages.length > 0 && selectedIds.size === messages.length;

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
                {totalCount} رسالة في هذا الصنف
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleMarkAllAsRead}
              disabled={markAllReadMutation.isPending}
              className="bg-luxury-primary/20 hover:bg-luxury-primary/30 text-luxury-primary border border-luxury-primary/30 px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <CheckCheck size={16} />
              <span>تحديد الكل كمقروء</span>
            </button>
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
              onClick={() => { setFilter(f.value); setPage(0); }}
              className={`px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                filter === f.value
                  ? 'bg-luxury-primary/20 text-luxury-primary border border-luxury-primary/30'
                  : 'bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10'
              }`}
            >
              {f.icon}
              {f.label}
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
      {isError && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg mb-6 flex items-center gap-2">
          <AlertCircle size={20} /> خطأ في تحميل الرسائل
        </div>
      )}

      {/* Loading or Messages */}
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
                    <div className="flex-1 min-w-0" onClick={() => !isSent && setExpandedMessage(isExpanded ? null : message.messageId)}>
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
                      {!isSent && (
                        <button
                          onClick={() => setExpandedMessage(isExpanded ? null : message.messageId)}
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
                        {threadReplies.map((reply) => (
                          <div key={reply.messageId} className="bg-white/5 rounded-xl p-3 border border-white/5">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-slate-400">
                                {reply.senderName} • {formatDate(reply.createdAt)}
                              </span>
                              {reply.senderEmployeeId === me?.employeeId && (
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
                            disabled={replyMutation.isPending || !replyText.trim()}
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
                              : 'bg-green-500/20 text-green-400 border-green-500/30'
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
                  <button onClick={handleCompose} disabled={sendMutation.isPending || !selectedEmployee || !composeTitle || !composeMessage}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg transition-all flex items-center gap-2">
                    <Send size={16} />
                    {sendMutation.isPending ? 'جاري الإرسال...' : 'إرسال'}
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
