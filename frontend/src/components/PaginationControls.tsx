import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface PaginationControlsProps {
  page: number;
  totalPages: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  className?: string;
}

const PaginationControls = ({
  page,
  totalPages,
  totalCount,
  onPageChange,
  className = '',
}: PaginationControlsProps) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className={`flex items-center justify-between gap-4 border-t border-white/5 bg-white/[0.02] px-6 py-4 ${className}`}>
      <p className="text-xs font-medium text-slate-500">
        {t('pagination.totalItems', { count: totalCount })}
      </p>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page === 0}
          className="flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm font-medium text-slate-300 transition-all hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isRTL ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          {t('pagination.prev')}
        </button>
        <span className="text-sm font-bold text-white">
          {t('pagination.pageInfo', { current: page + 1, total: totalPages })}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages - 1}
          className="flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm font-medium text-slate-300 transition-all hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {t('pagination.next')}
          {isRTL ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>
      </div>
    </div>
  );
};

export default PaginationControls;
