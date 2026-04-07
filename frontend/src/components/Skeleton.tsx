import { motion } from 'framer-motion';

interface SkeletonProps {
  className?: string;
  width?: string;
  height?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'pulse';
  count?: number;
}

const baseAnimation = {
  initial: { opacity: 0.4 },
  animate: { opacity: [0.4, 0.8, 0.4] },
  transition: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' },
};

const Skeleton = ({ className = '', width, height, variant = 'rectangular', count = 1 }: SkeletonProps) => {
  const variants = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
    pulse: 'rounded-lg',
  };

  const items = Array.from({ length: count });

  return (
    <>
      {items.map((_, index) => (
        <motion.div
          key={index}
          {...baseAnimation}
          className={`bg-slate-700 ${variants[variant]} ${className}`}
          style={{ width, height }}
        />
      ))}
    </>
  );
};

export const CardSkeleton = () => (
  <div className="bg-zinc-900 border border-white/5 rounded-2xl p-6 space-y-4">
    <Skeleton variant="circular" width="48px" height="48px" />
    <Skeleton className="w-3/4" />
    <Skeleton className="w-1/2" />
    <Skeleton className="w-full" count={1} />
  </div>
);

export const TableSkeleton = ({ rows = 5 }: { rows?: number }) => (
  <div className="bg-zinc-900 border border-white/5 rounded-2xl overflow-hidden">
    {/* Header */}
    <div className="bg-white/5 px-6 py-4 flex gap-4">
      <Skeleton className="flex-1" />
      <Skeleton className="flex-1" />
      <Skeleton className="flex-1" />
      <Skeleton className="w-24" />
    </div>
    {/* Rows */}
    <div className="p-6 space-y-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 items-center">
          <Skeleton variant="circular" width="32px" height="32px" />
          <Skeleton className="flex-1" />
          <Skeleton className="w-32" />
          <Skeleton className="w-24" />
        </div>
      ))}
    </div>
  </div>
);

export const FormSkeleton = ({ fields = 5 }: { fields?: number }) => (
  <div className="space-y-6">
    <Skeleton className="w-1/2 h-8" />
    {Array.from({ length: fields }).map((_, i) => (
      <div key={i} className="space-y-2">
        <Skeleton className="w-1/3" />
        <Skeleton className="w-full h-12" />
      </div>
    ))}
    <Skeleton className="w-32 h-12" />
  </div>
);

export default Skeleton;
