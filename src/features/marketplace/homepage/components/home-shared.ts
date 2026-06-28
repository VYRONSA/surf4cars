import { cn } from "@/utils";

/** Shared homepage polish tokens — spacing, glass, cards, typography rhythm. */
export const homePolish = {
  section: cn("relative py-14 lg:py-20"),
  sectionHeader: cn("mb-8 lg:mb-10"),
  sectionHeaderCenter: cn("mx-auto max-w-3xl text-center"),
  heroSearchPanel: cn(
    "glass-hero-float relative w-full overflow-hidden",
    "p-7 sm:p-8 lg:p-10",
    "shadow-[0_28px_56px_rgba(0,0,0,0.2),0_12px_24px_rgba(0,0,0,0.1)]",
  ),
  heroSearchInput: cn(
    "h-[4.75rem] border-[var(--color-border-subtle)] bg-[var(--color-surface)]/80",
    "pl-14 text-[length:var(--text-body-lg)] backdrop-blur-md",
    "sm:h-20 sm:pl-16 sm:text-[length:var(--text-body-lg)]",
  ),
  categoryCard: cn(
    "group relative overflow-hidden rounded-[var(--radius-2xl)] border border-[var(--color-border)] bg-[var(--color-surface)]",
    "min-h-[300px] p-6 transition-all duration-300",
    "shadow-[0_20px_60px_rgba(0,0,0,0.08)]",
    "hover:-translate-y-0.5 hover:shadow-[0_28px_80px_rgba(0,0,0,0.16)]",
  ),
  categoryIcon: cn(
    "flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--radius-xl)] border border-white/10 bg-black/20",
    "text-white transition-transform duration-300",
    "group-hover:scale-105",
  ),
  listingCard: cn(
    "border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)]/90",
    "shadow-[var(--shadow-sm)] backdrop-blur-sm",
    "hover:shadow-[var(--shadow-hover)]",
  ),
} as const;

export const homeLinkStyles = {
  primary: cn(
    "inline-flex h-11 items-center justify-center gap-2 rounded-[var(--radius-lg)]",
    "bg-[var(--color-primary)] px-5 text-[length:var(--text-body-sm)] font-medium text-white",
    "motion-button hover:bg-[var(--color-primary-hover)] shadow-sm",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]",
    "sm:h-12 sm:px-6 sm:text-[length:var(--text-body-md)]",
  ),
  secondary: cn(
    "inline-flex h-11 items-center justify-center gap-2 rounded-[var(--radius-lg)]",
    "border border-[var(--color-border)] bg-[var(--color-surface)]/60 px-5",
    "text-[length:var(--text-body-sm)] font-medium text-[var(--color-foreground)] backdrop-blur-sm",
    "motion-button hover:border-[var(--color-border-strong)] hover:bg-[var(--color-hover)]",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]",
    "sm:h-12 sm:px-6 sm:text-[length:var(--text-body-md)]",
  ),
  accent: cn(
    "inline-flex h-11 items-center justify-center gap-2 rounded-[var(--radius-lg)]",
    "bg-[var(--color-accent)] px-5 text-[length:var(--text-body-sm)] font-medium",
    "text-[var(--color-accent-foreground)] motion-button hover:bg-[var(--color-accent-hover)]",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]",
    "sm:h-12 sm:px-6 sm:text-[length:var(--text-body-md)]",
  ),
  ghost: cn(
    "inline-flex items-center gap-2 text-[length:var(--text-body-md)] font-medium",
    "text-[var(--color-primary)] motion-nav hover:text-[var(--color-primary-hover)]",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] rounded-[var(--radius-md)] px-2 py-1",
  ),
  searchSubmit: cn(
    "inline-flex h-14 w-full items-center justify-center gap-2.5 rounded-[var(--radius-xl)]",
    "bg-[var(--color-primary)] px-8 text-[length:var(--text-body-md)] font-semibold text-white",
    "motion-button hover:bg-[var(--color-primary-hover)]",
    "shadow-[var(--shadow-md)] hover:shadow-[var(--shadow-lg)]",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]",
    "sm:h-[3.75rem] sm:text-[length:var(--text-body-lg)]",
  ),
} as const;

export const homeSurfaceStyles = {
  heroGlow: cn(
    "pointer-events-none absolute inset-0",
    "bg-[radial-gradient(ellipse_90%_70%_at_50%_-20%,rgba(0,102,255,0.22),transparent)]",
  ),
  heroAccentGlow: cn(
    "pointer-events-none absolute inset-0",
    "bg-[radial-gradient(ellipse_50%_40%_at_100%_0%,rgba(200,169,110,0.07),transparent)]",
  ),
  heroFade: cn(
    "pointer-events-none absolute inset-0",
    "bg-[linear-gradient(180deg,transparent_0%,var(--color-background)_92%)]",
  ),
  panelShine: cn(
    "pointer-events-none absolute inset-0",
    "bg-gradient-to-br from-[var(--color-primary)]/[0.08] via-transparent to-[var(--color-accent)]/[0.04]",
  ),
  ctaGlow: cn(
    "pointer-events-none absolute inset-0",
    "bg-[radial-gradient(ellipse_at_top,rgba(0,102,255,0.14),transparent_55%)]",
  ),
  ctaAccentGlow: cn(
    "pointer-events-none absolute inset-0",
    "bg-[radial-gradient(ellipse_at_bottom_right,rgba(200,169,110,0.08),transparent_50%)]",
  ),
} as const;
