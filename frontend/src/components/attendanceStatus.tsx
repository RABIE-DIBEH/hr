import type { AttendanceRecord } from '../services/api';

type StatusMeta = {
  label: string;
  className: string;
};

const reviewStatusMap: Record<string, StatusMeta> = {
  PENDING_REVIEW: {
    label: 'بانتظار المراجعة',
    className: 'bg-amber-500/10 text-amber-300 border border-amber-500/20',
  },
  VERIFIED: {
    label: 'تم التحقق',
    className: 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20',
  },
  FRAUD: {
    label: 'تلاعب مؤكد',
    className: 'bg-rose-500/10 text-rose-300 border border-rose-500/20',
  },
  MANUALLY_CORRECTED: {
    label: 'تم التصحيح يدوياً',
    className: 'bg-sky-500/10 text-sky-300 border border-sky-500/20',
  },
  SUSPICIOUS: {
    label: 'نشاط مشبوه',
    className: 'bg-orange-500/10 text-orange-300 border border-orange-500/20',
  },
};

const payrollStatusMap: Record<string, StatusMeta> = {
  PENDING_APPROVAL: {
    label: 'بانتظار اعتماد الرواتب',
    className: 'bg-amber-500/10 text-amber-300 border border-amber-500/20',
  },
  APPROVED_FOR_PAYROLL: {
    label: 'معتمد للرواتب',
    className: 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20',
  },
  EXCLUDED_FROM_PAYROLL: {
    label: 'مستبعد من الرواتب',
    className: 'bg-rose-500/10 text-rose-300 border border-rose-500/20',
  },
};

const fallbackStatus: StatusMeta = {
  label: 'غير محدد',
  className: 'bg-white/5 text-slate-300 border border-white/10',
};

export const getReviewStatusMeta = (status?: string): StatusMeta => {
  if (!status) {
    return fallbackStatus;
  }
  return reviewStatusMap[status] ?? {
    label: status,
    className: fallbackStatus.className,
  };
};

export const getPayrollStatusMeta = (status?: string): StatusMeta => {
  if (!status) {
    return fallbackStatus;
  }
  return payrollStatusMap[status] ?? {
    label: status,
    className: fallbackStatus.className,
  };
};

export const getLegacyAttendanceStatusMeta = (record: AttendanceRecord): StatusMeta => {
  if (record.status === 'Fraud' || record.reviewStatus === 'FRAUD') {
    return {
      label: 'تلاعب',
      className: 'bg-rose-500/10 text-rose-300 border border-rose-500/20',
    };
  }

  if (record.reviewStatus === 'SUSPICIOUS') {
    return {
      label: 'مشبوه',
      className: 'bg-orange-500/10 text-orange-300 border border-orange-500/20',
    };
  }

  if (record.status === 'Manually Corrected' || record.reviewStatus === 'MANUALLY_CORRECTED') {
    return {
      label: 'تم التصحيح',
      className: 'bg-sky-500/10 text-sky-300 border border-sky-500/20',
    };
  }

  if (record.status === 'Verified' || record.reviewStatus === 'VERIFIED') {
    return {
      label: 'مؤكد',
      className: 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20',
    };
  }

  return {
    label: 'مفتوح',
    className: 'bg-orange-500/10 text-orange-300 border border-orange-500/20',
  };
};
