import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { validateAndSanitizeTagInput } from '@/lib/user-display';
import type { Tag } from '@/types/database';

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
    const body = (await request.json()) as {
      name?: unknown;
      color?: unknown;
    };

    const validation = validateAndSanitizeTagInput(body);
    if (!validation.valid || !validation.value) {
      return NextResponse.json(
        { error: validation.error || 'Datos de etiqueta inválidos' },
        { status: 400 }
      );
    }

    const { name, color } = validation.value;

    const existingRes = await supabase
      .from('tags')
      .select('id, name')
      .ilike('name', name)
      .neq('id', id);

    if (existingRes.error) throw existingRes.error;

    const duplicate = (existingRes.data || []).find(
      (t: { id: string; name: string }) =>
        t.name.toLowerCase() === name.toLowerCase()
    );
    if (duplicate) {
      return NextResponse.json(
        { error: `Ya existe otra etiqueta llamada "${duplicate.name}".` },
        { status: 409 }
      );
    }

    const { data, error } = await supabase
      .from('tags')
      .update({ name, color })
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;

    const countRes = await supabase
      .from('transaction_tags')
      .select('tag_id', { count: 'exact', head: true })
      .eq('tag_id', id);

    const updatedTag: Tag = {
      ...(data as Tag),
      usage_count: countRes.count || 0,
    };

    return NextResponse.json({ tag: updatedTag });
  } catch (err: unknown) {
    console.error('[API Tags PATCH Error]:', err);
    const message =
      err instanceof Error ? err.message : 'Error al actualizar la etiqueta';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const { error } = await supabase.from('tags').delete().eq('id', id);
    if (error) throw error;

    return NextResponse.json({ ok: true, id });
  } catch (err: unknown) {
    console.error('[API Tags DELETE Error]:', err);
    const message =
      err instanceof Error ? err.message : 'Error al eliminar la etiqueta';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
