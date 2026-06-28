import { Icon } from "@/components/ui/icons";
import { BadgeCheck, Lightbulb } from "@/components/ui/icons/registry";
import { dashboardPolish } from "@/features/dealer-command-centre/config/dashboard-shared";
import type { DashboardHealthMetric } from "@/features/dealer-command-centre/types/dashboard.types";
import { cn } from "@/utils";

const STATUS_STYLES = {
  good: "text-[var(--color-success)] bg-[var(--color-success-muted)]",
  warning: "text-[var(--color-warning)] bg-[var(--color-warning-muted)]",
  neutral: "text-[var(--color-muted-foreground)] bg-[var(--color-surface-sunken)]",
} as const;

export interface DashboardMarketplaceHealthProps {
  readonly metrics: readonly DashboardHealthMetric[];
  readonly recommendations: readonly string[];
}

export function DashboardMarketplaceHealth({
  metrics,
  recommendations,
}: DashboardMarketplaceHealthProps) {
  return (
    <section className={dashboardPolish.section} aria-labelledby="dashboard-health-heading">
      <h2 id="dashboard-health-heading" className={dashboardPolish.sectionTitle}>
        Marketplace Health
      </h2>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className={cn(dashboardPolish.panel, "p-4 lg:p-5")}>
          <ul className="space-y-3">
            {metrics.map((metric) => (
              <li
                key={metric.id}
                className="flex items-center justify-between gap-3 rounded-[var(--radius-xl)] border border-[var(--color-border-subtle)]/60 px-4 py-3"
              >
                <span className="text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)]">
                  {metric.label}
                </span>
                <span
                  className={cn(
                    "rounded-[var(--radius-pill)] px-2.5 py-1 text-[length:var(--text-caption)] font-semibold",
                    STATUS_STYLES[metric.status],
                  )}
                >
                  {metric.value}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className={cn(dashboardPolish.glassCard, "p-4 lg:p-5")}>
          <div className="mb-4 flex items-center gap-2">
            <Icon icon={Lightbulb} size="sm" tone="accent" aria-hidden />
            <h3 className="text-[length:var(--text-body-md)] font-semibold">Recommendations</h3>
          </div>
          {recommendations.length === 0 ? (
            <p className="text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)]">
              Your marketplace presence is optimised. Keep monitoring lead response times.
            </p>
          ) : (
            <ul className="space-y-3">
              {recommendations.map((rec, index) => (
                <li key={index} className="flex items-start gap-2 text-[length:var(--text-body-sm)] leading-[var(--leading-relaxed)]">
                  <Icon icon={BadgeCheck} size="xs" tone="primary" className="mt-0.5 shrink-0" aria-hidden />
                  {rec}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
