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
    iconBg: 'bg-indigo-500/15 group-hover:bg-indigo-500/25',
    iconText: 'text-indigo-400 group-hover:text-indigo-300',
    borderHover: 'hover:border-indigo-500/40 hover:shadow-indigo-500/10',
    glow: 'from-indigo-600/10 to-transparent',
  },
  emerald: {
    iconBg: 'bg-emerald-500/15 group-hover:bg-emerald-500/25',
    iconText: 'text-emerald-400 group-hover:text-emerald-300',
    borderHover: 'hover:border-emerald-500/40 hover:shadow-emerald-500/10',
    glow: 'from-emerald-600/10 to-transparent',
  },
  amber: {
    iconBg: 'bg-amber-500/15 group-hover:bg-amber-500/25',
    iconText: 'text-amber-400 group-hover:text-amber-300',
    borderHover: 'hover:border-amber-500/40 hover:shadow-amber-500/10',
    glow: 'from-amber-600/10 to-transparent',
  },
  cyan: {
    iconBg: 'bg-cyan-500/15 group-hover:bg-cyan-500/25',
    iconText: 'text-cyan-400 group-hover:text-cyan-300',
    borderHover: 'hover:border-cyan-500/40 hover:shadow-cyan-500/10',
    glow: 'from-cyan-600/10 to-transparent',
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
    <div
      className={`group relative overflow-hidden glass-panel rounded-2xl p-5 border border-white/[0.08] ${v.borderHover} hover:-translate-y-1 hover:shadow-xl transition-all duration-300 flex flex-col justify-between gap-3 before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent`}
    >
      {/* Subtle corner ambient gradient glow on hover */}
      <div
        className={`absolute -top-12 -right-12 w-28 h-28 rounded-full bg-gradient-to-br ${v.glow} blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`}
      />

      <div className="flex items-center justify-between gap-2 relative z-10">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 group-hover:text-slate-300 transition-colors">
          {title}
        </span>
        <div
          className={`p-2.5 rounded-xl border border-white/5 shadow-sm ${v.iconBg} ${v.iconText} transition-all duration-300 group-hover:scale-110`}
        >
          {icon}
        </div>
      </div>

      <div className="relative z-10">
        <div className="text-2xl sm:text-3xl font-bold text-white tabular-nums tracking-tight">
          {value}
        </div>
        {subValue && (
          <div className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-600 group-hover:bg-slate-400 transition-colors shrink-0" />
            <span className="truncate">{subValue}</span>
          </div>
        )}
      </div>
    </div>
  );
};
