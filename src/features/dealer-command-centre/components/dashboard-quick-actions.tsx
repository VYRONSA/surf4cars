import Link from "next/link";

import { Icon } from "@/components/ui/icons";
import { dashboardPolish } from "@/features/dealer-command-centre/config/dashboard-shared";
import { resolveDashboardIcon } from "@/features/dealer-command-centre/config/dashboard-icons";
import type { DashboardQuickAction } from "@/features/dealer-command-centre/types/dashboard.types";
import { cn } from "@/utils";

export interface DashboardQuickActionsProps {
  readonly actions: readonly DashboardQuickAction[];
}

export function DashboardQuickActions({ actions }: DashboardQuickActionsProps) {
  return (
    <section className={dashboardPolish.section} aria-labelledby="dashboard-actions-heading">
      <h2 id="dashboard-actions-heading" className={dashboardPolish.sectionTitle}>
        Quick Actions
      </h2>

      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {actions.map((action) => (
          <li key={action.id}>
            <Link
              href={action.href}
              className={cn(
                dashboardPolish.quickAction,
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]",
              )}
            >
              <span className="flex size-10 items-center justify-center rounded-[var(--radius-xl)] bg-[var(--color-primary-muted)] text-[var(--color-primary)]">
                <Icon icon={resolveDashboardIcon(action.icon)} size="sm" tone="primary" aria-hidden />
              </span>
              <span className="text-[length:var(--text-body-md)] font-semibold">{action.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
