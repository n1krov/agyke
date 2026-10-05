'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { DollarSign, CreditCard, TrendingUp, Clock } from 'lucide-react';
import type { Transaction, User, AgykeItem } from '../types/database';
import { HeaderBar } from '../components/HeaderBar';
import { MasterBalanceHero } from '../components/MasterBalanceHero';
import { StatMetricCard } from '../components/StatMetricCard';
import { AnalyticsSection } from '../components/AnalyticsSection';
import { TransactionsTable } from '../components/TransactionsTable';
import { QueueViewer } from '../components/QueueViewer';

export default function Dashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [queueItems, setQueueItems] = useState<AgykeItem[]>([]);
  const [netBalance, setNetBalance] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/dashboard');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.users) setUsers(data.users);
      if (data.transactions) setTransactions(data.transactions);
      if (data.queueItems) setQueueItems(data.queueItems);
      if (typeof data.netBalance === 'number') setNetBalance(data.netBalance);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error cargando datos del Dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    async function initDashboard() {
      try {
        const res = await fetch('/api/dashboard');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (ignore) return;
        if (data.users) setUsers(data.users);
        if (data.transactions) setTransactions(data.transactions);
        if (data.queueItems) setQueueItems(data.queueItems);
        if (typeof data.netBalance === 'number') setNetBalance(data.netBalance);
        setLastUpdated(new Date());
      } catch (err) {
        console.error('Error cargando datos del Dashboard:', err);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    initDashboard();
    return () => {
      ignore = true;
    };
  }, []);

  // Métricas agregadas
  const metrics = useMemo(() => {
    const totalGasto = transactions.reduce((acc, tx) => acc + Number(tx.amount), 0);
    const total50 = transactions
      .filter((tx) => tx.classification === '50')
      .reduce((acc, tx) => acc + Number(tx.amount), 0);
    const total100 = transactions
      .filter((tx) => tx.classification === '100')
      .reduce((acc, tx) => acc + Number(tx.amount), 0);
    const pendingQueueCount = queueItems.filter((q) => q.status === 'PENDING').length;

    return {
      totalGasto,
      total50,
      total100,
      pendingQueueCount,
    };
  }, [transactions, queueItems]);

  const formatARS = (val: number) => {
    return `$ ${val.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  return (
    <div className="min-h-screen bg-[#080B11] text-slate-100 relative overflow-hidden selection:bg-indigo-500/30 selection:text-white pb-20">
      {/* Atmosphere: Living Ambient Background Layer */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
        {/* Subtle Grounding Grid Pattern */}
        <div className="absolute inset-0 bg-grid-mesh opacity-70" />

        {/* Ambient Primary Orb - Indigo/Violet */}
        <div className="absolute -top-32 -left-32 w-[550px] h-[550px] rounded-full bg-gradient-to-br from-indigo-600/15 to-violet-600/10 blur-[100px] animate-ambient-slow" />

        {/* Ambient Secondary Orb - Emerald/Cyan */}
        <div className="absolute top-[35%] -right-40 w-[600px] h-[600px] rounded-full bg-gradient-to-tl from-emerald-600/10 to-cyan-500/10 blur-[110px] animate-ambient-reverse" />

        {/* Ambient Tertiary Glow - Subtle breathing pulse */}
        <div className="absolute bottom-10 left-[20%] w-[450px] h-[450px] rounded-full bg-indigo-500/10 blur-[90px] animate-mesh-pulse" />
      </div>

      {/* Header Sticky */}
      <HeaderBar onRefresh={fetchData} isLoading={loading} lastUpdated={lastUpdated} />

      {/* Main Content Container */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        {/* KPI Principal: Master Balance Hero */}
        <MasterBalanceHero
          netBalance={netBalance}
          users={users}
          transactionCount={transactions.length}
        />

        {/* Grid de 4 Métricas Secundarias */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <StatMetricCard
            title="Total Histórico"
            value={formatARS(metrics.totalGasto)}
            subValue={`${transactions.length} transacciones registradas`}
            icon={<DollarSign className="w-5 h-5" />}
            variant="cyan"
          />

          <StatMetricCard
            title="Compartido 50/50"
            value={formatARS(metrics.total50)}
            subValue="Dividido en partes iguales"
            icon={<CreditCard className="w-5 h-5" />}
            variant="indigo"
          />

          <StatMetricCard
            title="Favores 100%"
            value={formatARS(metrics.total100)}
            subValue="Cubierto 100% para el otro"
            icon={<TrendingUp className="w-5 h-5" />}
            variant="emerald"
          />

          <StatMetricCard
            title="Pendientes Muro"
            value={metrics.pendingQueueCount.toString()}
            subValue="Audios y fotos por clasificar"
            icon={<Clock className="w-5 h-5" />}
            variant="amber"
          />
        </div>

        {/* Sección de Analítica y Gráficos */}
        <AnalyticsSection transactions={transactions} />

        {/* Tabla Interactiva de Transacciones */}
        <TransactionsTable transactions={transactions} />

        {/* Visor de Cola Inteligente de Gemini */}
        <QueueViewer queueItems={queueItems} />
      </main>
    </div>
  );
}
