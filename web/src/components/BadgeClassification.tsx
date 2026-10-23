import React from 'react';
import type { ClassificationType } from '../types/database';

interface BadgeClassificationProps {
  classification: ClassificationType;
  className?: string;
  showIcon?: boolean;
}

const CONFIG: Record<ClassificationType, { label: string; bg: string; border: string; text: string; dot: string }> = {
  '50': {
    label: '50/50',
    bg: 'bg-blue-500/10 dark:bg-blue-500/15',
    border: 'border-blue-500/25 dark:border-blue-500/30',
    text: 'text-blue-700 dark:text-blue-300',
    dot: 'bg-blue-500'
  },
  '100': {
    label: 'Favor 100%',
    bg: 'bg-emerald-500/10 dark:bg-emerald-500/15',
    border: 'border-emerald-500/25 dark:border-emerald-500/30',
    text: 'text-emerald-700 dark:text-emerald-300',
    dot: 'bg-emerald-500'
  },
  '-100': {
    label: 'Deuda Mía',
    bg: 'bg-rose-500/10 dark:bg-rose-500/15',
    border: 'border-rose-500/25 dark:border-rose-500/30',
    text: 'text-rose-700 dark:text-rose-300',
    dot: 'bg-rose-500'
  },
  '0': {
    label: 'Personal',
    bg: 'bg-[var(--surface-subtle)]',
    border: 'border-[var(--border-hairline)]',
    text: 'text-[var(--text-secondary)]',
    dot: 'bg-[var(--text-muted)]'
  }
};

export const BadgeClassification: React.FC<BadgeClassificationProps> = ({
  classification,
  className = '',
  showIcon = true
}) => {
  const item = CONFIG[classification] || CONFIG['0'];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-mono font-medium border ${item.bg} ${item.border} ${item.text} ${className}`}
    >
      {showIcon && <span className={`w-1.5 h-1.5 rounded-full ${item.dot}`} />}
      {item.label}
    </span>
  );
};
