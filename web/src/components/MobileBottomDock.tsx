'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, TrendingUp, Inbox, Send, RefreshCw } from 'lucide-react';

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
  ];

  return (
    <nav
      aria-label="Navegación móvil inferior"
      className="fixed bottom-3 inset-x-3 sm:hidden z-40 pb-safe pointer-events-auto"
    >
      <div className="glass-panel bg-slate-900/95 backdrop-blur-2xl border border-white/15 shadow-2xl shadow-black/80 rounded-2xl px-2 py-1.5 flex items-center justify-between max-w-md mx-auto">
        {/* Navigation Tabs */}
        <div className="flex items-center justify-around flex-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex flex-col items-center justify-center min-h-[44px] min-w-[54px] px-2 py-1 rounded-xl transition-all active:scale-95 ${
                  item.isActive
                    ? 'text-indigo-400 font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-5 h-5 ${item.isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                  {item.badge !== null && item.badge !== undefined && (
                    <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 rounded-full text-[9px] font-bold bg-amber-400 text-slate-950 flex items-center justify-center animate-pulse shadow-sm shadow-amber-400/50">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] tracking-tight mt-0.5">{item.label}</span>
                {item.isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-0.5" />
                )}
              </Link>
            );
          })}
        </div>

        {/* Separador vertical */}
        <div className="h-6 w-px bg-white/10 mx-1" />

        {/* Action Controls: Refresh & Telegram */}
        <div className="flex items-center gap-1">
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="flex flex-col items-center justify-center min-h-[44px] min-w-[42px] px-1 text-slate-400 hover:text-white active:scale-95 transition-all disabled:opacity-40 cursor-pointer"
              title="Actualizar datos"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-indigo-400' : ''}`} />
              <span className="text-[9px] tracking-tight mt-0.5">Sync</span>
            </button>
          )}

          <a
            href="https://t.me/AgykeBot"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-3 py-2 min-h-[42px] rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-semibold text-xs shadow-md shadow-indigo-600/35 border border-indigo-400/30 active:scale-95 transition-all"
            title="Abrir Telegram Bot"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Bot</span>
          </a>
        </div>
      </div>
    </nav>
  );
};
