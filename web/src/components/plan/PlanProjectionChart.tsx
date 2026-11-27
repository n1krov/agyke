'use client';

import React, { useId, useMemo, useRef, useState } from 'react';
import { CheckCircle2, TrendingUp } from 'lucide-react';
import {
  clamp,
  formatArs,
  formatArsShort,
  formatAxisShort,
  formatEtaDate,
  formatMonthsText,
  formatPct,
  formatPlural,
} from '@/shared/services/financial-plan';
import type { FinancialPlanResult } from '@/shared/types/financial-plan';
import { useAnimatedNumber } from '@/hooks/useAnimatedNumber';

interface PlanProjectionChartProps {
  plan: FinancialPlanResult;
}

const W = 640;
const H = 270;
const PAD_L = 56;
const PAD_R = 16;
const PAD_T = 20;
const PAD_B = 30;

export const PlanProjectionChart: React.FC<PlanProjectionChartProps> = ({
  plan,
}) => {
  const gradId = useId();
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [hoveredYear, setHoveredYear] = useState<number | null>(null);

  const { proyeccion, objetivos, reparto, inputs } = plan;
  const years = proyeccion.anios;
  const pts = proyeccion.yearly;
  const meta = objetivos.meta;

  const animFinal = useAnimatedNumber(proyeccion.final);
  const animMeta = useAnimatedNumber(meta);
  const animRequired = useAnimatedNumber(proyeccion.aporteNecesario ?? 0);

  const activeYear =
    hoveredYear !== null ? clamp(hoveredYear, 0, years) : null;

  const geometry = useMemo(() => {
    const maxData = pts.length > 0 ? Math.max(...pts) : 0;
    const maxV = Math.max(meta, maxData) * 1.08 || 1;
    const x = (yr: number) => PAD_L + ((W - PAD_L - PAD_R) * yr) / Math.max(1, years);
    const y = (val: number) => PAD_T + (H - PAD_T - PAD_B) * (1 - val / maxV);

    const linePath = pts
      .map((val, idx) => `${idx === 0 ? 'M' : 'L'}${x(idx).toFixed(1)} ${y(val).toFixed(1)}`)
      .join(' ');
    const areaPath = `${linePath} L${x(years).toFixed(1)} ${H - PAD_B} L${x(0).toFixed(1)} ${H - PAD_B} Z`;

    const yTicks = [0, 1, 2, 3, 4].map((k) => {
      const value = (maxV * k) / 4;
      return {
        value,
        y: y(value),
        label: k === 0 ? '0' : formatAxisShort(value),
      };
    });

    const step = Math.max(1, Math.ceil(years / 7));
    const xTicks: Array<{ yr: number; x: number }> = [];
    for (let yr = 0; yr <= years; yr += step) {
      xTicks.push({ yr, x: x(yr) });
    }
    if (
      years % step !== 0 &&
      years - Math.floor(years / step) * step > step / 2
    ) {
      xTicks.push({ yr: years, x: x(years) });
    }

    const fondoMarkX =
      proyeccion.mesesParaFondo !== null &&
      proyeccion.mesesParaFondo > 0 &&
      proyeccion.mesesParaFondo / 12 <= years
        ? x(proyeccion.mesesParaFondo / 12)
        : null;

    return {
      maxV,
      x,
      y,
      linePath,
      areaPath,
      yTicks,
      xTicks,
      metaY: meta > 0 ? y(meta) : null,
      fondoMarkX,
    };
  }, [pts, meta, years, proyeccion.mesesParaFondo]);

  const handlePointer = (evt: React.PointerEvent<SVGSVGElement>) => {
    const el = svgRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0) return;
    const px = ((evt.clientX - rect.left) / rect.width) * W;
    const yr = clamp(
      Math.round(((px - PAD_L) / (W - PAD_L - PAD_R)) * years),
      0,
      years
    );
    setHoveredYear(yr);
  };

  const sharePct = meta > 0 ? (proyeccion.final / meta) * 100 : 100;
  const activeValue = activeYear !== null ? (pts[activeYear] ?? 0) : null;
  const activeShareText =
    activeValue !== null && meta > 0
      ? ` · ${formatPct((activeValue / meta) * 100)} de la meta`
      : '';

  const required = proyeccion.aporteNecesario;
  const onTrack = required !== null && reparto.aporte >= required - 1;

  return (
    <div className="pt-8 mt-8 border-t border-[var(--border-hairline)] plan-enter plan-enter-delay-3">
      <div className="flex items-center justify-between gap-2 mb-3">
        <h2 className="text-xs font-mono uppercase tracking-wider font-semibold text-[var(--text-muted)]">
          Proyección a largo plazo
        </h2>
        <span className="text-[11px] font-mono text-[var(--text-muted)]">
          Pesos reales de hoy
        </span>
      </div>

      {/* Headline dinámico */}
      <p className="text-lg sm:text-2xl font-normal leading-snug tracking-tight text-[var(--text-primary)] max-w-[38ch] mb-6">
        Con{' '}
        <strong className="font-mono font-semibold tabular-nums">
          {formatArs(reparto.aporte)} por mes
        </strong>
        , en {formatPlural(years, 'año', 'años')} tendrías{' '}
        <strong className="font-mono font-semibold tabular-nums text-[var(--plan-inv)]">
          {formatArsShort(animFinal)}
        </strong>
        , el <span className="font-mono tabular-nums">{formatPct(sharePct)}</span>{' '}
        de tu meta.
      </p>

      {/* Gráfico SVG interactivo a 60 FPS */}
      <div className="relative -mx-1 sm:-mx-2 select-none">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-label="Capital invertido proyectado a lo largo de los años"
          onPointerMove={handlePointer}
          onPointerDown={handlePointer}
          onPointerLeave={() => setHoveredYear(null)}
          className="block w-full h-auto touch-pan-y cursor-crosshair"
        >
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0%"
                style={{ stopColor: 'var(--plan-inv)', stopOpacity: 0.24 }}
              />
              <stop
                offset="100%"
                style={{ stopColor: 'var(--plan-inv)', stopOpacity: 0 }}
              />
            </linearGradient>
          </defs>

          {/* Grid horizontal + Y-axis ticks */}
          {geometry.yTicks.map((tick, idx) => (
            <g key={idx}>
              <line
                x1={PAD_L}
                x2={W - PAD_R}
                y1={tick.y}
                y2={tick.y}
                stroke="var(--border-hairline)"
                strokeWidth={1}
              />
              <text
                x={PAD_L - 8}
                y={tick.y + 4}
                textAnchor="end"
                fill="var(--text-muted)"
                fontSize={11}
                className="font-mono"
              >
                {tick.label}
              </text>
            </g>
          ))}

          {/* X-axis ticks */}
          {geometry.xTicks.map((tick) => (
            <text
              key={tick.yr}
              x={tick.x}
              y={H - 8}
              textAnchor="middle"
              fill="var(--text-muted)"
              fontSize={11}
              className="font-mono"
            >
              {tick.yr === 0 ? 'Hoy' : `${tick.yr}a`}
            </text>
          ))}

          {/* Línea de Meta horizontal */}
          {geometry.metaY !== null && (
            <g>
              <line
                x1={PAD_L}
                x2={W - PAD_R}
                y1={geometry.metaY}
                y2={geometry.metaY}
                stroke="var(--plan-gustos)"
                strokeWidth={1.5}
                strokeDasharray="5 5"
              />
              <text
                x={W - PAD_R}
                y={Math.max(12, geometry.metaY - 6)}
                textAnchor="end"
                fill="var(--text-secondary)"
                fontSize={11}
                className="font-mono font-medium"
              >
                Meta {formatArsShort(meta)}
              </text>
            </g>
          )}

          {/* Marcador vertical de Fondo completo */}
          {geometry.fondoMarkX !== null && (
            <g>
              <line
                x1={geometry.fondoMarkX}
                x2={geometry.fondoMarkX}
                y1={PAD_T}
                y2={H - PAD_B}
                stroke="var(--text-muted)"
                strokeWidth={1}
                strokeDasharray="2 4"
              />
              <text
                x={Math.min(W - 92, geometry.fondoMarkX + 6)}
                y={PAD_T + 12}
                fill="var(--text-secondary)"
                fontSize={11}
                className="font-mono"
              >
                Fondo completo
              </text>
            </g>
          )}

          {/* Área + Línea principal */}
          <path d={geometry.areaPath} fill={`url(#${gradId})`} />
          <path
            d={geometry.linePath}
            fill="none"
            stroke="var(--plan-inv)"
            strokeWidth={2.5}
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* Scrubber interactivo */}
          {activeYear !== null && activeValue !== null && (
            <g className="pointer-events-none">
              <line
                x1={geometry.x(activeYear)}
                x2={geometry.x(activeYear)}
                y1={PAD_T}
                y2={H - PAD_B}
                stroke="var(--text-primary)"
                strokeWidth={1}
                strokeOpacity={0.35}
              />
              <circle
                cx={geometry.x(activeYear)}
                cy={geometry.y(activeValue)}
                r={10}
                fill="var(--plan-inv)"
                fillOpacity={0.18}
              />
              <circle
                cx={geometry.x(activeYear)}
                cy={geometry.y(activeValue)}
                r={4.5}
                fill="var(--plan-inv)"
                stroke="var(--surface)"
                strokeWidth={2}
              />
            </g>
          )}
        </svg>
      </div>

      {/* Caption interactivo */}
      <p className="mt-2.5 text-xs sm:text-sm text-[var(--text-secondary)] min-h-[22px] font-mono tabular-nums">
        {activeYear !== null && activeValue !== null ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-[var(--surface-subtle)] border border-[var(--border-hairline)] text-[var(--text-primary)]">
            <strong>{activeYear === 0 ? 'Hoy' : `Año ${activeYear}`}:</strong>
            <span>{formatArsShort(activeValue)}</span>
            {activeShareText && (
              <span className="text-[var(--text-secondary)]">{activeShareText}</span>
            )}
          </span>
        ) : (
          <span className="font-sans text-[var(--text-muted)]">
            Capital invertido en pesos de hoy. Pasá el cursor o el dedo por el gráfico para inspeccionar cada año.
          </span>
        )}
      </p>

      {/* Grilla de 3 KPIs */}
      <dl className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mt-6">
        <div className="rounded-xl p-3.5 sm:p-4 border border-[var(--border-hairline)] bg-[var(--surface-subtle)]/50">
          <dt className="text-xs text-[var(--text-secondary)] mb-1">
            Meta de capital
          </dt>
          <dd className="text-lg sm:text-xl font-mono font-semibold tabular-nums text-[var(--text-primary)] tracking-tight">
            {formatArsShort(animMeta)}
          </dd>
        </div>

        <div className="rounded-xl p-3.5 sm:p-4 border border-[var(--border-hairline)] bg-[var(--surface-subtle)]/50">
          <dt className="text-xs text-[var(--text-secondary)] mb-1">
            Llegás a la meta
          </dt>
          <dd className="text-lg sm:text-xl font-mono font-semibold tabular-nums text-[var(--text-primary)] tracking-tight">
            {proyeccion.mesesParaMeta === null ? (
              'Más de 80 años'
            ) : proyeccion.mesesParaMeta === 0 ? (
              'Ya la tenés'
            ) : (
              <>
                <span>{formatMonthsText(proyeccion.mesesParaMeta)}</span>
                <small className="block text-xs font-normal text-[var(--text-muted)] mt-0.5">
                  {formatEtaDate(proyeccion.mesesParaMeta)}
                </small>
              </>
            )}
          </dd>
        </div>

        <div className="rounded-xl p-3.5 sm:p-4 border border-[var(--border-hairline)] bg-[var(--surface-subtle)]/50">
          <dt className="text-xs text-[var(--text-secondary)] mb-1">
            Aporte necesario
          </dt>
          <dd className="text-lg sm:text-xl font-mono font-semibold tabular-nums text-[var(--text-primary)] tracking-tight">
            {required === null ? (
              '—'
            ) : required === 0 ? (
              <>
                <span>Ninguno</span>
                <small className="block text-xs font-sans font-normal text-[var(--text-muted)] mt-0.5">
                  Tu capital actual ya alcanza
                </small>
              </>
            ) : (
              <>
                <span>{formatArs(animRequired)}</span>
                {inputs.sueldo > 0 && (
                  <small className="block text-xs font-normal text-[var(--text-muted)] mt-0.5">
                    {formatPct((required / inputs.sueldo) * 100)} del sueldo
                  </small>
                )}
              </>
            )}
          </dd>
        </div>
      </dl>

      {/* Veredicto */}
      {required !== null && (
        <div
          className={`mt-5 px-4 py-3.5 rounded-xl border text-xs sm:text-sm leading-relaxed flex items-start gap-2.5 transition-colors duration-300 ${
            onTrack
              ? 'bg-[var(--color-positive-bg)] border-[var(--color-positive-border)] text-[var(--text-primary)]'
              : 'bg-[var(--surface-subtle)] border-[var(--border-hairline)] text-[var(--text-secondary)]'
          }`}
        >
          {onTrack ? (
            <CheckCircle2
              className="w-4 h-4 flex-none mt-0.5 text-[var(--color-positive)]"
              strokeWidth={2}
            />
          ) : (
            <TrendingUp
              className="w-4 h-4 flex-none mt-0.5 text-[var(--text-secondary)]"
              strokeWidth={1.75}
            />
          )}
          <p>
            {onTrack ? (
              <>
                <strong className="font-semibold text-[var(--color-positive)]">
                  Vas en camino.
                </strong>{' '}
                Con tu aporte actual llegás a la meta dentro de tus{' '}
                {formatPlural(years, 'año', 'años')}.
              </>
            ) : (
              <>
                Para llegar en {formatPlural(years, 'año', 'años')} necesitás aportar{' '}
                <strong className="font-mono font-semibold tabular-nums text-[var(--text-primary)]">
                  {formatArs(required)} por mes
                </strong>
                ; hoy aportás{' '}
                <span className="font-mono tabular-nums text-[var(--text-primary)]">
                  {formatArs(reparto.aporte)}
                </span>
                . Probá subir el sobrante, el horizonte o el rendimiento esperado, y mirá cómo cambia.
              </>
            )}
          </p>
        </div>
      )}
    </div>
  );
};
