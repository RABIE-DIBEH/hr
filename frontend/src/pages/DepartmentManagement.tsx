import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Plus,
  Edit,
  Trash2,
  X,
  Users,
} from 'lucide-react';
import {
  getAllDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  type Department,
} from '../services/api';
import { getRole } from '../services/auth';
import { motion, AnimatePresence } from 'framer-motion';
import { extractApiError } from '../utils/errorHandler';

const DepartmentManagement = () => {
  const navigate = useNavigate();
  const userRole = getRole() || '';
  const isHighRole = ['HR', 'ADMIN', 'SUPER_ADMIN'].includes(userRole);

  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [formData, setFormData] = useState({
    departmentName: '',
    departmentCode: '',
    managerId: null as number | null,
    description: '',
  });

  useEffect(() => {
    if (!isHighRole) {
      navigate('/dashboard');
      return;
    }
    fetchDepartments();
  }, [isHighRole, navigate]);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const data = await getAllDepartments();
      setDepartments(data);
      setError(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'فشل في تحميل الأقسام');
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditingDept(null);
    setFormData({ departmentName: '', departmentCode: '', managerId: null, description: '' });
    setShowModal(true);
  };

  const openEdit = (dept: Department) => {
    setEditingDept(dept);
    setFormData({
      departmentName: dept.departmentName,
      departmentCode: dept.departmentCode || '',
      managerId: dept.managerId ?? null,
      description: dept.description || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      if (editingDept) {
        await updateDepartment(editingDept.departmentId, formData);
        setSuccess(`تم تحديث قسم "${formData.departmentName}" بنجاح`);
      } else {
        await createDepartment(formData);
        setSuccess(`تم إنشاء قسم "${formData.departmentName}" بنجاح`);
      }
      setShowModal(false);
      await fetchDepartments();
    } catch (err: unknown) {
      setError(extractApiError(err).message || 'فشل في الحفظ');
    }
  };

  const handleDelete = async (dept: Department) => {
    if (!confirm(`هل أنت متأكد من حذف قسم "${dept.departmentName}"؟ لا يمكن حذف قسم يحتوي على موظفين.`)) return;
    setError(null);
    setSuccess(null);

    try {
      await deleteDepartment(dept.departmentId);
      setSuccess(`تم حذف قسم "${dept.departmentName}" بنجاح`);
      await fetchDepartments();
    } catch (err: unknown) {
      setError(extractApiError(err).message || 'فشل في الحذف');
    }
  };

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  if (!isHighRole) return null;

  return (
    <div className="min-h-screen bg-zinc-950 text-white" dir="rtl">
      {/* Toasts */}
      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-green-600 text-white px-6 py-3 rounded-xl shadow-lg max-w-md"
          >
            <p className="font-bold">{success}</p>
            <button onClick={clearMessages} className="text-green-200 text-sm mt-1 hover:text-white">إغلاق</button>
          </motion.div>
        )}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-red-600 text-white px-6 py-3 rounded-xl shadow-lg max-w-md"
          >
            <p className="font-bold">{error}</p>
            <button onClick={clearMessages} className="text-red-200 text-sm mt-1 hover:text-white">إغلاق</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="bg-gradient-to-l from-blue-900 via-indigo-900 to-zinc-950 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-blue-500/10 p-3 rounded-xl">
                <Building2 size={28} className="text-blue-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">إدارة الأقسام</h1>
                <p className="text-slate-400 mt-1">عرض، إنشاء، وتعديل الأقسام</p>
              </div>
            </div>
            <button
              onClick={openCreate}
              className="flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-bold transition-colors"
            >
              <Plus size={18} />
              إضافة قسم
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Table */}
        {loading ? (
          <div className="text-center py-12 text-slate-500">جارِ التحميل...</div>
        ) : departments.length === 0 ? (
          <div className="text-center py-12 text-slate-500">لا توجد أقسام</div>
        ) : (
          <div className="bg-zinc-900 border border-white/5 rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-white/5 text-slate-400">
                <tr>
                  <th className="px-6 py-4 text-right font-bold">#</th>
                  <th className="px-6 py-4 text-right font-bold">اسم القسم</th>
                  <th className="px-6 py-4 text-right font-bold">الرمز</th>
                  <th className="px-6 py-4 text-right font-bold">الوصف</th>
                  <th className="px-6 py-4 text-right font-bold">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {departments.map((dept, idx) => (
                  <tr key={dept.departmentId} className="border-t border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 text-slate-500">{idx + 1}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 font-bold text-xs">
                          <Building2 size={16} />
                        </div>
                        <span className="font-bold text-slate-100">{dept.departmentName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-white/5 text-slate-300">
                        {dept.departmentCode || '—'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-300 max-w-xs truncate">
                      {dept.description || '—'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEdit(dept)}
                          className="p-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 hover:text-blue-300 transition-colors"
                          title="تعديل"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(dept)}
                          className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors"
                          title="حذف"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer count */}
        {!loading && (
          <div className="mt-4 text-slate-500 text-sm">
            عرض {departments.length} قسم
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl max-w-lg w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">
                  {editingDept ? 'تعديل القسم' : 'إنشاء قسم جديد'}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-2">اسم القسم <span className="text-red-400">*</span></label>
                  <input
                    type="text"
                    value={formData.departmentName}
                    onChange={(e) => setFormData({ ...formData, departmentName: e.target.value })}
                    required
                    placeholder="مثال: الهندسة"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-2">رمز القسم</label>
                  <input
                    type="text"
                    value={formData.departmentCode}
                    onChange={(e) => setFormData({ ...formData, departmentCode: e.target.value.toUpperCase() })}
                    placeholder="مثال: ENG"
                    maxLength={20}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-2">الوصف</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="وصف مختصر للقسم..."
                    rows={3}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-bold transition-colors"
                  >
                    {editingDept ? 'تحديث' : 'إنشاء'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-xl font-bold text-slate-300 transition-colors"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DepartmentManagement;
