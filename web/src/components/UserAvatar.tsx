import React from 'react';

interface UserAvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const COLOR_PALETTES = [
  { bg: 'bg-neutral-900 text-neutral-100 dark:bg-neutral-100 dark:text-neutral-900', border: 'border-neutral-700 dark:border-neutral-300' },
  { bg: 'bg-slate-800 text-slate-100 dark:bg-slate-200 dark:text-slate-900', border: 'border-slate-700 dark:border-slate-300' },
  { bg: 'bg-zinc-800 text-zinc-100 dark:bg-zinc-200 dark:text-zinc-900', border: 'border-zinc-700 dark:border-zinc-300' },
  { bg: 'bg-stone-800 text-stone-100 dark:bg-stone-200 dark:text-stone-900', border: 'border-stone-700 dark:border-stone-300' },
];

function getInitials(name: string): string {
  if (!name) return '??';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % COLOR_PALETTES.length;
  return COLOR_PALETTES[index];
}

const SIZES = {
  sm: 'w-7 h-7 text-xs font-mono',
  md: 'w-8 h-8 text-xs font-mono font-medium',
  lg: 'w-11 h-11 text-sm font-mono font-semibold',
};

export const UserAvatar: React.FC<UserAvatarProps> = ({ name, size = 'md', className = '' }) => {
  const initials = getInitials(name);
  const color = getColor(name || 'User');
  const sizeClasses = SIZES[size] || SIZES.md;

  return (
    <div
      title={name}
      className={`inline-flex items-center justify-center rounded-lg border select-none shadow-sm transition-colors ${sizeClasses} ${color.bg} ${color.border} ${className}`}
    >
      {initials}
    </div>
  );
};
