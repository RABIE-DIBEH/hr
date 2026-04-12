import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { User, X, Save, Upload, AlertCircle, Lock, Key } from 'lucide-react';
import { updateProfileMe, getCurrentEmployee, type EmployeeProfile, type EmployeeProfileUpdatePayload } from '../services/api';
import { getRole } from '../services/auth';
import ChangePasswordModal from './ChangePasswordModal';

interface ProfileEditModalProps {
  me: EmployeeProfile;
  onClose: () => void;
  onSuccess: (updatedMe: EmployeeProfile) => void;
}

const EDITABLE_ROLES = ['SUPER_ADMIN', 'ADMIN', 'HR', 'MANAGER'];

const ProfileEditModal: React.FC<ProfileEditModalProps> = ({ me, onClose, onSuccess }) => {
  const { t } = useTranslation();
  const currentRole = getRole();
  const canEditIdentity = currentRole ? EDITABLE_ROLES.includes(currentRole) : false;
  const [profileForm, setProfileForm] = useState<EmployeeProfileUpdatePayload>({
    fullName: me.fullName,
    email: me.email,
    mobileNumber: me.mobileNumber ?? '',
    address: me.address ?? '',
    nationalId: me.nationalId ?? '',
    avatarUrl: me.avatarUrl ?? '',
  });
  const [avatarPreview, setAvatarPreview] = useState<string | null>(me.avatarUrl ?? null);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileForm(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        setProfileError(t('profileEdit.imageSizeError'));
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setAvatarPreview(base64String);
        setProfileForm(prev => ({ ...prev, avatarUrl: base64String }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(false);
    setProfileSaving(true);

    try {
      await updateProfileMe(profileForm);
      setProfileSuccess(true);
      const refreshed = await getCurrentEmployee();
      onSuccess(refreshed.data);
      setTimeout(() => onClose(), 1500);
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      setProfileError(axiosError.response?.data?.message || t('profileEdit.updateFailed'));
    } finally {
      setProfileSaving(false);
    }
  };

  return (
    <>
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-[#110d18] rounded-[2.5rem] shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-white/10"
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-8 flex justify-between items-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
          <div className="flex items-center gap-4 relative z-10">
            <div className="bg-white/20 p-2.5 rounded-xl">
              <User size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tight">{t('profileEdit.title')}</h2>
              <p className="text-blue-100/70 text-sm">{t('profileEdit.subtitle')}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="bg-white/10 hover:bg-white/20 p-2 rounded-xl transition-all relative z-10"
          >
            <X size={20} aria-label={t('common.close')} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleProfileSubmit} className="p-8 space-y-6">
          <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/10 mb-2">
            <div>
              <p className="text-white font-bold text-sm">{t('profileEdit.password')}</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black">{t('profileEdit.accountSecurity')}</p>
            </div>
            <button
              type="button"
              onClick={() => setShowChangePassword(true)}
              className="bg-purple-600/10 hover:bg-purple-600 text-purple-400 hover:text-white px-4 py-2 rounded-xl text-xs font-bold transition-all border border-purple-500/20 flex items-center gap-2"
            >
              <Key size={14} />
              {t('profileEdit.changePassword')}
            </button>
          </div>

          {profileError && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }} 
              animate={{ opacity: 1, x: 0 }}
              className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl text-sm flex items-center gap-3"
            >
              <AlertCircle size={18} />
              {profileError}
            </motion.div>
          )}
          
          {profileSuccess && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }}
              className="bg-green-500/10 border border-green-500/20 text-green-400 p-4 rounded-2xl text-sm font-bold flex items-center gap-3"
            >
              {t('profileEdit.updateSuccess')}
            </motion.div>
          )}

          {/* Avatar Upload Polish */}
          <div className="flex flex-col items-center gap-6 mb-4">
            <div className="relative group">
              <div className="w-32 h-32 rounded-[2.5rem] border-4 border-blue-500/30 overflow-hidden bg-white/5 flex items-center justify-center text-slate-500 shadow-2xl transition-all group-hover:border-blue-500">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <User size={48} className="opacity-20" />
                )}
              </div>
              <label className="absolute -bottom-2 -right-2 cursor-pointer bg-blue-600 text-white w-10 h-10 rounded-xl flex items-center justify-center shadow-lg hover:bg-blue-700 transition-all hover:scale-110 active:scale-95 border-2 border-[#110d18]">
                <Upload size={18} />
                <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
              </label>
            </div>
            <div className="text-center">
              <p className="text-white font-bold text-sm">{t('profileEdit.profilePicture')}</p>
              <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-widest font-black">{t('profileEdit.imageFormat')}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Full Name */}
            <div className="md:col-span-2">
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2 px-1">
                {t('profileEdit.fullName')} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="fullName"
                  value={profileForm.fullName}
                  onChange={handleProfileChange}
                  readOnly={!canEditIdentity}
                  className={`w-full px-5 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-slate-600 focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all outline-none ${
                    !canEditIdentity ? 'cursor-not-allowed opacity-60' : ''
                  }`}
                />
                {!canEditIdentity && (
                  <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                )}
              </div>
            </div>

            {/* Email */}
            <div className="md:col-span-2">
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2 px-1">
                {t('profileEdit.email')} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  name="email"
                  value={profileForm.email}
                  onChange={handleProfileChange}
                  readOnly={!canEditIdentity}
                  className={`w-full px-5 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-slate-600 focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all outline-none ${
                    !canEditIdentity ? 'cursor-not-allowed opacity-60' : ''
                  }`}
                />
                {!canEditIdentity && (
                  <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                )}
              </div>
            </div>

            {/* Mobile Number */}
            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2 px-1">
                {t('profileEdit.mobileNumber')}
              </label>
              <input
                type="text"
                name="mobileNumber"
                value={profileForm.mobileNumber ?? ''}
                onChange={handleProfileChange}
                placeholder={t('profileEdit.mobilePlaceholder')}
                maxLength={10}
                className="w-full px-5 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-slate-600 focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all outline-none font-mono"
              />
            </div>

            {/* National ID */}
            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2 px-1">
                {t('profileEdit.nationalId')}
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="nationalId"
                  value={profileForm.nationalId ?? ''}
                  onChange={handleProfileChange}
                  readOnly={!canEditIdentity}
                  placeholder={t('profileEdit.nationalIdPlaceholder')}
                  maxLength={10}
                  className={`w-full px-5 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-slate-600 focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all outline-none font-mono ${
                    !canEditIdentity ? 'cursor-not-allowed opacity-60' : ''
                  }`}
                />
                {!canEditIdentity && (
                  <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                )}
              </div>
            </div>

            {/* Address */}
            <div className="md:col-span-2">
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2 px-1">
                {t('profileEdit.address')}
              </label>
              <input
                type="text"
                name="address"
                value={profileForm.address ?? ''}
                onChange={handleProfileChange}
                placeholder={t('profileEdit.addressPlaceholder')}
                className="w-full px-5 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-slate-600 focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all outline-none"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-4 border-t border-white/5">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-4 border border-white/10 text-slate-400 rounded-2xl font-bold hover:bg-white/5 transition-all disabled:opacity-50"
              disabled={profileSaving}
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              className="flex-[2] px-6 py-4 bg-white text-black rounded-2xl font-black hover:bg-slate-200 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-xl shadow-white/5"
              disabled={profileSaving}
            >
              {profileSaving ? (
                <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
              ) : (
                <>
                  <Save size={20} />
                  <span>{t('profileEdit.saveChanges')}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>

    <AnimatePresence>
      {showChangePassword && (
        <ChangePasswordModal onClose={() => setShowChangePassword(false)} />
      )}
    </AnimatePresence>
    </>
  );
};

export default ProfileEditModal;
