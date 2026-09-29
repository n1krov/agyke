'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Scale, Lock, Eye, EyeOff, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [pin, setPin] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin.trim()) {
      setError('Ingresá el PIN o contraseña de acceso.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pin.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'PIN o contraseña incorrecta.');
        setLoading(false);
        return;
      }

      // Login exitoso: redirigir al Dashboard principal
      router.push('/');
      router.refresh();
    } catch {
      setError('Error de conexión al validar el acceso. Intentá nuevamente.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080B11] text-slate-100 bg-gradient-radial selection:bg-indigo-500/30 selection:text-white flex items-center justify-center p-4">
      {/* Decorative Glow Background */}
      <div className="absolute w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none -top-20 -left-20" />
      <div className="absolute w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none -bottom-20 -right-20" />

      {/* Main Glass Card */}
      <div className="w-full max-w-md glass-panel rounded-2xl p-6 sm:p-8 border border-white/[0.08] shadow-2xl relative z-10 backdrop-blur-2xl">
        {/* Header with Logo */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center shadow-xl shadow-indigo-500/25 border border-indigo-400/30">
            <Scale className="w-7 h-7 text-white" />
          </div>

          <div>
            <div className="flex items-center justify-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-white">Agyke</h1>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Privado
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Control de Gastos Compartidos
            </p>
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-6 p-3 rounded-xl bg-slate-900/40 border border-white/5 flex items-center gap-3 text-xs text-slate-300">
          <ShieldCheck className="w-5 h-5 text-indigo-400 shrink-0" />
          <span>Acceso restringido únicamente a los participantes autorizados del sistema.</span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              PIN o Contraseña de Desbloqueo
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Ingresá el PIN..."
                autoFocus
                disabled={loading}
                className="w-full pl-10 pr-10 py-3 rounded-xl bg-slate-900/80 border border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all tabular-nums"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                title={showPassword ? 'Ocultar' : 'Mostrar'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2 animate-fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Validando acceso...
              </span>
            ) : (
              <>
                <span>Desbloquear Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer Info */}
        <div className="mt-6 pt-4 border-t border-white/[0.06] text-center text-[11px] text-slate-500">
          <span>Sesión segura válida por 30 días en este dispositivo.</span>
        </div>
      </div>
    </div>
  );
}
