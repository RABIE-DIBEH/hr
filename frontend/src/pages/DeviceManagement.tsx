import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Server,
  Plus,
  Trash2,
  Power,
  RefreshCw,
  Search,
  Wifi,
  WifiOff,
} from 'lucide-react';
import {
  getNfcDevicesPage,
  addNfcDevice,
  updateNfcDeviceStatus,
  deleteNfcDevice,
  type NfcDevice,
} from '../services/api';
import { queryKeys } from '../services/queryKeys';
import PaginationControls from '../components/PaginationControls';
import { extractApiError } from '../utils/errorHandler';

const DeviceManagement = () => {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ name: '', deviceId: '' });
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    data: devicesData,
    isLoading: loading,
    error: queryError,
    refetch: refetchDevices,
  } = useQuery({
    queryKey: queryKeys.admin.devices(page),
    queryFn: () => getNfcDevicesPage({ page, size: 10 }),
  });

  const devices = devicesData?.data?.items ?? [];
  const totalPages = devicesData?.data?.totalPages ?? 0;
  const totalCount = devicesData?.data?.totalCount ?? 0;
  const error = queryError ? extractApiError(queryError).message : null;

  const addMutation = useMutation({
    mutationFn: (data: { name: string; deviceId: string }) =>
      addNfcDevice({
        name: data.name,
        deviceId: data.deviceId,
        status: 'Offline',
        systemLoad: '0%',
      }),
    onSuccess: () => {
      setSuccessMessage(t('deviceManagement.add.success'));
      setShowAddModal(false);
      setAddForm({ name: '', deviceId: '' });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.devicesRoot });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ deviceId: _deviceId, status }: { deviceId: string; status: string }) =>
      updateNfcDeviceStatus(_deviceId, status),
    onSuccess: () => {
      setSuccessMessage(t('deviceManagement.update.success'));
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.devicesRoot });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (deviceId: string) => deleteNfcDevice(deviceId),
    onSuccess: () => {
      setSuccessMessage(t('deviceManagement.delete.success'));
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.devicesRoot });
    },
  });

  // Show mutation errors
  const mutationError =
    addMutation.error || updateStatusMutation.error || deleteMutation.error
      ? extractApiError(addMutation.error ?? updateStatusMutation.error ?? deleteMutation.error!).message
      : null;

  const displayError = error ?? mutationError;

  const filtered = devices.filter(
    (d) =>
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.deviceId.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddDevice = async () => {
    if (!addForm.name.trim() || !addForm.deviceId.trim()) {
      return;
    }
    addMutation.mutate({ name: addForm.name.trim(), deviceId: addForm.deviceId.trim() });
  };

  const handleToggleStatus = async (device: NfcDevice) => {
    const newStatus = device.status === 'Online' ? 'Offline' : 'Online';
    updateStatusMutation.mutate({ deviceId: device.deviceId, status: newStatus });
  };

  const handleDeleteDevice = async (device: NfcDevice) => {
    if (!window.confirm(t('deviceManagement.delete.confirm', { name: device.name }))) return;
    deleteMutation.mutate(device.deviceId);
  };

  const clearMessages = () => {
    setSuccessMessage(null);
    if (addMutation.error) addMutation.reset();
    if (updateStatusMutation.error) updateStatusMutation.reset();
    if (deleteMutation.error) deleteMutation.reset();
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white" dir={i18n.dir()}>
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
            <button onClick={clearMessages} className="text-green-200 text-sm mt-1 hover:text-white">
              {t('common.close')}
            </button>
          </motion.div>
        )}
        {displayError && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: -20 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-red-600 text-white px-6 py-3 rounded-xl shadow-lg max-w-md"
          >
            <p className="font-bold">{displayError}</p>
            <button onClick={clearMessages} className="text-red-200 text-sm mt-1 hover:text-white">
              {t('common.close')}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="bg-gradient-to-l from-blue-900 via-indigo-900 to-zinc-950 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-blue-500/10 p-3 rounded-xl">
                <Server size={28} className="text-blue-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">{t('deviceManagement.title')}</h1>
                <p className="text-slate-400 mt-1">{t('deviceManagement.subtitle')}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => refetchDevices()}
                className="bg-white/5 hover:bg-white/10 px-4 py-3 rounded-xl font-bold flex items-center gap-2 border border-white/10 transition-all"
              >
                <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                <span>{t('common.refresh')}</span>
              </button>
              <button
                onClick={() => {
                  setAddForm({ name: '', deviceId: `NFC_${Math.floor(1000 + Math.random() * 9000)}-NEW` });
                  setShowAddModal(true);
                }}
                className="bg-blue-600 hover:bg-blue-700 px-5 py-3 rounded-xl font-bold flex items-center gap-2 transition-all"
              >
                <Plus size={18} />
                <span>{t('deviceManagement.addDevice')}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Search */}
        <div className="relative mb-6">
          <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('deviceManagement.searchPlaceholder')}
            className="w-full pr-10 pl-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder:text-slate-600"
          />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-zinc-900 border border-white/5 rounded-2xl p-4">
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">{t('deviceManagement.totalDevices')}</p>
            <p className="text-3xl font-black text-white">{totalCount}</p>
          </div>
          <div className="bg-zinc-900 border border-green-500/20 rounded-2xl p-4">
            <p className="text-green-500 text-xs font-bold uppercase tracking-wider mb-1">{t('deviceManagement.online')}</p>
            <p className="text-3xl font-black text-green-400">
              {devices.filter((d) => d.status === 'Online').length}
            </p>
          </div>
          <div className="bg-zinc-900 border border-red-500/20 rounded-2xl p-4">
            <p className="text-red-500 text-xs font-bold uppercase tracking-wider mb-1">{t('deviceManagement.offline')}</p>
            <p className="text-3xl font-black text-red-400">
              {devices.filter((d) => d.status !== 'Online').length}
            </p>
          </div>
        </div>

        {/* Device List */}
        {loading ? (
          <div className="text-center py-12 text-slate-500">{t('common.loading')}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-500">{t('common.noData')}</div>
        ) : (
          <div className="bg-zinc-900 border border-white/5 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-white/5 text-slate-400">
                  <tr>
                    <th className="px-6 py-4 text-right font-bold">{t('deviceManagement.table.status')}</th>
                    <th className="px-6 py-4 text-right font-bold">{t('deviceManagement.table.deviceName')}</th>
                    <th className="px-6 py-4 text-right font-bold">{t('deviceManagement.table.deviceId')}</th>
                    <th className="px-6 py-4 text-right font-bold">{t('deviceManagement.table.load')}</th>
                    <th className="px-6 py-4 text-right font-bold">{t('deviceManagement.table.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((device) => (
                    <tr
                      key={device.deviceId}
                      className="border-t border-white/5 hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {device.status === 'Online' ? (
                            <Wifi size={16} className="text-green-400" />
                          ) : (
                            <WifiOff size={16} className="text-red-400 animate-pulse" />
                          )}
                          <span
                            className={`text-xs font-bold ${
                              device.status === 'Online' ? 'text-green-400' : 'text-red-400'
                            }`}
                          >
                            {device.status === 'Online' ? t('deviceManagement.online') : t('deviceManagement.offline')}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-100">{device.name}</td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-400">{device.deviceId}</td>
                      <td className="px-6 py-4 text-slate-300">{device.systemLoad}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleToggleStatus(device)}
                            disabled={updateStatusMutation.isPending}
                            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors disabled:opacity-50"
                            title={device.status === 'Online' ? t('deviceManagement.toggle.stop') : t('deviceManagement.toggle.start')}
                          >
                            <Power size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteDevice(device)}
                            disabled={deleteMutation.isPending}
                            className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
                            title={t('common.delete')}
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
            <PaginationControls
              page={page}
              totalPages={totalPages}
              totalCount={totalCount}
              onPageChange={setPage}
              className="p-4"
            />
          </div>
        )}
      </div>

      {/* Add Device Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-bold text-white mb-6">{t('deviceManagement.add.title')}</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-2">{t('deviceManagement.add.name')}</label>
                  <input
                    type="text"
                    value={addForm.name}
                    onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                    placeholder={t('deviceManagement.add.placeholderName')}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-blue-500 placeholder:text-slate-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-2">{t('deviceManagement.add.uid')}</label>
                  <input
                    type="text"
                    value={addForm.deviceId}
                    onChange={(e) => setAddForm({ ...addForm, deviceId: e.target.value })}
                    placeholder={t('deviceManagement.add.placeholderUid')}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white font-mono focus:ring-2 focus:ring-blue-500 placeholder:text-slate-600"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-xl font-bold text-slate-300 transition-colors"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleAddDevice}
                  disabled={addMutation.isPending}
                  className="flex-[2] py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-bold text-white transition-colors disabled:opacity-50"
                >
                  {addMutation.isPending ? t('deviceManagement.add.adding') : t('deviceManagement.addDevice')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DeviceManagement;
