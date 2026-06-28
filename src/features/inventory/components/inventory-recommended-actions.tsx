import { Badge } from "@/components/ui/feedback";
import { Icon } from "@/components/ui/icons";
import { CheckCircle2, Circle } from "@/components/ui/icons/registry";
import { inventoryPolish } from "@/features/inventory/config/inventory-shared";
import type { InventoryRecommendedAction } from "@/features/inventory/types/inventory.types";
import { cn } from "@/utils";

const PRIORITY_VARIANT = {
  high: "danger",
  medium: "warning",
  low: "info",
} as const;

export interface InventoryRecommendedActionsProps {
  readonly actions: readonly InventoryRecommendedAction[];
}

export function InventoryRecommendedActions({ actions }: InventoryRecommendedActionsProps) {
  return (
    <section className={inventoryPolish.section} aria-labelledby="inventory-actions-heading">
      <h2 id="inventory-actions-heading" className={inventoryPolish.sectionTitle}>
        Recommended Actions
      </h2>

      <div className={cn(inventoryPolish.panel, "p-4 lg:p-5")}>
        {actions.length === 0 ? (
          <div className="rounded-[var(--radius-xl)] border border-dashed border-[var(--color-border)] p-6 text-center">
            <Icon icon={CheckCircle2} size="md" tone="success" className="mx-auto mb-2" aria-hidden />
            <p className="text-[length:var(--text-body-md)] font-medium">Inventory optimised</p>
            <p className="mt-1 text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)]">
              No urgent actions today. Monitor performance and respond to new enquiries.
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {actions.map((action) => (
              <li
                key={action.id}
                className="flex items-center gap-3 rounded-[var(--radius-xl)] border border-[var(--color-border-subtle)]/60 px-3 py-3 motion-card hover:bg-[var(--color-hover)]/30"
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-[var(--radius-lg)] border border-[var(--color-border)] text-[var(--color-muted-foreground)]">
                  <Icon icon={Circle} size="xs" aria-hidden />
                </span>
                <span className="min-w-0 flex-1 text-[length:var(--text-body-sm)]">{action.label}</span>
                <Badge variant={PRIORITY_VARIANT[action.priority]} className="shrink-0 capitalize">
                  {action.priority}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
