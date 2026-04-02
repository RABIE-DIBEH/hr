import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Mail, Lock, ArrowLeft, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { login } from '../services/api';
import axios from 'axios';

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      const msg =
        axios.isAxiosError(err) && err.response?.data && typeof err.response.data === 'object' && 'message' in err.response.data
          ? String((err.response.data as { message: string }).message)
          : 'تعذر تسجيل الدخول. تحقق من البيانات أو اتصال الخادم.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-luxury-bg flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-luxury-primary/10 rounded-full blur-[120px] -mr-48 -mt-48" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-luxury-accent/5 rounded-full blur-[120px] -ml-48 -mb-48" />

      <motion.div 
        initial={{ opacity: 1, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full card-luxury p-10 relative z-10 bg-white/[0.02] backdrop-blur-2xl"
      >
        <div className="text-center mb-12">
          <div className="w-20 h-20 gold-gradient rounded-[24px] flex items-center justify-center mx-auto mb-8 shadow-[0_10px_40px_rgba(212,175,55,0.3)]">
            <ShieldCheck size={40} className="text-black" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tighter mb-3">البوابة الفاخرة</h1>
          <p className="text-white/40 font-medium text-sm">إدارة ثروتك بكل خصوصية وأمان</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-8">
          {error && (
            <p className="text-red-400 text-sm text-center font-medium" role="alert">
              {error}
            </p>
          )}
          <div className="space-y-2">
            <label className="text-xs font-black text-luxury-accent uppercase tracking-[0.2em] mr-1">البريد الإلكتروني</label>
            <div className="relative">
              <Mail className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20" size={20} />
              <input 
                type="email" 
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/[0.03] border border-white/5 rounded-[20px] py-5 pr-12 pl-4 text-white placeholder:text-white/10 focus:outline-none focus:border-luxury-primary/50 focus:bg-white/[0.05] transition-all text-sm font-medium"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-luxury-accent uppercase tracking-[0.2em] mr-1">كلمة المرور</label>
            <div className="relative">
              <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20" size={20} />
              <input 
                type="password" 
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/[0.03] border border-white/5 rounded-[20px] py-5 pr-12 pl-4 text-white placeholder:text-white/10 focus:outline-none focus:border-luxury-primary/50 focus:bg-white/[0.05] transition-all text-sm font-medium"
                required
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full gold-gradient text-black py-5 rounded-[20px] font-black shadow-[0_15px_30px_rgba(212,175,55,0.2)] hover:shadow-[0_20px_40px_rgba(212,175,55,0.3)] transition-all active:scale-[0.98] flex items-center justify-center gap-3"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={24} />
            ) : (
              <>
                <span className="text-lg">تسجيل الدخول</span>
                <ArrowLeft size={20} strokeWidth={3} />
              </>
            )}
          </button>
        </form>

        <p className="mt-12 text-center text-white/20 text-[10px] font-bold uppercase tracking-[0.3em]">
          النظام المالي المحمي • 2026
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
