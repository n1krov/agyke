'use client';

import React, { useRef } from 'react';
import { HeaderBar } from '@/components/HeaderBar';
import { MobileBottomDock } from '@/components/MobileBottomDock';
import { PlanHero } from '@/components/plan/PlanHero';
import { PlanControls } from '@/components/plan/PlanControls';
import { PlanMilestones } from '@/components/plan/PlanMilestones';
import { PlanProjectionChart } from '@/components/plan/PlanProjectionChart';
import { useFinancialPlan } from '@/hooks/useFinancialPlan';

export default function PlanPage() {
  const {
    plan,
    syncStatus,
    lastSyncedAt,
    updateInputs,
    resetPlan,
    refreshFromCloud,
  } = useFinancialPlan();

  const controlsRef = useRef<HTMLElement | null>(null);

  const handleJumpToControls = () => {
    controlsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const isSyncing = syncStatus === 'hydrating' || syncStatus === 'saving';

  return (
    <div className="min-h-screen bg-[var(--canvas)] text-[var(--text-primary)] flex flex-col">
      <HeaderBar
        onRefresh={() => {
          void refreshFromCloud();
        }}
        isLoading={isSyncing}
        lastUpdated={lastSyncedAt ? new Date(lastSyncedAt) : undefined}
      />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-28 sm:pb-14">
        <div className="space-y-6 sm:space-y-8">
          {/* Hero: Sueldo neto mensual + barra de reparto + destino */}
          <PlanHero
            plan={plan}
            syncStatus={syncStatus}
            onSueldoChange={(sueldo) => updateInputs({ sueldo })}
            onReset={resetPlan}
            onJumpToControls={handleJumpToControls}
          />

          {/* Layout principal: Controles sticky (izq) + Resultados (der). En mobile resultados primero */}
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(300px,350px)_1fr] gap-6 lg:gap-8 items-start">
            <div className="order-2 lg:order-1">
              <PlanControls
                plan={plan}
                onUpdate={updateInputs}
                sectionRef={controlsRef}
              />
            </div>

            <section
              aria-label="Hitos y proyección financiera"
              className="order-1 lg:order-2 hairline-card rounded-2xl p-5 sm:p-8"
            >
              <PlanMilestones plan={plan} />
              <PlanProjectionChart plan={plan} />
            </section>
          </div>

          {/* Nota metodológica */}
          <p className="text-xs text-[var(--text-muted)] max-w-2xl leading-relaxed px-1">
            Estimaciones en pesos de hoy, con aportes constantes y rendimiento real constante. No es asesoramiento financiero: los rendimientos reales varían de un año a otro y pueden ser negativos.
          </p>
        </div>
      </main>

      <MobileBottomDock
        onRefresh={() => {
          void refreshFromCloud();
        }}
        isLoading={isSyncing}
      />
    </div>
  );
}
