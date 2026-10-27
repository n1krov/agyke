import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { buildUserProfileSummaries } from '@/lib/user-display';
import type { Transaction, User } from '@/types/database';

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
    const [usersRes, txRes] = await Promise.all([
      supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: true }),
      supabase
        .from('transactions')
        .select('id, user_id, amount, concept, classification, created_at')
        .order('created_at', { ascending: false }),
    ]);

    if (usersRes.error) throw usersRes.error;
    if (txRes.error) throw txRes.error;

    const users: User[] = (usersRes.data || []) as User[];
    const transactions = (txRes.data || []) as Pick<
      Transaction,
      'id' | 'user_id' | 'amount' | 'concept' | 'classification' | 'created_at'
    >[];

    const profiles = buildUserProfileSummaries(users, transactions);

    return NextResponse.json({ users: profiles });
  } catch (err: unknown) {
    console.error('[API Users GET Error]:', err);
    const message =
      err instanceof Error ? err.message : 'Error al obtener usuarios';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
