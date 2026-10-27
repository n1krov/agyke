import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { validateAndSanitizeAlias, getUserDisplayName } from '@/lib/user-display';
import type { User } from '@/types/database';

const supabaseUrl =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  '';

const supabase = createClient(supabaseUrl, supabaseKey);

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = (await request.json()) as { alias?: unknown };

    const validation = validateAndSanitizeAlias(body.alias);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error || 'Alias inválido' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('users')
      .update({ alias: validation.value ?? null })
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    const updatedUser = data as User;
    return NextResponse.json({
      user: {
        ...updatedUser,
        display_name: getUserDisplayName(updatedUser),
      },
    });
  } catch (err: unknown) {
    console.error('[API Users PATCH Error]:', err);
    const message =
      err instanceof Error
        ? err.message
        : 'Error al actualizar el alias del usuario';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
