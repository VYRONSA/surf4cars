import { cn } from "@/utils";

export const inventoryPolish = {
  page: cn("space-y-8 lg:space-y-10"),
  section: cn("space-y-4"),
  sectionTitle: cn(
    "text-[length:var(--text-h5)] font-semibold tracking-[var(--tracking-heading)]",
  ),
  glassCard: cn(
    "glass-card rounded-[var(--radius-2xl)] border border-[var(--color-border-subtle)]",
    "shadow-[var(--shadow-sm)] backdrop-blur-md",
  ),
  kpiCard: cn(
    "glass-card rounded-[var(--radius-2xl)] border border-[var(--color-border-subtle)] p-5",
    "shadow-[var(--shadow-sm)] motion-card hover:-translate-y-0.5 hover:shadow-[var(--shadow-hover)]",
  ),
  panel: cn(
    "rounded-[var(--radius-2xl)] border border-[var(--color-border-subtle)]",
    "bg-[var(--color-surface-raised)]/60 shadow-[var(--shadow-sm)]",
  ),
  trendUp: cn("text-[var(--color-success)]"),
  trendDown: cn("text-[var(--color-danger)]"),
  trendNeutral: cn("text-[var(--color-muted-foreground)]"),
} as const;

export const HEALTH_STYLES = {
  excellent: {
    label: "Excellent",
    badge: "success",
    ring: "ring-[var(--color-success)]/30",
    bg: "bg-[var(--color-success-muted)]",
    text: "text-[var(--color-success)]",
  },
  good: {
    label: "Good",
    badge: "info",
    ring: "ring-[var(--color-primary)]/30",
    bg: "bg-[var(--color-primary-muted)]",
    text: "text-[var(--color-primary-text)]",
  },
  "needs-attention": {
    label: "Needs Attention",
    badge: "warning",
    ring: "ring-[var(--color-warning)]/30",
    bg: "bg-[var(--color-warning-muted)]",
    text: "text-[var(--color-warning)]",
  },
  critical: {
    label: "Critical",
    badge: "danger",
    ring: "ring-[var(--color-danger)]/30",
    bg: "bg-[var(--color-danger-muted)]",
    text: "text-[var(--color-danger)]",
  },
} as const;
