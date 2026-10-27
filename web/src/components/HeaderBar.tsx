'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  RefreshCw,
  Send,
  Lock,
  LayoutDashboard,
  TrendingUp,
  Inbox,
  SlidersHorizontal,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

interface HeaderBarProps {
  onRefresh?: () => void;
  isLoading?: boolean;
  lastUpdated?: Date;
  pendingQueueCount?: number;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  onRefresh,
  isLoading = false,
  lastUpdated,
  pendingQueueCount = 0,
}) => {
  const pathname = usePathname();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/login';
    } catch {
      window.location.href = '/login';
    }
  };

  const navLinks = [
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
    <header className="sticky top-0 z-30 w-full border-b border-[var(--border-hairline)] bg-[var(--surface)]/90 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-15 flex items-center justify-between gap-4">
        {/* Left: Brand Monogram + Navigation Links */}
        <div className="flex items-center gap-4 lg:gap-8">
          <Link href="/" className="flex items-center gap-3 group">
            {/* Minimalist Architectural Monogram */}
            <div className="w-8 h-8 rounded-lg bg-[var(--brand-accent)] text-[var(--canvas)] flex items-center justify-center font-mono font-bold text-sm tracking-tighter transition-transform group-hover:scale-105 select-none">
              A
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-base font-semibold tracking-tight text-[var(--text-primary)]">
                  Agyke
                </span>
                <span className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded border border-[var(--border-hairline)] bg-[var(--surface-subtle)] text-[var(--text-muted)] select-none">
                  Ledger
                </span>
              </div>
            </div>
          </Link>

          {/* Desktop Navigation Tabs (Editorial High-Contrast) */}
          <nav aria-label="Navegación principal" className="hidden md:flex items-center gap-1 p-0.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-subtle)]">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    link.isActive
                      ? 'bg-[var(--surface)] text-[var(--text-primary)] shadow-sm border border-[var(--border-hairline)] font-semibold'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)]/50'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" strokeWidth={1.75} />
                  <span>{link.label}</span>
                  {link.badge !== null && link.badge !== undefined && (
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                      {link.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right: Actions, Theme Switcher, Minimal Webhook Status */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Micro-pill alert if pending items on non-muro screens */}
          {pendingQueueCount > 0 && pathname !== '/muro' && (
            <Link
              href="/muro"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/25 text-amber-700 dark:text-amber-300 text-xs font-mono font-medium hover:bg-amber-500/20 transition-all"
              title="Hay comprobantes pendientes de clasificar en el Muro"
            >
              <Clock className="w-3 h-3" strokeWidth={1.75} />
              <span className="hidden sm:inline">{pendingQueueCount} en Muro</span>
              <span className="sm:hidden">{pendingQueueCount}</span>
              <ArrowRight className="w-3 h-3 hidden sm:inline" strokeWidth={1.75} />
            </Link>
          )}

          {/* Minimalist Webhook Status Dot */}
          <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-[var(--border-hairline)] bg-[var(--surface-subtle)] text-[var(--text-secondary)] text-xs font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="text-[11px]">Webhook OK</span>
          </div>

          {/* Theme Switcher Toggle (Claro / Oscuro) */}
          <ThemeToggle variant="pill" />

          {/* Desktop Refresh Button */}
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="hidden sm:inline-flex px-2.5 py-1.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--surface)] hover:bg-[var(--surface-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-mono items-center gap-1.5 transition-colors disabled:opacity-40 cursor-pointer"
              title={lastUpdated ? `Última sincronización: ${lastUpdated.toLocaleTimeString('es-AR')}` : 'Sincronizar'}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[var(--text-primary)]' : ''}`} strokeWidth={1.75} />
              <span>Sync</span>
            </button>
          )}

          {/* Desktop Telegram Bot Link */}
          <a
            href="https://t.me/AgykeBot"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex px-2.5 py-1.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--surface)] hover:bg-[var(--surface-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-mono items-center gap-1.5 transition-colors"
          >
            <Send className="w-3 h-3" strokeWidth={1.75} />
            <span>Bot</span>
          </a>

          {/* Desktop Lock / Logout Button */}
          <button
            onClick={handleLogout}
            className="hidden sm:inline-flex p-1.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--surface)] hover:bg-rose-500/10 hover:border-rose-500/30 text-[var(--text-muted)] hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
            title="Bloquear acceso"
          >
            <Lock className="w-3.5 h-3.5" strokeWidth={1.75} />
          </button>
        </div>
      </div>
    </header>
  );
};
