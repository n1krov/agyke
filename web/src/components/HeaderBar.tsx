'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  RefreshCw,
  Scale,
  Send,
  ShieldCheck,
  Lock,
  LayoutDashboard,
  TrendingUp,
  Inbox,
  Clock,
  ArrowRight,
} from 'lucide-react';

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
  ];

  return (
    <header className="sticky top-0 z-30 w-full glass-panel border-b border-white/[0.08] backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand + Navigation Links */}
        <div className="flex items-center gap-4 lg:gap-8">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center shadow-lg shadow-indigo-500/25 border border-indigo-400/30 group-hover:scale-105 transition-transform">
              <Scale className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight text-white">Agyke</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Fintech
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden lg:block">Control de Gastos Compartidos</p>
            </div>
          </Link>

          {/* Desktop Navigation Tabs */}
          <nav aria-label="Navegación principal" className="hidden md:flex items-center gap-1 bg-slate-900/60 p-1 rounded-xl border border-white/10 backdrop-blur-md">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all relative ${
                    link.isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{link.label}</span>
                  {link.badge !== null && link.badge !== undefined && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-400 text-slate-950 animate-pulse">
                      {link.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right: Actions, Pending Micro-pill, Webhook Status */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Micro-pill alert if pending items on non-muro screens */}
          {pendingQueueCount > 0 && pathname !== '/muro' && (
            <Link
              href="/muro"
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] sm:text-xs font-semibold hover:bg-amber-500/25 transition-all animate-pulse"
              title="Hay comprobantes o audios pendientes de clasificar en el Muro"
            >
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">{pendingQueueCount} en Muro</span>
              <span className="sm:hidden">{pendingQueueCount}</span>
              <ArrowRight className="w-3 h-3 hidden sm:inline" />
            </Link>
          )}

          {/* Webhook Status Pill with Double Radar Ring (UI-19 & UI-28) */}
          <div className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] sm:text-xs font-medium">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Webhook Activo</span>
            <span className="sm:hidden">Online</span>
          </div>

          {/* Desktop Refresh Button */}
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="hidden sm:inline-flex px-3 py-1.5 rounded-lg glass-panel-interactive border border-white/10 hover:border-indigo-500/40 text-slate-300 hover:text-white text-xs font-medium items-center gap-2 disabled:opacity-50 cursor-pointer"
              title={lastUpdated ? `Última sincronización: ${lastUpdated.toLocaleTimeString('es-AR')}` : 'Sincronizar'}
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-indigo-400' : ''}`} />
              <span>Actualizar</span>
            </button>
          )}

          {/* Desktop Telegram Bot Link */}
          <a
            href="https://t.me/AgykeBot"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold items-center gap-2 shadow-md shadow-indigo-600/30 transition-all hover:shadow-indigo-600/50 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Telegram</span>
          </a>

          {/* Desktop Lock / Logout Button */}
          <button
            onClick={handleLogout}
            className="hidden sm:inline-flex px-3 py-1.5 rounded-lg glass-panel-interactive border border-white/10 hover:border-rose-500/40 text-slate-400 hover:text-rose-300 text-xs font-medium items-center gap-1.5 cursor-pointer"
            title="Bloquear acceso / Cerrar sesión"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Bloquear</span>
          </button>
        </div>
      </div>
    </header>
  );
};
