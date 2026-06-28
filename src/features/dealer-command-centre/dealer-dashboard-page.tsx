import { PageContainer } from "@/components/shell/page/page-container";
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
import { getDealerDashboardShowcase } from "@/features/dealer-command-centre/config/dashboard-showcase-data";
import { dashboardPolish } from "@/features/dealer-command-centre/config/dashboard-shared";

export function DealerDashboardPage() {
  const data = getDealerDashboardShowcase();

  return (
    <PageContainer variant="analytics">
      <div className={dashboardPolish.page}>
        <DashboardHeader dealer={data.dealer} />
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
            <DashboardQuickActions actions={data.quickActions} />
            <DashboardActivityFeedPanel activities={data.activities} />
          </aside>
        </div>
      </div>
    </PageContainer>
  );
}
