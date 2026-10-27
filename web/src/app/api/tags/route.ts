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

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [tagsRes, txTagsRes] = await Promise.all([
      supabase.from('tags').select('*').order('name', { ascending: true }),
      supabase.from('transaction_tags').select('tag_id'),
    ]);

    if (tagsRes.error) {
      // Si la tabla aún no fue migrada en Supabase, devolver lista vacía con resiliencia
      if (tagsRes.error.code === '42P01' || tagsRes.error.code === 'PGRST205') {
        return NextResponse.json({ tags: [] });
      }
      throw tagsRes.error;
    }

    const usageMap: Record<string, number> = {};
    if (!txTagsRes.error && txTagsRes.data) {
      for (const row of txTagsRes.data as { tag_id: string }[]) {
        usageMap[row.tag_id] = (usageMap[row.tag_id] || 0) + 1;
      }
    }

    const tags: Tag[] = ((tagsRes.data || []) as Tag[]).map((tag) => ({
      ...tag,
      usage_count: usageMap[tag.id] || 0,
    }));

    return NextResponse.json({ tags });
  } catch (err: unknown) {
    console.error('[API Tags GET Error]:', err);
    const message =
      err instanceof Error ? err.message : 'Error al obtener etiquetas';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
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
      .ilike('name', name);

    if (existingRes.error && existingRes.error.code !== '42P01') {
      throw existingRes.error;
    }

    const duplicate = (existingRes.data || []).find(
      (t: { id: string; name: string }) =>
        t.name.toLowerCase() === name.toLowerCase()
    );
    if (duplicate) {
      return NextResponse.json(
        { error: `Ya existe una etiqueta llamada "${duplicate.name}".` },
        { status: 409 }
      );
    }

    const { data, error } = await supabase
      .from('tags')
      .insert({ name, color })
      .select('*')
      .single();

    if (error) throw error;

    const createdTag: Tag = {
      ...(data as Tag),
      usage_count: 0,
    };

    return NextResponse.json({ tag: createdTag }, { status: 201 });
  } catch (err: unknown) {
    console.error('[API Tags POST Error]:', err);
    const message =
      err instanceof Error ? err.message : 'Error al crear la etiqueta';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
