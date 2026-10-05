import React from 'react';
import { RefreshCw, Send, Lock } from 'lucide-react';

interface MobileBottomDockProps {
  onRefresh: () => void;
  isLoading: boolean;
}

export const MobileBottomDock: React.FC<MobileBottomDockProps> = ({ onRefresh, isLoading }) => {
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/login';
    } catch {
      window.location.href = '/login';
    }
  };

  return (
    <nav
      aria-label="Navegación móvil inferior"
      className="fixed bottom-4 inset-x-4 sm:hidden z-40 pb-safe pointer-events-auto"
    >
      <div className="glass-panel bg-slate-900/90 backdrop-blur-2xl border border-white/15 shadow-2xl shadow-black/60 rounded-full px-4 py-2 flex items-center justify-around max-w-sm mx-auto">
        {/* Actualizar Saldo */}
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="flex flex-col items-center justify-center min-h-[44px] min-w-[44px] px-2.5 text-slate-300 hover:text-white active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
          title="Actualizar datos"
        >
          <RefreshCw className={`w-4 h-4 mb-0.5 ${isLoading ? 'animate-spin text-indigo-400' : ''}`} />
          <span className="text-[10px] font-medium tracking-tight">Actualizar</span>
        </button>

        {/* Abrir Telegram Bot (Destacado Central) */}
        <a
          href="https://t.me/AgykeBot"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-4 py-2 min-h-[44px] rounded-full bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-semibold text-xs shadow-lg shadow-indigo-600/35 border border-indigo-400/30 active:scale-95 transition-all"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Telegram</span>
        </a>

        {/* Bloquear / Cerrar Sesión */}
        <button
          onClick={handleLogout}
          className="flex flex-col items-center justify-center min-h-[44px] min-w-[44px] px-2.5 text-slate-400 hover:text-rose-300 active:scale-95 transition-all cursor-pointer"
          title="Bloquear acceso"
        >
          <Lock className="w-4 h-4 mb-0.5" />
          <span className="text-[10px] font-medium tracking-tight">Bloquear</span>
        </button>
      </div>
    </nav>
  );
};
