import React from 'react';

interface StatMetricCardProps {
  title: string;
  value: string;
  subValue?: string;
  badge?: React.ReactNode;
  icon?: React.ReactNode;
}

export const StatMetricCard: React.FC<StatMetricCardProps> = ({
  title,
  value,
  subValue,
  badge,
}) => {
  return (
    <div
      className="group relative overflow-hidden rounded-xl hairline-card p-4 sm:p-5 flex flex-col justify-between gap-3 hairline-card-interactive cursor-default"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-muted)] group-hover:text-[var(--text-secondary)] transition-colors truncate">
          {title}
        </span>
        {badge && (
          <div className="shrink-0">
            {badge}
          </div>
        )}
      </div>

      <div className="space-y-1">
        <div className="text-xl sm:text-2xl lg:text-3xl font-semibold font-mono text-[var(--text-primary)] tabular-nums tracking-tight truncate">
          {value}
        </div>
        {subValue && (
          <p className="text-xs text-[var(--text-secondary)] truncate">
            {subValue}
          </p>
        )}
      </div>
    </div>
  );
};
