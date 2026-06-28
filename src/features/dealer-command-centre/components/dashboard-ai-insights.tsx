import { Badge } from "@/components/ui/feedback";
import { Icon } from "@/components/ui/icons";
import { Brain, Sparkles } from "@/components/ui/icons/registry";
import { dashboardPolish } from "@/features/dealer-command-centre/config/dashboard-shared";
import type { DashboardAiInsight } from "@/features/dealer-command-centre/types/dashboard.types";
import { cn } from "@/utils";

const PRIORITY_VARIANT = {
  high: "danger",
  medium: "warning",
  low: "info",
} as const;

export interface DashboardAiInsightsProps {
  readonly insights: readonly DashboardAiInsight[];
}

export function DashboardAiInsights({ insights }: DashboardAiInsightsProps) {
  return (
    <section className={dashboardPolish.section} aria-labelledby="dashboard-ai-heading">
      <div className="flex items-center gap-2">
        <span className="flex size-9 items-center justify-center rounded-[var(--radius-lg)] bg-[var(--color-secondary-muted)] text-[var(--color-secondary)]">
          <Icon icon={Sparkles} size="sm" tone="primary" aria-hidden />
        </span>
        <h2 id="dashboard-ai-heading" className={dashboardPolish.sectionTitle}>
          AI Business Insights
        </h2>
      </div>

      <div className={cn(dashboardPolish.glassCard, "overflow-hidden p-0")}>
        <div className="border-b border-[var(--color-border-subtle)] bg-[var(--color-secondary-muted)]/30 px-5 py-4 lg:px-6">
          <div className="flex items-center gap-2">
            <Icon icon={Brain} size="sm" tone="primary" aria-hidden />
            <p className="text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)]">
              SURF Intelligence — actionable recommendations for your dealership
            </p>
          </div>
        </div>
        <ul className="divide-y divide-[var(--color-border-subtle)]">
          {insights.map((insight) => (
            <li
              key={insight.id}
              className="flex items-start gap-4 px-5 py-4 motion-card hover:bg-[var(--color-hover)]/40 lg:px-6"
            >
              <Badge variant={PRIORITY_VARIANT[insight.priority]} className="mt-0.5 shrink-0 capitalize">
                {insight.priority}
              </Badge>
              <p className="text-[length:var(--text-body-md)] leading-[var(--leading-relaxed)]">
                {insight.message}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
