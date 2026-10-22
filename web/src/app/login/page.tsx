'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Eye, EyeOff, ArrowRight, AlertCircle } from 'lucide-react';
import { ThemeToggle } from '../../components/ThemeToggle';

export default function LoginPage() {
  const router = useRouter();
  const [pin, setPin] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 400);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin.trim()) {
      setError('Ingresá el PIN de acceso.');
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
        setError(data.error || 'PIN incorrecto.');
        triggerShake();
        setLoading(false);
        return;
      }

      router.push('/');
      router.refresh();
    } catch {
      setError('Error de conexión al validar el acceso.');
      triggerShake();
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[var(--canvas)] text-[var(--text-primary)] relative flex flex-col items-center justify-center p-4 sm:p-6 transition-colors">
      {/* Top Bar with Theme Switcher */}
      <div className="absolute top-4 right-4">
        <ThemeToggle variant="pill" />
      </div>

      {/* Main Editorial Card with Shake Feedback */}
      <div
        className={`w-full max-w-sm hairline-card rounded-2xl p-6 sm:p-8 shadow-sm transition-all duration-200 ${
          shake ? 'animate-shake border-rose-500/60' : ''
        }`}
      >
        {/* Header with Monogram */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="w-11 h-11 rounded-xl bg-[var(--brand-accent)] text-[var(--canvas)] font-mono font-bold text-base flex items-center justify-center select-none shadow-xs">
            A
          </div>

          <div>
            <div className="flex items-center justify-center gap-2">
              <h1 className="text-xl font-bold tracking-tight font-mono text-[var(--text-primary)]">
                Agyke
              </h1>
              <span className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded border border-[var(--border-hairline)] bg-[var(--surface-subtle)] text-[var(--text-muted)]">
                Privado
              </span>
            </div>
            <p className="text-xs text-[var(--text-muted)] font-mono mt-1">
              Control de Gastos Compartidos
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[11px] font-mono uppercase tracking-wider text-[var(--text-muted)]">
                PIN de Desbloqueo
              </label>
              {pin.length > 0 && (
                <span className="text-[11px] font-mono text-[var(--text-secondary)] tabular-nums">
                  {pin.length} {pin.length === 1 ? 'dígito' : 'dígitos'}
                </span>
              )}
            </div>

            <div className="relative">
              <Lock className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" strokeWidth={1.75} />
              <input
                type={showPassword ? 'text' : 'password'}
                inputMode="numeric"
                pattern="[0-9]*"
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="••••••"
                autoFocus
                disabled={loading}
                className={`w-full pl-8 pr-8 py-2 rounded-lg bg-[var(--surface-subtle)] border text-sm font-mono text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--text-primary)] transition-colors tabular-nums ${
                  error ? 'border-rose-500/60' : 'border-[var(--border-hairline)]'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors p-1"
                title={showPassword ? 'Ocultar' : 'Mostrar'}
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" strokeWidth={1.75} /> : <Eye className="w-3.5 h-3.5" strokeWidth={1.75} />}
              </button>
            </div>

            {/* Tactile Visual Digit Indicators */}
            <div className="flex items-center gap-1.5 mt-2 justify-center">
              {[0, 1, 2, 3, 4, 5].map((idx) => (
                <span
                  key={idx}
                  className={`h-1 rounded-full transition-all duration-150 ${
                    pin.length > idx
                      ? 'w-3.5 bg-[var(--text-primary)]'
                      : 'w-1 bg-[var(--border-hairline)]'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-2.5 rounded-lg border border-rose-500/25 bg-rose-500/10 text-rose-700 dark:text-rose-400 text-xs font-mono flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" strokeWidth={1.75} />
              <span>{error}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-3 rounded-lg bg-[var(--brand-accent)] hover:opacity-90 text-[var(--canvas)] text-xs font-mono font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-40 cursor-pointer shadow-xs"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
                Validando...
              </span>
            ) : (
              <>
                <span>Desbloquear</span>
                <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.75} />
              </>
            )}
          </button>
        </form>

        {/* Footer Info */}
        <div className="mt-6 pt-3 border-t border-[var(--border-hairline)] text-center text-[11px] font-mono text-[var(--text-muted)]">
          <span>Acceso autenticado y cifrado</span>
        </div>
      </div>
    </div>
  );
}
