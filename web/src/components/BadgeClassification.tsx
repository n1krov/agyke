import React from 'react';
import type { ClassificationType } from '../types/database';

interface BadgeClassificationProps {
  classification: ClassificationType;
  className?: string;
  showIcon?: boolean;
}

const CONFIG: Record<ClassificationType, { label: string; bg: string; border: string; text: string; dot: string }> = {
  '50': {
    label: '50/50 Mitad',
    bg: 'bg-indigo-500/15',
    border: 'border-indigo-500/40',
    text: 'text-indigo-300',
    dot: 'bg-indigo-400'
  },
  '100': {
    label: 'Favor 100%',
    bg: 'bg-emerald-500/15',
    border: 'border-emerald-500/40',
    text: 'text-emerald-300',
    dot: 'bg-emerald-400'
  },
  '-100': {
    label: 'Deuda Mía',
    bg: 'bg-rose-500/15',
    border: 'border-rose-500/40',
    text: 'text-rose-300',
    dot: 'bg-rose-400'
  },
  '0': {
    label: 'Personal',
    bg: 'bg-slate-500/15',
    border: 'border-slate-500/40',
    text: 'text-slate-300',
    dot: 'bg-slate-400'
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
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${item.bg} ${item.border} ${item.text} ${className}`}
    >
      {showIcon && <span className={`w-1.5 h-1.5 rounded-full ${item.dot}`} />}
      {item.label}
    </span>
  );
};
