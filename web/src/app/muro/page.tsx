'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  Inbox,
  Mic,
  Image as ImageIcon,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Filter,
  Search,
  Send,
  Sparkles,
  Layers,
  Bot,
} from 'lucide-react';
import type { AgykeItem } from '../../types/database';
import { HeaderBar } from '../../components/HeaderBar';
import { MobileBottomDock } from '../../components/MobileBottomDock';
import { UserAvatar } from '../../components/UserAvatar';

type StatusFilter = 'ALL' | 'PENDING' | 'PROCESSED' | 'DISCARDED';
type SourceFilter = 'ALL' | 'audio' | 'image' | 'text';

export default function MuroPage() {
  const [queueItems, setQueueItems] = useState<AgykeItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/dashboard');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.queueItems) setQueueItems(data.queueItems);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error cargando ítems de agyke_queue:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    async function initMuro() {
      try {
        const res = await fetch('/api/dashboard');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (ignore) return;
        if (data.queueItems) setQueueItems(data.queueItems);
        setLastUpdated(new Date());
      } catch (err) {
        console.error('Error cargando datos del Muro:', err);
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    initMuro();
    return () => {
      ignore = true;
    };
  }, []);

  // Contadores y Métricas del Muro
  const metrics = useMemo(() => {
    const total = queueItems.length;
    const pending = queueItems.filter((i) => i.status === 'PENDING').length;
    const processed = queueItems.filter((i) => i.status === 'PROCESSED').length;
    const discarded = queueItems.filter((i) => i.status === 'DISCARDED').length;

    const totalPendingAmount = queueItems
      .filter((i) => i.status === 'PENDING')
      .reduce((acc, i) => acc + Number(i.amount || 0), 0);

    return {
      total,
      pending,
      processed,
      discarded,
      totalPendingAmount,
    };
  }, [queueItems]);

  // Ítems filtrados
  const filteredItems = useMemo(() => {
    return queueItems.filter((item) => {
      // Filtro de Estado
      if (statusFilter !== 'ALL' && item.status !== statusFilter) {
        return false;
      }
      // Filtro de Tipo de Origen
      if (sourceFilter !== 'ALL' && item.source_type !== sourceFilter) {
        return false;
      }
      // Búsqueda textual
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase().trim();
        const conceptMatch = item.concept ? item.concept.toLowerCase().includes(query) : false;
        const amountMatch = item.amount ? item.amount.toString().includes(query) : false;
        const userMatch = item.users?.name ? item.users.name.toLowerCase().includes(query) : false;
        if (!conceptMatch && !amountMatch && !userMatch) {
          return false;
        }
      }
      return true;
    });
  }, [queueItems, statusFilter, sourceFilter, searchQuery]);

  const formatARS = (val: number) => {
    return `$ ${val.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-[#080B11] text-slate-100 relative overflow-hidden selection:bg-indigo-500/30 selection:text-white pb-28 sm:pb-20">
      {/* Living Ambient Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
        <div className="absolute inset-0 bg-grid-mesh opacity-70" />
        <div className="absolute -top-32 -left-32 w-[580px] h-[580px] rounded-full bg-gradient-to-br from-indigo-600/20 to-purple-600/15 blur-[125px] animate-ambient-slow" />
        <div className="absolute top-[35%] -right-40 w-[600px] h-[600px] rounded-full bg-gradient-to-tl from-emerald-600/15 to-cyan-500/15 blur-[135px] animate-ambient-reverse" />
        <div className="absolute bottom-10 left-[20%] w-[460px] h-[460px] rounded-full bg-gradient-to-tr from-amber-500/10 to-indigo-500/10 blur-[115px] animate-mesh-pulse" />
      </div>

      {/* Global Header */}
      <HeaderBar
        onRefresh={fetchData}
        isLoading={loading}
        lastUpdated={lastUpdated}
        pendingQueueCount={metrics.pending}
      />

      {/* Main Container */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 space-y-6 sm:space-y-8">
        {/* Navigation Breadcrumb / Header Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2 rounded-xl glass-panel-interactive border border-white/10 hover:border-indigo-500/40 text-slate-300 hover:text-white transition-all inline-flex items-center gap-1.5 text-xs font-semibold"
              title="Volver al Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </Link>

            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-amber-500/20 border border-amber-400/30">
                <Layers className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">Muro Agyke</h1>
                  <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    Pipeline Gemini
                  </span>
                </div>
                <p className="text-xs text-slate-400">Auditoría de comprobantes, audios y tickets procesados</p>
              </div>
            </div>
          </div>

          {/* Quick Telegram Bot CTA */}
          <div className="flex items-center gap-2">
            <a
              href="https://t.me/AgykeBot"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-xl bg-indigo-600/90 hover:bg-indigo-600 border border-indigo-400/30 text-white text-xs font-semibold inline-flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Bot className="w-3.5 h-3.5" />
              <span>Clasificar en Telegram</span>
            </a>
          </div>
        </div>

        {/* Banner Informativo / Instrucción */}
        <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-indigo-500/20 bg-indigo-950/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 shrink-0 mt-0.5 sm:mt-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-medium text-slate-200">
                Extracción automática impulsada por <span className="text-indigo-300 font-semibold">Gemini 1.5 Flash</span>
              </p>
              <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
                Los mensajes de voz y fotos enviados al bot son analizados en tiempo real y quedan registrados aquí. Para impactar en el saldo neto, deben confirmarse con los botones de clasificación (50, 100, -100, 0) directamente en Telegram.
              </p>
            </div>
          </div>
        </div>

        {/* 4 KPI Cards de la Cola */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-6">
          {/* Total Registrados */}
          <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-white/[0.08]">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1.5">
              <span>Total en Cola</span>
              <Inbox className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-white tabular-nums">{metrics.total}</div>
            <p className="text-[10px] text-slate-400 mt-1">Historial completo en agyke_queue</p>
          </div>

          {/* Pendientes de Auditoría */}
          <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-amber-500/30 bg-amber-500/[0.03]">
            <div className="flex items-center justify-between text-amber-300 text-xs mb-1.5">
              <span className="font-medium">Pendientes</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-amber-300 tabular-nums">{metrics.pending}</div>
            <p className="text-[10px] text-amber-400/80 mt-1">
              {metrics.totalPendingAmount > 0
                ? `${formatARS(metrics.totalPendingAmount)} por imputar`
                : 'Sin saldo pendiente'}
            </p>
          </div>

          {/* Procesados */}
          <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-emerald-500/30 bg-emerald-500/[0.03]">
            <div className="flex items-center justify-between text-emerald-300 text-xs mb-1.5">
              <span className="font-medium">Procesados</span>
              <CheckCircle className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-emerald-300 tabular-nums">{metrics.processed}</div>
            <p className="text-[10px] text-emerald-400/80 mt-1">Convertidos en transacciones</p>
          </div>

          {/* Descartados */}
          <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-rose-500/30 bg-rose-500/[0.03]">
            <div className="flex items-center justify-between text-rose-300 text-xs mb-1.5">
              <span className="font-medium">Descartados</span>
              <XCircle className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-rose-300 tabular-nums">{metrics.discarded}</div>
            <p className="text-[10px] text-rose-400/80 mt-1">Rechazados por el usuario</p>
          </div>
        </div>

        {/* Filtros de Estado, Tipo y Buscador */}
        <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-white/[0.08] space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Tabs de Estado */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
              <span className="text-xs text-slate-400 mr-1 flex items-center gap-1 shrink-0">
                <Filter className="w-3.5 h-3.5" /> Estado:
              </span>
              {(['ALL', 'PENDING', 'PROCESSED', 'DISCARDED'] as StatusFilter[]).map((st) => {
                const labels: Record<StatusFilter, string> = {
                  ALL: 'Todos',
                  PENDING: `Pendientes (${metrics.pending})`,
                  PROCESSED: `Procesados (${metrics.processed})`,
                  DISCARDED: `Descartados (${metrics.discarded})`,
                };
                const isActive = statusFilter === st;
                return (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                        : 'bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-800 border border-white/5'
                    }`}
                  >
                    {labels[st]}
                  </button>
                );
              })}
            </div>

            {/* Input de Búsqueda */}
            <div className="relative w-full md:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar concepto o monto..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-900/80 border border-white/10 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>

          {/* Sub-filtro por Tipo de Origen */}
          <div className="flex items-center gap-2 pt-2 border-t border-white/5 overflow-x-auto pb-1 md:pb-0">
            <span className="text-[11px] text-slate-400 shrink-0">Tipo de entrada:</span>
            {(
              [
                { id: 'ALL', label: 'Todos' },
                { id: 'audio', label: 'Voz / Audios', icon: Mic },
                { id: 'image', label: 'Tickets / Fotos', icon: ImageIcon },
                { id: 'text', label: 'Texto libre', icon: FileText },
              ] as { id: SourceFilter; label: string; icon?: React.ComponentType<{ className?: string }> }[]
            ).map((src) => {
              const isActive = sourceFilter === src.id;
              const Icon = src.icon;
              return (
                <button
                  key={src.id}
                  onClick={() => setSourceFilter(src.id)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    isActive
                      ? 'bg-slate-200 text-slate-950 font-semibold'
                      : 'bg-slate-900/40 text-slate-400 hover:text-white hover:bg-white/5 border border-white/5'
                  }`}
                >
                  {Icon && <Icon className="w-3.5 h-3.5" />}
                  <span>{src.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Grid de Ítems del Muro */}
        {loading && queueItems.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center gap-3 text-slate-400">
            <div className="w-8 h-8 rounded-full border-2 border-indigo-400/20 border-t-indigo-400 animate-spin" />
            <p className="text-xs">Cargando ítems del Muro...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="glass-panel rounded-2xl p-8 sm:p-12 border border-white/[0.08] text-center flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center border border-white/10 text-slate-500">
              <Inbox className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-white">No se encontraron ítems</h3>
            <p className="text-xs text-slate-400 max-w-sm">
              {searchQuery || statusFilter !== 'ALL' || sourceFilter !== 'ALL'
                ? 'No hay registros que coincidan con los filtros aplicados. Prueba limpiando la búsqueda.'
                : 'Aún no se han enviado audios ni comprobantes al bot de Telegram.'}
            </p>
            {(searchQuery || statusFilter !== 'ALL' || sourceFilter !== 'ALL') && (
              <button
                onClick={() => {
                  setStatusFilter('ALL');
                  setSourceFilter('ALL');
                  setSearchQuery('');
                }}
                className="mt-2 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors cursor-pointer"
              >
                Limpiar Filtros
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
            {filteredItems.map((item) => {
              const amountNumber = Number(item.amount || 0);
              const isPending = item.status === 'PENDING';
              const isProcessed = item.status === 'PROCESSED';
              const isDiscarded = item.status === 'DISCARDED';

              return (
                <div
                  key={item.id}
                  className={`glass-panel rounded-2xl p-4 sm:p-5 border transition-all duration-200 flex flex-col justify-between gap-3 ${
                    isPending
                      ? 'border-amber-500/30 bg-amber-500/[0.02] hover:border-amber-500/50 shadow-sm shadow-amber-500/5'
                      : isProcessed
                      ? 'border-white/[0.08] hover:border-emerald-500/30'
                      : 'border-white/[0.06] opacity-75 hover:opacity-100 hover:border-rose-500/30'
                  }`}
                >
                  {/* Top Row: Source Icon + Status Badge */}
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <div
                          className={`p-2 rounded-xl border ${
                            item.source_type === 'audio'
                              ? 'bg-violet-500/15 border-violet-500/30 text-violet-300'
                              : item.source_type === 'image'
                              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                              : 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300'
                          }`}
                        >
                          {item.source_type === 'audio' && <Mic className="w-4 h-4" />}
                          {item.source_type === 'image' && <ImageIcon className="w-4 h-4" />}
                          {item.source_type === 'text' && <FileText className="w-4 h-4" />}
                        </div>

                        <div>
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
                            {item.source_type === 'audio'
                              ? 'Nota de Voz'
                              : item.source_type === 'image'
                              ? 'Comprobante / Foto'
                              : 'Mensaje de Texto'}
                          </span>
                          <span className="text-[10px] text-slate-500">{formatDate(item.created_at)}</span>
                        </div>
                      </div>

                      {/* Status Badge */}
                      {isPending && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30 animate-pulse">
                          <Clock className="w-3 h-3" /> Pendiente
                        </span>
                      )}
                      {isProcessed && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                          <CheckCircle className="w-3 h-3" /> Procesado
                        </span>
                      )}
                      {isDiscarded && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30">
                          <XCircle className="w-3 h-3" /> Descartado
                        </span>
                      )}
                    </div>

                    {/* Main Amount & Concept */}
                    <div className="space-y-1">
                      <div className="text-xl sm:text-2xl font-bold text-white tracking-tight tabular-nums">
                        {formatARS(amountNumber)}
                      </div>
                      <p className="text-xs sm:text-sm font-medium text-slate-300 line-clamp-2">
                        {item.concept || 'Gasto no especificado'}
                      </p>
                    </div>
                  </div>

                  {/* Bottom Row: User Details + Action info */}
                  <div className="pt-3 border-t border-white/5 space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <div className="flex items-center gap-2">
                        <UserAvatar name={item.users?.name || 'Usuario'} size="sm" />
                        <span className="font-medium text-slate-300">{item.users?.name || 'Desconocido'}</span>
                      </div>
                      {item.telegram_message_id && (
                        <span className="text-[10px] text-slate-500 font-mono">
                          msg #{item.telegram_message_id}
                        </span>
                      )}
                    </div>

                    {/* Pending Prompt CTA */}
                    {isPending && (
                      <div className="mt-2 pt-2 border-t border-amber-500/15 flex items-center justify-between gap-2">
                        <span className="text-[10px] text-amber-300/90 font-medium">
                          Presiona 50/100/-100/0 en el bot
                        </span>
                        <a
                          href="https://t.me/AgykeBot"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2 py-0.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-200 text-[10px] font-semibold inline-flex items-center gap-1 transition-colors"
                        >
                          <Send className="w-2.5 h-2.5" />
                          <span>Abrir Chat</span>
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Floating Bottom Dock for Mobile */}
      <MobileBottomDock
        onRefresh={fetchData}
        isLoading={loading}
        pendingQueueCount={metrics.pending}
      />
    </div>
  );
}
