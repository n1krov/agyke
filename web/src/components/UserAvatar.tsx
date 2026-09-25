import React from 'react';

interface UserAvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const COLOR_PALETTES = [
  { bg: 'bg-indigo-600/30', border: 'border-indigo-500/40', text: 'text-indigo-200' },
  { bg: 'bg-emerald-600/30', border: 'border-emerald-500/40', text: 'text-emerald-200' },
  { bg: 'bg-cyan-600/30', border: 'border-cyan-500/40', text: 'text-cyan-200' },
  { bg: 'bg-amber-600/30', border: 'border-amber-500/40', text: 'text-amber-200' },
  { bg: 'bg-rose-600/30', border: 'border-rose-500/40', text: 'text-rose-200' },
  { bg: 'bg-purple-600/30', border: 'border-purple-500/40', text: 'text-purple-200' },
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
  sm: 'w-7 h-7 text-xs',
  md: 'w-9 h-9 text-sm',
  lg: 'w-12 h-12 text-base font-semibold',
};

export const UserAvatar: React.FC<UserAvatarProps> = ({ name, size = 'md', className = '' }) => {
  const initials = getInitials(name);
  const color = getColor(name || 'User');
  const sizeClasses = SIZES[size] || SIZES.md;

  return (
    <div
      title={name}
      className={`inline-flex items-center justify-center rounded-full border font-medium select-none shadow-sm ${sizeClasses} ${color.bg} ${color.border} ${color.text} ${className}`}
    >
      {initials}
    </div>
  );
};
