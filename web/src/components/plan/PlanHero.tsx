'use client';

import React, { useState } from 'react';
import {
  RotateCcw,
  Cloud,
  Loader2,
  HardDrive,
  ArrowRight,
  SlidersHorizontal,
} from 'lucide-react';
import {
  formatArs,
  formatPct,
} from '@/shared/services/financial-plan';
import type { FinancialPlanResult } from '@/shared/types/financial-plan';
import type { PlanSyncStatus } from '@/hooks/useFinancialPlan';
import { useAnimatedNumber } from '@/hooks/useAnimatedNumber';
import { MoneyInput } from './MoneyInput';

type PartKey = 'fijos' | 'gustos' | 'inv';

interface PlanHeroProps {
  plan: FinancialPlanResult;
  syncStatus: PlanSyncStatus;
  onSueldoChange: (sueldo: number) => void;
  onReset: () => void;
  onJumpToControls?: () => void;
}

export const PlanHero: React.FC<PlanHeroProps> = ({
  plan,
  syncStatus,
  onSueldoChange,
  onReset,
  onJumpToControls,
}) => {
  const [hoveredPart, setHoveredPart] = useState<PartKey | null>(null);
  const { reparto, destino } = plan;

  const animFijos = useAnimatedNumber(reparto.fijos);
  const animGustos = useAnimatedNumber(reparto.gustos);
  const animInv = useAnimatedNumber(reparto.inversion);
  const animAporte = useAnimatedNumber(reparto.aporte);

  const parts: Array<{
    key: PartKey;
    label: string;
    amount: number;
    pct: number;
    hint: string;
    colorVar: string;
  }> = [
    {
      key: 'fijos',
      label: 'Gastos fijos',
      amount: animFijos,
      pct: reparto.fijosPct,
      hint: 'Alquiler, servicios, comida, transporte, salud',
      colorVar: 'var(--plan-fijos)',
    },
    {
      key: 'gustos',
      label: 'Gustos',
      amount: animGustos,
      pct: reparto.gustosPct,
      hint: 'Salidas, ropa, viajes, suscripciones',
      colorVar: 'var(--plan-gustos)',
    },
    {
      key: 'inv',
      label: 'Inversión',
      amount: animInv,
      pct: reparto.invPct,
      hint: 'Largo plazo: fondos y CEDEARs',
      colorVar: 'var(--plan-inv)',
    },
  ];

  const syncMeta: Record<
    PlanSyncStatus,
    { label: string; icon: React.ReactNode; tone: string }
  > = {
    hydrating: {
      label: 'Cargando…',
      icon: <Loader2 className="w-3 h-3 animate-spin" strokeWidth={1.75} />,
      tone: 'text-[var(--text-muted)] border-[var(--border-hairline)] bg-[var(--surface-subtle)]',
    },
    saving: {
      label: 'Guardando…',
      icon: <Loader2 className="w-3 h-3 animate-spin" strokeWidth={1.75} />,
      tone: 'text-[var(--plan-inv)] border-[var(--plan-inv-border)] bg-[var(--plan-inv-soft)]',
    },
    synced: {
      label: 'Sincronizado',
      icon: <Cloud className="w-3.5 h-3.5" strokeWidth={1.75} />,
      tone: 'text-[var(--color-positive)] border-[var(--color-positive-border)] bg-[var(--color-positive-bg)]',
    },
    'local-only': {
      label: 'Guardado local',
      icon: <HardDrive className="w-3 h-3" strokeWidth={1.75} />,
      tone: 'text-[var(--text-secondary)] border-[var(--border-hairline)] bg-[var(--surface-subtle)]',
    },
  };

  const currentSync = syncMeta[syncStatus];

  return (
    <section
      aria-label="Reparto del sueldo"
      className="hairline-card rounded-2xl p-5 sm:p-8 plan-enter"
    >
      {/* Top Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-2.5">
          <span className="text-[11px] font-mono uppercase tracking-widest text-[var(--text-muted)]">
            Plan financiero
          </span>
          <span className="text-[var(--border-hover)]">·</span>
          <span
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[11px] font-mono transition-colors ${currentSync.tone}`}
            title={
              syncStatus === 'local-only'
                ? 'Guardado en este dispositivo (ejecutá la migración SQL de financial_plans para sincronizar entre dispositivos)'
                : 'Sincronizado en la nube con Supabase'
            }
          >
            {currentSync.icon}
            <span>{currentSync.label}</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          {onJumpToControls && (
            <button
              type="button"
              onClick={onJumpToControls}
              className="lg:hidden inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-subtle)] hover:border-[var(--border-hover)] text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" strokeWidth={1.75} />
              <span>Ajustar</span>
            </button>
          )}
          <button
            type="button"
            onClick={onReset}
            className="group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--surface)] hover:bg-[var(--surface-subtle)] hover:border-[var(--border-hover)] text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all cursor-pointer"
          >
            <RotateCcw
              className="w-3.5 h-3.5 transition-transform duration-300 group-hover:-rotate-90"
              strokeWidth={1.75}
            />
            <span>Restablecer</span>
          </button>
        </div>
      </div>

      {/* Monumental Salary Input */}
      <label
        htmlFor="plan-sueldo"
        className="block text-xs sm:text-sm font-medium text-[var(--text-secondary)] mb-1.5"
      >
        Sueldo neto mensual
      </label>
      <div className="flex items-baseline gap-2 sm:gap-3 border-b border-[var(--border-hairline)] pb-2.5 sm:pb-3 transition-colors focus-within:border-[var(--plan-inv)]">
        <span
          aria-hidden="true"
          className="font-mono font-light text-[var(--text-muted)] text-[clamp(1.75rem,4.5vw,3rem)] leading-none select-none"
        >
          $
        </span>
        <MoneyInput
          id="plan-sueldo"
          value={plan.inputs.sueldo}
          onChange={onSueldoChange}
          ariaDescribedBy="plan-destino"
          className="flex-1 min-w-0 bg-transparent border-0 outline-none p-0 font-mono font-light tabular-nums text-[var(--text-primary)] text-[clamp(2.35rem,7.2vw,4.75rem)] leading-none tracking-tight"
        />
      </div>

      {/* Animated 3-Segment Split Bar */}
      <div
        className="flex gap-1.5 h-4 sm:h-[18px] my-6 sm:my-7"
        aria-hidden="true"
      >
        {parts.map((part) => {
          const isActive = hoveredPart === part.key;
          const isDimmed = hoveredPart !== null && !isActive;
          return (
            <span
              key={part.key}
              onMouseEnter={() => setHoveredPart(part.key)}
              onMouseLeave={() => setHoveredPart(null)}
              style={{
                flexBasis: `${part.pct}%`,
                backgroundColor: part.colorVar,
              }}
              className={`h-full rounded-full min-w-0 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] cursor-pointer ${
                isActive ? 'scale-y-125 brightness-110' : ''
              } ${isDimmed ? 'opacity-35' : 'opacity-100'}`}
            />
          );
        })}
      </div>

      {/* 3 Part Breakdown Cards with Cross-Highlight */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-5">
        {parts.map((part) => {
          const isActive = hoveredPart === part.key;
          const isDimmed = hoveredPart !== null && !isActive;
          return (
            <div
              key={part.key}
              onMouseEnter={() => setHoveredPart(part.key)}
              onMouseLeave={() => setHoveredPart(null)}
              className={`rounded-xl p-3.5 sm:p-4 border transition-all duration-200 ${
                isActive
                  ? 'border-[var(--border-hover)] bg-[var(--surface-subtle)] -translate-y-0.5'
                  : 'border-[var(--border-hairline)] bg-[var(--surface)]'
              } ${isDimmed ? 'opacity-50' : 'opacity-100'}`}
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="inline-flex items-center gap-2 text-xs sm:text-sm text-[var(--text-secondary)] font-medium">
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-none"
                    style={{ backgroundColor: part.colorVar }}
                  />
                  {part.label}
                </span>
                <span className="text-xs font-mono font-semibold text-[var(--text-muted)] tabular-nums px-1.5 py-0.5 rounded bg-[var(--surface-subtle)] border border-[var(--border-hairline)]">
                  {formatPct(part.pct)}
                </span>
              </div>
              <div className="text-xl sm:text-2xl font-mono font-semibold tracking-tight tabular-nums text-[var(--text-primary)]">
                {formatArs(part.amount)}
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-1 leading-relaxed">
                {part.hint}
              </p>
            </div>
          );
        })}
      </div>

      {/* Contextual Savings Destination Callout */}
      <div
        id="plan-destino"
        className={`mt-6 px-4 py-3.5 rounded-xl border text-xs sm:text-sm leading-relaxed flex items-start gap-2.5 transition-colors duration-300 ${
          destino === 'inversion'
            ? 'bg-[var(--color-positive-bg)] border-[var(--color-positive-border)] text-[var(--text-primary)]'
            : 'bg-[var(--plan-inv-soft)] border-[var(--plan-inv-border)] text-[var(--text-primary)]'
        }`}
      >
        <ArrowRight
          className={`w-4 h-4 flex-none mt-0.5 ${
            destino === 'inversion'
              ? 'text-[var(--color-positive)]'
              : 'text-[var(--plan-inv)]'
          }`}
          strokeWidth={2}
        />
        <p>
          Tu ahorro de{' '}
          <strong className="font-mono font-semibold tabular-nums">
            {formatArs(animAporte)} por mes
          </strong>
          {reparto.sobrante > 0 ? (
            <span className="text-[var(--text-secondary)]">
              {' '}
              ({formatArs(reparto.inversion)} de inversión más{' '}
              {formatArs(reparto.sobrante)} de sobrante)
            </span>
          ) : null}{' '}
          {destino === 'fondo' ? (
            <>
              hoy va al <strong className="font-semibold">fondo de emergencia</strong>{' '}
              hasta completarlo, y después pasa a inversión.
            </>
          ) : (
            <>
              va a <strong className="font-semibold">inversión de largo plazo</strong>,
              porque tu fondo de emergencia ya está completo.
            </>
          )}
        </p>
      </div>
    </section>
  );
};
