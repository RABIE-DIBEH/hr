import { useState } from 'react';
import { submitAdvanceRequest } from '../services/api';
import { motion } from 'framer-motion';
import { extractApiError } from '../utils/errorHandler';

interface AdvanceRequestFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface FormErrors {
  [key: string]: string;
}

const AdvanceRequestForm = ({ onClose, onSuccess }: AdvanceRequestFormProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    amount: '',
    reason: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Amount validation
    const amount = parseFloat(formData.amount);
    if (!formData.amount.trim()) {
      newErrors.amount = 'المبلغ مطلوب';
    } else if (isNaN(amount) || amount <= 0) {
      newErrors.amount = 'المبلغ يجب أن يكون رقماً موجباً';
    } else if (amount > 100000) {
      newErrors.amount = 'المبلغ يتجاوز الحد الأقصى المسموح (100,000)';
    }

    // Reason validation
    if (formData.reason.trim().length > 500) {
      newErrors.reason = 'السبب يجب ألا يتجاوز 500 حرف';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const requestData = {
        amount: parseFloat(formData.amount),
        reason: formData.reason.trim() || undefined,
      };

      await submitAdvanceRequest(requestData);
      setSuccess(true);
      
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (err: unknown) {
      const { message } = extractApiError(err);
      setError(message || 'حدث خطأ أثناء إرسال الطلب');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-lg p-8 max-w-md w-full text-center"
          onClick={(e) => e.stopPropagation()}
          dir="rtl"
        >
          <div className="text-green-600 text-6xl mb-4">✓</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">تم إرسال طلب السلفة بنجاح</h2>
          <p className="text-gray-600 mb-6">
            تم إرسال طلب السلفة بنجاح وتم توجيهه إلى إدارة الرواتب للمراجعة والموافقة
          </p>
          <button
            onClick={onClose}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
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
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-2xl max-w-lg w-full"
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-6 rounded-t-lg">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">طلب سلفة مالية</h2>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 text-2xl font-bold"
            >
              ×
            </button>
          </div>
          <p className="text-purple-100 mt-2">
            أدخل المبلغ والسبب لإرسال طلب السلفة
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg" role="alert">
              {error}
            </div>
          )}

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              المبلغ المطلوب <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                placeholder="0.00"
                min="0"
                step="0.01"
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg font-semibold text-gray-900 ${
                  errors.amount ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">ر.س</span>
            </div>
            {errors.amount && (
              <p className="text-red-500 text-xs mt-1">{errors.amount}</p>
            )}
            <p className="text-gray-500 text-xs mt-2">
              الحد الأقصى المسموح: 100,000 ر.س
            </p>
          </div>
 
          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              سبب الطلب
            </label>
            <textarea
              name="reason"
              value={formData.reason}
              onChange={handleChange}
              placeholder="اكتب سبب طلب السلفة (اختياري)..."
              rows={4}
              maxLength={500}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-gray-900 font-medium ${
                errors.reason ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.reason && (
              <p className="text-red-500 text-xs mt-1">{errors.reason}</p>
            )}
            <p className="text-gray-500 text-xs mt-1 text-left">
              {formData.reason.length}/500
            </p>
          </div>

          {/* Info Box */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <p className="text-purple-800 text-sm">
              <strong>ملاحظة:</strong> سيتم خصم مبلغ السلفة من راتبك الشهري أثناء معالجة الرواتب.
              سيتم مراجعة طلبك من قبل إدارة الموارد البشرية.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-end pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  جاري الإرسال...
                </span>
              ) : (
                'إرسال الطلب'
              )}
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
};

export default AdvanceRequestForm;
