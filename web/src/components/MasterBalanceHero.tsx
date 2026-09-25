import React from 'react';
import { ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { UserAvatar } from './UserAvatar';
import type { User } from '../types/database';

interface MasterBalanceHeroProps {
  netBalance: number;
  users: User[];
  transactionCount: number;
}

export const MasterBalanceHero: React.FC<MasterBalanceHeroProps> = ({
  netBalance,
  users,
  transactionCount,
}) => {
  const userA = users[0] || { name: 'Usuario A', id: '1' };
  const userB = users[1] || { name: 'Usuario B', id: '2' };

  const isPositive = netBalance > 0;
  const isNegative = netBalance < 0;
  const isZero = netBalance === 0;

  const formattedAbs = Math.abs(netBalance).toLocaleString('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  // Estilos condicionales según el estado
  let statusGlow = 'bg-hero-glow-cyan border-cyan-500/30';
  let badgeColor = 'bg-cyan-500/15 border-cyan-500/30 text-cyan-300';
  let badgeText = 'Cuentas en Paz';

  if (isPositive) {
    statusGlow = 'bg-hero-glow-emerald border-emerald-500/30';
    badgeColor = 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300';
    badgeText = `${userB.name} debe a ${userA.name}`;
  } else if (isNegative) {
    statusGlow = 'bg-hero-glow-rose border-rose-500/30';
    badgeColor = 'bg-rose-500/15 border-rose-500/30 text-rose-300';
    badgeText = `${userA.name} debe a ${userB.name}`;
  }

  return (
    <div
      className={`relative overflow-hidden rounded-2xl glass-panel border p-6 sm:p-8 transition-all ${statusGlow}`}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        {/* Lado Izquierdo: Cifra y Explicación */}
        <div className="space-y-3">
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Balance Neto Consolidado
            </span>
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${badgeColor}`}>
              {isZero ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
              {badgeText}
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white tabular-nums">
              $ {formattedAbs}
            </span>
            <span className="text-sm font-medium text-slate-400">ARS</span>
          </div>

          <p className="text-sm text-slate-300">
            {isZero && '⚖️ Ambos usuarios están al día. No existen deudas pendientes entre las cuentas.'}
            {isPositive && (
              <>
                <strong className="text-emerald-400 font-semibold">{userB.name}</strong> le debe a{' '}
                <strong className="text-white font-semibold">{userA.name}</strong> exactamente{' '}
                <span className="text-emerald-300 font-medium tabular-nums">${formattedAbs}</span>.
              </>
            )}
            {isNegative && (
              <>
                <strong className="text-rose-400 font-semibold">{userA.name}</strong> le debe a{' '}
                <strong className="text-white font-semibold">{userB.name}</strong> exactamente{' '}
                <span className="text-rose-300 font-medium tabular-nums">${formattedAbs}</span>.
              </>
            )}
          </p>
        </div>

        {/* Lado Derecho: Flujo Visual de Cuentas */}
        <div className="flex items-center justify-center sm:justify-start gap-4 p-4 rounded-xl bg-slate-900/50 border border-white/5">
          {/* Acreedor / Deudor Usuario A */}
          <div className="flex flex-col items-center gap-1.5 text-center min-w-[70px]">
            <UserAvatar name={userA.name} size="md" />
            <span className="text-xs font-medium text-slate-200 truncate max-w-[85px]">{userA.name}</span>
            <span className={`text-[10px] font-semibold tabular-nums ${isPositive ? 'text-emerald-400' : isNegative ? 'text-rose-400' : 'text-slate-400'}`}>
              {isPositive ? `+$${formattedAbs}` : isNegative ? `-$${formattedAbs}` : '$0'}
            </span>
          </div>

          {/* Flecha de dirección */}
          <div className="flex flex-col items-center justify-center px-2">
            <div className={`p-1.5 rounded-full ${isZero ? 'bg-cyan-500/20 text-cyan-400' : isPositive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
              <ArrowRight className={`w-4 h-4 ${isNegative ? 'rotate-180' : ''}`} />
            </div>
            <span className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider">
              {isZero ? 'Paz' : 'Deuda'}
            </span>
          </div>

          {/* Acreedor / Deudor Usuario B */}
          <div className="flex flex-col items-center gap-1.5 text-center min-w-[70px]">
            <UserAvatar name={userB.name} size="md" />
            <span className="text-xs font-medium text-slate-200 truncate max-w-[85px]">{userB.name}</span>
            <span className={`text-[10px] font-semibold tabular-nums ${isPositive ? 'text-rose-400' : isNegative ? 'text-emerald-400' : 'text-slate-400'}`}>
              {isPositive ? `-$${formattedAbs}` : isNegative ? `+$${formattedAbs}` : '$0'}
            </span>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-center justify-between text-xs text-slate-400">
        <span>Impacto acumulado de <strong className="text-slate-200">{transactionCount}</strong> transacciones</span>
        <span className="hidden sm:inline">Calculado bajo el algoritmo Agyke 50/100/-100</span>
      </div>
    </div>
  );
};
