import { useEffect, useState } from 'react';
import { CalendarDays, Clock3 } from 'lucide-react';

type CurrentDateTimePanelProps = {
  className?: string;
};

const CurrentDateTimePanel = ({ className = '' }: CurrentDateTimePanelProps) => {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const time = new Intl.DateTimeFormat('ar-EG', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(now);

  const date = new Intl.DateTimeFormat('ar-EG', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  }).format(now);

  const weekday = new Intl.DateTimeFormat('ar-EG', {
    weekday: 'long',
  }).format(now);

  return (
    <div
      className={`flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white shadow-sm backdrop-blur-sm ${className}`.trim()}
    >
      <div className="flex items-center gap-2 rounded-xl bg-blue-500/10 px-3 py-2 text-blue-300">
        <Clock3 size={16} />
        <span className="text-lg font-black tabular-nums text-white">{time}</span>
      </div>
      <div className="h-8 w-px bg-white/10" />
      <div className="flex items-center gap-2 text-sm font-semibold tabular-nums text-slate-300">
        <CalendarDays size={14} className="text-slate-400" />
        <span>{date}</span>
        <span className="text-slate-500">(</span>
        <span className="text-slate-200">{weekday}</span>
        <span className="text-slate-500">)</span>
      </div>
    </div>
  );
};

export default CurrentDateTimePanel;
