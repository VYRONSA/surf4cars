import { ChartContainer } from "@/components/ui/dashboard";
import { DashboardMiniChart } from "@/features/dealer-command-centre/components/dashboard-mini-chart";
import { inventoryPolish } from "@/features/inventory/config/inventory-shared";
import type { InventoryShowcaseData } from "@/features/inventory/types/inventory.types";
import { cn } from "@/utils";

export interface InventoryPerformanceProps {
  readonly charts: InventoryShowcaseData["charts"];
}

export function InventoryPerformance({ charts }: InventoryPerformanceProps) {
  const chartCards = [
    { title: "Views Over Time", description: "Listing impressions — 12 weeks", series: charts.views, variant: "line" as const },
    { title: "Enquiries", description: "Buyer enquiries trend", series: charts.enquiries, variant: "bar" as const },
    { title: "Conversion", description: "Enquiry to sale ratio", series: charts.conversion, variant: "line" as const },
    { title: "Avg Days in Stock", description: "Inventory velocity", series: charts.daysInStock, variant: "line" as const },
    { title: "Price Trends", description: "Average list price index", series: charts.priceTrends, variant: "line" as const },
  ];

  return (
    <section className={inventoryPolish.section} aria-labelledby="inventory-performance-heading">
      <h2 id="inventory-performance-heading" className={inventoryPolish.sectionTitle}>
        Inventory Performance
      </h2>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {chartCards.map((chart) => (
          <ChartContainer
            key={chart.title}
            title={chart.title}
            description={chart.description}
            height={180}
            className={cn(inventoryPolish.glassCard, "border-0 shadow-[var(--shadow-sm)]")}
          >
            <div className="flex size-full items-end p-3">
              <DashboardMiniChart series={chart.series} variant={chart.variant} />
            </div>
          </ChartContainer>
        ))}

        <ChartContainer
          title="Top Performing Vehicles"
          description="Highest views this month"
          height={180}
          className={cn(inventoryPolish.glassCard, "border-0 shadow-[var(--shadow-sm)]")}
        >
          <ul className="flex size-full flex-col justify-center gap-2 p-4">
            {charts.topPerformers.map((v, i) => (
              <li key={v.title} className="flex items-center gap-3">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary-muted)] text-[length:var(--text-caption)] font-semibold text-[var(--color-primary)]">
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1 truncate text-[length:var(--text-body-sm)]">{v.title}</span>
                <span className="shrink-0 text-[length:var(--text-body-sm)] font-semibold tabular-nums">{v.views}</span>
              </li>
            ))}
          </ul>
        </ChartContainer>

        <ChartContainer
          title="Slowest Moving Vehicles"
          description="Longest days in stock"
          height={180}
          className={cn(inventoryPolish.glassCard, "border-0 shadow-[var(--shadow-sm)]")}
        >
          <ul className="flex size-full flex-col justify-center gap-2 p-4">
            {charts.slowMovers.map((v, i) => (
              <li key={v.title} className="flex items-center gap-3">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-warning-muted)] text-[length:var(--text-caption)] font-semibold text-[var(--color-warning)]">
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1 truncate text-[length:var(--text-body-sm)]">{v.title}</span>
                <span className="shrink-0 text-[length:var(--text-body-sm)] font-semibold tabular-nums">{v.days}d</span>
              </li>
            ))}
          </ul>
        </ChartContainer>
      </div>
    </section>
  );
}
