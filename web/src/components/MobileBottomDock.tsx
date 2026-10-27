'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, TrendingUp, Inbox, SlidersHorizontal, Send, RefreshCw } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

interface MobileBottomDockProps {
  onRefresh?: () => void;
  isLoading?: boolean;
  pendingQueueCount?: number;
}

export const MobileBottomDock: React.FC<MobileBottomDockProps> = ({
  onRefresh,
  isLoading = false,
  pendingQueueCount = 0,
}) => {
  const pathname = usePathname();

  const navItems = [
    {
      href: '/',
      label: 'Inicio',
      icon: LayoutDashboard,
      isActive: pathname === '/',
    },
    {
      href: '/analytics',
      label: 'Analítica',
      icon: TrendingUp,
      isActive: pathname.startsWith('/analytics'),
    },
    {
      href: '/muro',
      label: 'Muro',
      icon: Inbox,
      isActive: pathname.startsWith('/muro'),
      badge: pendingQueueCount > 0 ? pendingQueueCount : null,
    },
    {
      href: '/settings',
      label: 'Ajustes',
      icon: SlidersHorizontal,
      isActive: pathname.startsWith('/settings'),
    },
  ];

  return (
    <nav
      aria-label="Navegación móvil inferior"
      className="fixed bottom-3 inset-x-3 sm:hidden z-40 pb-safe pointer-events-auto"
    >
      <div className="bg-[var(--surface)]/95 backdrop-blur-xl border border-[var(--border-hairline)] shadow-xl shadow-black/10 dark:shadow-black/50 rounded-2xl px-2 py-1 flex items-center justify-between max-w-md mx-auto transition-colors">
        {/* Navigation Tabs */}
        <div className="flex items-center justify-around flex-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex flex-col items-center justify-center min-h-[44px] min-w-[52px] px-2 py-1 rounded-xl transition-all active:scale-95 ${
                  item.isActive
                    ? 'text-[var(--text-primary)] font-semibold'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <div className="relative">
                  <Icon className="w-4 h-4" strokeWidth={item.isActive ? 2 : 1.5} />
                  {item.badge !== null && item.badge !== undefined && (
                    <span className="absolute -top-1.5 -right-2 min-w-[15px] h-3.5 px-1 rounded-full text-[9px] font-mono font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40 flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] tracking-tight mt-0.5">{item.label}</span>
                {item.isActive && (
                  <span className="w-1 h-1 rounded-full bg-[var(--text-primary)] mt-0.5" />
                )}
              </Link>
            );
          })}
        </div>

        {/* Separador vertical */}
        <div className="h-5 w-px bg-[var(--border-hairline)] mx-1" />

        {/* Action Controls: Theme Switcher, Refresh & Telegram */}
        <div className="flex items-center gap-0.5">
          <ThemeToggle variant="compact" />

          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="flex flex-col items-center justify-center min-h-[44px] min-w-[38px] px-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] active:scale-95 transition-all disabled:opacity-40 cursor-pointer"
              title="Actualizar datos"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[var(--text-primary)]' : ''}`} strokeWidth={1.5} />
              <span className="text-[9px] tracking-tight mt-0.5">Sync</span>
            </button>
          )}

          <a
            href="https://t.me/AgykeBot"
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center justify-center min-h-[44px] min-w-[38px] px-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] active:scale-95 transition-all"
            title="Abrir Telegram"
          >
            <Send className="w-3.5 h-3.5" strokeWidth={1.5} />
            <span className="text-[9px] tracking-tight mt-0.5">Bot</span>
          </a>
        </div>
      </div>
    </nav>
  );
};
