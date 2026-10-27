import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Tag } from '@/types/database';

const supabaseUrl =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  '';

const supabase = createClient(supabaseUrl, supabaseKey);

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: transactionId } = await context.params;
    const body = (await request.json()) as { tagIds?: unknown };

    if (!Array.isArray(body.tagIds)) {
      return NextResponse.json(
        { error: 'Se requiere un arreglo tagIds válido.' },
        { status: 400 }
      );
    }

    const uniqueTagIds = Array.from(
      new Set(
        body.tagIds.filter(
          (item): item is string =>
            typeof item === 'string' && item.trim().length > 0
        )
      )
    );

    // 1. Limpiar asociaciones previas de la transacción
    const delRes = await supabase
      .from('transaction_tags')
      .delete()
      .eq('transaction_id', transactionId);

    if (delRes.error) throw delRes.error;

    // 2. Insertar nuevas asociaciones si hay etiquetas seleccionadas
    if (uniqueTagIds.length > 0) {
      const rows = uniqueTagIds.map((tagId) => ({
        transaction_id: transactionId,
        tag_id: tagId,
      }));
      const insRes = await supabase.from('transaction_tags').insert(rows);
      if (insRes.error) throw insRes.error;
    }

    // 3. Devolver los objetos Tag asociados actualizados
    let assignedTags: Tag[] = [];
    if (uniqueTagIds.length > 0) {
      const tagsRes = await supabase
        .from('tags')
        .select('*')
        .in('id', uniqueTagIds)
        .order('name', { ascending: true });
      if (tagsRes.error) throw tagsRes.error;
      assignedTags = (tagsRes.data || []) as Tag[];
    }

    return NextResponse.json({
      transaction_id: transactionId,
      tags: assignedTags,
    });
  } catch (err: unknown) {
    console.error('[API Transaction Tags PUT Error]:', err);
    const message =
      err instanceof Error
        ? err.message
        : 'Error al actualizar las etiquetas del gasto';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
