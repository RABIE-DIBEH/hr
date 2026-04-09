import { useState, useEffect } from 'react';
import { submitRecruitmentRequest, getNextEmployeeId, getAllDepartments, type RecruitmentRequest, type Department } from '../services/api';
import { motion } from 'framer-motion';
import { extractApiError } from '../utils/errorHandler';

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
  const [departments, setDepartments] = useState<Department[]>([]);
  const [departmentsLoading, setDepartmentsLoading] = useState(false);

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

  // Employee ID assignment mode: 'auto' or 'manual'
  const [employeeIdMode, setEmployeeIdMode] = useState<'auto' | 'manual'>('auto');
  const [manualEmployeeId, setManualEmployeeId] = useState('');
  const [nextAutoEmployeeId, setNextAutoEmployeeId] = useState<number | null>(null);
  const [requiresStartingNumber, setRequiresStartingNumber] = useState(false);

  // Fetch the next auto-generated employee ID on mount
  useEffect(() => {
    const fetchNextId = async () => {
      try {
        const res = await getNextEmployeeId();
        if (res.data.id != null) {
          setNextAutoEmployeeId(res.data.id);
          setRequiresStartingNumber(false);
        } else {
          // No starting number set yet
          setNextAutoEmployeeId(null);
          setRequiresStartingNumber(true);
        }
      } catch {
        // Silently ignore - the backend will still generate it on submit
      }
    };
    void fetchNextId();
  }, []);

  // Fetch departments on component mount
  useEffect(() => {
    const fetchDepartments = async () => {
      setDepartmentsLoading(true);
      try {
        const departments = await getAllDepartments();
        setDepartments(departments);
      } catch (err: unknown) {
        console.error('Failed to fetch departments:', err);
        // Departments will remain empty array
      } finally {
        setDepartmentsLoading(false);
      }
    };
    void fetchDepartments();
  }, []);

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

    // Manual employee ID validation
    if (employeeIdMode === 'manual') {
      if (!manualEmployeeId.trim()) {
        newErrors.employeeId = 'رقم الموظف مطلوب';
      } else {
        const empId = parseInt(manualEmployeeId);
        if (isNaN(empId) || empId <= 0) {
          newErrors.employeeId = 'رقم الموظف يجب أن يكون رقماً موجباً';
        }
      }
    }

    // Auto-generate starting number validation
    if (employeeIdMode === 'auto' && requiresStartingNumber) {
      if (!manualEmployeeId.trim()) {
        newErrors.employeeId = 'يجب إدخال رقم بداية للموظفين (يُستخدم كرقم أولي ثم يتم الزيادة تلقائياً)';
      } else {
        const empId = parseInt(manualEmployeeId);
        if (isNaN(empId) || empId <= 0) {
          newErrors.employeeId = 'رقم البداية يجب أن يكون رقماً موجباً';
        }
      }
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
        // When auto-generate is selected for the first time, send the starting number as employeeId
        employeeId: employeeIdMode === 'manual'
          ? parseInt(manualEmployeeId)
          : requiresStartingNumber && manualEmployeeId
            ? parseInt(manualEmployeeId)
            : undefined,
        autoGenerateEmployeeId: employeeIdMode === 'auto',
      };

      await submitRecruitmentRequest(requestData);
      setSuccess(true);
      
      // Notify parent component
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
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
                  الاسم الثلاثي <span className="text-red-500">*</span>
                </label>
                <input
                  id="fullName"
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="مثال: أحمد محمد علي"
                  className={`w-full px-4 py-2 border rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.fullName ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.fullName && (
                  <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  البريد الإلكتروني <span className="text-red-500">*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="example@company.com"
                  className={`w-full px-4 py-2 border rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                )}
              </div>

              {/* National ID */}
              <div>
                <label htmlFor="nationalId" className="block text-sm font-medium text-gray-700 mb-2">
                  رقم الهوية الوطنية <span className="text-red-500">*</span>
                </label>
                <input
                  id="nationalId"
                  type="text"
                  name="nationalId"
                  value={formData.nationalId}
                  onChange={handleChange}
                  placeholder="10 أرقام"
                  maxLength={10}
                  className={`w-full px-4 py-2 border rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.nationalId ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.nationalId && (
                  <p className="text-red-500 text-xs mt-1">{errors.nationalId}</p>
                )}
              </div>

              {/* Age */}
              <div>
                <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-2">
                  العمر <span className="text-red-500">*</span>
                </label>
                <input
                  id="age"
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleChange}
                  placeholder="18-65"
                  min="18"
                  max="65"
                  className={`w-full px-4 py-2 border rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.age ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.age && (
                  <p className="text-red-500 text-xs mt-1">{errors.age}</p>
                )}
              </div>

              {/* Marital Status */}
              <div>
                <label htmlFor="maritalStatus" className="block text-sm font-medium text-gray-700 mb-2">
                  الحالة الاجتماعية <span className="text-red-500">*</span>
                </label>
                <select
                  id="maritalStatus"
                  name="maritalStatus"
                  value={formData.maritalStatus}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
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
                <label htmlFor="numberOfChildren" className="block text-sm font-medium text-gray-700 mb-2">
                  عدد الأطفال
                </label>
                <input
                  id="numberOfChildren"
                  type="number"
                  name="numberOfChildren"
                  value={formData.numberOfChildren}
                  onChange={handleChange}
                  placeholder="0"
                  min="0"
                  className={`w-full px-4 py-2 border rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.numberOfChildren ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.numberOfChildren && (
                  <p className="text-red-500 text-xs mt-1">{errors.numberOfChildren}</p>
                )}
              </div>

              {/* Military Service Status */}
              <div>
                <label htmlFor="militaryServiceStatus" className="block text-sm font-medium text-gray-700 mb-2">
                  حالة الخدمة العسكرية <span className="text-red-500">*</span>
                </label>
                <select
                  id="militaryServiceStatus"
                  name="militaryServiceStatus"
                  value={formData.militaryServiceStatus}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
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
                <label htmlFor="mobileNumber" className="block text-sm font-medium text-gray-700 mb-2">
                  رقم الجوال <span className="text-red-500">*</span>
                </label>
                <input
                  id="mobileNumber"
                  type="text"
                  name="mobileNumber"
                  value={formData.mobileNumber}
                  onChange={handleChange}
                  placeholder="05XXXXXXXX"
                  maxLength={10}
                  className={`w-full px-4 py-2 border rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.mobileNumber ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.mobileNumber && (
                  <p className="text-red-500 text-xs mt-1">{errors.mobileNumber}</p>
                )}
              </div>

              {/* Address */}
              <div className="md:col-span-2">
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                  العنوان <span className="text-red-500">*</span>
                </label>
                <input
                  id="address"
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="المدينة، الحي، الشارع"
                  className={`w-full px-4 py-2 border rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
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
                <label htmlFor="jobDescription" className="block text-sm font-medium text-gray-700 mb-2">
                  المسمى الوظيفي <span className="text-red-500">*</span>
                </label>
                <input
                  id="jobDescription"
                  type="text"
                  name="jobDescription"
                  value={formData.jobDescription}
                  onChange={handleChange}
                  placeholder="مثال: مطور برمجيات"
                  className={`w-full px-4 py-2 border rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.jobDescription ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.jobDescription && (
                  <p className="text-red-500 text-xs mt-1">{errors.jobDescription}</p>
                )}
              </div>

              {/* Department */}
              <div>
                <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-2">
                  القسم <span className="text-red-500">*</span>
                </label>
                <select
                  id="department"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.department ? 'border-red-500' : 'border-gray-300'
                  }`}
                  disabled={departmentsLoading}
                >
                  <option value="">{departmentsLoading ? 'جاري تحميل الأقسام...' : 'اختر القسم'}</option>
                  {departments.map((dept) => (
                    <option key={dept.departmentId} value={dept.departmentName}>
                      {dept.departmentName}
                    </option>
                  ))}
                </select>
                {errors.department && (
                  <p className="text-red-500 text-xs mt-1">{errors.department}</p>
                )}
              </div>

              {/* Employee ID Assignment */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  رقم الموظف <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Auto-generate option */}
                  <label className="flex items-center gap-2 cursor-pointer bg-blue-50 border-2 border-blue-300 rounded-lg px-4 py-3 flex-1">
                    <input
                      type="radio"
                      name="employeeIdMode"
                      value="auto"
                      checked={employeeIdMode === 'auto'}
                      onChange={() => setEmployeeIdMode('auto')}
                      className="w-4 h-4 text-blue-600"
                    />
                    <div className="flex-1">
                      <span className="text-sm font-medium text-gray-800">توليد تلقائي</span>
                      {requiresStartingNumber ? (
                        <p className="text-xs text-amber-600 mt-1">
                          ⚠️ أدخل رقم البداية أدناه
                        </p>
                      ) : nextAutoEmployeeId != null ? (
                        <p className="text-xs text-gray-500 mt-1">
                          سيتم تعيين الرقم: <span className="font-mono font-bold text-blue-600">{nextAutoEmployeeId}</span>
                        </p>
                      ) : (
                        <p className="text-xs text-gray-500 mt-1">
                          جاري التحميل...
                        </p>
                      )}
                    </div>
                  </label>

                  {/* Manual entry option */}
                  <label className="flex items-center gap-2 cursor-pointer bg-gray-50 border-2 border-gray-300 rounded-lg px-4 py-3 flex-1">
                    <input
                      type="radio"
                      name="employeeIdMode"
                      value="manual"
                      checked={employeeIdMode === 'manual'}
                      onChange={() => setEmployeeIdMode('manual')}
                      className="w-4 h-4 text-blue-600"
                    />
                    <div className="flex-1">
                      <span className="text-sm font-medium text-gray-800">إدخال يدوي</span>
                    </div>
                  </label>
                </div>

                {/* Starting number input (shown when auto-generate is selected for the first time) */}
                {employeeIdMode === 'auto' && requiresStartingNumber && (
                  <div className="mt-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-sm text-amber-800 mb-2">
                      🔢 <strong>أول استخدام:</strong> أدخل رقم البداية وسيتم توليد الأرقام التالية تلقائياً
                    </p>
                    <input
                      id="startingNumber"
                      type="number"
                      value={manualEmployeeId}
                      onChange={(e) => setManualEmployeeId(e.target.value)}
                      placeholder="مثال: 5000"
                      min="1"
                      className={`w-full px-4 py-2 border rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.employeeId ? 'border-red-500' : 'border-amber-300'
                      }`}
                    />
                    {errors.employeeId && (
                      <p className="text-red-500 text-xs mt-1">{errors.employeeId}</p>
                    )}
                  </div>
                )}

                {/* Manual employee ID input (shown when manual mode is selected) */}
                {employeeIdMode === 'manual' && (
                  <div className="mt-3">
                    <input
                      id="manualEmployeeId"
                      type="number"
                      value={manualEmployeeId}
                      onChange={(e) => setManualEmployeeId(e.target.value)}
                      placeholder="أدخل رقم الموظف"
                      min="1"
                      className={`w-full px-4 py-2 border rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.employeeId ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.employeeId && (
                      <p className="text-red-500 text-xs mt-1">{errors.employeeId}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Expected Salary */}
              <div>
                <label htmlFor="expectedSalary" className="block text-sm font-medium text-gray-700 mb-2">
                  الراتب المتوقع <span className="text-red-500">*</span>
                </label>
                <input
                  id="expectedSalary"
                  type="number"
                  name="expectedSalary"
                  value={formData.expectedSalary}
                  onChange={handleChange}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className={`w-full px-4 py-2 border rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.expectedSalary ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.expectedSalary && (
                  <p className="text-red-500 text-xs mt-1">{errors.expectedSalary}</p>
                )}
              </div>

              {/* Insurance Number */}
              <div>
                <label htmlFor="insuranceNumber" className="block text-sm font-medium text-gray-700 mb-2">
                  رقم التأمين
                </label>
                <input
                  id="insuranceNumber"
                  type="text"
                  name="insuranceNumber"
                  value={formData.insuranceNumber}
                  onChange={handleChange}
                  placeholder="اختياري"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Health Number */}
              <div>
                <label htmlFor="healthNumber" className="block text-sm font-medium text-gray-700 mb-2">
                  الرقم الصحي
                </label>
                <input
                  id="healthNumber"
                  type="text"
                  name="healthNumber"
                  value={formData.healthNumber}
                  onChange={handleChange}
                  placeholder="اختياري"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
