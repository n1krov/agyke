import React from 'react';

interface StatMetricCardProps {
  title: string;
  value: string;
  subValue?: string;
  icon: React.ReactNode;
  variant?: 'indigo' | 'emerald' | 'amber' | 'cyan';
}

const VARIANTS = {
  indigo: {
    iconBg: 'bg-indigo-500/15',
    iconText: 'text-indigo-400',
    borderHover: 'hover:border-indigo-500/40',
  },
  emerald: {
    iconBg: 'bg-emerald-500/15',
    iconText: 'text-emerald-400',
    borderHover: 'hover:border-emerald-500/40',
  },
  amber: {
    iconBg: 'bg-amber-500/15',
    iconText: 'text-amber-400',
    borderHover: 'hover:border-amber-500/40',
  },
  cyan: {
    iconBg: 'bg-cyan-500/15',
    iconText: 'text-cyan-400',
    borderHover: 'hover:border-cyan-500/40',
  },
};

export const StatMetricCard: React.FC<StatMetricCardProps> = ({
  title,
  value,
  subValue,
  icon,
  variant = 'indigo',
}) => {
  const v = VARIANTS[variant] || VARIANTS.indigo;

  return (
    <div className={`glass-panel glass-panel-interactive rounded-xl p-5 border border-white/[0.08] ${v.borderHover} flex flex-col justify-between gap-3`}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</span>
        <div className={`p-2 rounded-lg ${v.iconBg} ${v.iconText}`}>{icon}</div>
      </div>

      <div>
        <div className="text-2xl font-bold text-white tabular-nums tracking-tight">{value}</div>
        {subValue && <div className="text-xs text-slate-400 mt-1">{subValue}</div>}
      </div>
    </div>
  );
};
