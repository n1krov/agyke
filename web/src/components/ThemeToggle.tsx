'use client';

import React, { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

export type Theme = 'light' | 'dark';

export function useTheme() {
  const [theme, setTheme] = useState<Theme>('dark');
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
    const isDark = document.documentElement.classList.contains('dark');
    setTheme(isDark ? 'dark' : 'light');

    const handleThemeChange = () => {
      const currentDark = document.documentElement.classList.contains('dark');
      setTheme(currentDark ? 'dark' : 'light');
    };

    window.addEventListener('agyke-theme-change', handleThemeChange);
    return () => window.removeEventListener('agyke-theme-change', handleThemeChange);
  }, []);

  const toggleTheme = () => {
    const nextTheme: Theme = theme === 'dark' ? 'light' : 'dark';
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    try {
      localStorage.setItem('agyke-theme', nextTheme);
    } catch {
      // Ignore localStorage access issues
    }
    setTheme(nextTheme);
    window.dispatchEvent(new Event('agyke-theme-change'));
  };

  return { theme, toggleTheme, mounted };
}

interface ThemeToggleProps {
  variant?: 'pill' | 'icon' | 'compact';
  className?: string;
}

export function ThemeToggle({ variant = 'pill', className = '' }: ThemeToggleProps) {
  const { theme, toggleTheme, mounted } = useTheme();

  if (!mounted) {
    // Skeleton placeholder to prevent layout shifts before client hydration
    return (
      <div
        className={`w-9 h-9 rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-subtle)] opacity-50 ${className}`}
        aria-hidden="true"
      />
    );
  }

  const isDark = theme === 'dark';

  if (variant === 'icon' || variant === 'compact') {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
        title={isDark ? 'Modo claro' : 'Modo oscuro'}
        className={`relative inline-flex items-center justify-center w-9 h-9 rounded-lg border border-[var(--border-hairline)] bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-hover)] hover:bg-[var(--surface-subtle)] transition-colors active:scale-95 ${className}`}
      >
        {isDark ? (
          <Sun className="w-4 h-4 text-amber-400 transition-transform hover:rotate-45" strokeWidth={1.75} />
        ) : (
          <Moon className="w-4 h-4 text-slate-700 transition-transform hover:-rotate-12" strokeWidth={1.75} />
        )}
      </button>
    );
  }

  // Pill variant (editorial high-contrast)
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      className={`group inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--surface)] text-xs font-mono text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-hover)] hover:bg-[var(--surface-subtle)] transition-all active:scale-[0.98] ${className}`}
    >
      <span className="relative flex items-center justify-center w-4 h-4">
        {isDark ? (
          <Sun className="w-3.5 h-3.5 text-amber-400 group-hover:rotate-45 transition-transform" strokeWidth={1.75} />
        ) : (
          <Moon className="w-3.5 h-3.5 text-slate-700 group-hover:-rotate-12 transition-transform" strokeWidth={1.75} />
        )}
      </span>
      <span className="font-medium tracking-tight">
        {isDark ? 'Oscuro' : 'Claro'}
      </span>
    </button>
  );
}
