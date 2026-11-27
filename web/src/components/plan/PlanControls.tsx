'use client';

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import {
  PLAN_LIMITS,
  clamp,
  formatArs,
  formatDecimalEsAr,
  formatPct,
  formatPlural,
} from '@/shared/services/financial-plan';
import type {
  FinancialPlanInputs,
  FinancialPlanResult,
  PlanBase,
} from '@/shared/types/financial-plan';
import { MoneyInput } from './MoneyInput';

interface PlanControlsProps {
  plan: FinancialPlanResult;
  onUpdate: (patch: Partial<FinancialPlanInputs>) => void;
  sectionRef?: React.RefObject<HTMLElement | null>;
}

function sliderPercent(value: number, min: number, max: number): string {
  if (max <= min) return '0%';
  const ratio = clamp(((value - min) / (max - min)) * 100, 0, 100);
  return `${ratio}%`;
}

export const PlanControls: React.FC<PlanControlsProps> = ({
  plan,
  onUpdate,
  sectionRef,
}) => {
  const [advancedOpen, setAdvancedOpen] = useState<boolean>(false);
  const { inputs, reparto } = plan;

  const handleNumberChange = (
    key: 'mesesColchon' | 'mesesFondo' | 'mesesMeta',
    raw: string,
    min: number,
    max: number
  ) => {
    const parsed = parseInt(raw, 10);
    if (Number.isNaN(parsed)) return;
    const clamped = clamp(parsed, min, max);
    if (key === 'mesesColchon') onUpdate({ mesesColchon: clamped });
    else if (key === 'mesesFondo') onUpdate({ mesesFondo: clamped });
    else onUpdate({ mesesMeta: clamped });
  };

  return (
    <aside
      ref={sectionRef}
      aria-label="Ajustes del plan financiero"
      className="hairline-card rounded-2xl p-5 sm:p-6 lg:sticky lg:top-20 plan-enter plan-enter-delay-1"
    >
      {/* Grupo 1: Reparto */}
      <div className="pb-5">
        <h2 className="text-xs font-mono uppercase tracking-wider font-semibold text-[var(--text-muted)] mb-4">
          Reparto
        </h2>

        {/* Gustos % */}
        <div className="mb-4">
          <div className="flex justify-between items-baseline mb-1.5 text-sm">
            <label htmlFor="plan-gustosPct" className="text-[var(--text-primary)]">
              Gustos
            </label>
            <output
              htmlFor="plan-gustosPct"
              className="font-mono font-semibold tabular-nums text-[var(--text-primary)]"
            >
              {formatPct(inputs.gustosPct)}
            </output>
          </div>
          <input
            id="plan-gustosPct"
            type="range"
            min={PLAN_LIMITS.gustosPct.min}
            max={PLAN_LIMITS.gustosPct.max}
            step={1}
            value={inputs.gustosPct}
            onChange={(e) => onUpdate({ gustosPct: parseFloat(e.target.value) })}
            style={
              {
                '--p': sliderPercent(
                  inputs.gustosPct,
                  PLAN_LIMITS.gustosPct.min,
                  PLAN_LIMITS.gustosPct.max
                ),
              } as React.CSSProperties
            }
            className="plan-slider"
          />
        </div>

        {/* Inversión % */}
        <div className="mb-4">
          <div className="flex justify-between items-baseline mb-1.5 text-sm">
            <label htmlFor="plan-invPct" className="text-[var(--text-primary)]">
              Inversión
            </label>
            <output
              htmlFor="plan-invPct"
              className="font-mono font-semibold tabular-nums text-[var(--text-primary)]"
            >
              {formatPct(inputs.invPct)}
            </output>
          </div>
          <input
            id="plan-invPct"
            type="range"
            min={PLAN_LIMITS.invPct.min}
            max={PLAN_LIMITS.invPct.max}
            step={1}
            value={inputs.invPct}
            onChange={(e) => onUpdate({ invPct: parseFloat(e.target.value) })}
            style={
              {
                '--p': sliderPercent(
                  inputs.invPct,
                  PLAN_LIMITS.invPct.min,
                  PLAN_LIMITS.invPct.max
                ),
              } as React.CSSProperties
            }
            className="plan-slider"
          />
        </div>

        {/* Gastos fijos (calculado) */}
        <div className="flex justify-between items-baseline text-xs sm:text-sm py-2.5 px-3 rounded-lg bg-[var(--surface-subtle)] border border-[var(--border-hairline)] mb-4">
          <span className="text-[var(--text-secondary)]">Gastos fijos (el resto)</span>
          <strong className="font-mono font-semibold tabular-nums text-[var(--text-primary)]">
            {formatPct(reparto.fijosPct)} · {formatArs(reparto.fijos)}
          </strong>
        </div>

        {/* Sobrante % */}
        <div>
          <div className="flex justify-between items-baseline mb-1.5 text-sm">
            <label htmlFor="plan-sobrantePct" className="text-[var(--text-primary)]">
              Sobrante que también ahorrás
            </label>
            <output
              htmlFor="plan-sobrantePct"
              className="font-mono font-semibold tabular-nums text-[var(--text-primary)]"
            >
              {formatPct(inputs.sobrantePct)}
            </output>
          </div>
          <input
            id="plan-sobrantePct"
            type="range"
            min={PLAN_LIMITS.sobrantePct.min}
            max={PLAN_LIMITS.sobrantePct.max}
            step={1}
            value={inputs.sobrantePct}
            onChange={(e) => onUpdate({ sobrantePct: parseFloat(e.target.value) })}
            style={
              {
                '--p': sliderPercent(
                  inputs.sobrantePct,
                  PLAN_LIMITS.sobrantePct.min,
                  PLAN_LIMITS.sobrantePct.max
                ),
              } as React.CSSProperties
            }
            className="plan-slider"
          />
          <p className="text-xs text-[var(--text-muted)] mt-1.5 leading-relaxed">
            Lo que te queda de fijos y gustos, como % del sueldo.
          </p>
        </div>
      </div>

      {/* Grupo 2: Supuestos */}
      <div className="py-5 border-t border-[var(--border-hairline)]">
        <h2 className="text-xs font-mono uppercase tracking-wider font-semibold text-[var(--text-muted)] mb-4">
          Supuestos
        </h2>

        {/* Rendimiento real anual */}
        <div className="mb-4">
          <div className="flex justify-between items-baseline mb-1.5 text-sm">
            <label htmlFor="plan-rend" className="text-[var(--text-primary)]">
              Rendimiento real anual
            </label>
            <output
              htmlFor="plan-rend"
              className="font-mono font-semibold tabular-nums text-[var(--text-primary)]"
            >
              {formatDecimalEsAr(inputs.rend)}%
            </output>
          </div>
          <input
            id="plan-rend"
            type="range"
            min={PLAN_LIMITS.rend.min}
            max={PLAN_LIMITS.rend.max}
            step={0.5}
            value={clamp(inputs.rend, PLAN_LIMITS.rend.min, PLAN_LIMITS.rend.max)}
            onChange={(e) => onUpdate({ rend: parseFloat(e.target.value) })}
            style={
              {
                '--p': sliderPercent(
                  inputs.rend,
                  PLAN_LIMITS.rend.min,
                  PLAN_LIMITS.rend.max
                ),
              } as React.CSSProperties
            }
            className="plan-slider"
          />
          <p className="text-xs text-[var(--text-muted)] mt-1.5 leading-relaxed">
            Por encima de la inflación. Es una hipótesis, no una garantía.
          </p>
        </div>

        {/* Horizonte */}
        <div className="mb-4">
          <div className="flex justify-between items-baseline mb-1.5 text-sm">
            <label htmlFor="plan-anios" className="text-[var(--text-primary)]">
              Horizonte
            </label>
            <output
              htmlFor="plan-anios"
              className="font-mono font-semibold tabular-nums text-[var(--text-primary)]"
            >
              {formatPlural(inputs.anios, 'año', 'años')}
            </output>
          </div>
          <input
            id="plan-anios"
            type="range"
            min={PLAN_LIMITS.anios.min}
            max={PLAN_LIMITS.anios.max}
            step={1}
            value={clamp(inputs.anios, PLAN_LIMITS.anios.min, PLAN_LIMITS.anios.max)}
            onChange={(e) => onUpdate({ anios: parseFloat(e.target.value) })}
            style={
              {
                '--p': sliderPercent(
                  inputs.anios,
                  PLAN_LIMITS.anios.min,
                  PLAN_LIMITS.anios.max
                ),
              } as React.CSSProperties
            }
            className="plan-slider"
          />
        </div>

        {/* Base de cálculo */}
        <div>
          <span className="block text-sm text-[var(--text-primary)] mb-2">
            Los objetivos se calculan sobre
          </span>
          <div
            role="group"
            aria-label="Base de cálculo"
            className="inline-flex p-1 rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-subtle)] gap-1"
          >
            {(
              [
                { value: 'sueldo', label: 'Sueldo' },
                { value: 'gastos', label: 'Gastos' },
              ] as Array<{ value: PlanBase; label: string }>
            ).map((opt) => {
              const active = inputs.base === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => onUpdate({ base: opt.value })}
                  className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                    active
                      ? 'bg-[var(--surface)] text-[var(--text-primary)] shadow-sm border border-[var(--border-hairline)] font-semibold'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-transparent'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-2 leading-relaxed">
            “Gastos” es fijos más gustos: la meta baja porque necesitás menos para vivir.
          </p>
        </div>
      </div>

      {/* Grupo 3: Dónde estás hoy */}
      <div className="py-5 border-t border-[var(--border-hairline)]">
        <h2 className="text-xs font-mono uppercase tracking-wider font-semibold text-[var(--text-muted)] mb-4">
          Dónde estás hoy
        </h2>

        <div className="mb-3.5">
          <label
            htmlFor="plan-fondoActual"
            className="block text-sm text-[var(--text-primary)] mb-1.5"
          >
            Ya tengo en el fondo de emergencia
          </label>
          <div className="flex items-center gap-2 px-3 rounded-xl border border-[var(--border-hairline)] bg-[var(--surface)] focus-within:border-[var(--plan-inv)] transition-colors">
            <span className="font-mono text-sm text-[var(--text-muted)] select-none">
              $
            </span>
            <MoneyInput
              id="plan-fondoActual"
              value={inputs.fondoActual}
              onChange={(val) => onUpdate({ fondoActual: val })}
              className="flex-1 min-w-0 py-2.5 bg-transparent border-0 outline-none font-mono text-sm tabular-nums text-[var(--text-primary)]"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="plan-investActual"
            className="block text-sm text-[var(--text-primary)] mb-1.5"
          >
            Ya tengo invertido
          </label>
          <div className="flex items-center gap-2 px-3 rounded-xl border border-[var(--border-hairline)] bg-[var(--surface)] focus-within:border-[var(--plan-inv)] transition-colors">
            <span className="font-mono text-sm text-[var(--text-muted)] select-none">
              $
            </span>
            <MoneyInput
              id="plan-investActual"
              value={inputs.investActual}
              onChange={(val) => onUpdate({ investActual: val })}
              className="flex-1 min-w-0 py-2.5 bg-transparent border-0 outline-none font-mono text-sm tabular-nums text-[var(--text-primary)]"
            />
          </div>
        </div>
      </div>

      {/* Grupo 4: Ajustes avanzados (Acordeón fluido) */}
      <div className="pt-5 border-t border-[var(--border-hairline)]">
        <button
          type="button"
          aria-expanded={advancedOpen}
          onClick={() => setAdvancedOpen((prev) => !prev)}
          className="w-full flex items-center justify-between text-left text-sm font-semibold text-[var(--text-primary)] hover:text-[var(--plan-inv)] transition-colors cursor-pointer py-1"
        >
          <span>Ajustes avanzados</span>
          <ChevronDown
            className={`w-4 h-4 text-[var(--text-muted)] transition-transform duration-300 ${
              advancedOpen ? 'rotate-180' : ''
            }`}
            strokeWidth={1.75}
          />
        </button>

        <div className="plan-accordion" data-open={advancedOpen ? 'true' : 'false'}>
          <div className="plan-accordion-inner">
            <div className="pt-4 space-y-3.5">
              <div>
                <label
                  htmlFor="plan-mesesColchon"
                  className="block text-xs sm:text-sm text-[var(--text-primary)] mb-1.5"
                >
                  Colchón inicial
                </label>
                <div className="flex items-center gap-2 px-3 rounded-xl border border-[var(--border-hairline)] bg-[var(--surface)] focus-within:border-[var(--plan-inv)] transition-colors">
                  <input
                    id="plan-mesesColchon"
                    type="number"
                    min={PLAN_LIMITS.mesesColchon.min}
                    max={PLAN_LIMITS.mesesColchon.max}
                    step={1}
                    value={inputs.mesesColchon}
                    onChange={(e) =>
                      handleNumberChange(
                        'mesesColchon',
                        e.target.value,
                        PLAN_LIMITS.mesesColchon.min,
                        PLAN_LIMITS.mesesColchon.max
                      )
                    }
                    className="flex-1 min-w-0 py-2 bg-transparent border-0 outline-none font-mono text-sm tabular-nums text-[var(--text-primary)]"
                  />
                  <span className="text-xs text-[var(--text-muted)] select-none">
                    meses
                  </span>
                </div>
              </div>

              <div>
                <label
                  htmlFor="plan-mesesFondo"
                  className="block text-xs sm:text-sm text-[var(--text-primary)] mb-1.5"
                >
                  Fondo de emergencia completo
                </label>
                <div className="flex items-center gap-2 px-3 rounded-xl border border-[var(--border-hairline)] bg-[var(--surface)] focus-within:border-[var(--plan-inv)] transition-colors">
                  <input
                    id="plan-mesesFondo"
                    type="number"
                    min={PLAN_LIMITS.mesesFondo.min}
                    max={PLAN_LIMITS.mesesFondo.max}
                    step={1}
                    value={inputs.mesesFondo}
                    onChange={(e) =>
                      handleNumberChange(
                        'mesesFondo',
                        e.target.value,
                        PLAN_LIMITS.mesesFondo.min,
                        PLAN_LIMITS.mesesFondo.max
                      )
                    }
                    className="flex-1 min-w-0 py-2 bg-transparent border-0 outline-none font-mono text-sm tabular-nums text-[var(--text-primary)]"
                  />
                  <span className="text-xs text-[var(--text-muted)] select-none">
                    meses
                  </span>
                </div>
              </div>

              <div>
                <label
                  htmlFor="plan-mesesMeta"
                  className="block text-xs sm:text-sm text-[var(--text-primary)] mb-1.5"
                >
                  Meta de libertad financiera
                </label>
                <div className="flex items-center gap-2 px-3 rounded-xl border border-[var(--border-hairline)] bg-[var(--surface)] focus-within:border-[var(--plan-inv)] transition-colors">
                  <input
                    id="plan-mesesMeta"
                    type="number"
                    min={PLAN_LIMITS.mesesMeta.min}
                    max={PLAN_LIMITS.mesesMeta.max}
                    step={12}
                    value={inputs.mesesMeta}
                    onChange={(e) =>
                      handleNumberChange(
                        'mesesMeta',
                        e.target.value,
                        PLAN_LIMITS.mesesMeta.min,
                        PLAN_LIMITS.mesesMeta.max
                      )
                    }
                    className="flex-1 min-w-0 py-2 bg-transparent border-0 outline-none font-mono text-sm tabular-nums text-[var(--text-primary)]"
                  />
                  <span className="text-xs text-[var(--text-muted)] select-none">
                    meses
                  </span>
                </div>
                <p className="text-xs text-[var(--text-muted)] mt-1.5 leading-relaxed">
                  300 meses equivalen a 25 años de gasto, la regla del 4%.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
