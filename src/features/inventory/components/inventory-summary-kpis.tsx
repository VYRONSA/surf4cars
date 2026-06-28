import { Icon } from "@/components/ui/icons";
import { TrendingDown, TrendingUp } from "@/components/ui/icons/registry";
import { resolveDashboardIcon } from "@/features/dealer-command-centre/config/dashboard-icons";
import { inventoryPolish } from "@/features/inventory/config/inventory-shared";
import type { InventoryKpi } from "@/features/inventory/types/inventory.types";
import { cn } from "@/utils";

export interface InventorySummaryKpisProps {
  readonly kpis: readonly InventoryKpi[];
}

export function InventorySummaryKpis({ kpis }: InventorySummaryKpisProps) {
  return (
    <section aria-labelledby="inventory-kpi-heading">
      <h2 id="inventory-kpi-heading" className="sr-only">
        Inventory summary
      </h2>
      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <li key={kpi.id} className={inventoryPolish.kpiCard}>
            <div className="mb-4 flex items-start justify-between gap-3">
              <p className="text-[length:var(--text-caption)] font-medium uppercase tracking-[var(--tracking-wide)] text-[var(--color-muted-foreground)]">
                {kpi.label}
              </p>
              <span className="flex size-9 shrink-0 items-center justify-center rounded-[var(--radius-xl)] bg-[var(--color-primary-muted)] text-[var(--color-primary)]">
                <Icon icon={resolveDashboardIcon(kpi.icon)} size="sm" tone="primary" aria-hidden />
              </span>
            </div>
            <p className="text-[length:var(--text-h3)] font-semibold tracking-[var(--tracking-heading)]">
              {kpi.value}
            </p>
            <div className="mt-2 flex items-center gap-1.5">
              {kpi.trend.direction === "up" && (
                <Icon icon={TrendingUp} size="xs" className={inventoryPolish.trendUp} aria-hidden />
              )}
              {kpi.trend.direction === "down" && (
                <Icon icon={TrendingDown} size="xs" className={inventoryPolish.trendDown} aria-hidden />
              )}
              <span
                className={cn(
                  "text-[length:var(--text-caption)] font-medium",
                  kpi.trend.direction === "up" && inventoryPolish.trendUp,
                  kpi.trend.direction === "down" && inventoryPolish.trendDown,
                  kpi.trend.direction === "neutral" && inventoryPolish.trendNeutral,
                )}
              >
                {kpi.trend.label}
              </span>
            </div>
            <p className="mt-3 text-[length:var(--text-caption)] leading-[var(--leading-relaxed)] text-[var(--color-muted-foreground)]">
              {kpi.explanation}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
