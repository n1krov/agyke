'use client';

import React from 'react';
import { Check, Lock } from 'lucide-react';
import {
  clamp,
  formatArsShort,
  formatDecimalEsAr,
  formatEtaText,
  formatPlural,
} from '@/shared/services/financial-plan';
import type {
  FinancialPlanResult,
  HitoId,
  HitoState,
} from '@/shared/types/financial-plan';

interface PlanMilestonesProps {
  plan: FinancialPlanResult;
}

const STATE_LABELS: Record<HitoState, string> = {
  done: 'Completado',
  active: 'En curso',
  locked: 'Bloqueado',
};

export const PlanMilestones: React.FC<PlanMilestonesProps> = ({ plan }) => {
  const { inputs, hitos } = plan;
  const baseWord = inputs.base === 'gastos' ? 'gastos' : 'sueldo';

  const copyById: Record<
    HitoId,
    { title: string; sub: string; lockNote: string }
  > = {
    colchon: {
      title: 'Colchón inicial',
      sub: `${formatPlural(inputs.mesesColchon, 'mes', 'meses')} de ${baseWord} ahorrados`,
      lockNote: '',
    },
    fondo: {
      title: 'Fondo de emergencia completo',
      sub: `${formatPlural(inputs.mesesFondo, 'mes', 'meses')} de ${baseWord} en algo líquido`,
      lockNote: 'Se activa al completar el colchón inicial.',
    },
    libertad: {
      title: 'Libertad financiera',
      sub: `${formatPlural(inputs.mesesMeta, 'mes', 'meses')} de ${baseWord} invertidos, unos ${formatDecimalEsAr(inputs.mesesMeta / 12)} años de gasto`,
      lockNote: 'Se activa al completar el fondo de emergencia.',
    },
  };

  return (
    <div className="plan-enter plan-enter-delay-2">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xs font-mono uppercase tracking-wider font-semibold text-[var(--text-muted)]">
          Hitos del plan
        </h2>
        <span className="text-xs font-mono text-[var(--text-muted)]">
          {hitos.filter((h) => h.state === 'done').length} / {hitos.length}
        </span>
      </div>

      <ol className="space-y-0">
        {hitos.map((hito, idx) => {
          const copy = copyById[hito.id];
          const ratio = hito.target > 0 ? clamp(hito.current / hito.target, 0, 1) : 1;
          const percent = Math.round(ratio * 100);
          const isLast = idx === hitos.length - 1;
          const isDone = hito.state === 'done';
          const isActive = hito.state === 'active';
          const isLocked = hito.state === 'locked';

          const etaLabel = isDone
            ? 'Completado'
            : formatEtaText(
                hito.etaMonths,
                hito.id === 'libertad'
                  ? 'No se alcanza en 80 años'
                  : 'Sin ahorro mensual, no se completa'
              );

          return (
            <li
              key={hito.id}
              className={`relative grid grid-cols-[36px_1fr] gap-4 ${
                isLast ? 'pb-0' : 'pb-7'
              }`}
            >
              {/* Conector vertical */}
              {!isLast && (
                <span
                  aria-hidden="true"
                  className={`absolute left-[17px] top-[38px] bottom-0.5 w-0.5 rounded-full transition-colors duration-500 ${
                    isDone ? 'bg-[var(--plan-inv)]' : 'bg-[var(--border-hairline)]'
                  }`}
                />
              )}

              {/* Nodo circular */}
              <div
                className={`relative z-10 w-9 h-9 rounded-full flex items-center justify-center font-mono text-sm font-semibold border-2 transition-all duration-300 ${
                  isDone
                    ? 'border-[var(--plan-inv)] bg-[var(--plan-inv)] text-white dark:text-slate-950'
                    : isActive
                    ? 'border-[var(--plan-inv)] bg-[var(--plan-inv-soft)] text-[var(--plan-inv)] plan-node-active-pulse'
                    : 'border-[var(--border-hairline)] bg-[var(--surface)] text-[var(--text-muted)]'
                }`}
              >
                {isDone ? (
                  <Check className="w-4 h-4" strokeWidth={2.4} />
                ) : isLocked ? (
                  <Lock className="w-3.5 h-3.5" strokeWidth={1.75} />
                ) : (
                  <span>{idx + 1}</span>
                )}
              </div>

              {/* Contenido del hito */}
              <div className="min-w-0 pt-0.5">
                <div className="flex items-baseline justify-between gap-2 flex-wrap">
                  <h3
                    className={`text-base font-semibold tracking-tight transition-colors ${
                      isLocked
                        ? 'text-[var(--text-secondary)]'
                        : 'text-[var(--text-primary)]'
                    }`}
                  >
                    {copy.title}
                  </h3>
                  <span
                    className={`text-xs font-mono font-medium px-2 py-0.5 rounded-md border ${
                      isDone
                        ? 'text-[var(--color-positive)] bg-[var(--color-positive-bg)] border-[var(--color-positive-border)]'
                        : isActive
                        ? 'text-[var(--plan-inv)] bg-[var(--plan-inv-soft)] border-[var(--plan-inv-border)]'
                        : 'text-[var(--text-muted)] bg-[var(--surface-subtle)] border-[var(--border-hairline)]'
                    }`}
                  >
                    {STATE_LABELS[hito.state]}
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-0.5 mb-3">
                  {copy.sub}
                </p>

                {/* Barra de progreso */}
                <div
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={percent}
                  aria-label={copy.title}
                  className="relative h-2 rounded-full bg-[var(--surface-subtle)] border border-[var(--border-hairline)] overflow-hidden"
                >
                  <span
                    style={{ width: `${ratio * 100}%` }}
                    className={`block h-full rounded-full transition-[width] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                      isDone
                        ? 'bg-[var(--color-positive)]'
                        : isLocked
                        ? 'bg-[var(--text-muted)]/50'
                        : 'bg-[var(--plan-inv)]'
                    }`}
                  />
                  {hito.id === 'libertad' && (
                    <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
                      <span className="absolute top-0 bottom-0 left-[25%] w-[2px] bg-[var(--surface)]/90" />
                      <span className="absolute top-0 bottom-0 left-[50%] w-[2px] bg-[var(--surface)]/90" />
                      <span className="absolute top-0 bottom-0 left-[75%] w-[2px] bg-[var(--surface)]/90" />
                    </div>
                  )}
                </div>

                {/* Pie de hito: progreso monetario y ETA */}
                <div className="flex justify-between items-baseline gap-3 flex-wrap mt-2 text-xs sm:text-sm text-[var(--text-secondary)]">
                  <span className="font-mono tabular-nums">
                    <strong className="font-semibold text-[var(--text-primary)]">
                      {formatArsShort(hito.current)}
                    </strong>{' '}
                    de {formatArsShort(hito.target)}
                  </span>
                  <span className="text-xs font-mono text-[var(--text-muted)]">
                    {etaLabel}
                  </span>
                </div>

                {isLocked && copy.lockNote && (
                  <p className="mt-2 text-xs text-[var(--text-muted)]">
                    {copy.lockNote}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
};
