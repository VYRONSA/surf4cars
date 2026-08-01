import Link from "next/link";

import { cn } from "@/utils";

/**
 * The luxury empty state.
 *
 * WHY THIS EXISTS
 * ===============
 * A marketplace is judged hardest at its edges. Somebody who searches for a marque we do not carry
 * is *more* attentive than somebody browsing, not less — they came looking for something specific
 * and the page is about to disappoint them. That is the worst possible moment to look like software.
 *
 * The state this replaces on `/search` failed four ways at once, and all four are worth naming
 * because they are the standard failure modes of an empty state:
 *
 *   squeezed     it rendered inside a three-column grid, so it occupied one third of the width and
 *                left two thirds of dead page beside it
 *   plain        "No results found" — the exact phrase a premium brand never uses
 *   leaky        "Intelligent search will understand natural language *when connected*" told a
 *                customer about an unfinished feature in developer language
 *   dishonest    a pagination control offered page 1 of nothing
 *
 * WHAT IT DOES INSTEAD
 * ====================
 * Three things, in this order: name what happened in the brand's voice, say the one useful thing,
 * and offer somewhere to go. The third is what separates a premium empty state from a polite one —
 * an apology is not guidance, and a customer at a dead end needs a road rather than sympathy.
 *
 * NO ICON
 * =======
 * Deliberate. A magnifying glass in a grey rounded square is the universal signature of an
 * administrative interface, and it adds nothing a headline does not already say. Type and space
 * carry this; that is what they are for.
 */

export interface LuxuryEmptyStateAction {
  readonly label: string;
  readonly href: string;
}

export interface LuxuryEmptyStateProps {
  /** Editorial, specific, in the brand's voice. Never "No results found". */
  readonly title: string;
  /** One sentence. The useful thing, not an apology. */
  readonly description?: string;
  /** Where to go instead. The point of the component — a dead end with no exit is the failure. */
  readonly actions?: readonly LuxuryEmptyStateAction[];
  /** `page` stands alone on a route; `section` sits inside a section that already has a heading. */
  readonly variant?: "page" | "section";
  readonly className?: string;
}

export function LuxuryEmptyState({
  title,
  description,
  actions = [],
  variant = "page",
  className,
}: LuxuryEmptyStateProps) {
  return (
    <div
      className={cn(
        /* Left-aligned, like everything else on these pages. Centred type in a wide column is the
           other tell of an admin empty state, and it fights the editorial hierarchy around it. */
        variant === "page" ? "py-20 lg:py-28" : "py-12",
        className,
      )}
    >
      <p
        className={cn(
          "max-w-2xl text-balance font-semibold tracking-[-0.02em] text-[var(--color-foreground)]",
          variant === "page"
            ? "text-[length:var(--text-h2)] leading-[1.1]"
            : "text-[length:var(--text-h4)] leading-[1.15]",
        )}
      >
        {title}
      </p>

      {description && (
        <p className="mt-4 max-w-xl text-[length:var(--text-body-lg)] leading-relaxed text-[var(--color-muted-foreground)]">
          {description}
        </p>
      )}

      {actions.length > 0 && (
        <div className="mt-8 flex flex-wrap gap-2">
          {actions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className={cn(
                "motion-button inline-flex min-h-11 items-center rounded-[var(--radius-pill)]",
                "border border-[var(--color-border)] px-5 text-[length:var(--text-body-sm)]",
                "text-[var(--color-foreground)] hover:border-[var(--color-border-strong)] hover:bg-[var(--color-hover)]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]",
              )}
            >
              {action.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
