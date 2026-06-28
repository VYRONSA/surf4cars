import { cn } from "@/utils";

export const dashboardPolish = {
  page: cn("space-y-8 lg:space-y-10"),
  section: cn("space-y-4"),
  sectionTitle: cn(
    "text-[length:var(--text-h5)] font-semibold tracking-[var(--tracking-heading)]",
  ),
  glassCard: cn(
    "glass-card rounded-[var(--radius-2xl)] border border-[var(--color-border-subtle)]",
    "shadow-[var(--shadow-sm)] backdrop-blur-md",
    "motion-card hover:border-[var(--color-border)] hover:shadow-[var(--shadow-hover)]",
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
  quickAction: cn(
    "flex h-full min-h-[88px] flex-col items-start justify-between rounded-[var(--radius-2xl)]",
    "border border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)]/50 p-5",
    "motion-card hover:-translate-y-0.5 hover:border-[var(--color-primary)]/25 hover:shadow-[var(--shadow-hover)]",
  ),
} as const;
