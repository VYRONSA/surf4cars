import { cn } from "@/utils";

/**
 * What the homepage still shares.
 *
 * This file held eighteen style objects. Fifteen were left behind by the V2 homepage — glass search
 * panels, 300px category cards with lifting shadows, blue and gold radial glows, a raised listing
 * card surface — and every one of them was dead code the day V3 shipped without them. Dead style
 * objects are not harmless: they are a menu, and the next section built here would have been built
 * out of the vocabulary the last redesign was written to remove.
 *
 * Three remain, each with a caller.
 */

export const homePolish = {
  /** Vertical rhythm for a full-width homepage section. */
  section: cn("relative py-20 lg:py-28"),
} as const;

export const homeLinkStyles = {
  /** The one filled red button per page. Red means primary action and nothing else. */
  primary: cn(
    "inline-flex h-12 items-center justify-center rounded-[var(--radius-lg)]",
    "bg-[var(--color-primary)] px-7 text-[length:var(--text-body-md)] font-medium text-white",
    "motion-button hover:bg-[var(--color-primary-hover)]",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]",
  ),

  /**
   * A quiet editorial link.
   *
   * Was red text with a red hover. Both were the accent used as ornament — a "View all" is
   * navigation, not the action a page is asking for, and setting fifteen of them in the brand colour
   * is how the colour stops meaning anything. The underline carries the affordance now.
   */
  ghost: cn(
    "inline-flex items-center gap-2 text-[length:var(--text-body-md)] font-medium",
    "text-[var(--color-muted-foreground)] motion-nav hover:text-[var(--color-foreground)]",
    "underline-offset-4 hover:underline",
    "rounded-[var(--radius-md)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]",
  ),
} as const;

/**
 * Carries a photograph into the page background without a visible seam. The only survivor of six
 * surface washes — the other five were unreferenced, or were blue on a brand whose accent is red.
 */
export const homeSurfaceStyles = {
  heroFade: cn(
    "pointer-events-none absolute inset-0",
    "bg-[linear-gradient(180deg,transparent_0%,var(--color-background)_92%)]",
  ),
} as const;
