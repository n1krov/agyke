import React, { useMemo } from 'react';
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
  Legend,
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

  // Datos para el DonutChart de clasificaciones
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
      .map((k) => ({
        name: PIE_LABELS[k] || k,
        value: counts[k],
        color: PIE_COLORS[k] || '#818CF8',
      }));
  }, [transactions]);

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

      {/* Gráfico Donut de Clasificaciones (1 columna) */}
      <div className="glass-panel rounded-2xl p-5 sm:p-6 border border-white/[0.08] flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <PieIcon className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-semibold text-white">Por Clasificación</h3>
          </div>
          <span className="text-xs text-slate-400">Distribución</span>
        </div>

        <div className="h-64 w-full flex items-center justify-center">
          {pieData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-slate-500">
              Sin datos para distribuir
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="45%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const entry = payload[0];
                      return (
                        <div className="p-2.5 rounded-lg glass-panel border border-white/10 text-xs shadow-xl">
                          <p className="font-semibold text-white">{entry.name}</p>
                          <p className="text-indigo-300 font-bold tabular-nums">
                            ${Number(entry.value).toLocaleString('es-AR')}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  align="center"
                  wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
};
