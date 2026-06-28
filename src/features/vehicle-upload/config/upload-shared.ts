import { cn } from "@/utils";

export const uploadPolish = {
  page: cn("relative space-y-8 lg:space-y-10"),
  shell: cn(
    "relative flex min-h-[calc(100dvh-var(--header-height,4rem))] flex-col",
  ),
  glow: cn(
    "pointer-events-none absolute inset-x-0 top-0 h-72",
    "bg-[radial-gradient(ellipse_80%_50%_at_50%_-15%,rgba(0,102,255,0.1),transparent)]",
  ),
  glassCard: cn(
    "glass-card rounded-[var(--radius-2xl)] border border-[var(--color-border-subtle)]",
    "shadow-[var(--shadow-sm)] backdrop-blur-md",
  ),
  stepPanel: cn(
    "glass-panel rounded-[var(--radius-2xl)] p-6 sm:p-8 lg:p-10",
    "shadow-[var(--shadow-md)]",
  ),
  stepHero: cn(
    "text-[length:var(--text-h3)] font-semibold tracking-[var(--tracking-heading)]",
    "text-balance lg:text-[length:var(--text-h2)]",
  ),
  stepWhy: cn(
    "mt-3 rounded-[var(--radius-xl)] border border-[var(--color-primary)]/10",
    "bg-[var(--color-primary-muted)]/25 px-4 py-3",
    "text-[length:var(--text-body-sm)] leading-[var(--leading-relaxed)] text-[var(--color-foreground)]/90",
  ),
  stepDescription: cn(
    "mt-3 max-w-2xl text-[length:var(--text-body-md)] leading-[var(--leading-relaxed)]",
    "text-[var(--color-muted-foreground)]",
  ),
  formStack: cn("space-y-6"),
  formGrid: cn("grid gap-6 sm:grid-cols-2"),
  inputClass: cn("h-12 text-[length:var(--text-body-md)]"),
  previewPanel: cn(
    "glass-card sticky top-24 overflow-hidden rounded-[var(--radius-2xl)]",
    "border border-[var(--color-border-subtle)] shadow-[var(--shadow-floating)] backdrop-blur-md",
  ),
  previewHeader: cn(
    "border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)]/80 px-5 py-4",
  ),
  previewBody: cn("p-4"),
  profitCard: cn(
    "rounded-[var(--radius-xl)] border border-[var(--color-success)]/25",
    "bg-gradient-to-br from-[var(--color-success-muted)]/60 to-transparent p-5",
    "shadow-[var(--shadow-sm)]",
  ),
  aiPanel: cn(
    "glass-card fixed bottom-6 right-6 z-40 w-[min(100vw-2rem,360px)]",
    "rounded-[var(--radius-2xl)] border border-[var(--color-secondary)]/15",
    "p-5 shadow-[var(--shadow-floating)] backdrop-blur-md",
    "motion-card animate-slide-up-sfc",
  ),
  uploadZone: cn(
    "relative flex flex-col items-center justify-center gap-4 overflow-hidden",
    "rounded-[var(--radius-2xl)] border-2 border-dashed px-8 py-14 text-center",
    "transition-all duration-500 ease-[var(--ease-premium)]",
  ),
  uploadZoneIdle: cn(
    "border-[var(--color-border)] bg-[var(--color-surface-sunken)]/40",
    "hover:border-[var(--color-primary)]/40 hover:bg-[var(--color-primary-muted)]/10",
  ),
  uploadZoneActive: cn(
    "scale-[1.01] border-[var(--color-primary)] bg-[var(--color-primary-muted)]/20",
    "shadow-[0_0_0_4px_var(--color-primary-muted)]",
  ),
  reviewCard: cn(
    "glass-card rounded-[var(--radius-xl)] border border-[var(--color-border-subtle)]",
    "p-5 shadow-[var(--shadow-sm)] transition-shadow duration-300",
    "hover:shadow-[var(--shadow-hover)]",
  ),
  validationBanner: cn(
    "rounded-[var(--radius-lg)] border border-[var(--color-danger)]/30",
    "bg-[var(--color-danger-muted)]/40 px-4 py-3",
    "text-[length:var(--text-body-sm)] text-[var(--color-danger)]",
  ),
  primaryButton: cn(
    "inline-flex h-12 items-center justify-center gap-2 rounded-[var(--radius-lg)] px-6",
    "bg-[var(--color-primary)] text-[length:var(--text-body-md)] font-medium text-white",
    "motion-button hover:bg-[var(--color-primary-hover)] shadow-sm",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] focus-visible:ring-offset-2",
    "disabled:cursor-not-allowed disabled:opacity-50",
  ),
  secondaryButton: cn(
    "inline-flex h-12 items-center justify-center gap-2 rounded-[var(--radius-lg)] px-6",
    "border border-[var(--color-border)] bg-[var(--color-surface)]/60",
    "text-[length:var(--text-body-md)] font-medium backdrop-blur-sm",
    "motion-button hover:bg-[var(--color-hover)]",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] focus-visible:ring-offset-2",
  ),
  stepTransition: cn(
    "animate-slide-up-sfc motion-page",
    "[animation-duration:var(--duration-slower)]",
  ),
} as const;
