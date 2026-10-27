import React from 'react';
import { X, Hash } from 'lucide-react';
import type { TagColorToken } from '../types/database';

interface TagBadgeProps {
  name: string;
  color?: TagColorToken;
  size?: 'xs' | 'sm';
  active?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  onRemove?: (e: React.MouseEvent) => void;
}

export const TAG_COLOR_STYLES: Record<
  TagColorToken,
  { badge: string; dot: string; label: string }
> = {
  slate: {
    badge:
      'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/25',
    dot: 'bg-slate-500',
    label: 'Pizarra',
  },
  indigo: {
    badge:
      'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/25',
    dot: 'bg-indigo-500',
    label: 'Índigo',
  },
  emerald: {
    badge:
      'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/25',
    dot: 'bg-emerald-500',
    label: 'Esmeralda',
  },
  amber: {
    badge:
      'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/25',
    dot: 'bg-amber-500',
    label: 'Ámbar',
  },
  rose: {
    badge:
      'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/25',
    dot: 'bg-rose-500',
    label: 'Carmesí',
  },
  cyan: {
    badge:
      'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/25',
    dot: 'bg-cyan-500',
    label: 'Cian',
  },
  violet: {
    badge:
      'bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/25',
    dot: 'bg-violet-500',
    label: 'Violeta',
  },
};

export const TagBadge: React.FC<TagBadgeProps> = ({
  name,
  color = 'slate',
  size = 'sm',
  active = false,
  onClick,
  onRemove,
}) => {
  const style = TAG_COLOR_STYLES[color] || TAG_COLOR_STYLES.slate;

  const sizeClasses =
    size === 'xs'
      ? 'px-1.5 py-0.5 text-[10px] gap-1 rounded'
      : 'px-2.5 py-1 text-xs gap-1.5 rounded-md';

  const interactiveClasses = onClick
    ? 'cursor-pointer hover:opacity-90 active:scale-95 transition-all'
    : '';

  const activeRing = active
    ? 'ring-1 ring-[var(--text-primary)] font-semibold'
    : 'font-medium';

  return (
    <span
      onClick={onClick}
      className={`inline-flex items-center font-mono border select-none ${style.badge} ${sizeClasses} ${interactiveClasses} ${activeRing}`}
    >
      <Hash
        className={size === 'xs' ? 'w-2.5 h-2.5 opacity-70' : 'w-3 h-3 opacity-70'}
        strokeWidth={2}
      />
      <span className="truncate max-w-[140px]">{name}</span>
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(e);
          }}
          className="ml-0.5 p-0.5 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors cursor-pointer"
          title={`Quitar etiqueta ${name}`}
        >
          <X className={size === 'xs' ? 'w-2.5 h-2.5' : 'w-3 h-3'} strokeWidth={2} />
        </button>
      )}
    </span>
  );
};
