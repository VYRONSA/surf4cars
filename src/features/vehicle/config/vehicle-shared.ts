import { cn } from "@/utils";

export const vehiclePolish = {
  section: cn("space-y-6 lg:space-y-8"),
  sectionTitle: cn(
    "text-[length:var(--text-h4)] font-semibold tracking-[var(--tracking-heading)]",
  ),
  glassCard: cn(
    "glass-card rounded-[var(--radius-2xl)] border border-[var(--color-border-subtle)]",
    "shadow-[var(--shadow-sm)] backdrop-blur-md",
  ),
  glassPanel: cn(
    "glass-hero-float rounded-[var(--radius-2xl)]",
    "shadow-[0_24px_48px_rgba(0,0,0,0.14),0_8px_20px_rgba(0,0,0,0.08)]",
  ),
  specRow: cn(
    "flex items-center justify-between gap-4 border-b border-[var(--color-border-subtle)] py-3.5",
    "last:border-b-0",
  ),
  featureTile: cn(
    "flex flex-col items-center gap-2.5 rounded-[var(--radius-xl)] border border-[var(--color-border-subtle)]",
    "bg-[var(--color-surface-raised)]/50 p-4 text-center motion-card",
    "hover:border-[var(--color-border)] hover:shadow-[var(--shadow-sm)]",
  ),
  trustBadge: cn(
    "flex items-start gap-3 rounded-[var(--radius-xl)] border border-[var(--color-border-subtle)]",
    "bg-[var(--color-surface-raised)]/40 p-4 motion-card",
  ),
  actionPrimary: cn("h-12 w-full lg:h-14"),
  stickyBar: cn(
    "fixed inset-x-0 bottom-0 z-40 border-t border-[var(--color-border-subtle)]",
    "bg-[var(--color-surface)]/92 backdrop-blur-xl shadow-[var(--shadow-lg)]",
  ),
} as const;
