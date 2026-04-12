import type { AttendanceRecord } from '../services/api';

type StatusMeta = {
  label: string;
  className: string;
};

const reviewStatusMap: Record<string, StatusMeta> = {
  PENDING_REVIEW: {
    label: 'attendanceStatus.review.PENDING_REVIEW',
    className: 'bg-amber-500/10 text-amber-300 border border-amber-500/20',
  },
  VERIFIED: {
    label: 'attendanceStatus.review.VERIFIED',
    className: 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20',
  },
  FRAUD: {
    label: 'attendanceStatus.review.FRAUD',
    className: 'bg-rose-500/10 text-rose-300 border border-rose-500/20',
  },
  MANUALLY_CORRECTED: {
    label: 'attendanceStatus.review.MANUALLY_CORRECTED',
    className: 'bg-sky-500/10 text-sky-300 border border-sky-500/20',
  },
  SUSPICIOUS: {
    label: 'attendanceStatus.review.SUSPICIOUS',
    className: 'bg-orange-500/10 text-orange-300 border border-orange-500/20',
  },
};

const payrollStatusMap: Record<string, StatusMeta> = {
  PENDING_APPROVAL: {
    label: 'attendanceStatus.payroll.PENDING_APPROVAL',
    className: 'bg-amber-500/10 text-amber-300 border border-amber-500/20',
  },
  APPROVED_FOR_PAYROLL: {
    label: 'attendanceStatus.payroll.APPROVED_FOR_PAYROLL',
    className: 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20',
  },
  EXCLUDED_FROM_PAYROLL: {
    label: 'attendanceStatus.payroll.EXCLUDED_FROM_PAYROLL',
    className: 'bg-rose-500/10 text-rose-300 border border-rose-500/20',
  },
};

const fallbackStatus: StatusMeta = {
  label: 'attendanceStatus.fallback',
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
      label: 'attendanceStatus.legacy.fraud',
      className: 'bg-rose-500/10 text-rose-300 border border-rose-500/20',
    };
  }

  if (record.reviewStatus === 'SUSPICIOUS') {
    return {
      label: 'attendanceStatus.legacy.suspicious',
      className: 'bg-orange-500/10 text-orange-300 border border-orange-500/20',
    };
  }

  if (record.status === 'Manually Corrected' || record.reviewStatus === 'MANUALLY_CORRECTED') {
    return {
      label: 'attendanceStatus.legacy.corrected',
      className: 'bg-sky-500/10 text-sky-300 border border-sky-500/20',
    };
  }

  if (record.status === 'Verified' || record.reviewStatus === 'VERIFIED') {
    return {
      label: 'attendanceStatus.legacy.verified',
      className: 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20',
    };
  }

  return {
    label: 'attendanceStatus.legacy.open',
    className: 'bg-orange-500/10 text-orange-300 border border-orange-500/20',
  };
};
