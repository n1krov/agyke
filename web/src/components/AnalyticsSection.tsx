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

  // Estadísticas del AreaChart
  const areaStats = useMemo(() => {
    if (!transactions.length) return { max: 0, avg: 0 };
    const amounts = transactions.map((t) => Number(t.amount));
    const max = Math.max(...amounts);
    const avg = Math.round(totalSpent / transactions.length);
    return { max, avg };
  }, [transactions, totalSpent]);

  // Datos para el DonutChart de clasificaciones con conteos y porcentajes
  const pieData = useMemo(() => {
    const counts: Record<ClassificationType, { total: number; count: number }> = {
      '50': { total: 0, count: 0 },
      '100': { total: 0, count: 0 },
      '-100': { total: 0, count: 0 },
      '0': { total: 0, count: 0 },
    };

    transactions.forEach((tx) => {
      if (counts[tx.classification] !== undefined) {
        counts[tx.classification].total += Number(tx.amount);
        counts[tx.classification].count += 1;
      }
    });

    return (Object.keys(counts) as ClassificationType[])
      .filter((k) => counts[k].total > 0)
      .map((k) => {
        const val = counts[k].total;
        const percentage = totalSpent > 0 ? Math.round((val / totalSpent) * 100) : 0;
        return {
          key: k,
          name: PIE_LABELS[k] || k,
          value: val,
          count: counts[k].count,
          color: PIE_COLORS[k] || '#818CF8',
          percentage,
        };
      });
  }, [transactions, totalSpent]);

  const activeItem = activeIndex !== null && pieData[activeIndex] ? pieData[activeIndex] : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
      {/* Gráfico de Evolución Temporal (2 columnas) */}
      <div className="lg:col-span-2 glass-panel rounded-2xl p-5 sm:p-6 border border-white/[0.08] flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-indigo-500/15 text-indigo-400">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">Evolución Acumulada de Gastos</h3>
                <p className="text-[11px] text-slate-400">Historial continuo del saldo consumido</p>
              </div>
            </div>
            <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
              {transactions.length} registros
            </span>
          </div>

          <div className="h-52 sm:h-60 w-full">
            {timelineData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                Sin datos suficientes para graficar
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366F1" stopOpacity={0.45} />
                      <stop offset="95%" stopColor="#6366F1" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="date"
                    stroke="#64748B"
                    fontSize={11}
                    tickLine={false}
                    interval="preserveStartEnd"
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
                          <div className="p-3 rounded-xl glass-panel border border-indigo-500/30 text-xs shadow-xl space-y-1 backdrop-blur-xl">
                            <p className="font-semibold text-white">{data.date} · {data.concepto}</p>
                            <p className="text-slate-300">
                              Importe: <span className="text-indigo-300 font-bold tabular-nums">${data.monto.toLocaleString('es-AR')}</span>
                            </p>
                            <p className="text-slate-400">
                              Acumulado: <span className="text-white font-bold tabular-nums">${data.acumulado.toLocaleString('es-AR')}</span>
                            </p>
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
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#areaGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Tira de 3 Métricas Rápidas para Balance Visual con el Donut */}
        {timelineData.length > 0 && (
          <div className="grid grid-cols-3 gap-1.5 sm:gap-3 mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-white/[0.06]">
            <div className="p-1.5 sm:p-2.5 rounded-xl bg-slate-900/40 border border-white/5">
              <span className="block text-[9px] sm:text-[10px] uppercase tracking-wider text-slate-400 font-medium truncate">Total</span>
              <span className="text-xs sm:text-sm font-bold text-white tabular-nums mt-0.5 block truncate">
                ${totalSpent.toLocaleString('es-AR')}
              </span>
            </div>
            <div className="p-1.5 sm:p-2.5 rounded-xl bg-slate-900/40 border border-white/5">
              <span className="block text-[9px] sm:text-[10px] uppercase tracking-wider text-slate-400 font-medium truncate">Promedio</span>
              <span className="text-xs sm:text-sm font-bold text-indigo-300 tabular-nums mt-0.5 block truncate">
                ${areaStats.avg.toLocaleString('es-AR')}
              </span>
            </div>
            <div className="p-1.5 sm:p-2.5 rounded-xl bg-slate-900/40 border border-white/5">
              <span className="block text-[9px] sm:text-[10px] uppercase tracking-wider text-slate-400 font-medium truncate">Mayor</span>
              <span className="text-xs sm:text-sm font-bold text-emerald-300 tabular-nums mt-0.5 block truncate">
                ${areaStats.max.toLocaleString('es-AR')}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Gráfico Donut de Clasificaciones Prolijo con Indicador Central y Desglose (1 columna) */}
      <div className="glass-panel rounded-2xl p-5 sm:p-6 border border-white/[0.08] flex flex-col justify-between">
        <div>
          {/* Card Header */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-indigo-500/15 text-indigo-400">
                <PieIcon className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">Por Clasificación</h3>
                <p className="text-[11px] text-slate-400">Distribución porcentual de gastos</p>
              </div>
            </div>
            <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-white/5">
              {pieData.length} {pieData.length === 1 ? 'tipo' : 'tipos'}
            </span>
          </div>

          {pieData.length === 0 ? (
            <div className="h-64 w-full flex flex-col items-center justify-center text-xs text-slate-500 gap-2">
              <PieIcon className="w-8 h-8 opacity-20" />
              <span>Sin datos para distribuir</span>
            </div>
          ) : (
            <div className="flex flex-col">
              {/* Donut Container with Perfectly Centered Gauge */}
              <div className="relative h-48 w-full flex items-center justify-center my-1">
                {/* Central Gauge Disk */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 select-none">
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-slate-900/85 border border-white/[0.08] shadow-2xl flex flex-col items-center justify-center p-1.5 sm:p-2 text-center backdrop-blur-md transition-all duration-300">
                    {activeItem ? (
                      <div className="animate-fade-in transition-all">
                        <span
                          className="block text-[9px] sm:text-[10px] font-bold uppercase tracking-wider truncate max-w-[80px] sm:max-w-[95px] mx-auto"
                          style={{ color: activeItem.color }}
                        >
                          {activeItem.name}
                        </span>
                        <span className="block text-base sm:text-lg font-black text-white tabular-nums tracking-tight mt-0.5">
                          ${activeItem.value >= 100000
                            ? `${(activeItem.value / 1000).toFixed(0)}k`
                            : activeItem.value.toLocaleString('es-AR')}
                        </span>
                        <span
                          className="inline-flex items-center gap-1 mt-0.5 px-1.5 py-0.2 rounded-full text-[8px] sm:text-[9px] font-bold tabular-nums border"
                          style={{
                            backgroundColor: `${activeItem.color}20`,
                            borderColor: `${activeItem.color}40`,
                            color: activeItem.color,
                          }}
                        >
                          {activeItem.percentage}%
                        </span>
                      </div>
                    ) : (
                      <div>
                        <span className="block text-[8px] sm:text-[9px] font-bold uppercase tracking-widest text-slate-400">
                          TOTAL
                        </span>
                        <span className="block text-base sm:text-lg font-black text-white tabular-nums tracking-tight mt-0.5">
                          ${totalSpent >= 1000000
                            ? `${(totalSpent / 1000000).toFixed(2)}M`
                            : totalSpent.toLocaleString('es-AR')}
                        </span>
                        <span className="block text-[9px] sm:text-[10px] text-slate-400 font-medium mt-0.5">
                          {transactions.length} txs
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Recharts Pie */}
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const item = payload[0].payload;
                          return (
                            <div className="px-3 py-2 rounded-xl glass-panel border border-white/15 text-xs shadow-2xl backdrop-blur-xl">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                                <span className="font-semibold text-white">{item.name}</span>
                              </div>
                              <div className="flex items-baseline gap-2">
                                <span className="text-sm font-bold text-white tabular-nums">
                                  ${Number(item.value).toLocaleString('es-AR')}
                                </span>
                                <span className="text-[10px] text-slate-400 font-medium">
                                  ({item.percentage}%)
                                </span>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={58}
                      outerRadius={78}
                      cornerRadius={5}
                      paddingAngle={3}
                      dataKey="value"
                      onClick={(_: unknown, index: number) => setActiveIndex((prev) => (prev === index ? null : index))}
                      onMouseEnter={(_: unknown, index: number) => setActiveIndex(index)}
                      onMouseLeave={() => setActiveIndex(null)}
                    >
                      {pieData.map((entry, index) => {
                        const isHovered = activeIndex === index;
                        return (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.color}
                            stroke={isHovered ? '#FFFFFF' : '#080B11'}
                            strokeWidth={isHovered ? 2.5 : 1.5}
                            opacity={activeIndex !== null && !isHovered ? 0.35 : 1}
                            style={{
                              filter: isHovered ? `drop-shadow(0 0 10px ${entry.color})` : undefined,
                              cursor: 'pointer',
                              transition: 'all 0.25s ease',
                            }}
                          />
                        );
                      })}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Stack de Desglose Prolijo de Categorías */}
              <div className="space-y-2 mt-2 pt-3 border-t border-white/[0.06]">
                {pieData.map((item, index) => {
                  const isHovered = activeIndex === index;
                  return (
                    <div
                      key={item.key}
                      onClick={() => setActiveIndex((prev) => (prev === index ? null : index))}
                      onMouseEnter={() => setActiveIndex(index)}
                      onMouseLeave={() => setActiveIndex(null)}
                      className={`min-h-[44px] flex flex-col justify-center p-2.5 rounded-xl border transition-all duration-200 cursor-pointer active:scale-[0.99] ${
                        isHovered
                          ? 'bg-slate-800/80 border-indigo-500/40 shadow-md shadow-indigo-500/10 -translate-y-0.5'
                          : 'bg-slate-900/40 border-white/[0.04] hover:bg-slate-800/40 hover:border-white/[0.08]'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0 transition-transform duration-200"
                            style={{
                              backgroundColor: item.color,
                              boxShadow: isHovered ? `0 0 8px ${item.color}` : 'none',
                              transform: isHovered ? 'scale(1.2)' : 'scale(1)',
                            }}
                          />
                          <span className={`font-semibold truncate ${isHovered ? 'text-white' : 'text-slate-200'}`}>
                            {item.name}
                          </span>
                          <span className="text-[10px] text-slate-500 hidden sm:inline">
                            ({item.count} {item.count === 1 ? 'tx' : 'txs'})
                          </span>
                        </div>
                        <div className="flex items-baseline gap-2 shrink-0">
                          <span className="font-bold text-white tabular-nums text-xs sm:text-sm">
                            ${item.value.toLocaleString('es-AR')}
                          </span>
                          <span
                            className="text-[10px] font-bold px-1.5 py-0.5 rounded-md tabular-nums border"
                            style={{
                              backgroundColor: `${item.color}15`,
                              borderColor: `${item.color}35`,
                              color: item.color,
                            }}
                          >
                            {item.percentage}%
                          </span>
                        </div>
                      </div>
                      {/* Micro Barra de Progreso */}
                      <div className="w-full h-1 bg-slate-800/90 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.max(item.percentage, 3)}%`,
                            backgroundColor: item.color,
                            boxShadow: isHovered ? `0 0 8px ${item.color}` : 'none',
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
