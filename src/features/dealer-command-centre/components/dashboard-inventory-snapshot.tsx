import { Badge } from "@/components/ui/feedback";
import { dashboardPolish } from "@/features/dealer-command-centre/config/dashboard-shared";
import type { DashboardInventoryItem } from "@/features/dealer-command-centre/types/dashboard.types";
import { cn } from "@/utils";

const CATEGORY_TABS = [
  { id: "recent", label: "Recently Added" },
  { id: "photos", label: "Needs Better Photos" },
  { id: "low-views", label: "Low Views" },
  { id: "above-market", label: "Above Market" },
  { id: "below-market", label: "Below Market" },
  { id: "expiring", label: "Expiring Listings" },
] as const;

const CATEGORY_VARIANT = {
  recent: "info",
  photos: "warning",
  "low-views": "warning",
  "above-market": "danger",
  "below-market": "success",
  expiring: "danger",
} as const;

export interface DashboardInventorySnapshotProps {
  readonly items: readonly DashboardInventoryItem[];
}

export function DashboardInventorySnapshot({ items }: DashboardInventorySnapshotProps) {
  const grouped = CATEGORY_TABS.map((tab) => ({
    ...tab,
    items: items.filter((item) => item.category === tab.id),
  }));

  return (
    <section className={dashboardPolish.section} aria-labelledby="dashboard-inventory-heading">
      <h2 id="dashboard-inventory-heading" className={dashboardPolish.sectionTitle}>
        Inventory Snapshot
      </h2>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {grouped.map((group) => (
          <div key={group.id} className={cn(dashboardPolish.panel, "p-4 lg:p-5")}>
            <h3 className="mb-3 text-[length:var(--text-body-sm)] font-semibold">{group.label}</h3>
            {group.items.length === 0 ? (
              <p className="rounded-[var(--radius-xl)] border border-dashed border-[var(--color-border)] p-4 text-center text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)]">
                No vehicles in this category — your inventory is in good shape.
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
