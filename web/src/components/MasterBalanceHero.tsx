import React from 'react';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { UserAvatar } from './UserAvatar';
import { getUserDisplayName } from '../lib/user-display';
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
  const userAName = getUserDisplayName(userA, 'Usuario A');
  const userBName = getUserDisplayName(userB, 'Usuario B');

  const isPositive = netBalance > 0;
  const isNegative = netBalance < 0;
  const isZero = netBalance === 0;

  const formattedAbs = Math.abs(netBalance).toLocaleString('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  // Estilos y badges semánticos sobrios
  let badgeClasses = 'bg-[var(--surface-subtle)] border-[var(--border-hairline)] text-[var(--text-secondary)]';
  let badgeText = 'Cuentas en Paz';
  let accentBorder = 'border-l-[var(--border-hairline)]';

  if (isPositive) {
    badgeClasses = 'bg-emerald-500/10 border-emerald-500/25 text-emerald-700 dark:text-emerald-400';
    badgeText = `${userBName} debe a ${userAName}`;
    accentBorder = 'border-l-emerald-600 dark:border-l-emerald-500';
  } else if (isNegative) {
    badgeClasses = 'bg-rose-500/10 border-rose-500/25 text-rose-700 dark:text-rose-400';
    badgeText = `${userAName} debe a ${userBName}`;
    accentBorder = 'border-l-rose-600 dark:border-l-rose-500';
  }

  return (
    <div
      className={`relative rounded-2xl hairline-card border-l-4 ${accentBorder} p-5 sm:p-8 transition-colors`}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        {/* Lado Izquierdo: Cifra y Explicación Editorial */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-[11px] font-mono uppercase tracking-widest text-[var(--text-muted)] select-none">
              Balance Neto Consolidado
            </span>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium border ${badgeClasses}`}>
              {isZero ? <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={1.75} /> : <span className="w-1.5 h-1.5 rounded-full bg-current" />}
              {badgeText}
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-4xl sm:text-6xl font-semibold tracking-tight font-mono text-[var(--text-primary)] tabular-nums">
              $ {formattedAbs}
            </span>
            <span className="text-xs sm:text-sm font-mono text-[var(--text-muted)]">ARS</span>
          </div>

          <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed max-w-xl">
            {isZero && 'Ambos usuarios están al día. No existen deudas pendientes entre las cuentas.'}
            {isPositive && (
              <>
                <strong className="text-[var(--text-primary)] font-semibold">{userBName}</strong> debe transferirle a{' '}
                <strong className="text-[var(--text-primary)] font-semibold">{userAName}</strong> la suma exacta de{' '}
                <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">${formattedAbs}</span> para saldar la diferencia acumulada.
              </>
            )}
            {isNegative && (
              <>
                <strong className="text-[var(--text-primary)] font-semibold">{userAName}</strong> debe transferirle a{' '}
                <strong className="text-[var(--text-primary)] font-semibold">{userBName}</strong> la suma exacta de{' '}
                <span className="font-mono font-semibold text-rose-600 dark:text-rose-400">${formattedAbs}</span> para saldar la diferencia acumulada.
              </>
            )}
          </p>
        </div>

        {/* Lado Derecho: Flujo Visual de Cuentas */}
        <div className="flex items-center justify-between sm:justify-start gap-3 sm:gap-5 p-3.5 sm:p-4 rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-subtle)] w-full sm:w-auto">
          {/* Usuario A */}
          <div className="flex flex-col items-center gap-1.5 text-center min-w-[70px]">
            <UserAvatar name={userAName} size="md" />
            <span className="text-xs font-medium text-[var(--text-primary)] truncate max-w-[85px]">{userAName}</span>
            <span className={`text-[11px] font-mono font-semibold tabular-nums ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : isNegative ? 'text-rose-600 dark:text-rose-400' : 'text-[var(--text-muted)]'}`}>
              {isPositive ? `+$${formattedAbs}` : isNegative ? `-$${formattedAbs}` : '$0'}
            </span>
          </div>

          {/* Flecha de Dirección Financiera */}
          <div className="flex flex-col items-center px-2">
            <span className="text-[9px] font-mono uppercase tracking-widest text-[var(--text-muted)] mb-1">
              {isZero ? 'Paridad' : 'Deuda'}
            </span>
            <div className="w-8 h-8 rounded-full border border-[var(--border-hairline)] bg-[var(--surface)] flex items-center justify-center">
              {isPositive ? (
                <ArrowRight className="w-4 h-4 text-emerald-600 dark:text-emerald-400" strokeWidth={2} />
              ) : isNegative ? (
                <ArrowRight className="w-4 h-4 text-rose-600 dark:text-rose-400 rotate-180" strokeWidth={2} />
              ) : (
                <div className="w-1.5 h-1.5 rounded-full bg-[var(--text-muted)]" />
              )}
            </div>
            <span className="text-[9px] font-mono text-[var(--text-muted)] mt-1">
              {transactionCount} txs
            </span>
          </div>

          {/* Usuario B */}
          <div className="flex flex-col items-center gap-1.5 text-center min-w-[70px]">
            <UserAvatar name={userBName} size="md" />
            <span className="text-xs font-medium text-[var(--text-primary)] truncate max-w-[85px]">{userBName}</span>
            <span className={`text-[11px] font-mono font-semibold tabular-nums ${isPositive ? 'text-rose-600 dark:text-rose-400' : isNegative ? 'text-emerald-600 dark:text-emerald-400' : 'text-[var(--text-muted)]'}`}>
              {isPositive ? `-$${formattedAbs}` : isNegative ? `+$${formattedAbs}` : '$0'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
