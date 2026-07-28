'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Transaction, User, AgykeItem } from '../types/database';
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  Users,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  RefreshCw,
  PieChart as PieChartIcon,
  BarChart3,
  Receipt,
  Search,
  Filter
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie
} from 'recharts';

export default function Dashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [queueItems, setQueueItems] = useState<AgykeItem[]>([]);
  const [netBalance, setNetBalance] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedClassification, setSelectedClassification] = useState<string>('ALL');

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
    } catch (err) {
      console.error('Error cargando datos del Dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Referencia de usuarios
  const userA = users[0] || { id: '1', name: 'Usuario A' };
  const userB = users[1] || { id: '2', name: 'Usuario B' };

  const displayTransactions = transactions;
  const currentBalance = netBalance;

  // Totales
  const totalGasto = displayTransactions.reduce((acc, tx) => acc + Number(tx.amount), 0);
  const totalCompartido = displayTransactions
    .filter((tx) => tx.classification === '50' || tx.classification === '100')
    .reduce((acc, tx) => acc + Number(tx.amount), 0);
  const totalPersonal = displayTransactions
    .filter((tx) => tx.classification === '0')
    .reduce((acc, tx) => acc + Number(tx.amount), 0);
  const pendingCount = queueItems.filter((q) => q.status === 'PENDING').length;

  // Filtrado de la tabla
  const filteredTransactions = displayTransactions.filter((tx) => {
    const matchesSearch = (tx.concept || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tx.users?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClassification = selectedClassification === 'ALL' || tx.classification === selectedClassification;
    return matchesSearch && matchesClassification;
  });

  // Datos para Recharts
  const classificationData = [
    { name: '50/50', value: displayTransactions.filter((t) => t.classification === '50').reduce((acc, t) => acc + Number(t.amount), 0), color: '#6366f1' },
    { name: 'Favor 100%', value: displayTransactions.filter((t) => t.classification === '100').reduce((acc, t) => acc + Number(t.amount), 0), color: '#10b981' },
    { name: 'Deuda Mía (-100)', value: displayTransactions.filter((t) => t.classification === '-100').reduce((acc, t) => acc + Number(t.amount), 0), color: '#f59e0b' },
    { name: 'Personal (0)', value: displayTransactions.filter((t) => t.classification === '0').reduce((acc, t) => acc + Number(t.amount), 0), color: '#6b7280' },
  ];

  const formattedCurrency = (val: number) => {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 bg-gradient-radial pb-16">
      {/* Header Bar */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Receipt className="w-5 h-5 text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-300 bg-clip-text text-transparent">
                Agyke Dashboard
              </h1>
              <p className="text-xs text-slate-400">Control Inteligente de Gastos Compartidos</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Sistema Activo
            </span>
            <button
              onClick={fetchData}
              disabled={loading}
              className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700/50"
              title="Actualizar datos"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        
        {/* Net Balance Highlight Card */}
        <div className="glass-card rounded-2xl p-6 sm:p-8 relative overflow-hidden border border-indigo-500/20 shadow-2xl">
          <div className="absolute -right-10 -bottom-10 w-60 h-60 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold tracking-wider uppercase text-indigo-400">
                <Users className="w-4 h-4" /> Balance Neto Consolidado
              </div>
              
              <div className="text-4xl sm:text-5xl font-black tracking-tight text-white">
                {formattedCurrency(Math.abs(currentBalance))}
              </div>

              <div className="pt-2">
                {currentBalance > 0 ? (
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-sm font-semibold">
                    <ArrowUpRight className="w-5 h-5 stroke-[2.5]" />
                    <span>{userB.name} le debe a {userA.name}</span>
                  </div>
                ) : currentBalance < 0 ? (
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 text-sm font-semibold">
                    <ArrowDownRight className="w-5 h-5 stroke-[2.5]" />
                    <span>{userA.name} le debe a {userB.name}</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20 text-sm font-semibold">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Cuentas Saldadas ($0)</span>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Summary Pills */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:w-auto w-full">
              <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800/80">
                <p className="text-xs text-slate-400 font-medium">Gastos Compartidos</p>
                <p className="text-lg font-bold text-indigo-300 mt-1">{formattedCurrency(totalCompartido)}</p>
              </div>
              <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800/80">
                <p className="text-xs text-slate-400 font-medium">Gastos Personales</p>
                <p className="text-lg font-bold text-slate-300 mt-1">{formattedCurrency(totalPersonal)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="glass-card glass-card-hover p-5 rounded-xl border border-slate-800/80">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Total Registrado</span>
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-2xl font-bold text-white">{formattedCurrency(totalGasto)}</p>
            <p className="text-xs text-slate-400 mt-1">{displayTransactions.length} transacciones registradas</p>
          </div>

          <div className="glass-card glass-card-hover p-5 rounded-xl border border-slate-800/80">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">50/50 Dividido</span>
              <CreditCard className="w-4 h-4 text-indigo-400" />
            </div>
            <p className="text-2xl font-bold text-indigo-300">
              {formattedCurrency(classificationData[0].value)}
            </p>
            <p className="text-xs text-slate-400 mt-1">Mitad y mitad entre ambos</p>
          </div>

          <div className="glass-card glass-card-hover p-5 rounded-xl border border-slate-800/80">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Favores 100%</span>
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-2xl font-bold text-emerald-300">
              {formattedCurrency(classificationData[1].value)}
            </p>
            <p className="text-xs text-slate-400 mt-1">Cubierto para el otro usuario</p>
          </div>

          <div className="glass-card glass-card-hover p-5 rounded-xl border border-slate-800/80">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Pendientes Muro</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-2xl font-bold text-amber-300">{pendingCount}</p>
            <p className="text-xs text-slate-400 mt-1">Esperando botón en Telegram</p>
          </div>
        </div>

        {/* Charts & Muro Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Chart 1: Categorías de Gasto */}
          <div className="glass-card rounded-2xl p-6 border border-slate-800/80 lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base font-semibold text-white flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-indigo-400" /> Distribución de Gastos por Clasificación
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Montos agrupados por tipo de acuerdo financiero</p>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={classificationData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#6b7280" fontSize={12} tickLine={false} />
                  <YAxis stroke="#6b7280" fontSize={12} tickFormatter={(v) => `$${v}`} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '0.75rem', color: '#fff' }}
                    formatter={(value: any) => [formattedCurrency(Number(value)), 'Monto']}
                  />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    {classificationData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Proportion Pie Chart */}
          <div className="glass-card rounded-2xl p-6 border border-slate-800/80">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base font-semibold text-white flex items-center gap-2">
                  <PieChartIcon className="w-4 h-4 text-emerald-400" /> Proporción de Gastos
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Visualización porcentual</p>
              </div>
            </div>

            <div className="h-64 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={classificationData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                  >
                    {classificationData.map((entry, index) => (
                      <Cell key={`pie-cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '0.75rem', color: '#fff' }}
                    formatter={(value: any) => [formattedCurrency(Number(value)), 'Monto']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Transactions Table Section */}
        <div className="glass-card rounded-2xl p-6 border border-slate-800/80 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Receipt className="w-5 h-5 text-indigo-400" /> Historial de Transacciones
              </h3>
              <p className="text-xs text-slate-400">Listado consolidado de gastos procesados por Agyke Bot</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Search input */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar gasto o usuario..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Classification filter */}
              <div className="flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-lg border border-slate-800 text-xs">
                <Filter className="w-3.5 h-3.5 text-slate-400 ml-1.5" />
                {['ALL', '50', '100', '-100', '0'].map((cl) => (
                  <button
                    key={cl}
                    onClick={() => setSelectedClassification(cl)}
                    className={`px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                      selectedClassification === cl ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {cl === 'ALL' ? 'Todos' : cl}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="text-xs uppercase bg-slate-900/80 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Usuario</th>
                  <th className="py-3 px-4">Concepto</th>
                  <th className="py-3 px-4">Monto Original</th>
                  <th className="py-3 px-4">Clasificación</th>
                  <th className="py-3 px-4">Impacto Deuda</th>
                  <th className="py-3 px-4 text-right">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500 text-sm">
                      No se encontraron transacciones registradas.
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((tx) => {
                    const isUserA = tx.user_id === userA.id;
                    const classificationBadge = {
                      '50': { label: '50/50 (Mitad)', bg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' },
                      '100': { label: 'Favor 100%', bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
                      '-100': { label: 'Deuda Propia', bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
                      '0': { label: 'Personal', bg: 'bg-slate-500/10 text-slate-400 border-slate-500/20' }
                    }[tx.classification] || { label: tx.classification, bg: 'bg-slate-500/10 text-slate-400' };

                    return (
                      <tr key={tx.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-4 font-medium text-white flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${isUserA ? 'bg-indigo-400' : 'bg-emerald-400'}`}></span>
                          {tx.users?.name || (isUserA ? userA.name : userB.name)}
                        </td>
                        <td className="py-3.5 px-4 font-medium">{tx.concept || 'Gasto general'}</td>
                        <td className="py-3.5 px-4 font-semibold text-slate-100">{formattedCurrency(Number(tx.amount))}</td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold border ${classificationBadge.bg}`}>
                            {classificationBadge.label}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-semibold">
                          <span className={Number(tx.debt_impact) > 0 ? 'text-emerald-400' : Number(tx.debt_impact) < 0 ? 'text-amber-400' : 'text-slate-400'}>
                            {Number(tx.debt_impact) > 0 ? `+${formattedCurrency(Number(tx.debt_impact))}` : formattedCurrency(Number(tx.debt_impact))}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right text-xs text-slate-400">
                          {new Date(tx.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
