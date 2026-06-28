import { Badge } from "@/components/ui/feedback";
import { Icon } from "@/components/ui/icons";
import { Check, Circle } from "@/components/ui/icons/registry";
import { dashboardPolish } from "@/features/dealer-command-centre/config/dashboard-shared";
import type { DashboardTask } from "@/features/dealer-command-centre/types/dashboard.types";
import { cn } from "@/utils";

const PRIORITY_VARIANT = {
  high: "danger",
  medium: "warning",
  low: "info",
} as const;

export interface DashboardTasksProps {
  readonly tasks: readonly DashboardTask[];
}

export function DashboardTasks({ tasks }: DashboardTasksProps) {
  const pending = tasks.filter((t) => !t.completed);
  const completed = tasks.filter((t) => t.completed);

  return (
    <section className={dashboardPolish.section} aria-labelledby="dashboard-tasks-heading">
      <h2 id="dashboard-tasks-heading" className={dashboardPolish.sectionTitle}>
        Today&apos;s Priorities
      </h2>

      <div className={cn(dashboardPolish.panel, "p-4 lg:p-5")}>
        {pending.length === 0 ? (
          <div className="rounded-[var(--radius-xl)] border border-dashed border-[var(--color-border)] p-6 text-center">
            <p className="text-[length:var(--text-body-md)] font-medium">All caught up</p>
            <p className="mt-1 text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)]">
              No pending tasks — focus on lead follow-ups and inventory quality.
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {pending.map((task) => (
              <li
                key={task.id}
                className="flex items-center gap-3 rounded-[var(--radius-xl)] border border-[var(--color-border-subtle)]/60 px-3 py-3 motion-card hover:bg-[var(--color-hover)]/30"
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-[var(--radius-lg)] border border-[var(--color-border)] text-[var(--color-muted-foreground)]">
                  <Icon icon={Circle} size="xs" aria-hidden />
                </span>
                <span className="min-w-0 flex-1 text-[length:var(--text-body-sm)]">{task.label}</span>
                <Badge variant={PRIORITY_VARIANT[task.priority]} className="shrink-0 capitalize">
                  {task.priority}
                </Badge>
              </li>
            ))}
          </ul>
        )}

        {completed.length > 0 && (
          <div className="mt-4 border-t border-[var(--color-border-subtle)] pt-4">
            <p className="mb-2 text-[length:var(--text-caption)] uppercase tracking-[var(--tracking-wide)] text-[var(--color-muted-foreground)]">
              Completed
            </p>
            <ul className="space-y-1">
              {completed.map((task) => (
                <li key={task.id} className="flex items-center gap-2 text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)] line-through">
                  <Icon icon={Check} size="xs" tone="success" aria-hidden />
                  {task.label}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
