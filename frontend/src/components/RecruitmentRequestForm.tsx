import { useState } from 'react';
import { submitRecruitmentRequest, type RecruitmentRequest } from '../services/api';
import { motion } from 'framer-motion';

interface RecruitmentRequestFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface FormErrors {
  [key: string]: string;
}

const RecruitmentRequestForm = ({ onClose, onSuccess }: RecruitmentRequestFormProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    nationalId: '',
    address: '',
    jobDescription: '',
    department: '',
    age: '',
    insuranceNumber: '',
    healthNumber: '',
    militaryServiceStatus: '',
    maritalStatus: '',
    numberOfChildren: '',
    mobileNumber: '',
    expectedSalary: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Full name validation (three-part name)
    const nameParts = formData.fullName.trim().split(/\s+/);
    if (nameParts.length < 3) {
      newErrors.fullName = 'يجب إدخال الاسم الثلاثي (ثلاثة أجزاء على الأقل)';
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'البريد الإلكتروني مطلوب';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'صيغة البريد الإلكتروني غير صحيحة';
    }

    // National ID validation
    if (!formData.nationalId.trim()) {
      newErrors.nationalId = 'رقم الهوية الوطنية مطلوب';
    } else if (!/^\d{10}$/.test(formData.nationalId.trim())) {
      newErrors.nationalId = 'رقم الهوية الوطنية يجب أن يكون 10 أرقام';
    }

    // Address validation
    if (!formData.address.trim()) {
      newErrors.address = 'العنوان مطلوب';
    }

    // Job description validation
    if (!formData.jobDescription.trim()) {
      newErrors.jobDescription = 'المسمى الوظيفي مطلوب';
    }

    // Department validation
    if (!formData.department.trim()) {
      newErrors.department = 'القسم مطلوب';
    }

    // Age validation
    const age = parseInt(formData.age);
    if (!formData.age) {
      newErrors.age = 'العمر مطلوب';
    } else if (isNaN(age) || age < 18 || age > 65) {
      newErrors.age = 'العمر يجب أن يكون بين 18 و 65 سنة';
    }

    // Military service status
    if (!formData.militaryServiceStatus) {
      newErrors.militaryServiceStatus = 'حالة الخدمة العسكرية مطلوبة';
    }

    // Marital status
    if (!formData.maritalStatus) {
      newErrors.maritalStatus = 'الحالة الاجتماعية مطلوبة';
    }

    // Number of children (optional but must be valid if provided)
    if (formData.numberOfChildren) {
      const children = parseInt(formData.numberOfChildren);
      if (isNaN(children) || children < 0) {
        newErrors.numberOfChildren = 'عدد الأطفال يجب أن يكون رقماً صحيحاً موجباً';
      }
    }

    // Mobile number validation
    if (!formData.mobileNumber.trim()) {
      newErrors.mobileNumber = 'رقم الجوال مطلوب';
    } else if (!/^05\d{8}$/.test(formData.mobileNumber.trim())) {
      newErrors.mobileNumber = 'رقم الجوال يجب أن يبدأ بـ 05 ويتكون من 10 أرقام';
    }

    // Expected salary validation
    const salary = parseFloat(formData.expectedSalary);
    if (!formData.expectedSalary) {
      newErrors.expectedSalary = 'الراتب المتوقع مطلوب';
    } else if (isNaN(salary) || salary <= 0) {
      newErrors.expectedSalary = 'الراتب يجب أن يكون رقماً موجباً';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error for this field when user starts typing
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
      const requestData: RecruitmentRequest = {
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        nationalId: formData.nationalId.trim(),
        address: formData.address.trim(),
        jobDescription: formData.jobDescription.trim(),
        department: formData.department.trim(),
        age: parseInt(formData.age),
        insuranceNumber: formData.insuranceNumber.trim() || undefined,
        healthNumber: formData.healthNumber.trim() || undefined,
        militaryServiceStatus: formData.militaryServiceStatus,
        maritalStatus: formData.maritalStatus,
        numberOfChildren: formData.numberOfChildren ? parseInt(formData.numberOfChildren) : undefined,
        mobileNumber: formData.mobileNumber.trim(),
        expectedSalary: parseFloat(formData.expectedSalary),
      };

      await submitRecruitmentRequest(requestData);
      setSuccess(true);
      
      // Notify parent component
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (err: unknown) {
      let errorMessage = 'حدث خطأ أثناء إرسال الطلب';
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
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-lg p-8 max-w-md w-full text-center"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-green-600 text-6xl mb-4">✓</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">تم إرسال الطلب بنجاح</h2>
          <p className="text-gray-600 mb-6">
            تم إرسال طلب التوظيف بنجاح وتم توجيهه إلى مدير القسم للمراجعة والموافقة
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
        className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-lg">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">طلب توظيف جديد</h2>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 text-2xl font-bold"
            >
              ×
            </button>
          </div>
          <p className="text-blue-100 mt-2">
            قم بملء جميع البيانات المطلوبة لإرسال طلب التوظيف
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg" role="alert">
              {error}
            </div>
          )}

          {/* Personal Information Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">البيانات الشخصية</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الاسم الثلاثي <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="مثال: أحمد محمد علي"
                  className={`w-full px-4 py-2 border rounded-lg text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.fullName ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.fullName && (
                  <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  البريد الإلكتروني <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="example@company.com"
                  className={`w-full px-4 py-2 border rounded-lg text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                )}
              </div>

              {/* National ID */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  رقم الهوية الوطنية <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="nationalId"
                  value={formData.nationalId}
                  onChange={handleChange}
                  placeholder="10 أرقام"
                  maxLength={10}
                  className={`w-full px-4 py-2 border rounded-lg text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.nationalId ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.nationalId && (
                  <p className="text-red-500 text-xs mt-1">{errors.nationalId}</p>
                )}
              </div>

              {/* Age */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  العمر <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleChange}
                  placeholder="18-65"
                  min="18"
                  max="65"
                  className={`w-full px-4 py-2 border rounded-lg text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.age ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.age && (
                  <p className="text-red-500 text-xs mt-1">{errors.age}</p>
                )}
              </div>

              {/* Marital Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الحالة الاجتماعية <span className="text-red-500">*</span>
                </label>
                <select
                  name="maritalStatus"
                  value={formData.maritalStatus}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.maritalStatus ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">اختر</option>
                  <option value="أعزب">أعزب</option>
                  <option value="متزوج">متزوج</option>
                  <option value="مطلق">مطلق</option>
                  <option value="أرمل">أرمل</option>
                </select>
                {errors.maritalStatus && (
                  <p className="text-red-500 text-xs mt-1">{errors.maritalStatus}</p>
                )}
              </div>

              {/* Number of Children */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  عدد الأطفال
                </label>
                <input
                  type="number"
                  name="numberOfChildren"
                  value={formData.numberOfChildren}
                  onChange={handleChange}
                  placeholder="0"
                  min="0"
                  className={`w-full px-4 py-2 border rounded-lg text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.numberOfChildren ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.numberOfChildren && (
                  <p className="text-red-500 text-xs mt-1">{errors.numberOfChildren}</p>
                )}
              </div>

              {/* Military Service Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  حالة الخدمة العسكرية <span className="text-red-500">*</span>
                </label>
                <select
                  name="militaryServiceStatus"
                  value={formData.militaryServiceStatus}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.militaryServiceStatus ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">اختر</option>
                  <option value="أدى الخدمة">أدى الخدمة</option>
                  <option value="معفي">معفي</option>
                  <option value="مستثنى">مستثنى</option>
                  <option value="لم يؤدها بعد">لم يؤدها بعد</option>
                </select>
                {errors.militaryServiceStatus && (
                  <p className="text-red-500 text-xs mt-1">{errors.militaryServiceStatus}</p>
                )}
              </div>
            </div>
          </div>

          {/* Contact Information Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">بيانات الاتصال</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Mobile Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  رقم الجوال <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="mobileNumber"
                  value={formData.mobileNumber}
                  onChange={handleChange}
                  placeholder="05XXXXXXXX"
                  maxLength={10}
                  className={`w-full px-4 py-2 border rounded-lg text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.mobileNumber ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.mobileNumber && (
                  <p className="text-red-500 text-xs mt-1">{errors.mobileNumber}</p>
                )}
              </div>

              {/* Address */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  العنوان <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="المدينة، الحي، الشارع"
                  className={`w-full px-4 py-2 border rounded-lg text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.address ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.address && (
                  <p className="text-red-500 text-xs mt-1">{errors.address}</p>
                )}
              </div>
            </div>
          </div>

          {/* Employment Information Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">بيانات التوظيف</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Job Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  المسمى الوظيفي <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="jobDescription"
                  value={formData.jobDescription}
                  onChange={handleChange}
                  placeholder="مثال: مطور برمجيات"
                  className={`w-full px-4 py-2 border rounded-lg text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.jobDescription ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.jobDescription && (
                  <p className="text-red-500 text-xs mt-1">{errors.jobDescription}</p>
                )}
              </div>

              {/* Department */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  القسم <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  placeholder="مثال: تقنية المعلومات"
                  className={`w-full px-4 py-2 border rounded-lg text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.department ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.department && (
                  <p className="text-red-500 text-xs mt-1">{errors.department}</p>
                )}
              </div>

              {/* Expected Salary */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الراتب المتوقع <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="expectedSalary"
                  value={formData.expectedSalary}
                  onChange={handleChange}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className={`w-full px-4 py-2 border rounded-lg text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.expectedSalary ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.expectedSalary && (
                  <p className="text-red-500 text-xs mt-1">{errors.expectedSalary}</p>
                )}
              </div>

              {/* Insurance Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  رقم التأمين
                </label>
                <input
                  type="text"
                  name="insuranceNumber"
                  value={formData.insuranceNumber}
                  onChange={handleChange}
                  placeholder="اختياري"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Health Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الرقم الصحي
                </label>
                <input
                  type="text"
                  name="healthNumber"
                  value={formData.healthNumber}
                  onChange={handleChange}
                  placeholder="اختياري"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
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
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
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
                'إرسال للموافقة'
              )}
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
};

export default RecruitmentRequestForm;
