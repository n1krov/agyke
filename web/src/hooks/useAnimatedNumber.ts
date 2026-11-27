'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Interpola suavemente un valor numérico con easing cúbico mediante rAF.
 * Respeta prefers-reduced-motion y evita llamadas síncronas a setState en useEffect.
 */
export function useAnimatedNumber(target: number, durationMs: number = 220): number {
  const [display, setDisplay] = useState<number>(target);
  const displayRef = useRef<number>(target);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const startVal = displayRef.current;
    if (!Number.isFinite(target)) return;

    if (Math.abs(target - startVal) < 0.01) {
      if (startVal !== target) {
        rafRef.current = requestAnimationFrame(() => {
          displayRef.current = target;
          setDisplay(target);
        });
      }
      return () => {
        if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      };
    }

    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReduced || durationMs <= 0) {
      rafRef.current = requestAnimationFrame(() => {
        displayRef.current = target;
        setDisplay(target);
      });
      return () => {
        if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      };
    }

    const startTime = performance.now();

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / durationMs);
      // Cubic ease-out
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = startVal + (target - startVal) * eased;

      displayRef.current = current;
      setDisplay(current);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        displayRef.current = target;
        setDisplay(target);
      }
    };

    rafRef.current = requestAnimationFrame(step);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [target, durationMs]);

  return display;
}
