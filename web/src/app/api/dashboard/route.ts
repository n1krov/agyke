import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Tag, Transaction } from '@/types/database';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [usersRes, txRes, queueRes, balanceRes, tagsRes, txTagsRes] = await Promise.all([
      supabase.from('users').select('*').order('created_at', { ascending: true }),
      supabase.from('transactions').select('*, users(*)').order('created_at', { ascending: false }),
      supabase.from('agyke_queue').select('*, users(*)').order('created_at', { ascending: false }),
      supabase.from('balances').select('*').maybeSingle(),
      supabase.from('tags').select('*').order('name', { ascending: true }),
      supabase.from('transaction_tags').select('transaction_id, tag_id')
    ]);

    const usersData = usersRes.data || [];
    const rawTxData = (txRes.data || []) as Transaction[];
    const tagsCatalog: Tag[] = !tagsRes.error && tagsRes.data ? (tagsRes.data as Tag[]) : [];
    const tagById = new Map<string, Tag>();
    for (const tag of tagsCatalog) {
      tagById.set(tag.id, tag);
    }

    const txTagsMap = new Map<string, Tag[]>();
    if (!txTagsRes.error && txTagsRes.data) {
      for (const rel of txTagsRes.data as { transaction_id: string; tag_id: string }[]) {
        const tagObj = tagById.get(rel.tag_id);
        if (tagObj) {
          const list = txTagsMap.get(rel.transaction_id) || [];
          list.push(tagObj);
          txTagsMap.set(rel.transaction_id, list);
        }
      }
    }

    const txData: Transaction[] = rawTxData.map((tx) => ({
      ...tx,
      tags: txTagsMap.get(tx.id) || [],
    }));

    let netBalance = balanceRes.data ? Number(balanceRes.data.net_balance) : 0;

    if (!balanceRes.data && txData.length > 0 && usersData.length >= 1) {
      const userA = usersData[0];
      const userB = usersData[1] || { id: 'user_b_placeholder', name: 'Usuario B' };
      let calc = 0;
      txData.forEach((tx: { debt_impact: number | string; user_id: string }) => {
        const impact = Number(tx.debt_impact);
        if (tx.user_id === userA.id) calc += impact;
        else if (tx.user_id === userB.id) calc -= impact;
      });
      netBalance = calc;
    }

    return NextResponse.json({
      users: usersData,
      transactions: txData,
      queueItems: queueRes.data || [],
      netBalance: netBalance,
      tags: tagsCatalog,
    });
  } catch (err: unknown) {
    console.error('[API Dashboard Error]:', err);
    const message = err instanceof Error ? err.message : 'Error desconocido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
