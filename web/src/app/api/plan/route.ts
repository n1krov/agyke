import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  DEFAULT_PLAN_INPUTS,
  normalizePlanInputs,
  validateAndSanitizePlanInputs,
} from '@/shared/services/financial-plan';
import type {
  FinancialPlanInputs,
  PlanApiGetResponse,
  PlanApiPutResponse,
} from '@/shared/types/financial-plan';

const supabaseUrl =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  '';

const supabase = createClient(supabaseUrl, supabaseKey);

const DEFAULT_PLAN_ROW_ID = 'default';

export const dynamic = 'force-dynamic';

function isMissingTableError(code?: string): boolean {
  return code === '42P01' || code === 'PGRST205';
}

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('financial_plans')
      .select('config, updated_at')
      .eq('id', DEFAULT_PLAN_ROW_ID)
      .maybeSingle();

    if (error) {
      if (isMissingTableError(error.code)) {
        const fallback: PlanApiGetResponse = {
          config: DEFAULT_PLAN_INPUTS,
          updated_at: null,
          source: 'default',
          migration_pending: true,
        };
        return NextResponse.json(fallback);
      }
      throw error;
    }

    if (!data || !data.config) {
      const initial: PlanApiGetResponse = {
        config: DEFAULT_PLAN_INPUTS,
        updated_at: null,
        source: 'default',
      };
      return NextResponse.json(initial);
    }

    const normalized = normalizePlanInputs(
      data.config as Partial<FinancialPlanInputs>
    );
    const response: PlanApiGetResponse = {
      config: normalized,
      updated_at: typeof data.updated_at === 'string' ? data.updated_at : null,
      source: 'supabase',
    };

    return NextResponse.json(response);
  } catch (err: unknown) {
    console.error('[API Plan GET Error]:', err);
    const message =
      err instanceof Error ? err.message : 'Error al obtener el plan financiero';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as { config?: unknown };
    const candidate = body && typeof body === 'object' && 'config' in body ? body.config : body;

    const validation = validateAndSanitizePlanInputs(candidate);
    if (!validation.valid || !validation.value) {
      return NextResponse.json(
        { error: validation.error || 'Configuración de plan inválida.' },
        { status: 400 }
      );
    }

    const nowIso = new Date().toISOString();
    const { data, error } = await supabase
      .from('financial_plans')
      .upsert(
        {
          id: DEFAULT_PLAN_ROW_ID,
          config: validation.value,
          updated_at: nowIso,
        },
        { onConflict: 'id' }
      )
      .select('config, updated_at')
      .single();

    if (error) {
      if (isMissingTableError(error.code)) {
        const localFallback: PlanApiPutResponse = {
          config: validation.value,
          updated_at: nowIso,
          persisted: false,
          migration_pending: true,
        };
        return NextResponse.json(localFallback);
      }
      throw error;
    }

    const persistedConfig = normalizePlanInputs(
      (data?.config as Partial<FinancialPlanInputs>) ?? validation.value
    );
    const response: PlanApiPutResponse = {
      config: persistedConfig,
      updated_at: typeof data?.updated_at === 'string' ? data.updated_at : nowIso,
      persisted: true,
    };

    return NextResponse.json(response);
  } catch (err: unknown) {
    console.error('[API Plan PUT Error]:', err);
    const message =
      err instanceof Error ? err.message : 'Error al guardar el plan financiero';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
