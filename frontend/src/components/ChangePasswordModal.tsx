import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, X, Save, AlertCircle, CheckCircle2 } from 'lucide-react';
import { changePassword } from '../services/api';

interface ChangePasswordModalProps {
  onClose: () => void;
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ onClose }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError('كلمات المرور الجديدة غير متطابقة');
      return;
    }

    if (newPassword.length < 6) {
      setError('كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل');
      return;
    }

    setLoading(true);
    try {
      await changePassword({ currentPassword, newPassword });
      setSuccess(true);
      setTimeout(() => onClose(), 2000);
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      setError(axiosError.response?.data?.message || 'فشل تغيير كلمة المرور');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-[#110d18] rounded-[2.5rem] shadow-2xl max-w-md w-full border border-white/10 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        <div className="bg-gradient-to-r from-purple-600 to-indigo-700 text-white p-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Lock size={20} />
            <h2 className="text-xl font-bold">تغيير كلمة المرور</h2>
          </div>
          <button onClick={onClose} aria-label="إغلاق" className="hover:bg-white/10 p-1 rounded-lg transition-all">
            <X size={20} aria-label="إغلاق" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-sm flex items-center gap-2">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-500/10 border border-green-500/20 text-green-400 p-3 rounded-xl text-sm flex items-center gap-2">
              <CheckCircle2 size={16} />
              تم تغيير كلمة المرور بنجاح!
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">كلمة المرور الحالية</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:ring-2 focus:ring-purple-500/50"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">كلمة المرور الجديدة</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:ring-2 focus:ring-purple-500/50"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">تأكيد كلمة المرور الجديدة</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:ring-2 focus:ring-purple-500/50"
              required
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-white/10 text-slate-400 rounded-xl font-bold hover:bg-white/5 transition-all"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={loading || success}
              className="flex-[2] px-4 py-3 bg-white text-black rounded-xl font-bold hover:bg-slate-200 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
              ) : (
                <>
                  <Save size={18} />
                  <span>تغيير كلمة المرور</span>
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default ChangePasswordModal;
