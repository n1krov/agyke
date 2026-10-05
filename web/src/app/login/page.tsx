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
  const [shake, setShake] = useState(false);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 450);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin.trim()) {
      setError('Ingresá el PIN o contraseña de acceso.');
      triggerShake();
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
        triggerShake();
        setLoading(false);
        return;
      }

      // Login exitoso: redirigir al Dashboard principal
      router.push('/');
      router.refresh();
    } catch {
      setError('Error de conexión al validar el acceso. Intentá nuevamente.');
      triggerShake();
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[#080B11] text-slate-100 relative overflow-hidden selection:bg-indigo-500/30 selection:text-white flex items-center justify-center p-4 sm:p-6">
      {/* Atmosphere: Living Ambient Background Layer */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
        <div className="absolute inset-0 bg-grid-mesh opacity-80" />
        <div className="absolute -top-32 -left-32 w-[550px] h-[550px] rounded-full bg-gradient-to-br from-indigo-600/20 to-violet-600/10 blur-[100px] animate-ambient-slow" />
        <div className="absolute -bottom-32 -right-32 w-[550px] h-[550px] rounded-full bg-gradient-to-tl from-emerald-600/15 to-cyan-500/10 blur-[110px] animate-ambient-reverse" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-indigo-500/10 blur-[90px] animate-mesh-pulse" />
      </div>

      {/* Main Glass Card with Shake Feedback */}
      <div
        className={`w-full max-w-sm sm:max-w-md glass-panel rounded-2xl p-5 sm:p-8 border shadow-2xl relative z-10 backdrop-blur-2xl transition-all duration-300 ${
          shake ? 'animate-shake border-rose-500/50 shadow-rose-500/20' : 'border-white/[0.08]'
        }`}
      >
        {/* Header with Logo & Breathing Halo */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="relative">
            <div className="absolute inset-0 rounded-2xl bg-indigo-500/35 blur-xl animate-halo-breathe pointer-events-none" />
            <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center shadow-xl shadow-indigo-500/25 border border-indigo-400/30">
              <Scale className="w-7 h-7 text-white" />
            </div>
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
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                PIN o Contraseña de Desbloqueo
              </label>
              {pin.length > 0 && (
                <span className="text-[11px] text-indigo-300 tabular-nums font-medium">
                  {pin.length} {pin.length === 1 ? 'dígito' : 'dígitos'}
                </span>
              )}
            </div>

            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                inputMode="numeric"
                pattern="[0-9]*"
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Ingresá el PIN..."
                autoFocus
                disabled={loading}
                className={`w-full pl-10 pr-10 py-3 rounded-xl bg-slate-900/80 border text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 transition-all tabular-nums ${
                  error
                    ? 'border-rose-500/60 focus:border-rose-500 focus:ring-rose-500/50'
                    : 'border-white/10 focus:border-indigo-500 focus:ring-indigo-500'
                }`}
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

            {/* Tactile Visual Digit Indicators */}
            <div className="flex items-center gap-1.5 mt-2 justify-center">
              {[0, 1, 2, 3, 4, 5].map((idx) => (
                <span
                  key={idx}
                  className={`h-1.5 rounded-full transition-all duration-200 ${
                    pin.length > idx
                      ? 'w-4 bg-indigo-400 shadow-sm shadow-indigo-400/50'
                      : 'w-1.5 bg-slate-700/60'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2 animate-fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Submit Button with Shimmer */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl shimmer-btn bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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
