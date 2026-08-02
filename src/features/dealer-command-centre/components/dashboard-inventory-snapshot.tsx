import { Badge } from "@/components/ui/feedback";
import { dashboardPolish } from "@/features/dealer-command-centre/config/dashboard-shared";
import type { DashboardInventoryCategory } from "@/features/dealer-command-centre/types/dashboard.types";
import { cn } from "@/utils";

const CATEGORY_VARIANT = {
  recent: "info",
  photos: "warning",
  "low-views": "warning",
  "above-market": "danger",
  "below-market": "success",
  expiring: "danger",
} as const;

export interface DashboardInventorySnapshotProps {
  readonly items: readonly DashboardInventoryCategory[];
}

export function DashboardInventorySnapshot({ items }: DashboardInventorySnapshotProps) {
  /* Whether the dealership has any stock at all, not just any in this category. */
  const hasInventory = items.some((group) => group.items.length > 0);

  return (
    <section className={dashboardPolish.section} aria-labelledby="dashboard-inventory-heading">
      <h2 id="dashboard-inventory-heading" className={dashboardPolish.sectionTitle}>
        Inventory Snapshot
      </h2>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {items.map((group) => (
          <div key={group.id} className={cn(dashboardPolish.panel, "p-4 lg:p-5")}>
            <h3 className="mb-3 text-[length:var(--text-body-sm)] font-semibold">{group.label}</h3>
            {group.availability === "unavailable" ? (
              <p className="rounded-[var(--radius-xl)] border border-dashed border-[var(--color-border)] p-4 text-center text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)]">
                {group.message ?? "Nothing to show yet."}
              </p>
            ) : group.items.length === 0 ? (
              /*
                "Your inventory is in good shape" is only true if there is an inventory.
                =====================================================================
                A dealership with nothing published saw six of these cards congratulating it on stock
                it does not have. An empty category means one of two different things and the copy has
                to say which, because the action a dealer should take is opposite in each case.
              */
              <p className="rounded-[var(--radius-xl)] border border-dashed border-[var(--color-border)] p-4 text-center text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)]">
                {hasInventory
                  ? "No vehicles need attention here."
                  : "Nothing here yet — this fills in once you have listings."}
              </p>
            ) : (
              <ul className="space-y-2">
                {group.items.map((item) => (
                  <li
                    key={item.id}
                    className="rounded-[var(--radius-xl)] border border-[var(--color-border-subtle)]/60 bg-[var(--color-surface)]/40 p-3 motion-card hover:border-[var(--color-border)]"
                  >
                    <p className="text-[length:var(--text-body-sm)] font-medium">{item.title}</p>
                    <div className="mt-1 flex items-center justify-between gap-2">
                      <p className="text-[length:var(--text-caption)] text-[var(--color-muted-foreground)]">
                        {item.meta}
                      </p>
                      <Badge variant={CATEGORY_VARIANT[item.category]} className="shrink-0">
                        Action
                      </Badge>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
