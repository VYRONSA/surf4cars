import { cn } from "@/utils";

export const onboardingStyles = {
  shell: cn(
    "relative flex min-h-dvh flex-col overflow-hidden",
    "bg-[var(--color-background)] text-[var(--color-foreground)]",
  ),
  shellGlow: cn(
    "pointer-events-none absolute inset-0",
    "bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(0,102,255,0.15),transparent)]",
  ),
  shellAccentGlow: cn(
    "pointer-events-none absolute inset-0",
    "bg-[radial-gradient(ellipse_40%_30%_at_100%_0%,rgba(200,169,110,0.06),transparent)]",
  ),
  panel: cn(
    "glass-panel w-full max-w-2xl rounded-[var(--radius-2xl)] p-6 sm:p-8 lg:p-10",
  ),
  widePanel: cn(
    "glass-panel w-full max-w-4xl rounded-[var(--radius-2xl)] p-6 sm:p-8 lg:p-10",
  ),
  primaryButton: cn(
    "inline-flex h-12 items-center justify-center gap-2 rounded-[var(--radius-lg)] px-6",
    "bg-[var(--color-primary)] text-[length:var(--text-body-md)] font-medium text-white",
    "motion-button hover:bg-[var(--color-primary-hover)] shadow-sm",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]",
    "disabled:cursor-not-allowed disabled:opacity-50",
  ),
  secondaryButton: cn(
    "inline-flex h-12 items-center justify-center gap-2 rounded-[var(--radius-lg)] px-6",
    "border border-[var(--color-border)] bg-[var(--color-surface)]/60",
    "text-[length:var(--text-body-md)] font-medium backdrop-blur-sm",
    "motion-button hover:bg-[var(--color-hover)]",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]",
  ),
  ghostButton: cn(
    "inline-flex h-10 items-center gap-1 rounded-[var(--radius-lg)] px-3",
    "text-[length:var(--text-body-sm)] font-medium text-[var(--color-primary-text)]",
    "motion-nav hover:text-[var(--color-primary-hover)]",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]",
  ),
} as const;
