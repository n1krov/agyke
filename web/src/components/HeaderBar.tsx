import React from 'react';
import { RefreshCw, Scale, Send, ShieldCheck } from 'lucide-react';

interface HeaderBarProps {
  onRefresh: () => void;
  isLoading: boolean;
  lastUpdated?: Date;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({ onRefresh, isLoading, lastUpdated }) => {
  return (
    <header className="sticky top-0 z-30 w-full glass-panel border-b border-white/[0.08] backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Logo & Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center shadow-lg shadow-indigo-500/25 border border-indigo-400/30">
            <Scale className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight text-white">Agyke</span>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Fintech
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">Control de Gastos Compartidos</p>
          </div>
        </div>

        {/* Live Webhook Status & Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Webhook Status Pill */}
          <div className="hidden md:inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Webhook Activo</span>
          </div>

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="p-2 sm:px-3 sm:py-1.5 rounded-lg glass-panel-interactive border border-white/10 hover:border-indigo-500/40 text-slate-300 hover:text-white text-xs font-medium inline-flex items-center gap-2 disabled:opacity-50"
            title={lastUpdated ? `Última sincronización: ${lastUpdated.toLocaleTimeString('es-AR')}` : 'Sincronizar'}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-indigo-400' : ''}`} />
            <span className="hidden sm:inline">Actualizar</span>
          </button>

          {/* Bot Link */}
          <a
            href="https://t.me/AgykeBot"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 sm:px-3 sm:py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium inline-flex items-center gap-2 shadow-md shadow-indigo-600/30 transition-all hover:shadow-indigo-600/50"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Abrir en Telegram</span>
          </a>
        </div>
      </div>
    </header>
  );
};
