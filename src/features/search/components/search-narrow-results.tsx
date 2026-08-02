import Link from "next/link";

import { Icon } from "@/components/ui/icons";
import { ArrowRight, Info } from "@/components/ui/icons/registry";
import type { SearchIntelligence } from "@/features/search/server/search-intelligence";
import { cn } from "@/utils";

/**
 * Why this search is nearly empty, and the shortest way out of it.
 *
 * The counts beside each option are measured, not estimated — the search was genuinely run again
 * without that filter. That is what makes the panel worth reading: "remove Manual to see 47" is a
 * promise the next click keeps, and a buyer who checks it once will trust the next one.
 *
 * Rendered for empty results and for nearly-empty ones. Four cars is not a failure, but it is the
 * point at which a buyer starts wondering whether the marketplace is small or their filters are
 * narrow — and that is a question the platform can answer precisely.
 */

export function SearchNarrowResults({
  intelligence,
  className,
}: {
  readonly intelligence: SearchIntelligence | null;
  readonly className?: string;
}) {
  if (!intelligence || intelligence.activeFilters.length === 0) return null;

  const { total, activeFilters, relax } = intelligence;

  return (
    <aside
      className={cn(
        "rounded-[var(--radius-2xl)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)]/50 p-6 lg:p-7",
        className,
      )}
      aria-labelledby="narrow-results-heading"
    >
      <p className="flex items-start gap-2.5">
        <Icon icon={Info} aria-hidden className="mt-0.5 size-4 shrink-0 text-[var(--color-muted)]" />
        <span
          id="narrow-results-heading"
          className="text-[length:var(--text-body-md)] font-medium text-[var(--color-foreground)]"
        >
          {total === 0
            ? "Nothing matches all of these at once"
            : `Only ${total} vehicle${total === 1 ? "" : "s"} match all of these`}
        </span>
      </p>

      {/* The filters, named. A buyer cannot relax a constraint they have lost track of setting. */}
      <ul className="mt-4 flex flex-wrap gap-2 pl-[1.625rem]">
        {activeFilters.map((filter) => (
          <li
            key={filter}
            className="rounded-[var(--radius-pill)] border border-[var(--color-border)] px-3 py-1 text-[length:var(--text-caption)] text-[var(--color-muted-foreground)]"
          >
            {filter}
          </li>
        ))}
      </ul>

      {relax.length > 0 ? (
        <div className="mt-6 pl-[1.625rem]">
          <p className="text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)]">
            Remove one to see more:
          </p>
          <ul className="mt-3 space-y-1.5">
            {relax.map((option) => (
              <li key={option.label}>
                <Link
                  href={option.href}
                  className="motion-nav group inline-flex items-center gap-2 text-[length:var(--text-body-sm)] text-[var(--color-foreground)] underline decoration-[var(--color-border-strong)] underline-offset-4 hover:decoration-[var(--color-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]"
                >
                  Without <span className="font-medium">{option.label}</span>
                  <span className="text-[var(--color-muted-foreground)] no-underline">
                    — {option.count} vehicle{option.count === 1 ? "" : "s"}
                  </span>
                  <Icon
                    icon={ArrowRight}
                    aria-hidden
                    className="size-3.5 text-[var(--color-muted)] transition-transform motion-hover group-hover:translate-x-0.5"
                  />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        /* Every filter was tested and none of them is the culprit — the marketplace simply does not
           hold this car today. Saying so is more useful than offering a relax link that changes
           nothing. */
        <p className="mt-5 pl-[1.625rem] text-[length:var(--text-body-sm)] leading-relaxed text-[var(--color-muted-foreground)]">
          Removing any one of these on its own does not open the search up — the marketplace does not
          hold this combination today. Stock changes as dealerships publish.
        </p>
      )}
    </aside>
  );
}
