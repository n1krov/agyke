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

      // Filtro de Origen
      if (sourceFilter !== 'ALL' && item.source_type !== sourceFilter) {
        return false;
      }

      // Filtro de Texto
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesConcept = (item.concept || '').toLowerCase().includes(q);
        const matchesAmount = (item.amount || '').toString().includes(q);
        const matchesUser = (item.users?.name || '').toLowerCase().includes(q);
        return matchesConcept || matchesAmount || matchesUser;
      }

      return true;
    });
  }, [queueItems, statusFilter, sourceFilter, searchQuery]);

  const formatARS = (val: number) => {
    return `$ ${val.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  const formatDate = (isoStr: string) => {
    const d = new Date(isoStr);
    return d.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-[var(--canvas)] text-[var(--text-primary)] relative selection:bg-neutral-800 selection:text-white dark:selection:bg-neutral-200 dark:selection:text-neutral-900 pb-28 sm:pb-20 transition-colors">
      {/* Global Header */}
      <HeaderBar
        onRefresh={fetchData}
        isLoading={loading}
        lastUpdated={lastUpdated}
        pendingQueueCount={metrics.pending}
      />

      {/* Main Container */}
      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 space-y-6 sm:space-y-8">
        {/* Navigation Breadcrumb / Header Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-1.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--surface)] hover:bg-[var(--surface-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors inline-flex items-center gap-1.5 text-xs font-mono"
              title="Volver al Inicio"
            >
              <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.75} />
              <span className="hidden sm:inline">Inicio</span>
            </Link>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-semibold font-mono tracking-tight text-[var(--text-primary)]">
                  Muro de Ingestión
                </h1>
                <span className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded border border-[var(--border-hairline)] bg-[var(--surface-subtle)] text-[var(--text-muted)]">
                  Gemini Pipeline
                </span>
              </div>
              <p className="text-xs text-[var(--text-muted)]">Auditoría de comprobantes, audios y tickets procesados</p>
            </div>
          </div>

          {/* Quick Telegram Bot CTA */}
          <div className="flex items-center gap-2">
            <a
              href="https://t.me/AgykeBot"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--surface)] hover:bg-[var(--surface-subtle)] text-[var(--text-primary)] text-xs font-mono font-medium inline-flex items-center gap-1.5 transition-colors"
            >
              <Bot className="w-3.5 h-3.5" strokeWidth={1.75} />
              <span>Clasificar en Telegram</span>
            </a>
          </div>
        </div>

        {/* Banner Informativo / Instrucción */}
        <div className="hairline-card rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-colors">
          <div className="flex items-start sm:items-center gap-3">
            <Sparkles className="w-4 h-4 text-[var(--text-secondary)] shrink-0 mt-0.5 sm:mt-0" strokeWidth={1.75} />
            <div>
              <p className="text-xs sm:text-sm font-medium text-[var(--text-primary)]">
                Extracción automática con modelo <span className="font-mono font-semibold">Gemini Flash</span>
              </p>
              <p className="text-xs text-[var(--text-muted)] mt-0.5 leading-relaxed">
                Los mensajes de voz y fotos enviados al bot son analizados en tiempo real y quedan registrados aquí. Para impactar en el saldo neto, deben confirmarse con los botones de clasificación (50, 100, -100, 0) directamente en Telegram.
              </p>
            </div>
          </div>
        </div>

        {/* 4 KPI Cards de la Cola */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
          {/* Total Registrados */}
          <div className="hairline-card rounded-xl p-4 sm:p-5 transition-colors">
            <div className="flex items-center justify-between text-[var(--text-muted)] text-[11px] font-mono uppercase tracking-wider mb-1.5">
              <span>Total en Cola</span>
              <Inbox className="w-3.5 h-3.5" strokeWidth={1.75} />
            </div>
            <div className="text-xl sm:text-2xl font-semibold font-mono text-[var(--text-primary)] tabular-nums">{metrics.total}</div>
            <p className="text-[11px] text-[var(--text-muted)] mt-1 font-mono">Historial en agyke_queue</p>
          </div>

          {/* Pendientes de Auditoría */}
          <div className="hairline-card rounded-xl p-4 sm:p-5 transition-colors">
            <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider mb-1.5 text-amber-700 dark:text-amber-400">
              <span className="font-semibold">Pendientes</span>
              <Clock className="w-3.5 h-3.5" strokeWidth={1.75} />
            </div>
            <div className="text-xl sm:text-2xl font-semibold font-mono text-[var(--text-primary)] tabular-nums">{metrics.pending}</div>
            <p className="text-[11px] text-amber-700/80 dark:text-amber-400/80 mt-1 font-mono">
              {metrics.totalPendingAmount > 0
                ? `${formatARS(metrics.totalPendingAmount)} por imputar`
                : 'Sin saldo pendiente'}
            </p>
          </div>

          {/* Procesados */}
          <div className="hairline-card rounded-xl p-4 sm:p-5 transition-colors">
            <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider mb-1.5 text-emerald-700 dark:text-emerald-400">
              <span className="font-semibold">Procesados</span>
              <CheckCircle className="w-3.5 h-3.5" strokeWidth={1.75} />
            </div>
            <div className="text-xl sm:text-2xl font-semibold font-mono text-[var(--text-primary)] tabular-nums">{metrics.processed}</div>
            <p className="text-[11px] text-[var(--text-muted)] mt-1 font-mono">Convertidos en transacciones</p>
          </div>

          {/* Descartados */}
          <div className="hairline-card rounded-xl p-4 sm:p-5 transition-colors">
            <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider mb-1.5 text-rose-700 dark:text-rose-400">
              <span className="font-semibold">Descartados</span>
              <XCircle className="w-3.5 h-3.5" strokeWidth={1.75} />
            </div>
            <div className="text-xl sm:text-2xl font-semibold font-mono text-[var(--text-primary)] tabular-nums">{metrics.discarded}</div>
            <p className="text-[11px] text-[var(--text-muted)] mt-1 font-mono">Rechazados por usuario</p>
          </div>
        </div>

        {/* Filtros de Estado, Tipo y Buscador */}
        <div className="hairline-card rounded-xl p-4 sm:p-5 space-y-3.5 transition-colors">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Tabs de Estado */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none font-mono text-xs">
              <span className="text-[var(--text-muted)] mr-1 flex items-center gap-1 shrink-0 text-[11px] uppercase tracking-wider">
                <Filter className="w-3 h-3" strokeWidth={1.75} /> Estado:
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
                    className={`px-2.5 py-1 rounded-md text-xs font-mono transition-all cursor-pointer whitespace-nowrap ${
                      isActive
                        ? 'bg-[var(--brand-accent)] text-[var(--canvas)] font-semibold shadow-sm'
                        : 'bg-[var(--surface-subtle)] border border-[var(--border-hairline)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {labels[st]}
                  </button>
                );
              })}
            </div>

            {/* Input de Búsqueda */}
            <div className="relative w-full md:w-60">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" strokeWidth={1.75} />
              <input
                type="text"
                placeholder="Buscar concepto o monto..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[var(--surface-subtle)] border border-[var(--border-hairline)] text-xs font-mono text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--text-primary)] transition-colors"
              />
            </div>
          </div>

          {/* Sub-filtro por Tipo de Origen */}
          <div className="flex items-center gap-2 pt-2.5 border-t border-[var(--border-hairline)] overflow-x-auto pb-1 md:pb-0">
            <span className="text-[11px] font-mono text-[var(--text-muted)] uppercase tracking-wider shrink-0">Entrada:</span>
            {(
              [
                { id: 'ALL', label: 'Todos' },
                { id: 'audio', label: 'Voz / Audio', icon: Mic },
                { id: 'image', label: 'Ticket / Foto', icon: ImageIcon },
                { id: 'text', label: 'Texto libre', icon: FileText },
              ] as { id: SourceFilter; label: string; icon?: React.ComponentType<{ className?: string }> }[]
            ).map((src) => {
              const isActive = sourceFilter === src.id;
              const Icon = src.icon;
              return (
                <button
                  key={src.id}
                  onClick={() => setSourceFilter(src.id)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[var(--surface-subtle)] border border-[var(--border-hover)] text-[var(--text-primary)] font-semibold'
                      : 'border border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)]/50'
                  }`}
                >
                  {Icon && <Icon className="w-3 h-3" />}
                  <span>{src.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Grid de Ítems del Muro */}
        {loading && queueItems.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center gap-3 text-[var(--text-muted)] font-mono">
            <div className="w-6 h-6 rounded-full border-2 border-[var(--text-muted)] border-t-[var(--text-primary)] animate-spin" />
            <p className="text-xs">Cargando registros del Muro...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="hairline-card rounded-2xl p-8 sm:p-12 text-center flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-subtle)] flex items-center justify-center text-[var(--text-muted)]">
              <Inbox className="w-5 h-5" strokeWidth={1.5} />
            </div>
            <h3 className="text-sm font-mono font-semibold text-[var(--text-primary)]">No se encontraron registros</h3>
            <p className="text-xs text-[var(--text-muted)] max-w-sm">
              {searchQuery || statusFilter !== 'ALL' || sourceFilter !== 'ALL'
                ? 'No hay registros que coincidan con los filtros aplicados.'
                : 'Aún no se han enviado audios ni comprobantes al bot de Telegram.'}
            </p>
            {(searchQuery || statusFilter !== 'ALL' || sourceFilter !== 'ALL') && (
              <button
                onClick={() => {
                  setStatusFilter('ALL');
                  setSourceFilter('ALL');
                  setSearchQuery('');
                }}
                className="mt-2 px-3 py-1.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-subtle)] hover:bg-[var(--surface)] text-xs font-mono font-medium text-[var(--text-primary)] transition-colors cursor-pointer"
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
                  className={`hairline-card rounded-xl p-4 sm:p-5 transition-all flex flex-col justify-between gap-3 ${
                    isPending
                      ? 'border-l-4 border-l-amber-500'
                      : isProcessed
                      ? 'border-l-4 border-l-emerald-500'
                      : 'border-l-4 border-l-rose-500 opacity-80'
                  }`}
                >
                  {/* Top Row: Source Icon + Status Badge */}
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-subtle)] text-[var(--text-secondary)]">
                          {item.source_type === 'audio' && <Mic className="w-3.5 h-3.5" strokeWidth={1.75} />}
                          {item.source_type === 'image' && <ImageIcon className="w-3.5 h-3.5" strokeWidth={1.75} />}
                          {item.source_type === 'text' && <FileText className="w-3.5 h-3.5" strokeWidth={1.75} />}
                        </div>

                        <div>
                          <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[var(--text-muted)] block">
                            {item.source_type === 'audio'
                              ? 'Nota de Voz'
                              : item.source_type === 'image'
                              ? 'Comprobante / Foto'
                              : 'Texto'}
                          </span>
                          <span className="text-[10px] font-mono text-[var(--text-muted)]">{formatDate(item.created_at)}</span>
                        </div>
                      </div>

                      {/* Status Badge */}
                      {isPending && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                          <Clock className="w-3 h-3" /> Pendiente
                        </span>
                      )}
                      {isProcessed && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                          <CheckCircle className="w-3 h-3" /> Procesado
                        </span>
                      )}
                      {isDiscarded && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30">
                          <XCircle className="w-3 h-3" /> Descartado
                        </span>
                      )}
                    </div>

                    {/* Main Amount & Concept */}
                    <div className="space-y-1">
                      <div className="text-xl sm:text-2xl font-semibold font-mono text-[var(--text-primary)] tracking-tight tabular-nums">
                        {formatARS(amountNumber)}
                      </div>
                      <p className="text-xs sm:text-sm font-medium text-[var(--text-secondary)] line-clamp-2">
                        {item.concept || 'Gasto no especificado'}
                      </p>
                    </div>
                  </div>

                  {/* Bottom Row: User Details + Action info */}
                  <div className="pt-3 border-t border-[var(--border-hairline)] space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <UserAvatar name={item.users?.name || 'Usuario'} size="sm" />
                        <span className="font-medium text-[var(--text-primary)]">{item.users?.name || 'Desconocido'}</span>
                      </div>
                      {item.telegram_message_id && (
                        <span className="text-[10px] text-[var(--text-muted)] font-mono">
                          msg #{item.telegram_message_id}
                        </span>
                      )}
                    </div>

                    {/* Pending Prompt CTA */}
                    {isPending && (
                      <div className="mt-2 pt-2 border-t border-[var(--border-hairline)] flex items-center justify-between gap-2">
                        <span className="text-[10px] font-mono text-[var(--text-muted)]">
                          Botones 50/100/-100/0 en Telegram
                        </span>
                        <a
                          href="https://t.me/AgykeBot"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2 py-0.5 rounded border border-[var(--border-hairline)] bg-[var(--surface-subtle)] hover:bg-[var(--surface)] text-[var(--text-primary)] text-[10px] font-mono font-medium inline-flex items-center gap-1 transition-colors"
                        >
                          <Send className="w-2.5 h-2.5" />
                          <span>Chat</span>
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
