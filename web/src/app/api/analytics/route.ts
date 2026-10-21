import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type {
  ClassificationType,
  AnalyticsMonthPayload,
  AnalyticsKPIs,
  AnalyticsDailyTimeline,
  AnalyticsClassificationItem,
  AnalyticsDayOfWeekItem,
  AnalyticsTopExpense,
  User,
  Transaction,
} from '../../../types/database';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

export const dynamic = 'force-dynamic';

const MONTH_NAMES_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const MONTH_SHORT_ES = [
  'ene', 'feb', 'mar', 'abr', 'may', 'jun',
  'jul', 'ago', 'sep', 'oct', 'nov', 'dic'
];

const DAY_NAMES_ORDER = [
  'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'
];

const CLASSIFICATION_LABELS: Record<ClassificationType, string> = {
  '50': '50/50 Mitad',
  '100': 'Favor 100%',
  '-100': 'Deuda Mía',
  '0': 'Personal',
};

const CLASSIFICATION_COLORS: Record<ClassificationType, string> = {
  '50': '#818CF8', // Indigo
  '100': '#34D399', // Emerald
  '-100': '#FB7185', // Rose
  '0': '#94A3B8', // Slate
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const now = new Date();
    const currentMonthKey = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
    const selectedMonth = searchParams.get('month') || currentMonthKey;

    // Validar formato YYYY-MM
    const monthRegex = /^\d{4}-(0[1-9]|1[0-2])$/;
    if (!monthRegex.test(selectedMonth)) {
      return NextResponse.json(
        { error: 'Parámetro month inválido. Formato requerido: YYYY-MM' },
        { status: 400 }
      );
    }

    const [yearStr, monthStr] = selectedMonth.split('-');
    const year = parseInt(yearStr, 10);
    const monthNum = parseInt(monthStr, 10); // 1 a 12

    // Rangos del mes seleccionado
    const startDate = new Date(Date.UTC(year, monthNum - 1, 1, 0, 0, 0, 0));
    const endDate = new Date(Date.UTC(year, monthNum, 1, 0, 0, 0, 0));

    // Rangos del mes anterior
    const prevStartDate = new Date(Date.UTC(year, monthNum - 2, 1, 0, 0, 0, 0));
    const prevEndDate = startDate;

    const daysInMonth = new Date(year, monthNum, 0).getDate();
    const monthLabel = `${MONTH_NAMES_ES[monthNum - 1]} ${year}`;

    // Consultas concurrentes a Supabase
    const [usersRes, currentTxRes, prevTxRes, allDatesRes] = await Promise.all([
      supabase.from('users').select('*').order('created_at', { ascending: true }),
      supabase
        .from('transactions')
        .select('*, users(*)')
        .gte('created_at', startDate.toISOString())
        .lt('created_at', endDate.toISOString())
        .order('created_at', { ascending: true }),
      supabase
        .from('transactions')
        .select('amount')
        .gte('created_at', prevStartDate.toISOString())
        .lt('created_at', prevEndDate.toISOString()),
      supabase
        .from('transactions')
        .select('created_at')
        .order('created_at', { ascending: false })
    ]);

    if (usersRes.error) throw usersRes.error;
    if (currentTxRes.error) throw currentTxRes.error;
    if (prevTxRes.error) throw prevTxRes.error;

    const usersData: User[] = usersRes.data || [];
    const currentTxData: Transaction[] = currentTxRes.data || [];
    const prevTxData: { amount: number | string }[] = prevTxRes.data || [];
    const allDatesData: { created_at: string }[] = allDatesRes.data || [];

    // Meses disponibles
    const monthSet = new Set<string>();
    monthSet.add(currentMonthKey);
    monthSet.add(selectedMonth);
    allDatesData.forEach((row) => {
      if (row.created_at) {
        monthSet.add(row.created_at.slice(0, 7));
      }
    });
    const availableMonths = Array.from(monthSet).sort((a, b) => b.localeCompare(a));

    // Cálculos de KPIs principales
    const totalGastoMes = currentTxData.reduce((acc, t) => acc + Number(t.amount), 0);
    const totalGastoMesAnterior = prevTxData.reduce((acc, t) => acc + Number(t.amount), 0);

    let variacionPorcentual: number | null = null;
    if (totalGastoMesAnterior > 0) {
      variacionPorcentual = Math.round(((totalGastoMes - totalGastoMesAnterior) / totalGastoMesAnterior) * 1000) / 10;
    }

    const userA = usersData[0] || { id: 'user_a_placeholder', name: 'Usuario A', telegram_id: 0, created_at: '' };
    const userB = usersData[1] || { id: 'user_b_placeholder', name: 'Usuario B', telegram_id: 0, created_at: '' };

    let totalUserA = 0;
    let totalUserB = 0;
    let deudaGeneradaMes = 0;

    currentTxData.forEach((t) => {
      const amount = Number(t.amount);
      const impact = Number(t.debt_impact);

      if (t.user_id === userA.id) {
        totalUserA += amount;
        deudaGeneradaMes += impact;
      } else if (t.user_id === userB.id) {
        totalUserB += amount;
        deudaGeneradaMes -= impact;
      }
    });

    const kpis: AnalyticsKPIs = {
      totalGastoMes,
      totalGastoMesAnterior,
      variacionPorcentual,
      transaccionesCount: currentTxData.length,
      deudaGeneradaMes,
      aporteUserA: {
        id: userA.id,
        name: userA.name,
        total: totalUserA,
        percentage: totalGastoMes > 0 ? Math.round((totalUserA / totalGastoMes) * 100) : 0,
      },
      aporteUserB: {
        id: userB.id,
        name: userB.name,
        total: totalUserB,
        percentage: totalGastoMes > 0 ? Math.round((totalUserB / totalGastoMes) * 100) : 0,
      },
    };

    // Línea de tiempo diaria (días 1 al fin de mes)
    const dailyMap: Record<number, { monto: number; count: number }> = {};
    for (let d = 1; d <= daysInMonth; d++) {
      dailyMap[d] = { monto: 0, count: 0 };
    }

    currentTxData.forEach((t) => {
      const txDate = new Date(t.created_at);
      const day = txDate.getDate();
      if (dailyMap[day]) {
        dailyMap[day].monto += Number(t.amount);
        dailyMap[day].count += 1;
      }
    });

    let runningAccum = 0;
    const dailyTimeline: AnalyticsDailyTimeline[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      runningAccum += dailyMap[d].monto;
      dailyTimeline.push({
        day: d,
        date: `${d} ${MONTH_SHORT_ES[monthNum - 1]}`,
        monto: dailyMap[d].monto,
        acumulado: runningAccum,
        count: dailyMap[d].count,
      });
    }

    // Desglose por clasificación del mes
    const classCounts: Record<ClassificationType, { total: number; count: number }> = {
      '50': { total: 0, count: 0 },
      '100': { total: 0, count: 0 },
      '-100': { total: 0, count: 0 },
      '0': { total: 0, count: 0 },
    };

    currentTxData.forEach((t) => {
      if (classCounts[t.classification]) {
        classCounts[t.classification].total += Number(t.amount);
        classCounts[t.classification].count += 1;
      }
    });

    const classificationBreakdown: AnalyticsClassificationItem[] = (
      Object.keys(classCounts) as ClassificationType[]
    ).map((key) => {
      const val = classCounts[key].total;
      return {
        key,
        name: CLASSIFICATION_LABELS[key] || key,
        value: val,
        count: classCounts[key].count,
        percentage: totalGastoMes > 0 ? Math.round((val / totalGastoMes) * 100) : 0,
        color: CLASSIFICATION_COLORS[key] || '#818CF8',
      };
    });

    // Intensidad por día de la semana (Lunes a Domingo)
    const dayMap: Record<string, { total: number; count: number }> = {
      Lunes: { total: 0, count: 0 },
      Martes: { total: 0, count: 0 },
      Miércoles: { total: 0, count: 0 },
      Jueves: { total: 0, count: 0 },
      Viernes: { total: 0, count: 0 },
      Sábado: { total: 0, count: 0 },
      Domingo: { total: 0, count: 0 },
    };

    currentTxData.forEach((t) => {
      const d = new Date(t.created_at);
      // getDay: 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
      const dayIndex = d.getDay();
      const mappedName =
        dayIndex === 0
          ? 'Domingo'
          : dayIndex === 1
          ? 'Lunes'
          : dayIndex === 2
          ? 'Martes'
          : dayIndex === 3
          ? 'Miércoles'
          : dayIndex === 4
          ? 'Jueves'
          : dayIndex === 5
          ? 'Viernes'
          : 'Sábado';

      dayMap[mappedName].total += Number(t.amount);
      dayMap[mappedName].count += 1;
    });

    const dayOfWeekIntensity: AnalyticsDayOfWeekItem[] = DAY_NAMES_ORDER.map((name) => ({
      dayName: name,
      total: dayMap[name].total,
      count: dayMap[name].count,
    }));

    // Top 5 gastos del mes
    const sortedDesc = [...currentTxData].sort((a, b) => Number(b.amount) - Number(a.amount));
    const topExpenses: AnalyticsTopExpense[] = sortedDesc.slice(0, 5).map((t) => ({
      id: t.id,
      concept: t.concept || 'Gasto sin descripción',
      amount: Number(t.amount),
      userName: t.users?.name || 'Usuario',
      date: new Date(t.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' }),
      classification: t.classification,
    }));

    const responsePayload: AnalyticsMonthPayload = {
      selectedMonth,
      monthLabel,
      availableMonths,
      kpis,
      dailyTimeline,
      classificationBreakdown,
      dayOfWeekIntensity,
      topExpenses,
    };

    return NextResponse.json(responsePayload);
  } catch (err: unknown) {
    console.error('[API Analytics Error]:', err);
    const message = err instanceof Error ? err.message : 'Error desconocido al procesar analítica';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
