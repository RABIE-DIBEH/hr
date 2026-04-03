import { useState } from 'react';
import { submitLeaveRequest } from '../services/api';
import { motion } from 'framer-motion';
import { X, Calendar, Clock, FileText } from 'lucide-react';

interface LeaveRequestFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

const LeaveRequestForm = ({ onClose, onSuccess }: LeaveRequestFormProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [leaveType, setLeaveType] = useState<'Standard' | 'Hourly'>('Standard');

  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    duration: '',
    reason: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const durationNum = parseFloat(formData.duration);
    if (!formData.startDate || (leaveType === 'Standard' && !formData.endDate)) {
      setError('يرجى تحديد تواريخ الإجازة');
      return;
    }
    if (isNaN(durationNum) || durationNum <= 0) {
      setError('المدة يجب أن تكون رقماً أكبر من صفر');
      return;
    }

    setLoading(true);

    try {
      await submitLeaveRequest({
        leaveType: leaveType === 'Standard' ? 'Standard' : 'Hourly',
        startDate: formData.startDate,
        endDate: leaveType === 'Standard' ? formData.endDate : formData.startDate,
        duration: durationNum,
        reason: formData.reason.trim() || undefined,
      });
      setSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (err: unknown) {
      let errorMessage = 'حدث خطأ أثناء إرسال الطلب. تأكد من صحة البيانات وتوفر رصيد كافٍ.';
      if (typeof err === 'object' && err !== null && 'response' in err) {
        const axiosError = err as { response?: { data?: { message?: string } } };
        if (axiosError.response?.data?.message) {
          errorMessage = axiosError.response.data.message;
        }
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <div
          className="bg-zinc-900 border border-white/10 rounded-2xl p-8 max-w-md w-full text-center shadow-2xl"
          onClick={(e) => e.stopPropagation()}
          dir="rtl"
        >
          <div className="text-green-400 bg-green-500/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto text-4xl mb-4">
            ✓
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">تم إصدار الطلب بنجاح</h2>
          <p className="text-slate-400 mb-6">
            تم توجيه الطلب إلى مدير القسم للمراجعة المبدئية.
          </p>
          <button
            onClick={onClose}
            className="bg-blue-600 text-white px-8 py-3 rounded-xl hover:bg-blue-700 font-bold transition-all w-full"
          >
            إغلاق
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl max-w-lg w-full flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-6 rounded-t-2xl flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-2xl font-bold">نموذج طلب إجازة</h2>
            <p className="text-blue-200 mt-1 text-sm">حدد نوع الإجازة والفترة المطلوبة</p>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-xl transition-all"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form Body - scrollable */}
        <div className="p-6 overflow-y-auto custom-scrollbar">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm" role="alert">
                {error}
              </div>
            )}

            {/* Leave Type Toggle */}
            <div className="flex bg-white/5 border border-white/10 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setLeaveType('Standard')}
                className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all ${
                  leaveType === 'Standard'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                إجازة مسبقة (أيام)
              </button>
              <button
                type="button"
                onClick={() => setLeaveType('Hourly')}
                className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all ${
                  leaveType === 'Hourly'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                إجازة ساعية (مباشرة)
              </button>
            </div>

            {/* Date Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2 flex items-center gap-2">
                  <Calendar size={16} className="text-blue-400" />
                  {leaveType === 'Standard' ? 'تاريخ البداية' : 'تاريخ الإجازة'}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white color-scheme-dark"
                />
              </div>

              {leaveType === 'Standard' && (
                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-2 flex items-center gap-2">
                    <Calendar size={16} className="text-blue-400" />
                    تاريخ النهاية <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white color-scheme-dark"
                  />
                </div>
              )}
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-bold text-slate-300 mb-2 flex items-center gap-2">
                <Clock size={16} className="text-blue-400" />
                المدة المطلوبة <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                  placeholder="مثال: 1"
                  min="0.5"
                  step="0.5"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder:text-slate-600"
                />
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                  {leaveType === 'Standard' ? 'يوم' : 'ساعة'}
                </span>
              </div>
              <p className="text-slate-500 text-xs mt-2 font-medium">
                {leaveType === 'Standard' 
                  ? 'يتم خصم هذه الأيام من رصيد الإجازات السنوي المتبقي.' 
                  : 'يتم خصم هذه الساعات من رصيد الساعات الإضافية (Overtime).'}
              </p>
            </div>

            {/* Reason */}
            <div>
              <label className="block text-sm font-bold text-slate-300 mb-2 flex items-center gap-2">
                <FileText size={16} className="text-blue-400" />
                سبب الإجازة (اختياري)
              </label>
              <textarea
                name="reason"
                value={formData.reason}
                onChange={handleChange}
                placeholder="اكتب التبرير هنا..."
                rows={3}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder:text-slate-600 resize-none"
              />
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="p-6 bg-white/5 border-t border-white/10 flex gap-4 shrink-0 rounded-b-2xl">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 text-slate-300 bg-white/5 hover:bg-white/10 rounded-xl font-bold transition-all"
            disabled={loading}
          >
            إلغاء
          </button>
          <button
            onClick={handleSubmit}
            className="flex-[2] bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-bold disabled:opacity-50 flex items-center justify-center gap-2"
            disabled={loading}
          >
            {loading ? (
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              'إرسال الطلب للمدير'
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default LeaveRequestForm;
