'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Activity,
  ArrowLeft,
  Maximize2,
  Minimize2,
  Scale,
  Receipt,
  Users,
  PieChart as PieIcon,
  Clock,
  Sparkles,
  LayoutDashboard,
  Inbox,
} from 'lucide-react';
import type { AnalyticsMonthPayload, ClassificationType } from '../../types/database';
import { BadgeClassification } from '../../components/BadgeClassification';
import { UserAvatar } from '../../components/UserAvatar';
import { MobileBottomDock } from '../../components/MobileBottomDock';

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsMonthPayload | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [activeDonutIndex, setActiveDonutIndex] = useState<number | null>(null);

  const fetchAnalytics = useCallback(async (month?: string) => {
    setLoading(true);
    try {
      const url = month ? `/api/analytics?month=${month}` : '/api/analytics';
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const payload: AnalyticsMonthPayload = await res.json();
      setData(payload);
      setSelectedMonth(payload.selectedMonth);
    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    async function initAnalytics() {
      try {
        const res = await fetch('/api/analytics');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const payload: AnalyticsMonthPayload = await res.json();
        if (ignore) return;
        setData(payload);
        setSelectedMonth(payload.selectedMonth);
      } catch (err) {
        console.error('Error fetching analytics:', err);
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    initAnalytics();
    return () => {
      ignore = true;
    };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const handlePrevMonth = () => {
    if (!data) return;
    const currentIndex = data.availableMonths.indexOf(selectedMonth);
    if (currentIndex < data.availableMonths.length - 1) {
      const prevMonth = data.availableMonths[currentIndex + 1];
      fetchAnalytics(prevMonth);
    } else {
      // Calcular mes cronológico anterior si no está en availableMonths
      const [y, m] = selectedMonth.split('-').map(Number);
      const prevDate = new Date(Date.UTC(y, m - 2, 1));
      const prevStr = `${prevDate.getUTCFullYear()}-${String(prevDate.getUTCMonth() + 1).padStart(2, '0')}`;
      fetchAnalytics(prevStr);
    }
  };

  const handleNextMonth = () => {
    if (!data) return;
    const currentIndex = data.availableMonths.indexOf(selectedMonth);
    if (currentIndex > 0) {
      const nextMonth = data.availableMonths[currentIndex - 1];
      fetchAnalytics(nextMonth);
    } else {
      // Mes cronológico siguiente
      const [y, m] = selectedMonth.split('-').map(Number);
      const nextDate = new Date(Date.UTC(y, m, 1));
      const nextStr = `${nextDate.getUTCFullYear()}-${String(nextDate.getUTCMonth() + 1).padStart(2, '0')}`;
      fetchAnalytics(nextStr);
    }
  };

  const formatARS = (val: number) => {
    return `$ ${val.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  // Comparativa de aportes A vs B para BarChart
  const comparisonData = useMemo(() => {
    if (!data) return [];
    return [
      {
        name: data.kpis.aporteUserA.name,
        total: data.kpis.aporteUserA.total,
        percentage: data.kpis.aporteUserA.percentage,
        color: '#818CF8',
      },
      {
        name: data.kpis.aporteUserB.name,
        total: data.kpis.aporteUserB.total,
        percentage: data.kpis.aporteUserB.percentage,
        color: '#34D399',
      },
    ];
  }, [data]);

  const activeDonutItem =
    activeDonutIndex !== null && data?.classificationBreakdown[activeDonutIndex]
      ? data.classificationBreakdown[activeDonutIndex]
      : null;

  return (
    <div className="min-h-screen bg-[#080B11] text-slate-100 relative overflow-hidden selection:bg-indigo-500/30 selection:text-white pb-24 sm:pb-16">
      {/* Living Ambient Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
        <div className="absolute inset-0 bg-grid-mesh opacity-70" />
        <div className="absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-indigo-600/20 to-purple-600/10 blur-[130px] animate-ambient-slow" />
        <div className="absolute top-[40%] -right-40 w-[600px] h-[600px] rounded-full bg-gradient-to-tl from-emerald-600/15 to-cyan-500/10 blur-[140px] animate-ambient-reverse" />
        <div className="absolute bottom-10 left-[25%] w-[450px] h-[450px] rounded-full bg-cyan-500/10 blur-[110px] animate-mesh-pulse" />
      </div>

      {/* Header Bar */}
      <header className="sticky top-0 z-30 w-full glass-panel border-b border-white/[0.08] backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Left: Brand + Link to Dashboard */}
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2 rounded-xl glass-panel-interactive border border-white/10 hover:border-indigo-500/40 text-slate-300 hover:text-white transition-all inline-flex items-center gap-1.5 text-xs font-semibold"
              title="Volver al Dashboard principal"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </Link>

            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center shadow-lg shadow-indigo-500/25 border border-indigo-400/30">
                <Activity className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">Centro de Analítica</h1>
                  <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 hidden sm:inline-block">
                    Mensual
                  </span>
                </div>
              </div>
            </div>

            {/* Desktop Navigation Tabs */}
            <nav aria-label="Navegación principal" className="hidden lg:flex items-center gap-1 bg-slate-900/60 p-1 rounded-xl border border-white/10 backdrop-blur-md ml-2">
              <Link
                href="/"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/5 transition-all"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Inicio</span>
              </Link>
              <Link
                href="/analytics"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 text-white shadow-md shadow-indigo-600/30 transition-all"
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Analítica</span>
              </Link>
              <Link
                href="/muro"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/5 transition-all"
              >
                <Inbox className="w-3.5 h-3.5" />
                <span>Muro</span>
              </Link>
            </nav>
          </div>

          {/* Right: Month Selector + Fullscreen */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Month Navigator Controls */}
            <div className="flex items-center glass-panel bg-slate-900/60 rounded-xl border border-white/10 p-1">
              <button
                onClick={handlePrevMonth}
                disabled={loading}
                className="p-1.5 sm:px-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer disabled:opacity-40"
                title="Mes anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="px-2.5 sm:px-3 text-xs font-bold text-white tracking-tight flex items-center gap-1.5 whitespace-nowrap min-w-[110px] justify-center">
                <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                <span>{data?.monthLabel || 'Cargando...'}</span>
              </div>

              <button
                onClick={handleNextMonth}
                disabled={loading}
                className="p-1.5 sm:px-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer disabled:opacity-40"
                title="Mes siguiente"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Selector Desplegable Rápido (Desktop) */}
            {data && data.availableMonths.length > 0 && (
              <select
                value={selectedMonth}
                onChange={(e) => fetchAnalytics(e.target.value)}
                className="hidden md:block py-1.5 px-2.5 rounded-xl bg-slate-900/80 border border-white/10 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
              >
                {data.availableMonths.map((m) => (
                  <option key={m} value={m} className="bg-slate-900 text-white">
                    {m}
                  </option>
                ))}
              </select>
            )}

            {/* Botón Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-xl glass-panel-interactive border border-white/10 hover:border-indigo-500/40 text-slate-400 hover:text-white transition-all cursor-pointer hidden sm:inline-flex"
              title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa (Command Center)'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 space-y-6 sm:space-y-8">
        {loading && !data ? (
          <div className="h-96 flex flex-col items-center justify-center gap-3 text-slate-400">
            <div className="w-8 h-8 rounded-full border-2 border-indigo-400/20 border-t-indigo-400 animate-spin" />
            <p className="text-xs font-medium">Analizando transacciones del período...</p>
          </div>
        ) : data ? (
          <>
            {/* KPI Strip: 4 Cifras Monumentales del Mes */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-6">
              {/* KPI 1: Gasto Total Mes */}
              <div className="glass-panel rounded-2xl p-3.5 sm:p-5 border border-white/[0.08] flex flex-col justify-between gap-2.5 relative overflow-hidden">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Gasto del Mes
                  </span>
                  <div className="p-1.5 sm:p-2 rounded-lg bg-indigo-500/15 text-indigo-400">
                    <DollarSign className="w-4 h-4" />
                  </div>
                </div>

                <div>
                  <div className="text-lg sm:text-2xl md:text-3xl font-bold text-white tabular-nums tracking-tight truncate">
                    {formatARS(data.kpis.totalGastoMes)}
                  </div>

                  {data.kpis.variacionPorcentual !== null && (
                    <div className="text-[10px] sm:text-xs mt-1 flex items-center gap-1.5">
                      {data.kpis.variacionPorcentual > 0 ? (
                        <span className="inline-flex items-center text-rose-400 font-semibold tabular-nums">
                          <TrendingUp className="w-3.5 h-3.5 mr-0.5" />
                          +{data.kpis.variacionPorcentual}%
                        </span>
                      ) : data.kpis.variacionPorcentual < 0 ? (
                        <span className="inline-flex items-center text-emerald-400 font-semibold tabular-nums">
                          <TrendingDown className="w-3.5 h-3.5 mr-0.5" />
                          {data.kpis.variacionPorcentual}%
                        </span>
                      ) : (
                        <span className="text-slate-400">0%</span>
                      )}
                      <span className="text-slate-500 truncate">vs mes anterior</span>
                    </div>
                  )}
                </div>
              </div>

              {/* KPI 2: Paridad de Desembolso A vs B */}
              <div className="glass-panel rounded-2xl p-3.5 sm:p-5 border border-white/[0.08] flex flex-col justify-between gap-2.5 relative overflow-hidden">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Paridad de Aporte
                  </span>
                  <div className="p-1.5 sm:p-2 rounded-lg bg-emerald-500/15 text-emerald-400">
                    <Users className="w-4 h-4" />
                  </div>
                </div>

                <div>
                  <div className="flex items-baseline justify-between text-xs sm:text-sm font-semibold text-white mb-1.5">
                    <span className="truncate">{data.kpis.aporteUserA.name}: {data.kpis.aporteUserA.percentage}%</span>
                    <span className="truncate">{data.kpis.aporteUserB.name}: {data.kpis.aporteUserB.percentage}%</span>
                  </div>

                  {/* Micro Barra Bicolor */}
                  <div className="w-full h-2 rounded-full bg-slate-800 flex overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 transition-all duration-500"
                      style={{ width: `${data.kpis.aporteUserA.percentage}%` }}
                      title={`${data.kpis.aporteUserA.name}: ${formatARS(data.kpis.aporteUserA.total)}`}
                    />
                    <div
                      className="h-full bg-emerald-400 transition-all duration-500"
                      style={{ width: `${data.kpis.aporteUserB.percentage}%` }}
                      title={`${data.kpis.aporteUserB.name}: ${formatARS(data.kpis.aporteUserB.total)}`}
                    />
                  </div>

                  <span className="text-[10px] text-slate-500 mt-1 block truncate">
                    Desembolso real compartido
                  </span>
                </div>
              </div>

              {/* KPI 3: Deuda Neta del Período */}
              <div className="glass-panel rounded-2xl p-3.5 sm:p-5 border border-white/[0.08] flex flex-col justify-between gap-2.5 relative overflow-hidden">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Deuda del Período
                  </span>
                  <div className="p-1.5 sm:p-2 rounded-lg bg-cyan-500/15 text-cyan-400">
                    <Scale className="w-4 h-4" />
                  </div>
                </div>

                <div>
                  <div className="text-lg sm:text-2xl md:text-3xl font-bold text-white tabular-nums tracking-tight truncate">
                    {formatARS(Math.abs(data.kpis.deudaGeneradaMes))}
                  </div>
                  <span className="text-[10px] sm:text-xs text-slate-400 mt-1 block truncate">
                    {data.kpis.deudaGeneradaMes > 0
                      ? `A favor de ${data.kpis.aporteUserA.name}`
                      : data.kpis.deudaGeneradaMes < 0
                      ? `A favor de ${data.kpis.aporteUserB.name}`
                      : 'Paridad exacta este mes'}
                  </span>
                </div>
              </div>

              {/* KPI 4: Operaciones y Promedio */}
              <div className="glass-panel rounded-2xl p-3.5 sm:p-5 border border-white/[0.08] flex flex-col justify-between gap-2.5 relative overflow-hidden">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Operaciones
                  </span>
                  <div className="p-1.5 sm:p-2 rounded-lg bg-amber-500/15 text-amber-400">
                    <Receipt className="w-4 h-4" />
                  </div>
                </div>

                <div>
                  <div className="text-lg sm:text-2xl md:text-3xl font-bold text-white tabular-nums tracking-tight truncate">
                    {data.kpis.transaccionesCount}
                  </div>
                  <span className="text-[10px] sm:text-xs text-slate-400 mt-1 block truncate">
                    Promedio:{' '}
                    <strong className="text-slate-200">
                      {formatARS(
                        data.kpis.transaccionesCount > 0
                          ? Math.round(data.kpis.totalGastoMes / data.kpis.transaccionesCount)
                          : 0
                      )}
                    </strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Grilla Principal de Gráficos (Command Center 2x2) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
              {/* Gráfico 1: Evolución Diaria Acumulada */}
              <div className="glass-panel rounded-2xl p-5 sm:p-6 border border-white/[0.08] flex flex-col justify-between">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-indigo-500/15 text-indigo-400">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-sm sm:text-base font-semibold text-white">Evolución Acumulada Diaria</h2>
                      <p className="text-[11px] text-slate-400">Ritmo de consumo a lo largo de {data.monthLabel}</p>
                    </div>
                  </div>
                </div>

                <div className="h-56 sm:h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.dailyTimeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="monthAreaGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366F1" stopOpacity={0.45} />
                          <stop offset="95%" stopColor="#6366F1" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="day"
                        stroke="#64748B"
                        fontSize={11}
                        tickLine={false}
                        interval="preserveStartEnd"
                        axisLine={{ stroke: 'rgba(255, 255, 255, 0.08)' }}
                        tickFormatter={(d) => `d${d}`}
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
                            const p = payload[0].payload;
                            return (
                              <div className="p-3 rounded-xl glass-panel border border-indigo-500/30 text-xs shadow-xl space-y-1 backdrop-blur-xl">
                                <p className="font-semibold text-white">{p.date}</p>
                                <p className="text-slate-300">
                                  Día:{' '}
                                  <span className="text-indigo-300 font-bold tabular-nums">
                                    {formatARS(p.monto)}
                                  </span>{' '}
                                  ({p.count} txs)
                                </p>
                                <p className="text-slate-400">
                                  Acumulado:{' '}
                                  <span className="text-white font-bold tabular-nums">
                                    {formatARS(p.acumulado)}
                                  </span>
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
                        fill="url(#monthAreaGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Gráfico 2: Paridad de Aportes Head-to-Head */}
              <div className="glass-panel rounded-2xl p-5 sm:p-6 border border-white/[0.08] flex flex-col justify-between">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-400">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-sm sm:text-base font-semibold text-white">Comparativa Head-to-Head</h2>
                      <p className="text-[11px] text-slate-400">Aporte total por usuario en {data.monthLabel}</p>
                    </div>
                  </div>
                </div>

                <div className="h-56 sm:h-64 w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={comparisonData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                      <XAxis
                        dataKey="name"
                        stroke="#64748B"
                        fontSize={12}
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
                            const p = payload[0].payload;
                            return (
                              <div className="p-3 rounded-xl glass-panel border border-emerald-500/30 text-xs shadow-xl backdrop-blur-xl">
                                <p className="font-semibold text-white">{p.name}</p>
                                <p className="text-emerald-300 font-bold tabular-nums text-sm mt-0.5">
                                  {formatARS(p.total)}
                                </p>
                                <p className="text-slate-400 text-[11px]">
                                  Representa el {p.percentage}% del total
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar dataKey="total" radius={[8, 8, 0, 0]}>
                        {comparisonData.map((entry, index) => (
                          <Cell key={`bar-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Gráfico 3: Donut de Clasificaciones del Mes */}
              <div className="glass-panel rounded-2xl p-5 sm:p-6 border border-white/[0.08] flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-indigo-500/15 text-indigo-400">
                      <PieIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-sm sm:text-base font-semibold text-white">Por Clasificación</h2>
                      <p className="text-[11px] text-slate-400">Distribución porcentual en {data.monthLabel}</p>
                    </div>
                  </div>
                </div>

                <div className="relative h-48 w-full flex items-center justify-center my-1">
                  {/* Central Gauge Disk */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 select-none">
                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-slate-900/85 border border-white/[0.08] shadow-2xl flex flex-col items-center justify-center p-1.5 text-center backdrop-blur-md transition-all duration-300">
                      {activeDonutItem ? (
                        <div>
                          <span
                            className="block text-[9px] sm:text-[10px] font-bold uppercase tracking-wider truncate max-w-[80px] sm:max-w-[95px] mx-auto"
                            style={{ color: activeDonutItem.color }}
                          >
                            {activeDonutItem.name}
                          </span>
                          <span className="block text-base sm:text-lg font-black text-white tabular-nums tracking-tight mt-0.5">
                            {formatARS(activeDonutItem.value)}
                          </span>
                          <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded-full text-[8px] sm:text-[9px] font-bold tabular-nums border"
                            style={{
                              backgroundColor: `${activeDonutItem.color}20`,
                              borderColor: `${activeDonutItem.color}40`,
                              color: activeDonutItem.color,
                            }}
                          >
                            {activeDonutItem.percentage}%
                          </span>
                        </div>
                      ) : (
                        <div>
                          <span className="block text-[8px] sm:text-[9px] font-bold uppercase tracking-widest text-slate-400">
                            TOTAL MES
                          </span>
                          <span className="block text-base sm:text-lg font-black text-white tabular-nums tracking-tight mt-0.5">
                            {formatARS(data.kpis.totalGastoMes)}
                          </span>
                          <span className="block text-[9px] sm:text-[10px] text-slate-400 font-medium mt-0.5">
                            {data.kpis.transaccionesCount} txs
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.classificationBreakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={58}
                        outerRadius={78}
                        cornerRadius={5}
                        paddingAngle={3}
                        dataKey="value"
                        onClick={(_: unknown, index: number) =>
                          setActiveDonutIndex((prev) => (prev === index ? null : index))
                        }
                        onMouseEnter={(_: unknown, index: number) => setActiveDonutIndex(index)}
                        onMouseLeave={() => setActiveDonutIndex(null)}
                      >
                        {data.classificationBreakdown.map((entry, index) => {
                          const isHovered = activeDonutIndex === index;
                          return (
                            <Cell
                              key={`cell-${index}`}
                              fill={entry.color}
                              stroke={isHovered ? '#FFFFFF' : '#080B11'}
                              strokeWidth={isHovered ? 2.5 : 1.5}
                              opacity={activeDonutIndex !== null && !isHovered ? 0.35 : 1}
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

                {/* Desglose List */}
                <div className="space-y-1.5 mt-2 pt-2 border-t border-white/[0.06]">
                  {data.classificationBreakdown.map((item, index) => {
                    const isHovered = activeDonutIndex === index;
                    return (
                      <div
                        key={item.key}
                        onClick={() => setActiveDonutIndex((prev) => (prev === index ? null : index))}
                        onMouseEnter={() => setActiveDonutIndex(index)}
                        onMouseLeave={() => setActiveDonutIndex(null)}
                        className={`min-h-[40px] flex items-center justify-between p-2 rounded-xl border transition-all cursor-pointer ${
                          isHovered
                            ? 'bg-slate-800/80 border-indigo-500/40'
                            : 'bg-slate-900/40 border-white/[0.04]'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                          <span className="text-xs font-semibold text-slate-200">{item.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white tabular-nums">{formatARS(item.value)}</span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md border"
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
                    );
                  })}
                </div>
              </div>

              {/* Gráfico 4: Intensidad por Día de la Semana */}
              <div className="glass-panel rounded-2xl p-5 sm:p-6 border border-white/[0.08] flex flex-col justify-between">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-cyan-500/15 text-cyan-400">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-sm sm:text-base font-semibold text-white">Velocidad por Día de la Semana</h2>
                      <p className="text-[11px] text-slate-400">Patrón de consumo semanal en {data.monthLabel}</p>
                    </div>
                  </div>
                </div>

                <div className="h-56 sm:h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.dayOfWeekIntensity} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <XAxis
                        dataKey="dayName"
                        stroke="#64748B"
                        fontSize={11}
                        tickLine={false}
                        axisLine={{ stroke: 'rgba(255, 255, 255, 0.08)' }}
                        tickFormatter={(name) => name.slice(0, 3)}
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
                            const p = payload[0].payload;
                            return (
                              <div className="p-3 rounded-xl glass-panel border border-cyan-500/30 text-xs shadow-xl backdrop-blur-xl">
                                <p className="font-semibold text-white">{p.dayName}</p>
                                <p className="text-cyan-300 font-bold tabular-nums text-sm mt-0.5">
                                  {formatARS(p.total)}
                                </p>
                                <p className="text-slate-400 text-[11px]">
                                  {p.count} compras en este día
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar dataKey="total" fill="#06B6D4" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Top 5 Gastos del Mes */}
            {data.topExpenses.length > 0 && (
              <div className="glass-panel rounded-2xl p-5 sm:p-6 border border-white/[0.08]">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-amber-500/15 text-amber-400">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-sm sm:text-base font-semibold text-white">Mayores Gastos del Mes</h2>
                      <p className="text-[11px] text-slate-400">Top 5 compras más significativas de {data.monthLabel}</p>
                    </div>
                  </div>
                </div>

                <div className="divide-y divide-white/[0.04]">
                  {data.topExpenses.map((tx, idx) => (
                    <div key={tx.id} className="py-3 flex items-center justify-between gap-3 first:pt-0 last:pb-0">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-6 h-6 rounded-full bg-slate-800 text-slate-300 text-xs font-bold flex items-center justify-center shrink-0">
                          #{idx + 1}
                        </span>
                        <UserAvatar name={tx.userName} size="sm" />
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-semibold text-white truncate">{tx.concept}</p>
                          <p className="text-[10px] text-slate-400">
                            {tx.userName} · {tx.date}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <BadgeClassification classification={tx.classification as ClassificationType} />
                        <span className="text-xs sm:text-sm font-bold text-white tabular-nums">
                          {formatARS(tx.amount)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : null}
      </main>

      {/* Floating Bottom Dock for Mobile */}
      <MobileBottomDock />
    </div>
  );
}
