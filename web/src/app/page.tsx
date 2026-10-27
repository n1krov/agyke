'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import type { Transaction, User, AgykeItem, Tag } from '../types/database';
import { HeaderBar } from '../components/HeaderBar';
import { MasterBalanceHero } from '../components/MasterBalanceHero';
import { StatMetricCard } from '../components/StatMetricCard';
import { AnalyticsSection } from '../components/AnalyticsSection';
import { TransactionsTable } from '../components/TransactionsTable';
import { MobileBottomDock } from '../components/MobileBottomDock';

export default function Dashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [queueItems, setQueueItems] = useState<AgykeItem[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
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
      if (data.tags) setTags(data.tags);
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
        if (data.tags) setTags(data.tags);
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

  const handleUpdateTransactionTags = (
    transactionId: string,
    updatedTags: Tag[]
  ) => {
    setTransactions((prev) =>
      prev.map((tx) =>
        tx.id === transactionId ? { ...tx, tags: updatedTags } : tx
      )
    );
  };

  const handleTagCreated = (newTag: Tag) => {
    setTags((prev) =>
      [...prev, newTag].sort((a, b) => a.name.localeCompare(b.name))
    );
  };

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
    <div className="min-h-screen bg-[var(--canvas)] text-[var(--text-primary)] relative selection:bg-neutral-800 selection:text-white dark:selection:bg-neutral-200 dark:selection:text-neutral-900 pb-28 sm:pb-20 transition-colors">
      {/* Header Sticky */}
      <HeaderBar
        onRefresh={fetchData}
        isLoading={loading}
        lastUpdated={lastUpdated}
        pendingQueueCount={metrics.pendingQueueCount}
      />

      {/* Main Content Container */}
      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        {/* KPI Principal: Master Balance Hero */}
        <MasterBalanceHero
          netBalance={netBalance}
          users={users}
          transactionCount={transactions.length}
        />

        {/* Grid de 4 Métricas Secundarias (2x2 en mobile, 4 cols en desktop) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
          <StatMetricCard
            title="Total Histórico"
            value={formatARS(metrics.totalGasto)}
            subValue={`${transactions.length} transacciones registradas`}
          />

          <StatMetricCard
            title="Compartido 50/50"
            value={formatARS(metrics.total50)}
            subValue="Dividido en partes iguales"
          />

          <StatMetricCard
            title="Favores 100%"
            value={formatARS(metrics.total100)}
            subValue="Cubierto 100% para el otro"
          />

          <Link href="/muro" className="block transition-transform hover:scale-[1.01] active:scale-[0.99]">
            <StatMetricCard
              title="Pendientes Muro"
              value={metrics.pendingQueueCount.toString()}
              subValue="Ver cola y auditoría →"
              badge={
                metrics.pendingQueueCount > 0 ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                    {metrics.pendingQueueCount} PENDIENTES
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono text-[var(--text-muted)] border border-[var(--border-hairline)] bg-[var(--surface-subtle)]">
                    AL DÍA
                  </span>
                )
              }
            />
          </Link>
        </div>

        {/* Sección de Analítica y Gráficos */}
        <AnalyticsSection transactions={transactions} />

        {/* Tabla Interactiva de Transacciones */}
        <TransactionsTable
          transactions={transactions}
          allTags={tags}
          onUpdateTransactionTags={handleUpdateTransactionTags}
          onTagCreated={handleTagCreated}
        />
      </main>

      {/* Cápsula Flotante Inferior de Navegación Mobile */}
      <MobileBottomDock
        onRefresh={fetchData}
        isLoading={loading}
        pendingQueueCount={metrics.pendingQueueCount}
      />
    </div>
  );
}
