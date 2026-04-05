import { useState } from 'react';
import { CreditCard, CheckCircle, Wifi, ShieldCheck, AlertCircle } from 'lucide-react';
import { clockByNfc } from '../services/api';

const NFCClock = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('اقرب بطاقة NFC من القارئ');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(false);

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
    <div className="min-h-screen bg-black flex items-center justify-center p-6 text-white font-sans">
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

        <p className="mt-8 text-xs text-slate-500">
          معرّف الجهاز: NFC-TERMINAL-01
        </p>
      </div>
    </div>
  );
};

export default NFCClock;
