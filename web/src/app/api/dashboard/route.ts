import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET() {
  try {
    const [usersRes, txRes, queueRes, balanceRes] = await Promise.all([
      supabase.from('users').select('*').order('created_at', { ascending: true }),
      supabase.from('transactions').select('*, users(*)').order('created_at', { ascending: false }),
      supabase.from('agyke_queue').select('*, users(*)').order('created_at', { ascending: false }),
      supabase.from('balances').select('*').maybeSingle()
    ]);

    const usersData = usersRes.data || [];
    const txData = txRes.data || [];
    let netBalance = balanceRes.data ? Number(balanceRes.data.net_balance) : 0;

    if (!balanceRes.data && txData.length > 0 && usersData.length >= 1) {
      const userA = usersData[0];
      const userB = usersData[1] || { id: 'user_b_placeholder', name: 'Usuario B' };
      let calc = 0;
      txData.forEach((tx: any) => {
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
      netBalance: netBalance
    });
  } catch (err: any) {
    console.error('[API Dashboard Error]:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
