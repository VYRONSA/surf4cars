import { cn } from "@/utils";

/**
 * Vehicle page section styles.
 *
 * The page used to be nine of these stacked down a single column, and every one of them was a
 * bordered, blurred, shadowed card: description in a card, specification in a card, equipment in a
 * card, market insight in a card, finance in a card, trade-in in a card, dealer in a card. Nothing on
 * the page was more important than anything else, because everything on the page was in the same box.
 *
 * The boxes are gone. Sections are separated by space and, where the change of subject is real, a
 * hairline — which is how an editorial page is organised and how a report is not. `glassCard` remains
 * for the two places a container is genuinely doing work: the finance calculator, which is a form and
 * needs to read as one, and the market comparison, which is a figure.
 */
export const vehiclePolish = {
  /** Vertical rhythm between a heading and its content. */
  section: cn("space-y-6"),

  /** A section heading. Set at h4 — a page has one h1, and it is the car's name. */
  sectionTitle: cn(
    "text-[length:var(--text-h4)] font-semibold tracking-[var(--tracking-heading)] text-[var(--color-foreground)]",
  ),

  /**
   * Section eyebrows were red, uppercase and everywhere: SPECIFICATION, MARKET INTELLIGENCE,
   * TRADE-IN, YOU MAY ALSO LIKE. Six of the nine sections wore one. They named a category the
   * heading beneath already named, in the one colour the brand reserves for a single accent per
   * screen. This is what a quiet one looks like, for the two places a section genuinely needs
   * qualifying rather than labelling.
   */
  sectionEyebrow: cn(
    "block text-[length:var(--text-caption)] font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]",
  ),

  /** Retained for the finance calculator and the market comparison figure. Not a default. */
  glassCard: cn(
    "rounded-[var(--radius-2xl)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)]/40",
  ),

  specRow: cn(
    "flex items-baseline justify-between gap-6 border-b border-[var(--color-border-subtle)] py-3",
    "last:border-b-0",
  ),

  actionPrimary: cn("h-12 w-full lg:h-14"),

  stickyBar: cn(
    "fixed inset-x-0 bottom-0 z-40 border-t border-[var(--color-border-subtle)]",
    "bg-[var(--color-surface)]/92 backdrop-blur-xl shadow-[var(--shadow-lg)]",
  ),
} as const;
