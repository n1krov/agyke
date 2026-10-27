'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  X,
  Copy,
  Check,
  Calendar,
  Tag as TagIcon,
  Plus,
  Calculator,
  ArrowUpRight,
  User as UserIcon,
} from 'lucide-react';
import type {
  Transaction,
  Tag,
  TagColorToken,
  ClassificationType,
} from '../types/database';
import { BadgeClassification } from './BadgeClassification';
import { UserAvatar } from './UserAvatar';
import { TagBadge, TAG_COLOR_STYLES } from './TagBadge';
import { getUserDisplayName, VALID_TAG_COLORS } from '../lib/user-display';

interface TransactionDetailDrawerProps {
  transaction: Transaction | null;
  allTags: Tag[];
  onClose: () => void;
  onUpdateTransactionTags: (transactionId: string, updatedTags: Tag[]) => void;
  onTagCreated: (newTag: Tag) => void;
}

const CLASSIFICATION_EXPLANATIONS: Record<
  ClassificationType,
  { title: string; description: string; formulaLabel: string }
> = {
  '50': {
    title: 'Gasto Compartido (50/50)',
    description:
      'El gasto se divide en partes iguales entre ambos usuarios. Quien pagó acredita el 50% del monto a su favor en el balance neto.',
    formulaLabel: 'Impacto = +50% del monto pagado',
  },
  '100': {
    title: 'Favor / Adelanto Total (100%)',
    description:
      'Quien registró el gasto abonó la totalidad en nombre de la otra persona. El 100% del monto se suma a favor de quien pagó.',
    formulaLabel: 'Impacto = +100% del monto pagado',
  },
  '-100': {
    title: 'Deuda Directa Asumida (-100%)',
    description:
      'Registra un monto adeudado directamente en su totalidad a la contraparte.',
    formulaLabel: 'Impacto = -100% del monto registrado',
  },
  '0': {
    title: 'Gasto Personal / Neutro (0%)',
    description:
      'Gasto individual registrado únicamente para control estadístico y seguimiento de volumen mensual. No altera la deuda compartida.',
    formulaLabel: 'Impacto = $0,00 (Sin efecto en balance)',
  },
};

function formatRelativeTime(isoDate: string): string {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Hace instantes';
  if (diffMins < 60) return `Hace ${diffMins} min`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `Hace ${diffHours} h`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Ayer';
  if (diffDays < 30) return `Hace ${diffDays} días`;
  const diffMonths = Math.floor(diffDays / 30);
  return `Hace ${diffMonths} mes${diffMonths > 1 ? 'es' : ''}`;
}

export const TransactionDetailDrawer: React.FC<TransactionDetailDrawerProps> = ({
  transaction,
  allTags,
  onClose,
  onUpdateTransactionTags,
  onTagCreated,
}) => {
  const [copiedId, setCopiedId] = useState(false);
  const [savingTags, setSavingTags] = useState(false);
  const [tagError, setTagError] = useState<string | null>(null);

  // Estado para creación rápida de etiqueta in-situ
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState<TagColorToken>('indigo');
  const [creatingTag, setCreatingTag] = useState(false);

  useEffect(() => {
    if (!transaction) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [transaction, onClose]);

  if (!transaction) return null;

  const displayName = getUserDisplayName(transaction.users, 'Usuario');
  const hasAlias =
    Boolean(transaction.users?.alias?.trim()) &&
    transaction.users?.alias?.trim() !== transaction.users?.name;

  const assignedTags = transaction.tags || [];
  const assignedTagIds = new Set(assignedTags.map((t) => t.id));
  const unassignedTags = allTags.filter((t) => !assignedTagIds.has(t.id));

  const amountNum = Number(transaction.amount);
  const impactNum = Number(transaction.debt_impact);

  const formattedAmount = amountNum.toLocaleString('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const formattedImpact = Math.abs(impactNum).toLocaleString('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const dateObj = new Date(transaction.created_at);
  const fullDateStr = dateObj.toLocaleDateString('es-AR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  const fullTimeStr = dateObj.toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const ruleInfo =
    CLASSIFICATION_EXPLANATIONS[transaction.classification] ||
    CLASSIFICATION_EXPLANATIONS['50'];

  const handleCopyId = async () => {
    try {
      await navigator.clipboard.writeText(transaction.id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 1800);
    } catch {
      // Ignorar si clipboard no está disponible
    }
  };

  const syncTagsOnServer = async (nextTagIds: string[]) => {
    setSavingTags(true);
    setTagError(null);
    try {
      const res = await fetch(`/api/transactions/${transaction.id}/tags`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tagIds: nextTagIds }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'No se pudieron guardar las etiquetas');
      }
      onUpdateTransactionTags(transaction.id, data.tags || []);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Error al actualizar etiquetas';
      setTagError(msg);
    } finally {
      setSavingTags(false);
    }
  };

  const handleToggleTag = async (tag: Tag) => {
    if (savingTags) return;
    const exists = assignedTagIds.has(tag.id);
    const nextIds = exists
      ? assignedTags.filter((t) => t.id !== tag.id).map((t) => t.id)
      : [...assignedTags.map((t) => t.id), tag.id];
    await syncTagsOnServer(nextIds);
  };

  const handleQuickCreateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim() || creatingTag) return;
    setCreatingTag(true);
    setTagError(null);
    try {
      const res = await fetch('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newTagName.trim(),
          color: newTagColor,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'No se pudo crear la etiqueta');
      }
      const createdTag: Tag = data.tag;
      onTagCreated(createdTag);
      setNewTagName('');
      setShowQuickCreate(false);

      // Asignarla inmediatamente a este gasto
      const nextIds = [...assignedTags.map((t) => t.id), createdTag.id];
      await syncTagsOnServer(nextIds);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Error al crear etiqueta';
      setTagError(msg);
    } finally {
      setCreatingTag(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs transition-opacity"
      onClick={onClose}
    >
      {/* Panel Lateral Editorial */}
      <aside
        className="relative w-full max-w-lg bg-[var(--surface)] border-l border-[var(--border-hairline)] h-full overflow-y-auto p-5 sm:p-7 flex flex-col justify-between gap-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="space-y-6">
          {/* Encabezado Técnico: ID + Botón Cerrar */}
          <div className="flex items-center justify-between gap-3 pb-4 border-b border-[var(--border-hairline)]">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono uppercase tracking-widest text-[var(--text-muted)]">
                Detalle de Gasto
              </span>
              <button
                type="button"
                onClick={handleCopyId}
                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded border border-[var(--border-hairline)] bg-[var(--surface-subtle)] text-[11px] font-mono text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                title="Copiar UUID completo de la transacción"
              >
                <span>#{transaction.id.slice(0, 8)}</span>
                {copiedId ? (
                  <Check className="w-3 h-3 text-emerald-500" />
                ) : (
                  <Copy className="w-3 h-3 opacity-70" />
                )}
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
              title="Cerrar detalle (Esc)"
            >
              <X className="w-4 h-4" strokeWidth={1.75} />
            </button>
          </div>

          {/* Bloque Monumental: Monto y Concepto Completo */}
          <div className="p-5 rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-subtle)] space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--text-muted)]">
                Monto Total Registrado
              </span>
              <BadgeClassification classification={transaction.classification} />
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-semibold font-mono tracking-tight text-[var(--text-primary)] tabular-nums">
                $ {formattedAmount}
              </span>
              <span className="text-xs font-mono text-[var(--text-muted)]">
                ARS
              </span>
            </div>

            <div className="pt-2 border-t border-[var(--border-hairline)]">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--text-muted)] block mb-1">
                Concepto / Descripción Completa
              </span>
              <p className="text-sm sm:text-base font-medium text-[var(--text-primary)] break-words leading-relaxed">
                {transaction.concept || 'Gasto sin descripción'}
              </p>
            </div>
          </div>

          {/* Grilla de Metadatos Contables */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Pagador / Usuario */}
            <div className="p-3.5 rounded-xl border border-[var(--border-hairline)] bg-[var(--surface)] space-y-1.5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
                <UserIcon className="w-3 h-3" /> Pagado y Cargado por
              </span>
              <div className="flex items-center gap-2.5 pt-0.5">
                <UserAvatar name={displayName} size="sm" />
                <div className="min-w-0">
                  <div className="text-xs sm:text-sm font-semibold text-[var(--text-primary)] truncate">
                    {displayName}
                  </div>
                  {hasAlias && (
                    <div className="text-[11px] font-mono text-[var(--text-muted)] truncate">
                      Telegram: {transaction.users?.name}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Fecha y Hora Exacta */}
            <div className="p-3.5 rounded-xl border border-[var(--border-hairline)] bg-[var(--surface)] space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
                <Calendar className="w-3 h-3" /> Fecha y Hora Exacta
              </span>
              <div className="text-xs font-medium text-[var(--text-primary)] capitalize">
                {fullDateStr}
              </div>
              <div className="text-[11px] font-mono text-[var(--text-muted)] tabular-nums">
                {fullTimeStr} hs · {formatRelativeTime(transaction.created_at)}
              </div>
            </div>
          </div>

          {/* Desglose Matemático y Regla de Clasificación */}
          <div className="p-4 rounded-xl border border-[var(--border-hairline)] bg-[var(--surface)] space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
                <Calculator className="w-3 h-3" /> Auditoría de Impacto en Balance
              </span>
              <span className="text-[11px] font-mono text-[var(--text-muted)]">
                {ruleInfo.formulaLabel}
              </span>
            </div>

            <div className="flex items-center justify-between gap-4 pt-1">
              <div>
                <div className="text-xs font-semibold text-[var(--text-primary)]">
                  {ruleInfo.title}
                </div>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5 leading-relaxed">
                  {ruleInfo.description}
                </p>
              </div>

              <div className="text-right shrink-0">
                <span className="text-[10px] font-mono uppercase text-[var(--text-muted)] block">
                  Impacto Neto
                </span>
                {impactNum > 0 && (
                  <span className="text-sm sm:text-base font-mono font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                    +$ {formattedImpact}
                  </span>
                )}
                {impactNum < 0 && (
                  <span className="text-sm sm:text-base font-mono font-bold text-rose-600 dark:text-rose-400 tabular-nums">
                    -$ {formattedImpact}
                  </span>
                )}
                {impactNum === 0 && (
                  <span className="text-sm sm:text-base font-mono font-semibold text-[var(--text-muted)] tabular-nums">
                    $ 0,00
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Sección de Etiquetas (Tags N:M) */}
          <div className="p-4 rounded-xl border border-[var(--border-hairline)] bg-[var(--surface)] space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="text-xs font-mono uppercase tracking-wider font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                  <TagIcon className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                  Etiquetas del Gasto
                </h3>
                <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                  Añade o quita etiquetas para clasificar este movimiento
                </p>
              </div>

              {savingTags && (
                <span className="text-[11px] font-mono text-[var(--text-muted)] animate-pulse">
                  Guardando...
                </span>
              )}
            </div>

            {tagError && (
              <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs text-rose-600 dark:text-rose-400 font-mono">
                {tagError}
              </div>
            )}

            {/* Etiquetas Asignadas Actualmente */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] block">
                Asignadas a este gasto ({assignedTags.length})
              </span>
              {assignedTags.length === 0 ? (
                <p className="text-xs text-[var(--text-muted)] italic py-1">
                  Este gasto aún no tiene etiquetas asignadas.
                </p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {assignedTags.map((tag) => (
                    <TagBadge
                      key={tag.id}
                      name={tag.name}
                      color={tag.color}
                      size="sm"
                      onRemove={() => handleToggleTag(tag)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Catálogo de Etiquetas Disponibles para Agregar en 1 Clic */}
            <div className="pt-3 border-t border-[var(--border-hairline)] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)]">
                  Disponibles para agregar ({unassignedTags.length})
                </span>
                <button
                  type="button"
                  onClick={() => setShowQuickCreate((prev) => !prev)}
                  className="inline-flex items-center gap-1 text-[11px] font-mono font-medium text-[var(--text-primary)] hover:underline cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>{showQuickCreate ? 'Cancelar' : 'Nueva etiqueta'}</span>
                </button>
              </div>

              {unassignedTags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {unassignedTags.map((tag) => (
                    <TagBadge
                      key={tag.id}
                      name={tag.name}
                      color={tag.color}
                      size="sm"
                      onClick={() => handleToggleTag(tag)}
                    />
                  ))}
                </div>
              )}

              {/* Formulario Inline de Creación Rápida de Etiqueta */}
              {showQuickCreate && (
                <form
                  onSubmit={handleQuickCreateTag}
                  className="mt-2 p-3 rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-subtle)] space-y-2.5"
                >
                  <div className="text-[11px] font-mono font-semibold text-[var(--text-primary)]">
                    Crear y asignar nueva etiqueta
                  </div>
                  <input
                    type="text"
                    maxLength={28}
                    placeholder="Ej. Supermercado, Salidas, Hogar..."
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-md bg-[var(--surface)] border border-[var(--border-hairline)] text-xs font-mono text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--text-primary)]"
                  />
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      {VALID_TAG_COLORS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setNewTagColor(c)}
                          className={`w-5 h-5 rounded-full flex items-center justify-center border transition-transform cursor-pointer ${
                            newTagColor === c
                              ? 'scale-110 border-[var(--text-primary)] ring-2 ring-[var(--text-primary)]/20'
                              : 'border-transparent opacity-70 hover:opacity-100'
                          }`}
                          title={TAG_COLOR_STYLES[c].label}
                        >
                          <span
                            className={`w-3.5 h-3.5 rounded-full ${TAG_COLOR_STYLES[c].dot}`}
                          />
                        </button>
                      ))}
                    </div>

                    <button
                      type="submit"
                      disabled={creatingTag || !newTagName.trim()}
                      className="px-3 py-1 rounded-md bg-[var(--brand-accent)] text-[var(--canvas)] text-xs font-mono font-semibold disabled:opacity-40 cursor-pointer"
                    >
                      {creatingTag ? 'Creando...' : 'Crear y Asignar'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Pie del Drawer: Enlace a Configuración de Etiquetas */}
        <div className="pt-4 border-t border-[var(--border-hairline)] flex items-center justify-between text-xs font-mono text-[var(--text-muted)]">
          <span>UUID: {transaction.id}</span>
          <Link
            href="/settings?tab=tags"
            className="inline-flex items-center gap-1 text-[var(--text-primary)] hover:underline font-medium shrink-0"
          >
            <span>Gestionar etiquetas</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </aside>
    </div>
  );
};
