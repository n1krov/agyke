import React, { useMemo, useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { TrendingUp, PieChart as PieIcon } from 'lucide-react';
import type { Transaction, ClassificationType } from '../types/database';

interface AnalyticsSectionProps {
  transactions: Transaction[];
}

const PIE_COLORS: Record<ClassificationType, string> = {
  '50': '#818CF8', // Indigo
  '100': '#34D399', // Emerald
  '-100': '#FB7185', // Rose
  '0': '#94A3B8', // Slate
};

const PIE_LABELS: Record<ClassificationType, string> = {
  '50': '50/50 Mitad',
  '100': 'Favor 100%',
  '-100': 'Deuda Mía',
  '0': 'Personal',
};

export const AnalyticsSection: React.FC<AnalyticsSectionProps> = ({ transactions }) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  // Total acumulado general
  const totalSpent = useMemo(() => {
    return transactions.reduce((acc, tx) => acc + Number(tx.amount), 0);
  }, [transactions]);

  // Datos temporales para el AreaChart
  const timelineData = useMemo(() => {
    if (!transactions.length) return [];
    const sorted = [...transactions].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    let runningTotal = 0;
    return sorted.map((tx) => {
      runningTotal += Number(tx.amount);
      const d = new Date(tx.created_at);
      return {
        date: d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' }),
        monto: Number(tx.amount),
        acumulado: runningTotal,
        concepto: tx.concept || 'Gasto',
      };
    });
  }, [transactions]);

  // Datos para el DonutChart de clasificaciones con porcentajes
  const pieData = useMemo(() => {
    const counts: Record<ClassificationType, number> = {
      '50': 0,
      '100': 0,
      '-100': 0,
      '0': 0,
    };

    transactions.forEach((tx) => {
      if (counts[tx.classification] !== undefined) {
        counts[tx.classification] += Number(tx.amount);
      }
    });

    return (Object.keys(counts) as ClassificationType[])
      .filter((k) => counts[k] > 0)
      .map((k) => {
        const value = counts[k];
        const percentage = totalSpent > 0 ? Math.round((value / totalSpent) * 100) : 0;
        return {
          name: PIE_LABELS[k] || k,
          value,
          color: PIE_COLORS[k] || '#818CF8',
          percentage,
        };
      });
  }, [transactions, totalSpent]);

  const activeItem = activeIndex !== null && pieData[activeIndex] ? pieData[activeIndex] : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Gráfico de Evolución Temporal (2 columnas) */}
      <div className="lg:col-span-2 glass-panel rounded-2xl p-5 sm:p-6 border border-white/[0.08] flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-semibold text-white">Evolución Acumulada de Gastos</h3>
          </div>
          <span className="text-xs text-slate-400">Total Histórico</span>
        </div>

        <div className="h-64 w-full">
          {timelineData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-slate-500">
              Sin datos suficientes para graficar
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  stroke="#64748B"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: 'rgba(255, 255, 255, 0.08)' }}
                />
                <YAxis
                  stroke="#64748B"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: 'rgba(255, 255, 255, 0.08)' }}
                  tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="p-3 rounded-lg glass-panel border border-indigo-500/30 text-xs shadow-xl space-y-1">
                          <p className="font-semibold text-white">{data.date} - {data.concepto}</p>
                          <p className="text-slate-300">Gasto: <span className="text-indigo-300 font-semibold tabular-nums">${data.monto.toLocaleString('es-AR')}</span></p>
                          <p className="text-slate-400">Acumulado: <span className="text-white font-semibold tabular-nums">${data.acumulado.toLocaleString('es-AR')}</span></p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="acumulado"
                  stroke="#818CF8"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#areaGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Gráfico Donut de Clasificaciones con KPI Central Dinámico (1 columna) */}
      <div className="glass-panel rounded-2xl p-5 sm:p-6 border border-white/[0.08] flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <PieIcon className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-semibold text-white">Por Clasificación</h3>
          </div>
          <span className="text-xs text-slate-400">Distribución</span>
        </div>

        {pieData.length === 0 ? (
          <div className="h-64 w-full flex items-center justify-center text-xs text-slate-500">
            Sin datos para distribuir
          </div>
        ) : (
          <div className="flex flex-col">
            {/* Donut Container with Centered KPI */}
            <div className="relative h-56 w-full flex items-center justify-center">
              {/* Dynamic Center KPI Overlay */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10 select-none">
                {activeItem ? (
                  <div className="text-center px-4 animate-fade-in transition-all">
                    <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 truncate max-w-[140px]">
                      {activeItem.name}
                    </span>
                    <span className="block text-xl font-bold text-white tabular-nums tracking-tight">
                      ${activeItem.value.toLocaleString('es-AR')}
                    </span>
                    <span className="inline-flex items-center gap-1 mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      {activeItem.percentage}% del total
                    </span>
                  </div>
                ) : (
                  <div className="text-center px-4">
                    <span className="block text-[9px] font-semibold uppercase tracking-widest text-slate-400">
                      TOTAL GASTADO
                    </span>
                    <span className="block text-xl font-extrabold text-white tabular-nums tracking-tight">
                      ${totalSpent.toLocaleString('es-AR')}
                    </span>
                    <span className="block text-[10px] text-slate-400 mt-0.5">
                      {transactions.length} {transactions.length === 1 ? 'movimiento' : 'movimientos'}
                    </span>
                  </div>
                )}
              </div>

              {/* Recharts Pie with Active Shape */}
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={62}
                    outerRadius={80}
                    cornerRadius={6}
                    paddingAngle={4}
                    dataKey="value"
                    onMouseEnter={(_: unknown, index: number) => setActiveIndex(index)}
                    onMouseLeave={() => setActiveIndex(null)}
                  >
                    {pieData.map((entry, index) => {
                      const isHovered = activeIndex === index;
                      return (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.color}
                          stroke={isHovered ? '#FFFFFF' : 'rgba(8, 11, 17, 0.7)'}
                          strokeWidth={isHovered ? 3 : 2}
                          opacity={activeIndex !== null && !isHovered ? 0.55 : 1}
                          style={{
                            filter: isHovered ? `drop-shadow(0 0 8px ${entry.color})` : undefined,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                          }}
                        />
                      );
                    })}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Enriched Interactive Legend with Calculated Percentages */}
            <div className="grid grid-cols-2 gap-2 mt-2 pt-3 border-t border-white/[0.06]">
              {pieData.map((item, index) => {
                const isHovered = activeIndex === index;
                return (
                  <button
                    key={item.name}
                    type="button"
                    onMouseEnter={() => setActiveIndex(index)}
                    onMouseLeave={() => setActiveIndex(null)}
                    className={`flex items-center justify-between p-2 rounded-xl border text-left transition-all cursor-pointer ${
                      isHovered
                        ? 'bg-slate-800/80 border-indigo-500/40 shadow-sm shadow-indigo-500/15'
                        : 'bg-slate-900/40 border-white/[0.04] hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{
                          backgroundColor: item.color,
                          boxShadow: isHovered ? `0 0 8px ${item.color}` : 'none',
                        }}
                      />
                      <div className="truncate">
                        <span className="text-xs font-medium text-slate-200 block truncate">
                          {item.name}
                        </span>
                        <span className="text-[11px] text-slate-400 tabular-nums">
                          ${item.value >= 1000 ? `${(item.value / 1000).toFixed(1)}k` : item.value.toLocaleString('es-AR')}
                        </span>
                      </div>
                    </div>
                    <span
                      className="ml-2 text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 tabular-nums border"
                      style={{
                        backgroundColor: `${item.color}15`,
                        borderColor: `${item.color}35`,
                        color: item.color,
                      }}
                    >
                      {item.percentage}%
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
