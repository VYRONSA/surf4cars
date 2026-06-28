import { ActivityFeed } from "@/components/ui/dashboard";
import { dashboardPolish } from "@/features/dealer-command-centre/config/dashboard-shared";
import type { DashboardActivity } from "@/features/dealer-command-centre/types/dashboard.types";
import { cn } from "@/utils";

export interface DashboardActivityFeedProps {
  readonly activities: readonly DashboardActivity[];
}

export function DashboardActivityFeedPanel({ activities }: DashboardActivityFeedProps) {
  return (
    <section className={dashboardPolish.section} aria-labelledby="dashboard-activity-heading">
      <h2 id="dashboard-activity-heading" className={dashboardPolish.sectionTitle}>
        Activity Feed
      </h2>

      <ActivityFeed
        className={cn(dashboardPolish.glassCard, "border-0 shadow-[var(--shadow-sm)]")}
        items={activities.map((activity) => (
          <div key={activity.id}>
            <p className="text-[length:var(--text-body-sm)] leading-[var(--leading-relaxed)]">
              {activity.message}
            </p>
            <p className="mt-1 text-[length:var(--text-caption)] text-[var(--color-muted-foreground)]">
              {activity.timestamp}
            </p>
          </div>
        ))}
        empty={
          <div className="rounded-[var(--radius-xl)] border border-dashed border-[var(--color-border)] p-6 text-center">
            <p className="text-[length:var(--text-body-sm)] font-medium">No recent activity</p>
            <p className="mt-1 text-[length:var(--text-caption)] text-[var(--color-muted-foreground)]">
              Publish listings and engage with leads to see activity here.
            </p>
          </div>
        }
      />
    </section>
  );
}
