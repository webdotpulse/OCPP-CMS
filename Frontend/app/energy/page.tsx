"use client";

import { useTranslation } from "react-i18next";
import { AppShell } from '@/components/layout/AppShell';
import { EmsDashboard } from '@/components/dashboard/ems/EmsDashboard';

export default function EnergyDashboardPage() {
  const { t } = useTranslation();

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{t('nav.energyDashboard')}</h2>
          <p className="text-muted-foreground">
            {t('dashboard.energyOverviewDesc')}
          </p>
        </div>
        <EmsDashboard />
      </div>
    </AppShell>
  );
}
