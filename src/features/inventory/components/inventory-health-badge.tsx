import { Badge } from "@/components/ui/feedback";
import { HEALTH_STYLES } from "@/features/inventory/config/inventory-shared";
import type { InventoryHealthLevel } from "@/features/inventory/types/inventory.types";
import { cn } from "@/utils";

export interface InventoryHealthBadgeProps {
  readonly health: InventoryHealthLevel;
  readonly score?: number;
  readonly compact?: boolean;
}

export function InventoryHealthBadge({ health, score, compact }: InventoryHealthBadgeProps) {
  const style = HEALTH_STYLES[health];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] px-2.5 py-1 text-[length:var(--text-caption)] font-medium",
        style.bg,
        style.text,
      )}
    >
      {!compact && style.label}
      {score != null && (
        <span className="tabular-nums">{score}%</span>
      )}
    </span>
  );
}

export interface InventoryScoreRingProps {
  readonly score: number;
  readonly health: InventoryHealthLevel;
}

export function InventoryScoreRing({ score, health }: InventoryScoreRingProps) {
  const style = HEALTH_STYLES[health];
  const circumference = 2 * Math.PI * 16;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative inline-flex size-10 items-center justify-center">
      <svg className="size-10 -rotate-90" viewBox="0 0 36 36" aria-hidden>
        <circle cx="18" cy="18" r="16" fill="none" className="stroke-[var(--color-surface-sunken)]" strokeWidth="3" />
        <circle
          cx="18"
          cy="18"
          r="16"
          fill="none"
          className={cn("stroke-current", style.text)}
          strokeWidth="3"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <span className={cn("absolute text-[length:var(--text-caption)] font-semibold tabular-nums", style.text)}>
        {score}
      </span>
    </div>
  );
}

export function InventoryStatusBadge({
  status,
}: {
  readonly status: "live" | "draft" | "featured" | "expiring" | "sold";
}) {
  const labels = {
    live: { label: "Live", variant: "success" as const },
    draft: { label: "Draft", variant: "info" as const },
    featured: { label: "Featured", variant: "primary" as const },
    expiring: { label: "Expiring", variant: "warning" as const },
    sold: { label: "Sold", variant: "default" as const },
  };
  const { label, variant } = labels[status];
  return <Badge variant={variant}>{label}</Badge>;
}
