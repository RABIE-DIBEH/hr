import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  UserX,
  Edit,
  Eye,
  Filter,
  Users,
  ShieldCheck,
  UserCog,
  Briefcase,
  Key,
} from 'lucide-react';
import {
  listEmployees,
  updateEmployee,
  deleteEmployee,
  resetEmployeePassword,
  getAllDepartments,
  type EmployeeSummary,
  type EmployeeAdminUpdatePayload,
} from '../services/api';
import { getRole, getPayload } from '../services/auth';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../services/queryKeys';
import { extractApiError } from '../utils/errorHandler';

const roleLabel = (role: string) => {
  const map: Record<string, string> = {
    SUPER_ADMIN: 'مدير النظام الأعلى',
    ADMIN: 'مدير النظام',
    HR: 'الموارد البشرية',
    MANAGER: 'مدير القسم',
    EMPLOYEE: 'موظف',
  };
  return map[role] || role;
};

const roleIcon = (role: string) => {
  const map: Record<string, React.ComponentType<{ size?: number }>> = {
    SUPER_ADMIN: ShieldCheck,
    ADMIN: UserCog,
    HR: Briefcase,
    MANAGER: Users,
    EMPLOYEE: Users,
  };
  const Icon = map[role] || Users;
  return <Icon size={16} />;
};

const roleColors: Record<string, string> = {
  SUPER_ADMIN: 'bg-red-500/10 text-red-400 border-red-500/20',
  ADMIN: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  HR: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  MANAGER: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  EMPLOYEE: 'bg-green-500/10 text-green-400 border-green-500/20',
};

const statusColors: Record<string, string> = {
  Active: 'bg-green-500/10 text-green-400',
  Inactive: 'bg-yellow-500/10 text-yellow-400',
  Terminated: 'bg-red-500/10 text-red-400',
};

const UserManagement = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const userRole = getRole() || '';
  const isHighRole = ['HR', 'ADMIN', 'SUPER_ADMIN'].includes(userRole);
  const isManager = userRole === 'MANAGER';
  const currentUserEmail = getPayload()?.sub || '';
  const isDevUser = currentUserEmail === 'dev@hrms.com';
  const canManagePasswords = isDevUser || isHighRole || isManager;

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal state
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeSummary | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [resetPasswordResult, setResetPasswordResult] = useState<{ password: string; name: string } | null>(null);

  // React Query for departments (shared with DepartmentManagement)
  const { data: departments = [], isLoading: departmentsLoading } = useQuery({
    queryKey: queryKeys.departments.all,
    queryFn: () => getAllDepartments(),
    enabled: isHighRole,
    staleTime: 1000 * 60 * 5, // 5 minutes — departments rarely change
  });

  // Edit form state
  const [editForm, setEditForm] = useState<EmployeeAdminUpdatePayload>({
    fullName: '',
    email: '',
    mobileNumber: '',
    address: '',
    nationalId: '',
    teamId: null,
    departmentId: null,
    roleId: null,
    managerId: null,
    baseSalary: null,
    employmentStatus: null,
  });

  // React Query for employees list (always called, even if user isn't authorized)
  const { data: employees = [], isPending, error: queryError } = useQuery({
    queryKey: queryKeys.users.list,
    queryFn: async () => {
      const res = await listEmployees();
      return res.data;
    },
    enabled: isHighRole, // Only fetch if user has permission
  });

  const error = queryError
    ? (queryError instanceof Error ? queryError.message : 'فشل في تحميل بيانات الموظفين')
    : null;

  const [mutationError, setMutationError] = useState<string | null>(null);

  // Mutation: Update employee
  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: EmployeeAdminUpdatePayload }) =>
      updateEmployee(id, payload),
    onSuccess: () => {
      setSuccessMessage('تم تحديث بيانات الموظف بنجاح');
      setShowEditModal(false);
      void queryClient.invalidateQueries({ queryKey: queryKeys.users.list });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'فشل في التحديث';
      setMutationError(msg);
    },
  });

  // Mutation: Delete (terminate) employee
  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteEmployee(id),
    onSuccess: (res) => {
      setSuccessMessage(res.data ? `تم إنهاء الموظف ${res.data.fullName} بنجاح` : 'تم إنهاء الموظف بنجاح');
      setShowDeleteConfirm(false);
      setSelectedEmployee(null);
      void queryClient.invalidateQueries({ queryKey: queryKeys.users.list });
    },
    onError: (err: unknown) => {
      setMutationError(extractApiError(err).message || 'فشل في الحذف');
    },
  });

  // Mutation: Reset password
  const resetPasswordMutation = useMutation({
    mutationFn: (id: number) => resetEmployeePassword(id),
    onSuccess: (res) => {
      setResetPasswordResult({ password: res.data.newPassword, name: res.data.fullName });
      setSuccessMessage(`تم إعادة تعيين كلمة المرور للموظف ${res.data.fullName}`);
    },
    onError: (err: unknown) => {
      setMutationError(extractApiError(err).message || 'فشل في إعادة تعيين كلمة المرور');
    },
  });

  const filtered = employees.filter((emp) => {
    const matchesSearch =
      search === '' ||
      emp.fullName.toLowerCase().includes(search.toLowerCase()) ||
      emp.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || emp.roleName === roleFilter;
    const matchesStatus = statusFilter === 'ALL' || emp.employmentStatus === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleView = (emp: EmployeeSummary) => {
    setSelectedEmployee(emp);
    setShowViewModal(true);
  };

  const handleEdit = (emp: EmployeeSummary) => {
    setSelectedEmployee(emp);
    setEditForm({
      fullName: emp.fullName,
      email: emp.email,
      mobileNumber: emp.mobileNumber || '',
      address: emp.address || '',
      nationalId: emp.nationalId || '',
      teamId: emp.teamId,
      departmentId: emp.departmentId,
      roleId: emp.roleId,
      managerId: null,
      baseSalary: emp.baseSalary,
      employmentStatus: emp.employmentStatus,
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = () => {
    if (!selectedEmployee) return;
    updateMutation.mutate({ id: selectedEmployee.employeeId, payload: editForm });
  };

  const handleDelete = () => {
    if (!selectedEmployee) return;
    deleteMutation.mutate(selectedEmployee.employeeId);
  };

  const handleResetPassword = () => {
    if (!selectedEmployee) return;
    setResetPasswordResult(null);
    resetPasswordMutation.mutate(selectedEmployee.employeeId);
  };

  const clearMessages = () => {
    setSuccessMessage(null);
    setMutationError(null);
  };

  const displayError = mutationError || error;

  // Redirect if not authorized (useEffect to avoid render-time side effect)
  useEffect(() => {
    if (!isHighRole) {
      navigate('/dashboard');
    }
  }, [isHighRole, navigate]);

  if (!isHighRole) {
    return null;
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white" dir="rtl">
      {/* Success/Error Toasts */}
      <AnimatePresence>
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-green-600 text-white px-6 py-3 rounded-xl shadow-lg max-w-md"
          >
            <p className="font-bold">{successMessage}</p>
            <button onClick={clearMessages} className="text-green-200 text-sm mt-1 hover:text-white">إغلاق</button>
          </motion.div>
        )}
        {displayError && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-red-600 text-white px-6 py-3 rounded-xl shadow-lg max-w-md"
          >
            <p className="font-bold">{displayError}</p>
            <button onClick={clearMessages} className="text-red-200 text-sm mt-1 hover:text-white">إغلاق</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="bg-gradient-to-l from-blue-900 via-indigo-900 to-zinc-950 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center gap-4">
            <div className="bg-blue-500/10 p-3 rounded-xl">
              <Users size={28} className="text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">إدارة الموظفين</h1>
              <p className="text-slate-400 mt-1">عرض، تعديل، وإنهاء حسابات الموظفين</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="relative flex-1 min-w-[250px]">
            <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث بالاسم أو البريد..."
              className="w-full pr-10 pl-4 py-3 bg-zinc-900 border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder:text-slate-600"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-slate-500" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-4 py-3 bg-zinc-900 border border-white/10 rounded-xl text-white"
            >

              <option value="ALL">كل الأدوار</option>
              <option value="SUPER_ADMIN">مدير النظام الأعلى</option>
              <option value="ADMIN">مدير النظام</option>
              <option value="HR">الموارد البشرية</option>
              <option value="MANAGER">مدير القسم</option>
              <option value="EMPLOYEE">موظف</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 bg-zinc-900 border border-white/10 rounded-xl text-white"
            >
              <option value="ALL">كل الحالات</option>
              <option value="Active">نشط</option>
              <option value="Inactive">غير نشط</option>
              <option value="Terminated">مُنهى</option>
            </select>
          </div>
        </div>

        {/* Table */}
        {isPending ? (
          <div className="text-center py-12 text-slate-500">جارِ التحميل...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-500">لا توجد نتائج</div>
        ) : (
          <div className="bg-zinc-900 border border-white/5 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-white/5 text-slate-400">
                  <tr>
                    <th className="px-6 py-4 text-right font-bold">#</th>
                    <th className="px-6 py-4 text-right font-bold">الاسم</th>
                    <th className="px-6 py-4 text-right font-bold">البريد</th>
                    <th className="px-6 py-4 text-right font-bold">الدور</th>
                    <th className="px-6 py-4 text-right font-bold">الفريق</th>
                    <th className="px-6 py-4 text-right font-bold">القسم</th>
                    <th className="px-6 py-4 text-right font-bold">الحالة</th>
                    <th className="px-6 py-4 text-right font-bold">البطاقة</th>
                    <th className="px-6 py-4 text-right font-bold">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((emp, idx) => (
                    <tr key={emp.employeeId} className="border-t border-white/5 hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4 text-slate-500">{idx + 1}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 font-bold text-xs">
                            {emp.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </div>
                          <span className="font-bold text-slate-100">{emp.fullName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-300">{emp.email}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${roleColors[emp.roleName] || ''}`}>
                          {roleIcon(emp.roleName)}
                          {roleLabel(emp.roleName)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-300">{emp.teamName ?? '—'}</td>
                      <td className="px-6 py-4 text-slate-300">{emp.departmentName ?? '—'}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${statusColors[emp.employmentStatus] || 'bg-slate-500/10 text-slate-400'}`}>
                          {emp.employmentStatus === 'Active' ? 'نشط' : emp.employmentStatus === 'Terminated' ? 'مُنهى' : emp.employmentStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {emp.nfcLinked ? (
                          <span className="text-green-400 text-xs font-bold">✓ مرتبط</span>
                        ) : (
                          <span className="text-slate-500 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleView(emp)}
                            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                            title="عرض"
                          >
                            <Eye size={16} />
                          </button>
                          {isHighRole && (
                            <button
                              onClick={() => handleEdit(emp)}
                              className="p-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 hover:text-blue-300 transition-colors"
                              title="تعديل"
                            >
                              <Edit size={16} />
                            </button>
                          )}
                          {canManagePasswords && (
                            <button
                              onClick={() => { setSelectedEmployee(emp); setResetPasswordResult(null); setShowResetPassword(true); }}
                              className="p-2 rounded-lg bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 hover:text-yellow-300 transition-colors"
                              title={isDevUser ? "إعادة تعيين كلمة المرور (Dev)" : "إعادة تعيين كلمة المرور"}
                            >
                              <Key size={16} />
                            </button>
                          )}
                          {emp.employmentStatus !== 'Terminated' && (
                            <button
                              onClick={() => { setSelectedEmployee(emp); setShowDeleteConfirm(true); }}
                              className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors"
                              title="إنهاء"
                            >
                              <UserX size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Footer count */}
        {!isPending && (
          <div className="mt-4 text-slate-500 text-sm">
            عرض {filtered.length} من أصل {employees.length} موظف
          </div>
        )}
      </div>

      {/* View Modal */}
      <AnimatePresence>
        {showViewModal && selectedEmployee && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowViewModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl max-w-lg w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 font-bold text-2xl">
                  {selectedEmployee.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">{selectedEmployee.fullName}</h2>
                  <p className="text-slate-400">{selectedEmployee.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-white/5 p-4 rounded-xl">
                  <p className="text-slate-500 mb-1">الدور</p>
                  <p className="text-white font-bold">{roleLabel(selectedEmployee.roleName)}</p>
                </div>
                <div className="bg-white/5 p-4 rounded-xl">
                  <p className="text-slate-500 mb-1">القسم</p>
                  <p className="text-white font-bold">{selectedEmployee.teamName ?? '—'}</p>
                </div>
                <div className="bg-white/5 p-4 rounded-xl">
                  <p className="text-slate-500 mb-1">الراتب الأساسي</p>
                  <p className="text-white font-bold">{selectedEmployee.baseSalary ? `${Number(selectedEmployee.baseSalary).toLocaleString()} ل.س` : '—'}</p>
                </div>
                <div className="bg-white/5 p-4 rounded-xl">
                  <p className="text-slate-500 mb-1">الحالة</p>
                  <p className={`font-bold ${selectedEmployee.employmentStatus === 'Active' ? 'text-green-400' : 'text-red-400'}`}>
                    {selectedEmployee.employmentStatus === 'Active' ? 'نشط' : selectedEmployee.employmentStatus}
                  </p>
                </div>
                <div className="bg-white/5 p-4 rounded-xl">
                  <p className="text-slate-500 mb-1">بطاقة NFC</p>
                  <p className="text-white font-bold">{selectedEmployee.nfcLinked ? `✓ ${selectedEmployee.cardUid ?? ''}` : 'غير مرتبط'}</p>
                </div>
                <div className="bg-white/5 p-4 rounded-xl">
                  <p className="text-slate-500 mb-1">رقم الموظف</p>
                  <p className="text-white font-bold">#{selectedEmployee.employeeId}</p>
                </div>
              </div>
              <button
                onClick={() => setShowViewModal(false)}
                className="w-full mt-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl font-bold text-slate-300 transition-colors"
              >
                إغلاق
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {showEditModal && selectedEmployee && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowEditModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-bold text-white mb-6">تعديل بيانات: {selectedEmployee.fullName}</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-2">الاسم الكامل</label>
                  <input
                    type="text"
                    value={editForm.fullName}
                    onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-2">البريد الإلكتروني</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-2">رقم الهاتف</label>
                  <input
                    type="text"
                    value={editForm.mobileNumber || ''}
                    onChange={(e) => setEditForm({ ...editForm, mobileNumber: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-2">العنوان</label>
                  <input
                    type="text"
                    value={editForm.address || ''}
                    onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-2">رقم الهوية</label>
                  <input
                    type="text"
                    value={editForm.nationalId || ''}
                    onChange={(e) => setEditForm({ ...editForm, nationalId: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Admin-only fields */}
                <div className="border-t border-white/10 pt-4 mt-6">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">حقول الإدارة المتقدمة</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-300 mb-2">القسم</label>
                      <select
                        value={editForm.departmentId || ''}
                        onChange={(e) => setEditForm({ ...editForm, departmentId: e.target.value ? Number(e.target.value) : null })}
                        className="w-full px-4 py-3 bg-zinc-800 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-blue-500"
                        disabled={departmentsLoading}
                      >
                        <option value="" className="bg-zinc-800 text-white">
                          {departmentsLoading ? 'جاري تحميل الأقسام...' : 'بدون قسم'}
                        </option>
                        {departments.map((d) => (
                          <option key={d.departmentId} value={d.departmentId} className="bg-zinc-800 text-white">{d.departmentName}{d.departmentCode ? ` (${d.departmentCode})` : ''}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-300 mb-2">الحالة</label>
                      <select
                        value={editForm.employmentStatus || 'Active'}
                        onChange={(e) => setEditForm({ ...editForm, employmentStatus: e.target.value })}
                        className="w-full px-4 py-3 bg-zinc-800 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Active" className="bg-zinc-800 text-white">نشط</option>
                        <option value="Inactive" className="bg-zinc-800 text-white">غير نشط</option>
                        <option value="Terminated" className="bg-zinc-800 text-white">مُنهى</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-300 mb-2">الراتب الأساسي (ل.س)</label>
                      <input
                        type="number"
                        value={editForm.baseSalary || ''}
                        onChange={(e) => setEditForm({ ...editForm, baseSalary: e.target.value || null })}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-blue-500"
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-xl font-bold text-slate-300 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={updateMutation.isPending}
                  className="flex-[2] py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-bold text-white transition-colors disabled:opacity-50"
                >
                  {updateMutation.isPending ? 'جارِ الحفظ...' : 'حفظ التغييرات'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && selectedEmployee && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowDeleteConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl max-w-md w-full p-6 text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto text-4xl text-red-400 mb-4">
                <UserX size={36} />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">تأكيد الإنهاء</h2>
              <p className="text-slate-400 mb-2">
                هل أنت متأكد من إنهاء حساب الموظف التالي؟
              </p>
              <div className="bg-white/5 rounded-xl p-4 mb-6">
                <p className="text-white font-bold text-lg">{selectedEmployee.fullName}</p>
                <p className="text-slate-500 text-sm">{selectedEmployee.email} · {roleLabel(selectedEmployee.roleName)}</p>
              </div>
              <p className="text-yellow-500/80 text-xs mb-6">
                ⚠️ سيتم تغيير الحالة إلى "مُنهى" وتعطيل بطاقة NFC المرتبطة. لا يمكن التراجع عن هذا الإجراء بسهولة.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-xl font-bold text-slate-300 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleteMutation.isPending}
                  className="flex-[2] py-3 bg-red-600 hover:bg-red-700 rounded-xl font-bold text-white transition-colors disabled:opacity-50"
                >
                  {deleteMutation.isPending ? 'جارِ الإنهاء...' : 'تأكيد الإنهاء'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reset Password Modal */}
      <AnimatePresence>
        {showResetPassword && selectedEmployee && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => { setShowResetPassword(false); setResetPasswordResult(null); }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl max-w-md w-full p-6 text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-20 h-20 rounded-full bg-yellow-500/10 flex items-center justify-center mx-auto text-4xl text-yellow-400 mb-4">
                <Key size={36} />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">إعادة تعيين كلمة المرور</h2>

              {!resetPasswordResult ? (
                <>
                  <p className="text-slate-400 mb-2">
                    هل تريد إعادة تعيين كلمة المرور للموظف التالي؟
                  </p>
                  <div className="bg-white/5 rounded-xl p-4 mb-6">
                    <p className="text-white font-bold text-lg">{selectedEmployee.fullName}</p>
                    <p className="text-slate-500 text-sm">{selectedEmployee.email}</p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => { setShowResetPassword(false); setResetPasswordResult(null); }}
                      className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-xl font-bold text-slate-300 transition-colors"
                    >
                      إلغاء
                    </button>
                    <button
                      onClick={handleResetPassword}
                      disabled={resetPasswordMutation.isPending}
                      className="flex-[2] py-3 bg-yellow-600 hover:bg-yellow-700 rounded-xl font-bold text-white transition-colors disabled:opacity-50"
                    >
                      {resetPasswordMutation.isPending ? 'جارِ التعيين...' : 'تأكيد إعادة التعيين'}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 mb-4">
                    <p className="text-green-400 font-bold mb-3">✓ تم تعيين كلمة مرور جديدة</p>
                    <div className="bg-zinc-950 rounded-lg p-4 font-mono text-lg text-white select-all">
                      {resetPasswordResult.password}
                    </div>
                    <p className="text-slate-400 text-xs mt-3">
                      هذه هي كلمة المرور الوحيدة — انسخها وأرسلها للموظف <strong>{resetPasswordResult.name}</strong>
                    </p>
                  </div>
                  <button
                    onClick={() => { setShowResetPassword(false); setResetPasswordResult(null); }}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-bold text-white transition-colors"
                  >
                    تم
                  </button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserManagement;
