import React, { useState, useMemo } from 'react';
import { Search, Filter, Receipt, ArrowUpRight, ArrowDownLeft, Minus } from 'lucide-react';
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
    <div className="glass-panel rounded-2xl border border-white/[0.08] overflow-hidden flex flex-col">
      {/* Table Header Controls */}
      <div className="p-4 sm:p-6 border-b border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Receipt className="w-5 h-5 text-indigo-400" />
            Registro de Transacciones
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {filtered.length} de {transactions.length} operaciones
          </p>
        </div>

        {/* Search Bar & Chips */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar gasto o pagador..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-60 pl-9 pr-3 py-1.5 rounded-lg bg-slate-900/60 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Classification Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {FILTERS.map((f) => {
              const active = selectedFilter === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => setSelectedFilter(f.id)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap border ${
                    active
                      ? 'bg-indigo-600 border-indigo-500 text-white shadow-sm'
                      : 'bg-slate-900/40 border-white/10 text-slate-400 hover:text-slate-200 hover:border-white/20'
                  }`}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Table View */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-white/[0.06] bg-slate-900/30 text-slate-400 uppercase tracking-wider font-semibold">
              <th className="py-3 px-4 sm:px-6">Pagador</th>
              <th className="py-3 px-4">Concepto</th>
              <th className="py-3 px-4">Fecha</th>
              <th className="py-3 px-4">Clasificación</th>
              <th className="py-3 px-4 text-right">Monto</th>
              <th className="py-3 px-4 sm:px-6 text-right">Impacto Deuda</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Filter className="w-8 h-8 text-slate-600 mb-1" />
                    <p className="text-sm font-medium text-slate-300">No se encontraron transacciones</p>
                    <p className="text-xs text-slate-500">
                      Intenta modificando los términos de búsqueda o limpiando los filtros.
                    </p>
                    {(searchTerm || selectedFilter !== 'ALL') && (
                      <button
                        onClick={() => {
                          setSearchTerm('');
                          setSelectedFilter('ALL');
                        }}
                        className="mt-2 text-xs text-indigo-400 hover:text-indigo-300 underline underline-offset-4"
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
                    className="hover:bg-white/[0.02] transition-colors group"
                  >
                    {/* Pagador */}
                    <td className="py-3.5 px-4 sm:px-6">
                      <div className="flex items-center gap-2.5">
                        <UserAvatar name={userName} size="sm" />
                        <span className="font-medium text-slate-200">{userName}</span>
                      </div>
                    </td>

                    {/* Concepto */}
                    <td className="py-3.5 px-4">
                      <span className="text-slate-100 font-medium">
                        {tx.concept || 'Gasto sin descripción'}
                      </span>
                    </td>

                    {/* Fecha */}
                    <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                      <span>{dateStr}</span>
                      <span className="text-slate-500 ml-1.5">{timeStr}</span>
                    </td>

                    {/* Clasificación Badge */}
                    <td className="py-3.5 px-4">
                      <BadgeClassification classification={tx.classification} />
                    </td>

                    {/* Monto */}
                    <td className="py-3.5 px-4 text-right font-semibold text-white tabular-nums">
                      $ {formattedAmount}
                    </td>

                    {/* Impacto en Deuda */}
                    <td className="py-3.5 px-4 sm:px-6 text-right tabular-nums font-semibold">
                      {impact > 0 && (
                        <span className="inline-flex items-center gap-1 text-emerald-400">
                          <ArrowUpRight className="w-3.5 h-3.5" />
                          +${formattedImpact}
                        </span>
                      )}
                      {impact < 0 && (
                        <span className="inline-flex items-center gap-1 text-rose-400">
                          <ArrowDownLeft className="w-3.5 h-3.5" />
                          -${formattedImpact}
                        </span>
                      )}
                      {impact === 0 && (
                        <span className="inline-flex items-center gap-1 text-slate-500 font-normal">
                          <Minus className="w-3.5 h-3.5" />
                          $0,00
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
