import React from 'react';

interface MetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  subtext?: string;
  accent?: 'default' | 'cyan' | 'emerald' | 'amber' | 'rose';
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  unit,
  subtext,
  accent = 'default'
}) => {
  const valueColor =
    accent === 'cyan'
      ? 'text-cyan-300'
      : accent === 'emerald'
      ? 'text-emerald-400'
      : accent === 'amber'
      ? 'text-amber-400'
      : accent === 'rose'
      ? 'text-rose-400'
      : 'text-white';

  return (
    <div className="bg-[#111827] border border-slate-800/90 rounded-xl p-4 flex flex-col justify-between">
      <div className="text-xs font-medium text-slate-400 truncate">
        {label}
      </div>
      <div className="mt-2 flex items-baseline">
        <span className={`text-2xl font-mono font-semibold tabular-nums ${valueColor}`}>
          {value}
        </span>
        {unit && (
          <span className="text-xs font-mono text-slate-400 ml-1.5">
            {unit}
          </span>
        )}
      </div>
      {subtext && (
        <div className="mt-1.5 text-xs text-slate-400 truncate" title={subtext}>
          {subtext}
        </div>
      )}
    </div>
  );
};
