import React, { useState, useMemo } from 'react';
import { Search, Filter, Receipt } from 'lucide-react';
import { BadgeClassification } from './BadgeClassification';
import { UserAvatar } from './UserAvatar';
import type { Transaction, ClassificationType } from '../types/database';

interface TransactionsTableProps {
  transactions: Transaction[];
  currentUserId?: string;
}

type FilterOption = 'ALL' | ClassificationType;

export const TransactionsTable: React.FC<TransactionsTableProps> = ({ transactions }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<FilterOption>('ALL');

  const filtered = useMemo(() => {
    return transactions.filter((tx) => {
      const matchesSearch =
        (tx.concept || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (tx.users?.name || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchesFilter = selectedFilter === 'ALL' || tx.classification === selectedFilter;

      return matchesSearch && matchesFilter;
    });
  }, [transactions, searchTerm, selectedFilter]);

  const FILTERS: { id: FilterOption; label: string }[] = [
    { id: 'ALL', label: 'Todos' },
    { id: '50', label: '50/50' },
    { id: '100', label: 'Favor 100%' },
    { id: '-100', label: 'Deuda Mía' },
    { id: '0', label: 'Personal' },
  ];

  return (
    <div className="rounded-2xl hairline-card overflow-hidden flex flex-col transition-colors">
      {/* Table Header Controls */}
      <div className="p-4 sm:p-6 border-b border-[var(--border-hairline)] flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[var(--surface)]">
        <div>
          <h2 className="text-sm sm:text-base font-semibold text-[var(--text-primary)] font-mono uppercase tracking-wider flex items-center gap-2">
            <Receipt className="w-4 h-4 text-[var(--text-secondary)]" strokeWidth={1.75} />
            Libro de Movimientos
          </h2>
          <p className="text-xs text-[var(--text-muted)] font-mono mt-0.5">
            {filtered.length} de {transactions.length} registros
          </p>
        </div>

        {/* Search Bar & Chips */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          {/* Search Box */}
          <div className="relative w-full sm:w-56">
            <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" strokeWidth={1.75} />
            <input
              type="text"
              placeholder="Buscar concepto o pagador..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[var(--surface-subtle)] border border-[var(--border-hairline)] text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--text-primary)] transition-colors font-mono"
            />
          </div>

          {/* Classification Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 touch-pan-x">
            {FILTERS.map((f) => {
              const active = selectedFilter === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => setSelectedFilter(f.id)}
                  className={`px-2.5 py-1 rounded-md text-xs font-mono transition-all whitespace-nowrap cursor-pointer ${
                    active
                      ? 'bg-[var(--brand-accent)] text-[var(--canvas)] font-semibold shadow-sm'
                      : 'bg-[var(--surface-subtle)] border border-[var(--border-hairline)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-hover)]'
                  }`}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Mobile Card Feed View (block sm:hidden) */}
      <div className="block sm:hidden">
        {filtered.length === 0 ? (
          <div className="py-10 px-4 text-center text-[var(--text-muted)]">
            <Filter className="w-6 h-6 text-[var(--text-muted)] mx-auto mb-2" strokeWidth={1.5} />
            <p className="text-xs font-mono font-medium text-[var(--text-primary)]">No se encontraron movimientos</p>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Modifica la búsqueda o limpia los filtros.
            </p>
            {(searchTerm || selectedFilter !== 'ALL') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedFilter('ALL');
                }}
                className="mt-3 text-xs font-mono text-[var(--text-primary)] underline underline-offset-4 cursor-pointer"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        ) : (
          <div className="p-3 space-y-2.5">
            {filtered.map((tx) => {
              const userName = tx.users?.name || 'Usuario';
              const formattedAmount = Number(tx.amount).toLocaleString('es-AR', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2,
              });

              const impact = Number(tx.debt_impact);
              const formattedImpact = Math.abs(impact).toLocaleString('es-AR', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2,
              });

              const dateObj = new Date(tx.created_at);
              const dateStr = dateObj.toLocaleDateString('es-AR', {
                day: '2-digit',
                month: 'short',
              });
              const timeStr = dateObj.toLocaleTimeString('es-AR', {
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={tx.id}
                  className="p-3.5 rounded-xl border border-[var(--border-hairline)] bg-[var(--surface)] hover:border-[var(--border-hover)] transition-all flex flex-col gap-2 shadow-xs"
                >
                  {/* Top row: Avatar + Pagador + Fecha */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <UserAvatar name={userName} size="sm" />
                      <span className="text-xs font-medium text-[var(--text-primary)]">{userName}</span>
                    </div>
                    <span className="text-[11px] font-mono text-[var(--text-muted)] tabular-nums">
                      {dateStr} · {timeStr}
                    </span>
                  </div>

                  {/* Concept */}
                  <div className="text-sm font-medium text-[var(--text-primary)] leading-snug">
                    {tx.concept || 'Gasto sin descripción'}
                  </div>

                  {/* Bottom row: Classification Badge + Monto + Impacto */}
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-[var(--border-hairline)]">
                    <BadgeClassification classification={tx.classification} />
                    <div className="text-right">
                      <span className="text-xs font-mono font-semibold text-[var(--text-primary)] tabular-nums">
                        $ {formattedAmount}
                      </span>
                      {impact > 0 && (
                        <span className="inline-flex items-center text-[11px] font-mono font-semibold text-emerald-600 dark:text-emerald-400 ml-1.5 tabular-nums">
                          (+${formattedImpact})
                        </span>
                      )}
                      {impact < 0 && (
                        <span className="inline-flex items-center text-[11px] font-mono font-semibold text-rose-600 dark:text-rose-400 ml-1.5 tabular-nums">
                          (-${formattedImpact})
                        </span>
                      )}
                      {impact === 0 && (
                        <span className="inline-flex items-center text-[11px] font-mono text-[var(--text-muted)] ml-1.5 tabular-nums">
                          ($0)
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Desktop Table View (hidden sm:block) */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-[var(--border-hairline)] bg-[var(--surface-subtle)] text-[var(--text-muted)] font-mono text-[11px] uppercase tracking-wider font-medium">
              <th className="py-3 px-5 sm:px-6">Pagador</th>
              <th className="py-3 px-4">Concepto</th>
              <th className="py-3 px-4">Fecha</th>
              <th className="py-3 px-4">Clasificación</th>
              <th className="py-3 px-4 text-right">Monto</th>
              <th className="py-3 px-5 sm:px-6 text-right">Impacto Deuda</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-hairline)]">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-[var(--text-muted)]">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Filter className="w-6 h-6 text-[var(--text-muted)] mb-1" strokeWidth={1.5} />
                    <p className="text-xs font-mono font-medium text-[var(--text-primary)]">No se encontraron transacciones</p>
                    <p className="text-xs text-[var(--text-muted)]">
                      Modifica la búsqueda o limpia los filtros.
                    </p>
                    {(searchTerm || selectedFilter !== 'ALL') && (
                      <button
                        onClick={() => {
                          setSearchTerm('');
                          setSelectedFilter('ALL');
                        }}
                        className="mt-2 text-xs font-mono text-[var(--text-primary)] underline underline-offset-4 cursor-pointer"
                      >
                        Limpiar filtros
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((tx) => {
                const userName = tx.users?.name || 'Usuario';
                const formattedAmount = Number(tx.amount).toLocaleString('es-AR', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                });

                const impact = Number(tx.debt_impact);
                const formattedImpact = Math.abs(impact).toLocaleString('es-AR', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                });

                const dateObj = new Date(tx.created_at);
                const dateStr = dateObj.toLocaleDateString('es-AR', {
                  day: '2-digit',
                  month: 'short',
                });
                const timeStr = dateObj.toLocaleTimeString('es-AR', {
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <tr
                    key={tx.id}
                    className="hover:bg-[var(--surface-subtle)]/60 transition-colors group"
                  >
                    <td className="py-3.5 px-5 sm:px-6 font-medium text-[var(--text-primary)]">
                      <div className="flex items-center gap-2.5">
                        <UserAvatar name={userName} size="sm" />
                        <span>{userName}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-[var(--text-primary)] max-w-xs truncate">
                      {tx.concept || 'Sin descripción'}
                    </td>
                    <td className="py-3.5 px-4 text-[var(--text-muted)] font-mono text-[11px] whitespace-nowrap">
                      {dateStr} · {timeStr}
                    </td>
                    <td className="py-3.5 px-4">
                      <BadgeClassification classification={tx.classification} />
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-semibold text-[var(--text-primary)] tabular-nums">
                      $ {formattedAmount}
                    </td>
                    <td className="py-3.5 px-5 sm:px-6 text-right font-mono font-semibold tabular-nums">
                      {impact > 0 && (
                        <span className="text-emerald-600 dark:text-emerald-400">
                          +${formattedImpact}
                        </span>
                      )}
                      {impact < 0 && (
                        <span className="text-rose-600 dark:text-rose-400">
                          -${formattedImpact}
                        </span>
                      )}
                      {impact === 0 && (
                        <span className="text-[var(--text-muted)] font-normal">
                          $0.00
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
