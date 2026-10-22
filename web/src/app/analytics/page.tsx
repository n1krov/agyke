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
  ArrowLeft,
  Maximize2,
  Minimize2,
  LayoutDashboard,
  Inbox,
  Sparkles,
} from 'lucide-react';
import type { AnalyticsMonthPayload, ClassificationType } from '../../types/database';
import { BadgeClassification } from '../../components/BadgeClassification';
import { UserAvatar } from '../../components/UserAvatar';
import { MobileBottomDock } from '../../components/MobileBottomDock';
import { ThemeToggle, useTheme } from '../../components/ThemeToggle';

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsMonthPayload | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [activeDonutIndex, setActiveDonutIndex] = useState<number | null>(null);

  const { theme } = useTheme();
  const isDark = theme === 'dark';

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
      const [y, m] = selectedMonth.split('-').map(Number);
      const nextDate = new Date(Date.UTC(y, m, 1));
      const nextStr = `${nextDate.getUTCFullYear()}-${String(nextDate.getUTCMonth() + 1).padStart(2, '0')}`;
      fetchAnalytics(nextStr);
    }
  };

  const formatARS = (val: number) => {
    return `$ ${val.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  const comparisonData = useMemo(() => {
    if (!data) return [];
    return [
      {
        name: data.kpis.aporteUserA.name,
        total: data.kpis.aporteUserA.total,
        percentage: data.kpis.aporteUserA.percentage,
        color: isDark ? '#93C5FD' : '#2563EB',
      },
      {
        name: data.kpis.aporteUserB.name,
        total: data.kpis.aporteUserB.total,
        percentage: data.kpis.aporteUserB.percentage,
        color: isDark ? '#6EE7B7' : '#059669',
      },
    ];
  }, [data, isDark]);

  const activeDonutItem =
    activeDonutIndex !== null && data?.classificationBreakdown[activeDonutIndex]
      ? data.classificationBreakdown[activeDonutIndex]
      : null;

  return (
    <div className="min-h-screen bg-[var(--canvas)] text-[var(--text-primary)] relative selection:bg-neutral-800 selection:text-white dark:selection:bg-neutral-200 dark:selection:text-neutral-900 pb-24 sm:pb-16 transition-colors">
      {/* Header Bar */}
      <header className="sticky top-0 z-30 w-full border-b border-[var(--border-hairline)] bg-[var(--surface)]/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-15 flex items-center justify-between gap-4">
          {/* Left: Brand + Navigation */}
          <div className="flex items-center gap-3 sm:gap-4">
            <Link
              href="/"
              className="p-1.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--surface)] hover:bg-[var(--surface-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors inline-flex items-center gap-1.5 text-xs font-mono"
              title="Volver al Inicio"
            >
              <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.75} />
              <span className="hidden sm:inline">Inicio</span>
            </Link>

            <div className="flex items-center gap-2">
              <span className="text-base font-semibold text-[var(--text-primary)] font-mono tracking-tight">
                Analítica
              </span>
              <span className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded border border-[var(--border-hairline)] bg-[var(--surface-subtle)] text-[var(--text-muted)] hidden sm:inline-block">
                Mensual
              </span>
            </div>

            {/* Desktop Navigation Tabs */}
            <nav aria-label="Navegación principal" className="hidden lg:flex items-center gap-1 p-0.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-subtle)] ml-2">
              <Link
                href="/"
                className="flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-mono text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                <LayoutDashboard className="w-3.5 h-3.5" strokeWidth={1.75} />
                <span>Inicio</span>
              </Link>
              <Link
                href="/analytics"
                className="flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-mono font-semibold bg-[var(--surface)] text-[var(--text-primary)] border border-[var(--border-hairline)] shadow-sm"
              >
                <TrendingUp className="w-3.5 h-3.5" strokeWidth={1.75} />
                <span>Analítica</span>
              </Link>
              <Link
                href="/muro"
                className="flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-mono text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                <Inbox className="w-3.5 h-3.5" strokeWidth={1.75} />
                <span>Muro</span>
              </Link>
            </nav>
          </div>

          {/* Right: Month Selector + Theme + Fullscreen */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Month Navigator Controls */}
            <div className="flex items-center rounded-lg border border-[var(--border-hairline)] bg-[var(--surface)] p-0.5">
              <button
                onClick={handlePrevMonth}
                disabled={loading}
                className="p-1 rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] transition-colors cursor-pointer disabled:opacity-40"
                title="Mes anterior"
              >
                <ChevronLeft className="w-3.5 h-3.5" strokeWidth={1.75} />
              </button>

              <div className="px-2.5 text-xs font-mono font-semibold text-[var(--text-primary)] tracking-tight flex items-center gap-1.5 whitespace-nowrap min-w-[100px] justify-center">
                <Calendar className="w-3 h-3 text-[var(--text-muted)]" strokeWidth={1.75} />
                <span>{data?.monthLabel || 'Cargando...'}</span>
              </div>

              <button
                onClick={handleNextMonth}
                disabled={loading}
                className="p-1 rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] transition-colors cursor-pointer disabled:opacity-40"
                title="Mes siguiente"
              >
                <ChevronRight className="w-3.5 h-3.5" strokeWidth={1.75} />
              </button>
            </div>

            {/* Dropdown de Meses Disponibles */}
            {data && data.availableMonths.length > 0 && (
              <select
                value={selectedMonth}
                onChange={(e) => fetchAnalytics(e.target.value)}
                className="hidden md:block py-1 px-2 rounded-lg bg-[var(--surface)] border border-[var(--border-hairline)] text-xs font-mono text-[var(--text-primary)] focus:outline-none focus:border-[var(--text-primary)] transition-colors cursor-pointer"
              >
                {data.availableMonths.map((m) => (
                  <option key={m} value={m} className="bg-[var(--surface)] text-[var(--text-primary)]">
                    {m}
                  </option>
                ))}
              </select>
            )}

            <ThemeToggle variant="pill" />

            {/* Fullscreen Button */}
            <button
              onClick={toggleFullscreen}
              className="p-1.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--surface)] hover:bg-[var(--surface-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer hidden sm:inline-flex"
              title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" strokeWidth={1.75} /> : <Maximize2 className="w-3.5 h-3.5" strokeWidth={1.75} />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 space-y-6 sm:space-y-8">
        {loading && !data ? (
          <div className="h-96 flex flex-col items-center justify-center gap-3 text-[var(--text-muted)] font-mono">
            <div className="w-6 h-6 rounded-full border-2 border-[var(--text-muted)] border-t-[var(--text-primary)] animate-spin" />
            <p className="text-xs">Consolidando métricas del período...</p>
          </div>
        ) : data ? (
          <>
            {/* KPI Strip: 4 Cifras Monumentales del Mes */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
              {/* KPI 1: Gasto Total Mes */}
              <div className="hairline-card rounded-xl p-4 sm:p-5 flex flex-col justify-between gap-2.5 transition-colors">
                <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-muted)]">
                  Gasto del Mes
                </span>

                <div>
                  <div className="text-xl sm:text-2xl md:text-3xl font-semibold font-mono text-[var(--text-primary)] tabular-nums tracking-tight truncate">
                    {formatARS(data.kpis.totalGastoMes)}
                  </div>

                  {data.kpis.variacionPorcentual !== null && (
                    <div className="text-xs font-mono mt-1 flex items-center gap-1.5">
                      {data.kpis.variacionPorcentual > 0 ? (
                        <span className="inline-flex items-center text-rose-600 dark:text-rose-400 font-semibold tabular-nums">
                          <TrendingUp className="w-3 h-3 mr-0.5" strokeWidth={2} />
                          +{data.kpis.variacionPorcentual}%
                        </span>
                      ) : data.kpis.variacionPorcentual < 0 ? (
                        <span className="inline-flex items-center text-emerald-600 dark:text-emerald-400 font-semibold tabular-nums">
                          <TrendingDown className="w-3 h-3 mr-0.5" strokeWidth={2} />
                          {data.kpis.variacionPorcentual}%
                        </span>
                      ) : (
                        <span className="text-[var(--text-muted)]">0%</span>
                      )}
                      <span className="text-[var(--text-muted)] truncate">vs mes anterior</span>
                    </div>
                  )}
                </div>
              </div>

              {/* KPI 2: Paridad de Desembolso A vs B */}
              <div className="hairline-card rounded-xl p-4 sm:p-5 flex flex-col justify-between gap-2.5 transition-colors">
                <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-muted)]">
                  Paridad de Aporte
                </span>

                <div>
                  <div className="flex items-baseline justify-between text-xs font-mono font-medium text-[var(--text-primary)] mb-1.5">
                    <span className="truncate">{data.kpis.aporteUserA.name}: {data.kpis.aporteUserA.percentage}%</span>
                    <span className="truncate">{data.kpis.aporteUserB.name}: {data.kpis.aporteUserB.percentage}%</span>
                  </div>

                  {/* Micro Barra Bicolor */}
                  <div className="w-full h-2 rounded-full bg-[var(--surface-subtle)] border border-[var(--border-hairline)] flex overflow-hidden">
                    <div
                      className="h-full bg-blue-500 transition-all duration-500"
                      style={{ width: `${data.kpis.aporteUserA.percentage}%` }}
                      title={`${data.kpis.aporteUserA.name}: ${formatARS(data.kpis.aporteUserA.total)}`}
                    />
                    <div
                      className="h-full bg-emerald-500 transition-all duration-500"
                      style={{ width: `${data.kpis.aporteUserB.percentage}%` }}
                      title={`${data.kpis.aporteUserB.name}: ${formatARS(data.kpis.aporteUserB.total)}`}
                    />
                  </div>

                  <span className="text-[10px] font-mono text-[var(--text-muted)] mt-1.5 block truncate">
                    Desembolso real compartido
                  </span>
                </div>
              </div>

              {/* KPI 3: Deuda Neta del Período */}
              <div className="hairline-card rounded-xl p-4 sm:p-5 flex flex-col justify-between gap-2.5 transition-colors">
                <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-muted)]">
                  Deuda del Período
                </span>

                <div>
                  <div className="text-xl sm:text-2xl md:text-3xl font-semibold font-mono text-[var(--text-primary)] tabular-nums tracking-tight truncate">
                    {formatARS(Math.abs(data.kpis.deudaGeneradaMes))}
                  </div>
                  <span className="text-xs font-mono text-[var(--text-secondary)] mt-1 block truncate">
                    {data.kpis.deudaGeneradaMes > 0
                      ? `A favor de ${data.kpis.aporteUserA.name}`
                      : data.kpis.deudaGeneradaMes < 0
                      ? `A favor de ${data.kpis.aporteUserB.name}`
                      : 'Paridad exacta este mes'}
                  </span>
                </div>
              </div>

              {/* KPI 4: Operaciones y Promedio */}
              <div className="hairline-card rounded-xl p-4 sm:p-5 flex flex-col justify-between gap-2.5 transition-colors">
                <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-muted)]">
                  Operaciones
                </span>

                <div>
                  <div className="text-xl sm:text-2xl md:text-3xl font-semibold font-mono text-[var(--text-primary)] tabular-nums tracking-tight truncate">
                    {data.kpis.transaccionesCount}
                  </div>
                  <span className="text-xs font-mono text-[var(--text-muted)] mt-1 block truncate">
                    Ticket promedio:{' '}
                    <strong className="text-[var(--text-primary)] font-medium">
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
              <div className="hairline-card rounded-2xl p-5 sm:p-6 flex flex-col justify-between transition-colors">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-sm sm:text-base font-semibold font-mono uppercase tracking-wider text-[var(--text-primary)]">
                      Evolución Acumulada Diaria
                    </h2>
                    <p className="text-xs text-[var(--text-muted)]">Ritmo de consumo a lo largo de {data.monthLabel}</p>
                  </div>
                </div>

                <div className="h-56 sm:h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.dailyTimeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="monthDailyAreaGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={isDark ? '#F3F4F6' : '#0F172A'} stopOpacity={isDark ? 0.15 : 0.08} />
                          <stop offset="95%" stopColor={isDark ? '#F3F4F6' : '#0F172A'} stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="day"
                        stroke={isDark ? '#6B7280' : '#868C98'}
                        fontSize={11}
                        fontFamily="var(--font-geist-mono), monospace"
                        tickLine={false}
                        interval="preserveStartEnd"
                        axisLine={{ stroke: isDark ? '#22242E' : '#E4E5EA' }}
                        tickFormatter={(d) => `d${d}`}
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
                            const p = payload[0].payload;
                            return (
                              <div className="p-3 rounded-xl border border-[var(--border-hairline)] bg-[var(--surface)] text-xs shadow-md space-y-1 font-mono">
                                <p className="font-semibold text-[var(--text-primary)]">{p.date}</p>
                                <p className="text-[var(--text-secondary)]">
                                  Día:{' '}
                                  <span className="font-bold text-[var(--text-primary)] tabular-nums">
                                    {formatARS(p.monto)}
                                  </span>{' '}
                                  ({p.count} txs)
                                </p>
                                <p className="text-[var(--text-muted)]">
                                  Acumulado:{' '}
                                  <span className="font-bold text-[var(--text-primary)] tabular-nums">
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
                        stroke={isDark ? '#F3F4F6' : '#0F172A'}
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#monthDailyAreaGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Gráfico 2: Paridad de Aportes Head-to-Head */}
              <div className="hairline-card rounded-2xl p-5 sm:p-6 flex flex-col justify-between transition-colors">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-sm sm:text-base font-semibold font-mono uppercase tracking-wider text-[var(--text-primary)]">
                      Comparativa de Aporte
                    </h2>
                    <p className="text-xs text-[var(--text-muted)]">Volumen neto aportado en {data.monthLabel}</p>
                  </div>
                </div>

                <div className="h-56 sm:h-64 w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={comparisonData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                      <XAxis
                        dataKey="name"
                        stroke={isDark ? '#6B7280' : '#868C98'}
                        fontSize={12}
                        fontFamily="var(--font-geist-mono), monospace"
                        tickLine={false}
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
                            const p = payload[0].payload;
                            return (
                              <div className="p-3 rounded-xl border border-[var(--border-hairline)] bg-[var(--surface)] text-xs shadow-md font-mono">
                                <p className="font-semibold text-[var(--text-primary)]">{p.name}</p>
                                <p className="font-bold tabular-nums text-sm mt-0.5 text-[var(--text-primary)]">
                                  {formatARS(p.total)}
                                </p>
                                <p className="text-[var(--text-muted)] text-[11px] mt-0.5">
                                  Representa el {p.percentage}% del total
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar dataKey="total" radius={[6, 6, 0, 0]}>
                        {comparisonData.map((entry, index) => (
                          <Cell key={`bar-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Gráfico 3: Donut de Clasificaciones del Mes */}
              <div className="hairline-card rounded-2xl p-5 sm:p-6 flex flex-col justify-between transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h2 className="text-sm sm:text-base font-semibold font-mono uppercase tracking-wider text-[var(--text-primary)]">
                      Por Clasificación
                    </h2>
                    <p className="text-xs text-[var(--text-muted)]">Distribución contable en {data.monthLabel}</p>
                  </div>
                </div>

                <div className="relative h-44 w-full flex items-center justify-center my-1">
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 select-none">
                    <div className="flex flex-col items-center justify-center text-center font-mono">
                      {activeDonutItem ? (
                        <div>
                          <span className="block text-[10px] font-bold uppercase tracking-wider text-[var(--text-primary)]">
                            {activeDonutItem.name}
                          </span>
                          <span className="block text-base sm:text-lg font-bold text-[var(--text-primary)] tabular-nums">
                            {formatARS(activeDonutItem.value)}
                          </span>
                          <span className="text-[10px] text-[var(--text-muted)]">
                            {activeDonutItem.percentage}%
                          </span>
                        </div>
                      ) : (
                        <div>
                          <span className="block text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
                            TOTAL MES
                          </span>
                          <span className="block text-base sm:text-lg font-bold text-[var(--text-primary)] tabular-nums">
                            {formatARS(data.kpis.totalGastoMes)}
                          </span>
                          <span className="block text-[10px] text-[var(--text-muted)]">
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
                        innerRadius={54}
                        outerRadius={72}
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
                              stroke="var(--surface)"
                              strokeWidth={2}
                              className="transition-opacity hover:opacity-80"
                            />
                          );
                        })}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Desglose List */}
                <div className="space-y-1 mt-2 pt-2 border-t border-[var(--border-hairline)]">
                  {data.classificationBreakdown.map((item, index) => {
                    const isHovered = activeDonutIndex === index;
                    return (
                      <div
                        key={item.key}
                        onClick={() => setActiveDonutIndex((prev) => (prev === index ? null : index))}
                        onMouseEnter={() => setActiveDonutIndex(index)}
                        onMouseLeave={() => setActiveDonutIndex(null)}
                        className={`min-h-[36px] flex items-center justify-between p-1.5 rounded-lg border transition-all cursor-pointer font-mono text-xs ${
                          isHovered
                            ? 'bg-[var(--surface-subtle)] border-[var(--border-hover)]'
                            : 'border-transparent hover:bg-[var(--surface-subtle)]/50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                          <span className="text-[var(--text-secondary)] font-medium">{item.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-[var(--text-primary)] tabular-nums">{formatARS(item.value)}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded border border-[var(--border-hairline)] bg-[var(--surface-subtle)] text-[var(--text-muted)]">
                            {item.percentage}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Gráfico 4: Intensidad por Día de la Semana */}
              <div className="hairline-card rounded-2xl p-5 sm:p-6 flex flex-col justify-between transition-colors">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-sm sm:text-base font-semibold font-mono uppercase tracking-wider text-[var(--text-primary)]">
                      Intensidad Semanal
                    </h2>
                    <p className="text-xs text-[var(--text-muted)]">Gasto agrupado por día de la semana</p>
                  </div>
                </div>

                <div className="h-56 sm:h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.dayOfWeekIntensity} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <XAxis
                        dataKey="dayName"
                        stroke={isDark ? '#6B7280' : '#868C98'}
                        fontSize={11}
                        fontFamily="var(--font-geist-mono), monospace"
                        tickLine={false}
                        axisLine={{ stroke: isDark ? '#22242E' : '#E4E5EA' }}
                        tickFormatter={(name) => name.slice(0, 3)}
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
                            const p = payload[0].payload;
                            return (
                              <div className="p-3 rounded-xl border border-[var(--border-hairline)] bg-[var(--surface)] text-xs shadow-md font-mono">
                                <p className="font-semibold text-[var(--text-primary)]">{p.dayName}</p>
                                <p className="font-bold tabular-nums text-sm mt-0.5 text-[var(--text-primary)]">
                                  {formatARS(p.total)}
                                </p>
                                <p className="text-[var(--text-muted)] text-[11px] mt-0.5">
                                  {p.count} compras en este día
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar dataKey="total" fill={isDark ? '#60A5FA' : '#3B82F6'} radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Top 5 Gastos del Mes */}
            {data.topExpenses.length > 0 && (
              <div className="hairline-card rounded-2xl p-5 sm:p-6 transition-colors">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-sm sm:text-base font-semibold font-mono uppercase tracking-wider text-[var(--text-primary)]">
                      Mayores Gastos del Mes
                    </h2>
                    <p className="text-xs text-[var(--text-muted)]">Top 5 transacciones de mayor volumen en {data.monthLabel}</p>
                  </div>
                </div>

                <div className="divide-y divide-[var(--border-hairline)]">
                  {data.topExpenses.map((tx, idx) => (
                    <div key={tx.id} className="py-3 flex items-center justify-between gap-3 first:pt-0 last:pb-0 hover:bg-[var(--surface-subtle)]/40 transition-colors px-2 rounded-lg">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-5 h-5 rounded border border-[var(--border-hairline)] bg-[var(--surface-subtle)] text-[var(--text-muted)] font-mono text-[11px] font-semibold flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <UserAvatar name={tx.userName} size="sm" />
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-medium text-[var(--text-primary)] truncate">{tx.concept}</p>
                          <p className="text-[10px] font-mono text-[var(--text-muted)]">
                            {tx.userName} · {tx.date}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <BadgeClassification classification={tx.classification as ClassificationType} />
                        <span className="text-xs sm:text-sm font-semibold font-mono text-[var(--text-primary)] tabular-nums">
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
