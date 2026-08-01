import { ChartContainer } from "@/components/ui/dashboard";
import { dashboardPolish } from "@/features/dealer-command-centre/config/dashboard-shared";
import { DashboardMiniChart } from "@/features/dealer-command-centre/components/dashboard-mini-chart";
import type { DealerDashboardData } from "@/features/dealer-command-centre/types/dashboard.types";
import { cn } from "@/utils";

export interface DashboardPerformanceProps {
  readonly charts: DealerDashboardData["charts"];
}

export function DashboardPerformance({ charts }: DashboardPerformanceProps) {
  const chartCards = [
    { title: "Views", description: "Listing impressions — last 12 weeks", series: charts.views, variant: "line" as const },
    { title: "Enquiries", description: "Buyer enquiries over time", series: charts.enquiries, variant: "bar" as const },
    { title: "Conversions", description: "Sales conversions trend", series: charts.conversions, variant: "line" as const },
    { title: "Inventory Growth", description: "Stock levels over time", series: charts.inventoryGrowth, variant: "line" as const },
    { title: "Daily Traffic", description: "Last 7 days", series: charts.dailyTraffic, variant: "bar" as const },
    { title: "Monthly Sales", description: "Last 12 months", series: charts.monthlySales, variant: "bar" as const },
  ];

  return (
    <section className={dashboardPolish.section} aria-labelledby="dashboard-performance-heading">
      <h2 id="dashboard-performance-heading" className={dashboardPolish.sectionTitle}>
        Dealer Performance
      </h2>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {chartCards.map((chart) => (
          <ChartContainer
            key={chart.title}
            title={chart.title}
            description={chart.description}
            height={200}
            className={cn(dashboardPolish.glassCard, "border-0 shadow-[var(--shadow-sm)]")}
          >
            {chart.series.availability === "coming-soon" ? (
              <div className="flex size-full items-center justify-center p-4 text-center text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)]">
                {chart.series.message ?? "Coming Soon"}
              </div>
            ) : (
              <div className="flex size-full items-end p-3">
                <DashboardMiniChart series={chart.series} variant={chart.variant} />
              </div>
            )}
          </ChartContainer>
        ))}

        <ChartContainer
          title="Lead Sources"
          description="Where your enquiries originate"
          height={200}
          className={cn(dashboardPolish.glassCard, "border-0 shadow-[var(--shadow-sm)] lg:col-span-2 xl:col-span-3")}
        >
          {charts.leadSources.length === 0 || charts.leadSources.every((source) => source.availability === "coming-soon") ? (
            <div className="flex size-full items-center justify-center p-4 text-center text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)]">
              {charts.leadSources[0]?.message ?? "Coming Soon"}
            </div>
          ) : (
            <div className="flex size-full flex-col justify-center gap-3 p-4">
              {charts.leadSources.map((source) => (
                <div key={source.label} className="space-y-1">
                  <div className="flex items-center justify-between text-[length:var(--text-body-sm)]">
                    <span>{source.label}</span>
                    <span className="font-medium tabular-nums">{source.value}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-[var(--radius-pill)] bg-[var(--color-surface-sunken)]">
                    <div
                      className="h-full rounded-[var(--radius-pill)] bg-[var(--color-primary)]"
                      style={{ width: `${source.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </ChartContainer>
      </div>
    </section>
  );
}
