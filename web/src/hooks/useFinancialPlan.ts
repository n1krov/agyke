'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  DEFAULT_PLAN_INPUTS,
  calculatePlan,
  normalizePlanInputs,
} from '@/shared/services/financial-plan';
import type {
  FinancialPlanInputs,
  FinancialPlanResult,
  PlanApiGetResponse,
  PlanApiPutResponse,
} from '@/shared/types/financial-plan';

const STORAGE_KEY = 'agyke:plan-financiero:v1';
const LEGACY_STORAGE_KEY = 'plan-financiero:v1';
const SYNC_DEBOUNCE_MS = 700;

export type PlanSyncStatus =
  | 'hydrating'
  | 'synced'
  | 'saving'
  | 'local-only';

interface StoredPlanPayload {
  config: FinancialPlanInputs;
  updatedAt: string | null;
}

function readLocalCache(): StoredPlanPayload | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<StoredPlanPayload> &
        Partial<FinancialPlanInputs>;
      if (parsed && typeof parsed === 'object' && parsed.config) {
        return {
          config: normalizePlanInputs(parsed.config),
          updatedAt:
            typeof parsed.updatedAt === 'string' ? parsed.updatedAt : null,
        };
      }
      return {
        config: normalizePlanInputs(parsed),
        updatedAt: null,
      };
    }

    const legacyRaw = window.localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacyRaw) {
      const legacyParsed = JSON.parse(legacyRaw) as Partial<FinancialPlanInputs>;
      return {
        config: normalizePlanInputs(legacyParsed),
        updatedAt: null,
      };
    }
  } catch {
    return null;
  }
  return null;
}

function writeLocalCache(config: FinancialPlanInputs, updatedAt: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    const payload: StoredPlanPayload = { config, updatedAt };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Ignore storage quota errors
  }
}

export interface UseFinancialPlanReturn {
  inputs: FinancialPlanInputs;
  plan: FinancialPlanResult;
  syncStatus: PlanSyncStatus;
  lastSyncedAt: string | null;
  isHydrated: boolean;
  updateInputs: (patch: Partial<FinancialPlanInputs>) => void;
  resetPlan: () => void;
  refreshFromCloud: () => Promise<void>;
}

export function useFinancialPlan(): UseFinancialPlanReturn {
  const [inputs, setInputs] = useState<FinancialPlanInputs>(DEFAULT_PLAN_INPUTS);
  const [syncStatus, setSyncStatus] = useState<PlanSyncStatus>('hydrating');
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState<boolean>(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const latestConfigRef = useRef<FinancialPlanInputs>(DEFAULT_PLAN_INPUTS);

  const pushToCloud = useCallback(async (config: FinancialPlanInputs) => {
    if (abortRef.current) {
      abortRef.current.abort();
    }
    const controller = new AbortController();
    abortRef.current = controller;

    setSyncStatus('saving');
    try {
      const res = await fetch('/api/plan', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config }),
        signal: controller.signal,
      });

      if (!res.ok) {
        setSyncStatus('local-only');
        return;
      }

      const data = (await res.json()) as PlanApiPutResponse;
      if (data.persisted) {
        writeLocalCache(data.config, data.updated_at);
        setLastSyncedAt(data.updated_at);
        setSyncStatus('synced');
      } else {
        setSyncStatus('local-only');
      }
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return;
      }
      setSyncStatus('local-only');
    }
  }, []);

  const scheduleCloudSync = useCallback(
    (config: FinancialPlanInputs) => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      setSyncStatus('saving');
      debounceRef.current = setTimeout(() => {
        void pushToCloud(config);
      }, SYNC_DEBOUNCE_MS);
    },
    [pushToCloud]
  );

  const refreshFromCloud = useCallback(async () => {
    setSyncStatus('hydrating');
    const local = readLocalCache();
    try {
      const res = await fetch('/api/plan', { cache: 'no-store' });
      if (!res.ok) {
        if (local) {
          latestConfigRef.current = local.config;
          setInputs(local.config);
          setLastSyncedAt(local.updatedAt);
        }
        setSyncStatus('local-only');
        return;
      }

      const server = (await res.json()) as PlanApiGetResponse;
      if (server.migration_pending) {
        if (local) {
          latestConfigRef.current = local.config;
          setInputs(local.config);
          setLastSyncedAt(local.updatedAt);
        }
        setSyncStatus('local-only');
        return;
      }

      if (server.source === 'supabase') {
        const normalized = normalizePlanInputs(server.config);
        latestConfigRef.current = normalized;
        setInputs(normalized);
        writeLocalCache(normalized, server.updated_at);
        setLastSyncedAt(server.updated_at);
        setSyncStatus('synced');
      } else if (local) {
        await pushToCloud(local.config);
      } else {
        setSyncStatus('synced');
      }
    } catch {
      setSyncStatus('local-only');
    } finally {
      setIsHydrated(true);
    }
  }, [pushToCloud]);

  useEffect(() => {
    let ignore = false;

    async function initPlan() {
      const local = readLocalCache();

      try {
        const res = await fetch('/api/plan', { cache: 'no-store' });
        if (ignore) return;

        if (!res.ok) {
          if (local) {
            latestConfigRef.current = local.config;
            setInputs(local.config);
            setLastSyncedAt(local.updatedAt);
          }
          setSyncStatus('local-only');
          return;
        }

        const server = (await res.json()) as PlanApiGetResponse;
        if (ignore) return;

        if (server.migration_pending) {
          if (local) {
            latestConfigRef.current = local.config;
            setInputs(local.config);
            setLastSyncedAt(local.updatedAt);
          }
          setSyncStatus('local-only');
          return;
        }

        if (server.source === 'supabase') {
          const localTime = local?.updatedAt ? Date.parse(local.updatedAt) : 0;
          const serverTime = server.updated_at ? Date.parse(server.updated_at) : 0;

          if (!local || serverTime >= localTime) {
            const normalized = normalizePlanInputs(server.config);
            latestConfigRef.current = normalized;
            setInputs(normalized);
            writeLocalCache(normalized, server.updated_at);
            setLastSyncedAt(server.updated_at);
            setSyncStatus('synced');
            return;
          }

          // Local tiene cambios más recientes: aplicamos local y subimos
          latestConfigRef.current = local.config;
          setInputs(local.config);
          setLastSyncedAt(local.updatedAt);
          setSyncStatus('saving');

          const putRes = await fetch('/api/plan', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ config: local.config }),
          });
          if (ignore) return;

          if (putRes.ok) {
            const putData = (await putRes.json()) as PlanApiPutResponse;
            if (ignore) return;
            if (putData.persisted) {
              writeLocalCache(putData.config, putData.updated_at);
              setLastSyncedAt(putData.updated_at);
              setSyncStatus('synced');
            } else {
              setSyncStatus('local-only');
            }
          } else {
            setSyncStatus('local-only');
          }
          return;
        }

        if (local) {
          latestConfigRef.current = local.config;
          setInputs(local.config);
          setLastSyncedAt(local.updatedAt);
          setSyncStatus('saving');

          const putRes = await fetch('/api/plan', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ config: local.config }),
          });
          if (ignore) return;

          if (putRes.ok) {
            const putData = (await putRes.json()) as PlanApiPutResponse;
            if (ignore) return;
            if (putData.persisted) {
              writeLocalCache(putData.config, putData.updated_at);
              setLastSyncedAt(putData.updated_at);
              setSyncStatus('synced');
            } else {
              setSyncStatus('local-only');
            }
          } else {
            setSyncStatus('local-only');
          }
          return;
        }

        setSyncStatus('synced');
      } catch {
        if (!ignore) {
          if (local) {
            latestConfigRef.current = local.config;
            setInputs(local.config);
            setLastSyncedAt(local.updatedAt);
          }
          setSyncStatus('local-only');
        }
      } finally {
        if (!ignore) {
          setIsHydrated(true);
        }
      }
    }

    initPlan();

    return () => {
      ignore = true;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  const plan = useMemo<FinancialPlanResult>(() => calculatePlan(inputs), [inputs]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.dispatchEvent(new CustomEvent('plan:change', { detail: plan }));
  }, [plan]);

  const updateInputs = useCallback(
    (patch: Partial<FinancialPlanInputs>) => {
      const next = normalizePlanInputs({ ...latestConfigRef.current, ...patch });
      latestConfigRef.current = next;
      setInputs(next);
      const nowIso = new Date().toISOString();
      writeLocalCache(next, nowIso);
      scheduleCloudSync(next);
    },
    [scheduleCloudSync]
  );

  const resetPlan = useCallback(() => {
    const defaults = { ...DEFAULT_PLAN_INPUTS };
    latestConfigRef.current = defaults;
    setInputs(defaults);
    const nowIso = new Date().toISOString();
    writeLocalCache(defaults, nowIso);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    void pushToCloud(defaults);
  }, [pushToCloud]);

  return {
    inputs,
    plan,
    syncStatus,
    lastSyncedAt,
    isHydrated,
    updateInputs,
    resetPlan,
    refreshFromCloud,
  };
}
