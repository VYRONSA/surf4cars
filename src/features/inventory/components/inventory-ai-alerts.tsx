import { Badge } from "@/components/ui/feedback";
import { Icon } from "@/components/ui/icons";
import { Brain, Sparkles } from "@/components/ui/icons/registry";
import { inventoryPolish } from "@/features/inventory/config/inventory-shared";
import type { InventoryAiAlert } from "@/features/inventory/types/inventory.types";
import { cn } from "@/utils";

const SEVERITY_VARIANT = {
  high: "danger",
  medium: "warning",
  info: "info",
} as const;

export interface InventoryAiAlertsProps {
  readonly alerts: readonly InventoryAiAlert[];
}

export function InventoryAiAlerts({ alerts }: InventoryAiAlertsProps) {
  return (
    <section className={inventoryPolish.section} aria-labelledby="inventory-alerts-heading">
      <div className="flex items-center gap-2">
        <span className="flex size-9 items-center justify-center rounded-[var(--radius-lg)] bg-[var(--color-secondary-muted)] text-[var(--color-secondary)]">
          <Icon icon={Sparkles} size="sm" tone="primary" aria-hidden />
        </span>
        <h2 id="inventory-alerts-heading" className={inventoryPolish.sectionTitle}>
          AI Alerts
        </h2>
      </div>

      <div className={cn(inventoryPolish.glassCard, "overflow-hidden p-0")}>
        <div className="border-b border-[var(--color-border-subtle)] bg-[var(--color-secondary-muted)]/30 px-5 py-4 lg:px-6">
          <div className="flex items-center gap-2">
            <Icon icon={Brain} size="sm" tone="primary" aria-hidden />
            <p className="text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)]">
              Actionable inventory intelligence — prioritised by business impact
            </p>
          </div>
        </div>
        <ul className="divide-y divide-[var(--color-border-subtle)]">
          {alerts.map((alert) => (
            <li
              key={alert.id}
              className="flex items-start gap-4 px-5 py-4 motion-card hover:bg-[var(--color-hover)]/40 lg:px-6"
            >
              <Badge variant={SEVERITY_VARIANT[alert.severity]} className="mt-0.5 shrink-0 capitalize">
                {alert.severity}
              </Badge>
              <p className="text-[length:var(--text-body-md)] leading-[var(--leading-relaxed)]">
                {alert.message}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
