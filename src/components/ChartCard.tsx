import React from 'react';

interface ChartCardProps {
  title: string;
  subtitle: string;
  rightLabel?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

export const ChartCard: React.FC<ChartCardProps> = ({
  title,
  subtitle,
  rightLabel,
  actions,
  children
}) => {
  return (
    <div className="bg-[#111827] border border-slate-800/90 rounded-xl p-5 flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <h3 className="text-base font-semibold text-white">
            {title}
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {subtitle}
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          {rightLabel && (
            <div className="text-xs font-mono text-slate-400 tabular-nums">
              {rightLabel}
            </div>
          )}
          {actions}
        </div>
      </div>
      <div className="w-full h-72">
        {children}
      </div>
    </div>
  );
};
