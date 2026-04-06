import { useState, useEffect } from 'react';
import { CreditCard, CheckCircle, Wifi, ShieldCheck, AlertCircle, Plus, X, Search } from 'lucide-react';
import { clockByNfc, searchEmployees, assignEmployeeNfcCard } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';

const NFCClock = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('اقرب بطاقة NFC من القارئ');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(false);

  // NFC Card assignment modal
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ employeeId: number; fullName: string; email: string }[]>([]);
  const [assignLoading, setAssignLoading] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<{ employeeId: number; fullName: string } | null>(null);
  const [cardUid, setCardUid] = useState('');
  const [assignResult, setAssignResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(() => {
      searchEmployees(searchQuery)
        .then(res => setSearchResults(res.data))
        .catch(() => setSearchResults([]));
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleAssignCard = async () => {
    if (!selectedEmployee || !cardUid.trim()) return;
    setAssignLoading(true);
    try {
      await assignEmployeeNfcCard(selectedEmployee.employeeId, cardUid.trim());
      setAssignResult({ success: true, message: `تم ربط البطاقة بـ ${selectedEmployee.fullName}` });
      setCardUid('');
      setSelectedEmployee(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'فشل ربط البطاقة';
      setAssignResult({ success: false, message: msg });
    } finally {
      setAssignLoading(false);
    }
  };

  const simulateClock = async () => {
    setLoading(true);
    setError(false);
    setMessage('جاري التحقق من الهوية...');
    
    try {
      const response = await clockByNfc("04:23:1A:FF"); // Simulated Card UID
      setLoading(false);
      setSuccess(true);
      // After interceptor auto-unwrap, response.data is the inner Map: { result: "..." }
      setMessage(response.data.result || response.data.message || 'تم التسجيل بنجاح');

      setTimeout(() => {
        setSuccess(false);
        setMessage('اقرب بطاقة NFC من القارئ');
      }, 5000);
    } catch (err: unknown) {
      setLoading(false);
      setError(true);
      const msg = (typeof err === 'object' && err !== null && 'response' in err)
        ? ((err as { response?: { data?: { message?: string } } }).response?.data?.message || 'خطأ في الاتصال بالخادم')
        : 'خطأ في الاتصال بالخادم';
      setMessage(msg);
      
      setTimeout(() => {
        setError(false);
        setMessage('اقرب بطاقة NFC من القارئ');
      }, 5000);
    }
  };

  return (
    <div className="flex items-center justify-center p-6 text-white font-sans w-full min-h-[70vh]">
      <div className="max-w-md w-full bg-luxury-surface rounded-[2.5rem] p-10 shadow-2xl border border-white/5 text-center relative overflow-hidden">
        {/* Connection Indicator */}
        <div className="absolute top-6 right-8 flex items-center gap-1 text-green-500 text-xs">
          <Wifi size={14} />
          <span>متصل</span>
        </div>

        <div className="mb-8">
          <ShieldCheck className="mx-auto text-blue-500 mb-2" size={32} />
          <h1 className="text-xl font-bold tracking-tight text-white">نظام الحضور الذكي</h1>
          <p className="text-slate-400 text-sm">فرع المركز الرئيسي</p>
        </div>

        <div className={`w-48 h-48 mx-auto rounded-full border-4 flex items-center justify-center mb-10 transition-all duration-500 ${
          success ? 'border-green-500 bg-green-500/10' : 
          error ? 'border-red-500 bg-red-500/10' :
          loading ? 'border-blue-500 border-t-transparent animate-spin' : 'border-white/5 bg-white/5'
        }`}>
          {!loading && !success && !error && <CreditCard size={64} className="text-slate-500 animate-pulse" />}
          {success && <CheckCircle size={64} className="text-green-500" />}
          {error && <AlertCircle size={64} className="text-red-500" />}
        </div>

        <div className={`text-lg font-medium mb-8 transition-colors ${
          success ? 'text-green-400' : 
          error ? 'text-red-400' : 'text-slate-200'
        }`}>
          {message}
        </div>

        <button
          onClick={simulateClock}
          disabled={loading || success}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-white/5 disabled:text-slate-500 py-4 rounded-2xl font-bold transition-all active:scale-95 shadow-lg shadow-blue-900/20"
        >
          {loading ? 'جاري القراءة...' : 'محاكاة تمرير البطاقة (04:23:1A:FF)'}
        </button>

        <button
          onClick={() => { setShowAssignModal(true); setAssignResult(null); setSearchQuery(''); setSelectedEmployee(null); setCardUid(''); }}
          className="w-full mt-3 bg-white/5 hover:bg-white/10 border border-white/10 py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 text-slate-300 hover:text-white"
        >
          <Plus size={20} />
          ربط بطاقة NFC بموظف
        </button>

        <p className="mt-8 text-xs text-slate-500">
          معرّف الجهاز: NFC-TERMINAL-01
        </p>
      </div>

      {/* Assign NFC Card Modal */}
      <AnimatePresence>
        {showAssignModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowAssignModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white">ربط بطاقة NFC</h2>
                <button onClick={() => setShowAssignModal(false)} className="text-slate-400 hover:text-white">
                  <X size={20} />
                </button>
              </div>

              {!assignResult ? (
                <div className="space-y-4">
                  {/* Employee Search */}
                  <div>
                    <label className="block text-sm font-bold text-slate-300 mb-2">البحث عن موظف</label>
                    <div className="relative">
                      <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); setSelectedEmployee(null); }}
                        placeholder="اكتب الاسم أو البريد..."
                        className="w-full pr-10 pl-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-600 focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    {searchResults.length > 0 && !selectedEmployee && (
                      <div className="mt-2 max-h-40 overflow-y-auto bg-white/5 rounded-xl border border-white/10">
                        {searchResults.map(emp => (
                          <button
                            key={emp.employeeId}
                            onClick={() => { setSelectedEmployee({ employeeId: emp.employeeId, fullName: emp.fullName }); setSearchQuery(emp.fullName); }}
                            className="w-full text-right px-4 py-3 hover:bg-white/10 transition-colors text-sm text-white"
                          >
                            {emp.fullName}
                          </button>
                        ))}
                      </div>
                    )}
                    {selectedEmployee && (
                      <div className="mt-2 px-4 py-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-300 text-sm font-bold">
                        ✓ {selectedEmployee.fullName}
                      </div>
                    )}
                  </div>

                  {/* Card UID */}
                  <div>
                    <label className="block text-sm font-bold text-slate-300 mb-2">معرف البطاقة (UID)</label>
                    <input
                      type="text"
                      value={cardUid}
                      onChange={(e) => setCardUid(e.target.value)}
                      placeholder="مثال: 04:23:1A:FF"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white font-mono placeholder:text-slate-600 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <button
                    onClick={handleAssignCard}
                    disabled={assignLoading || !selectedEmployee || !cardUid.trim()}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 py-3 rounded-xl font-bold text-white transition-all"
                  >
                    {assignLoading ? 'جارِ الربط...' : 'ربط البطاقة'}
                  </button>
                </div>
              ) : (
                <div className={`p-6 rounded-xl text-center ${assignResult.success ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
                  <p className={`font-bold ${assignResult.success ? 'text-green-400' : 'text-red-400'}`}>
                    {assignResult.success ? '✓' : '✗'} {assignResult.message}
                  </p>
                  {assignResult.success && (
                    <button
                      onClick={() => setShowAssignModal(false)}
                      className="mt-4 w-full bg-blue-600 hover:bg-blue-700 py-3 rounded-xl font-bold text-white transition-all"
                    >
                      تم
                    </button>
                  )}
                  {!assignResult.success && (
                    <button
                      onClick={() => setAssignResult(null)}
                      className="mt-4 w-full bg-white/5 hover:bg-white/10 py-3 rounded-xl font-bold text-slate-300 transition-all"
                    >
                      إعادة المحاولة
                    </button>
                  )}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NFCClock;
