import { Icon } from "@/components/ui/icons";
import { TrendingDown, TrendingUp } from "@/components/ui/icons/registry";
import { dashboardPolish } from "@/features/dealer-command-centre/config/dashboard-shared";
import { resolveDashboardIcon } from "@/features/dealer-command-centre/config/dashboard-icons";
import type { DashboardKpi } from "@/features/dealer-command-centre/types/dashboard.types";
import { cn } from "@/utils";

export interface DashboardKpiGridProps {
  readonly kpis: readonly DashboardKpi[];
}

export function DashboardKpiGrid({ kpis }: DashboardKpiGridProps) {
  return (
    <section aria-labelledby="dashboard-kpi-heading">
      <h2 id="dashboard-kpi-heading" className="sr-only">
        Key performance indicators
      </h2>
      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {kpis.map((kpi) => (
          <li key={kpi.id} className={dashboardPolish.kpiCard} data-kpi-id={kpi.id}>
            <div className="mb-4 flex items-start justify-between gap-3">
              <p className="text-[length:var(--text-caption)] font-medium uppercase tracking-[var(--tracking-wide)] text-[var(--color-muted-foreground)]">
                {kpi.label}
              </p>
              <span className="flex size-9 shrink-0 items-center justify-center rounded-[var(--radius-xl)] bg-[var(--color-primary-muted)] text-[var(--color-primary-text)]">
                <Icon icon={resolveDashboardIcon(kpi.icon)} size="sm" tone="primary" aria-hidden />
              </span>
            </div>
            <p className="text-[length:var(--text-h3)] font-semibold tracking-[var(--tracking-heading)]" data-kpi-value>
              {kpi.value}
            </p>
            <div className="mt-2 flex items-center gap-1.5">
              {kpi.trend.direction === "up" && (
                <Icon icon={TrendingUp} size="xs" className={dashboardPolish.trendUp} aria-hidden />
              )}
              {kpi.trend.direction === "down" && (
                <Icon icon={TrendingDown} size="xs" className={dashboardPolish.trendDown} aria-hidden />
              )}
              <span
                className={cn(
                  "text-[length:var(--text-caption)] font-medium",
                  kpi.trend.direction === "up" && dashboardPolish.trendUp,
                  kpi.trend.direction === "down" && dashboardPolish.trendDown,
                  kpi.trend.direction === "neutral" && dashboardPolish.trendNeutral,
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
