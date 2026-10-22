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
import { useTheme } from './ThemeToggle';

interface AnalyticsSectionProps {
  transactions: Transaction[];
}

const PIE_LABELS: Record<ClassificationType, string> = {
  '50': '50/50 Mitad',
  '100': 'Favor 100%',
  '-100': 'Deuda Mía',
  '0': 'Personal',
};

export const AnalyticsSection: React.FC<AnalyticsSectionProps> = ({ transactions }) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const PIE_COLORS: Record<ClassificationType, string> = useMemo(() => ({
    '50': isDark ? '#60A5FA' : '#2563EB',
    '100': isDark ? '#34D399' : '#059669',
    '-100': isDark ? '#F87171' : '#DC2626',
    '0': isDark ? '#9CA3AF' : '#64748B',
  }), [isDark]);

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
  }, [transactions, totalSpent, PIE_COLORS]);

  const activeItem = activeIndex !== null && pieData[activeIndex] ? pieData[activeIndex] : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
      {/* Gráfico de Evolución Temporal (2 columnas) */}
      <div className="lg:col-span-2 hairline-card rounded-2xl p-5 sm:p-6 flex flex-col justify-between transition-colors">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[var(--text-secondary)]" strokeWidth={1.75} />
              <div>
                <h3 className="text-sm sm:text-base font-semibold font-mono uppercase tracking-wider text-[var(--text-primary)]">
                  Evolución Acumulada
                </h3>
                <p className="text-xs text-[var(--text-muted)]">Historial de volumen contable consumido</p>
              </div>
            </div>
            <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded border border-[var(--border-hairline)] bg-[var(--surface-subtle)] text-[var(--text-muted)]">
              {transactions.length} registros
            </span>
          </div>

          <div className="h-52 sm:h-60 w-full">
            {timelineData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs font-mono text-[var(--text-muted)]">
                Sin datos suficientes para graficar
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="editorialAreaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={isDark ? '#F3F4F6' : '#0F172A'} stopOpacity={isDark ? 0.15 : 0.08} />
                      <stop offset="95%" stopColor={isDark ? '#F3F4F6' : '#0F172A'} stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="date"
                    stroke={isDark ? '#6B7280' : '#868C98'}
                    fontSize={11}
                    fontFamily="var(--font-geist-mono), monospace"
                    tickLine={false}
                    interval="preserveStartEnd"
                    axisLine={{ stroke: isDark ? '#22242E' : '#E4E5EA' }}
                  />
                  <YAxis
                    stroke={isDark ? '#6B7280' : '#868C98'}
                    fontSize={11}
                    fontFamily="var(--font-geist-mono), monospace"
                    tickLine={false}
                    axisLine={{ stroke: isDark ? '#22242E' : '#E4E5EA' }}
                    tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="p-3 rounded-xl border border-[var(--border-hairline)] bg-[var(--surface)] text-xs shadow-md space-y-1 font-mono">
                            <p className="font-semibold text-[var(--text-primary)]">{d.date} · {d.concepto}</p>
                            <p className="text-[var(--text-secondary)]">
                              Importe: <span className="font-bold text-[var(--text-primary)] tabular-nums">${d.monto.toLocaleString('es-AR')}</span>
                            </p>
                            <p className="text-[var(--text-muted)]">
                              Acumulado: <span className="font-bold text-[var(--text-primary)] tabular-nums">${d.acumulado.toLocaleString('es-AR')}</span>
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
                    stroke={isDark ? '#F3F4F6' : '#0F172A'}
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#editorialAreaGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Tira de 3 Métricas Rápidas */}
        {timelineData.length > 0 && (
          <div className="grid grid-cols-3 gap-2 sm:gap-3 mt-4 pt-4 border-t border-[var(--border-hairline)]">
            <div className="p-2 sm:p-2.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-subtle)]">
              <span className="block text-[10px] uppercase font-mono tracking-wider text-[var(--text-muted)] truncate">Total</span>
              <span className="text-xs sm:text-sm font-semibold font-mono text-[var(--text-primary)] tabular-nums mt-0.5 block truncate">
                ${totalSpent.toLocaleString('es-AR')}
              </span>
            </div>
            <div className="p-2 sm:p-2.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-subtle)]">
              <span className="block text-[10px] uppercase font-mono tracking-wider text-[var(--text-muted)] truncate">Promedio</span>
              <span className="text-xs sm:text-sm font-semibold font-mono text-[var(--text-primary)] tabular-nums mt-0.5 block truncate">
                ${areaStats.avg.toLocaleString('es-AR')}
              </span>
            </div>
            <div className="p-2 sm:p-2.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-subtle)]">
              <span className="block text-[10px] uppercase font-mono tracking-wider text-[var(--text-muted)] truncate">Mayor</span>
              <span className="text-xs sm:text-sm font-semibold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums mt-0.5 block truncate">
                ${areaStats.max.toLocaleString('es-AR')}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Gráfico Donut de Clasificaciones */}
      <div className="hairline-card rounded-2xl p-5 sm:p-6 flex flex-col justify-between transition-colors">
        <div>
          {/* Card Header */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-[var(--text-secondary)]" strokeWidth={1.75} />
              <div>
                <h3 className="text-sm sm:text-base font-semibold font-mono uppercase tracking-wider text-[var(--text-primary)]">
                  Por Clasificación
                </h3>
                <p className="text-xs text-[var(--text-muted)]">Distribución del gasto compartido</p>
              </div>
            </div>
            <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded border border-[var(--border-hairline)] bg-[var(--surface-subtle)] text-[var(--text-muted)]">
              {pieData.length} {pieData.length === 1 ? 'tipo' : 'tipos'}
            </span>
          </div>

          {pieData.length === 0 ? (
            <div className="h-64 w-full flex flex-col items-center justify-center text-xs font-mono text-[var(--text-muted)] gap-2">
              <PieIcon className="w-6 h-6 opacity-30" strokeWidth={1.5} />
              <span>Sin datos para distribuir</span>
            </div>
          ) : (
            <div className="flex flex-col">
              {/* Donut Container with Perfectly Centered Gauge */}
              <div className="relative h-44 w-full flex items-center justify-center my-1">
                {/* Central Gauge Disk */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none z-10">
                  {activeItem ? (
                    <div className="flex flex-col items-center justify-center text-center animate-in fade-in zoom-in-95 duration-150 px-2">
                      <span className="text-[10px] font-mono font-bold tracking-tight text-[var(--text-primary)] uppercase truncate max-w-[120px]">
                        {activeItem.name}
                      </span>
                      <span className="text-base sm:text-lg font-bold font-mono text-[var(--text-primary)] tabular-nums leading-tight">
                        ${activeItem.value.toLocaleString('es-AR')}
                      </span>
                      <span className="text-[10px] font-mono font-medium text-[var(--text-muted)]">
                        {activeItem.percentage}% ({activeItem.count} {activeItem.count === 1 ? 'tx' : 'txs'})
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center animate-in fade-in duration-200">
                      <span className="text-[9px] font-mono uppercase tracking-widest text-[var(--text-muted)]">
                        Total
                      </span>
                      <span className="text-base sm:text-lg font-bold font-mono text-[var(--text-primary)] tabular-nums leading-tight">
                        ${totalSpent.toLocaleString('es-AR')}
                      </span>
                      <span className="text-[10px] font-mono text-[var(--text-muted)]">
                        {transactions.length} movs
                      </span>
                    </div>
                  )}
                </div>

                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={52}
                      outerRadius={70}
                      paddingAngle={3}
                      dataKey="value"
                      onMouseEnter={(_, index) => setActiveIndex(index)}
                      onMouseLeave={() => setActiveIndex(null)}
                      cursor="pointer"
                    >
                      {pieData.map((entry) => (
                        <Cell
                          key={`cell-${entry.key}`}
                          fill={entry.color}
                          stroke="var(--surface)"
                          strokeWidth={2}
                          className="transition-opacity hover:opacity-80"
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Leyenda interactiva */}
              <div className="space-y-1.5 mt-2">
                {pieData.map((item, index) => {
                  const isHovered = activeIndex === index;
                  return (
                    <button
                      key={item.key}
                      onMouseEnter={() => setActiveIndex(index)}
                      onMouseLeave={() => setActiveIndex(null)}
                      onClick={() => setActiveIndex(activeIndex === index ? null : index)}
                      className={`w-full flex items-center justify-between p-1.5 rounded-lg border transition-all text-xs font-mono cursor-pointer ${
                        isHovered
                          ? 'border-[var(--border-hover)] bg-[var(--surface-subtle)]'
                          : 'border-transparent hover:bg-[var(--surface-subtle)]/50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-[var(--text-secondary)] font-medium">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[var(--text-primary)] tabular-nums">
                          ${item.value.toLocaleString('es-AR')}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded border border-[var(--border-hairline)] bg-[var(--surface-subtle)] text-[var(--text-muted)]">
                          {item.percentage}%
                        </span>
                      </div>
                    </button>
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
