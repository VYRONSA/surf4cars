"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { PageContainer } from "@/components/shell/page/page-container";
import { Skeleton } from "@/components/ui/feedback";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icons";
import { Activity, ArrowRight, Brain, List, Sparkles, Zap } from "@/components/ui/icons/registry";
import { DashboardActivityFeedPanel } from "@/features/dealer-command-centre/components/dashboard-activity-feed";
import { DashboardAiInsights } from "@/features/dealer-command-centre/components/dashboard-ai-insights";
import { DashboardHeader } from "@/features/dealer-command-centre/components/dashboard-header";
import { DashboardInventorySnapshot } from "@/features/dealer-command-centre/components/dashboard-inventory-snapshot";
import { DashboardKpiGrid } from "@/features/dealer-command-centre/components/dashboard-kpi-grid";
import { DashboardMarketplaceHealth } from "@/features/dealer-command-centre/components/dashboard-marketplace-health";
import { DashboardPerformance } from "@/features/dealer-command-centre/components/dashboard-performance";
import { DashboardQuickActions } from "@/features/dealer-command-centre/components/dashboard-quick-actions";
import { DashboardRecentLeads } from "@/features/dealer-command-centre/components/dashboard-recent-leads";
import { DashboardTasks } from "@/features/dealer-command-centre/components/dashboard-tasks";
import { dashboardPolish } from "@/features/dealer-command-centre/config/dashboard-shared";
import { getDealerDashboardPayload } from "@/features/dealer-command-centre/services/dealer-dashboard.api";
import type { DealerDashboardData } from "@/features/dealer-command-centre/types/dashboard.types";
import { getActiveDealershipId } from "@/features/inventory/utils/active-dealership";

const EMPTY_DATA: DealerDashboardData = {
  dealer: {
    name: "Dealer Dashboard",
    subscription: "No data yet",
    profileCompletion: 0,
    lastLogin: "No data yet",
  },
  kpis: [],
  aiInsights: [],
  leads: [],
  inventory: [
    { id: "recent", label: "Recently Added", availability: "live", items: [] },
    { id: "photos", label: "Missing Photos", availability: "live", items: [] },
    { id: "low-views", label: "Low Quality Listings", availability: "live", items: [] },
    { id: "above-market", label: "Needs Price Review", availability: "live", items: [] },
    { id: "below-market", label: "Ready to Publish", availability: "live", items: [] },
    { id: "expiring", label: "Expiring Listings", availability: "unavailable", message: "Featured listing expiry telemetry is not available yet.", items: [] },
  ],
  tasks: [],
  quickActions: [],
  health: [],
  recommendations: [],
  activities: [],
  charts: {
    views: { id: "views", label: "Views", values: [], availability: "unavailable", message: "Live listing view telemetry is not connected yet." },
    enquiries: { id: "enquiries", label: "Enquiries", values: [] },
    conversions: { id: "conversions", label: "Conversions", values: [] },
    inventoryGrowth: { id: "inventory-growth", label: "Inventory", values: [] },
    leadSources: [{ label: "No data yet", value: 0, availability: "unavailable", message: "Live lead-source attribution is not connected yet." }],
    dailyTraffic: { id: "daily-traffic", label: "Daily Traffic", values: [], availability: "unavailable", message: "Live traffic telemetry is not connected yet." },
    monthlySales: { id: "monthly-sales", label: "Monthly Sales", values: [] },
  },
};

export function DealerDashboardPage() {
  const [dealershipId, setDealershipId] = useState<string>(() => getActiveDealershipId() ?? "");
  const [data, setData] = useState<DealerDashboardData>(EMPTY_DATA);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  const quickActions = useMemo(() => data.quickActions, [data.quickActions]);
  const isInitialLoading = isLoading && !hasLoadedOnce;

  const loadDashboard = useCallback(async (activeDealershipId: string) => {
    if (!activeDealershipId) {
      setData(EMPTY_DATA);
      setHasLoadedOnce(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const payload = await getDealerDashboardPayload(activeDealershipId);
      setData(payload);
      setHasLoadedOnce(true);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load dealer dashboard.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const syncDealership = () => {
      const nextDealershipId = getActiveDealershipId() ?? "";
      setDealershipId((current) => current === nextDealershipId ? current : nextDealershipId);
    };

    syncDealership();
    window.addEventListener("focus", syncDealership);
    window.addEventListener("storage", syncDealership);

    return () => {
      window.removeEventListener("focus", syncDealership);
      window.removeEventListener("storage", syncDealership);
    };
  }, []);

  useEffect(() => {
    const refreshOnFocus = () => {
      if (dealershipId) {
        void loadDashboard(dealershipId);
      }
    };

    queueMicrotask(refreshOnFocus);

    window.addEventListener("focus", refreshOnFocus);
    window.addEventListener("storage", refreshOnFocus);

    return () => {
      window.removeEventListener("focus", refreshOnFocus);
      window.removeEventListener("storage", refreshOnFocus);
    };
  }, [dealershipId, loadDashboard]);

  return (
    <PageContainer variant="analytics">
      <div className="pb-24 md:pb-8 xl:pb-8">
        <div className={dashboardPolish.page}>
        <DashboardHeader dealer={data.dealer} onRefresh={() => { if (dealershipId) void loadDashboard(dealershipId); }} isRefreshing={isLoading && hasLoadedOnce} />
        {error && (
          <div className="rounded-[var(--radius-xl)] border border-[var(--color-danger)]/30 bg-[var(--color-danger-muted)]/20 px-4 py-3 text-[length:var(--text-body-sm)] text-[var(--color-danger)]" role="alert">
            {error}
          </div>
        )}
        {!dealershipId && !error && (
          <div className="rounded-[var(--radius-xl)] border border-[var(--color-border-subtle)] px-4 py-3 text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)]">
            Select an active dealership to load live dashboard data.
          </div>
        )}
        {isLoading && dealershipId && (
          <div className="rounded-[var(--radius-xl)] border border-[var(--color-border-subtle)] px-4 py-3 text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)]">
            Refreshing live dashboard data...
          </div>
        )}
        {isInitialLoading ? <DashboardLoadingSkeleton /> : null}

        {!isInitialLoading && (
        <>
        <div className="xl:hidden space-y-8">
          <section id="summary" className={dashboardPolish.section}>
            <h2 className={dashboardPolish.sectionTitle}>Executive Summary</h2>
            <DashboardKpiGrid kpis={data.kpis.slice(0, 6)} />
          </section>
          <section id="insights">
            <DashboardAiInsights insights={data.aiInsights} />
          </section>
          <section id="actions">
            <DashboardQuickActions actions={quickActions} />
          </section>
          <section id="priorities">
            <DashboardTasks tasks={data.tasks} />
          </section>
          <section id="activity">
            <DashboardActivityFeedPanel activities={data.activities} />
          </section>
          <section id="enquiries">
            <DashboardRecentLeads leads={data.leads} />
          </section>
          <section id="listings">
            <DashboardInventorySnapshot items={data.inventory} />
          </section>
          <DashboardPerformance charts={data.charts} />
          <DashboardMarketplaceHealth
            metrics={data.health}
            recommendations={data.recommendations}
          />
        </div>

        <div className="hidden xl:block">
        <DashboardKpiGrid kpis={data.kpis} />
        <DashboardAiInsights insights={data.aiInsights} />

        <div className="grid gap-8 xl:grid-cols-[1fr_360px]">
          <div className="space-y-8">
            <DashboardRecentLeads leads={data.leads} />
            <DashboardInventorySnapshot items={data.inventory} />
            <DashboardPerformance charts={data.charts} />
            <DashboardMarketplaceHealth
              metrics={data.health}
              recommendations={data.recommendations}
            />
          </div>

          <aside className="space-y-8">
            <DashboardTasks tasks={data.tasks} />
            <DashboardQuickActions actions={quickActions} />
            <DashboardActivityFeedPanel activities={data.activities} />
          </aside>
        </div>
        </div>
        </>
        )}
        </div>
        <DashboardMobileDock />
      </div>
    </PageContainer>
  );
}

function DashboardLoadingSkeleton() {
  return (
    <div className="space-y-8" aria-label="Dashboard loading">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className={dashboardPolish.kpiCard}>
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-4 h-8 w-28" />
            <Skeleton className="mt-3 h-3 w-20" />
            <Skeleton className="mt-4 h-3 w-full" />
          </div>
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <Skeleton className="h-64 w-full rounded-[var(--radius-2xl)]" />
          <Skeleton className="h-72 w-full rounded-[var(--radius-2xl)]" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-56 w-full rounded-[var(--radius-2xl)]" />
          <Skeleton className="h-72 w-full rounded-[var(--radius-2xl)]" />
        </div>
      </div>
    </div>
  );
}

function DashboardMobileDock() {
  const items = [
    { id: "summary", label: "Summary", icon: Zap },
    { id: "insights", label: "Insights", icon: Brain },
    { id: "actions", label: "Actions", icon: ArrowRight },
    { id: "priorities", label: "Priorities", icon: List },
    { id: "activity", label: "Activity", icon: Activity },
    { id: "enquiries", label: "Leads", icon: Sparkles },
  ] as const;

  return (
    <nav
      className="fixed inset-x-3 bottom-3 z-30 rounded-[var(--radius-2xl)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)]/95 p-2 shadow-[var(--shadow-hover)] backdrop-blur-xl md:hidden"
      aria-label="Dashboard quick navigation"
    >
      <ul className="grid grid-cols-6 gap-1">
        {items.map((item) => (
          <li key={item.id}>
            <Button
              variant="ghost"
              size="sm"
              className="h-auto w-full flex-col gap-1.5 px-1 py-2 text-[10px]"
              onClick={() => {
                document.getElementById(item.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
            >
              <Icon icon={item.icon} size="xs" aria-hidden />
              {item.label}
            </Button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
