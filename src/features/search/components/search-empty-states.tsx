import { LuxuryEmptyState, Spinner } from "@/components/ui/feedback";
import { COLLECTION_LINKS } from "@/features/search/config";

/**
 * What the marketplace says when it has nothing to show.
 *
 * All of these used the generic `EmptyState` — an icon in a grey rounded square over centred
 * sentence-case type. That component is right for an administrative screen and wrong for the one
 * page where a customer is most alert to whether this place is any good. See `LuxuryEmptyState`.
 */

export interface SearchEmptyStateProps {
  /** What was searched for, so the page can say it back rather than saying "your search". */
  readonly subject?: string;
}

/**
 * No results.
 *
 * The old copy read "Try adjusting your search or filters. Intelligent search will understand
 * natural language when connected." — an instruction to do the work again, followed by a note about
 * an unbuilt feature written in the language of the people building it.
 *
 * A buyer at a dead end wants a road. Four collections and the full marketplace are exactly that,
 * and they are the same links the catalogue header offers, so nothing new was invented to fill the
 * space.
 */
export function SearchNoResults({ subject }: SearchEmptyStateProps) {
  const onward = COLLECTION_LINKS.slice(0, 4).map((link) => ({
    label: link.label,
    href: `/search?${link.query}`,
  }));

  return (
    <LuxuryEmptyState
      title={
        subject
          ? `Nothing matching ${subject} on the marketplace today.`
          : "Nothing matches that combination today."
      }
      description="Stock changes as dealers publish. These are the parts of the marketplace people look at most."
      actions={[...onward, { label: "Every vehicle", href: "/search" }]}
    />
  );
}

export function SearchSearching() {
  return (
    <div className="flex items-center gap-3 py-16" aria-live="polite" aria-busy="true">
      <Spinner className="size-5" label="Searching" />
      <p className="text-[length:var(--text-body-md)] text-[var(--color-muted-foreground)]">
        Searching
      </p>
    </div>
  );
}

/**
 * The loading skeleton.
 *
 * Shaped like the cards it replaces — a 4:3 photograph with two lines under it — rather than as
 * three grey bars of unrelated proportion. A skeleton that does not match its content produces a
 * visible jump when the content lands, which a customer experiences as cheapness even if they could
 * not name it.
 */
export function SearchLoading() {
  return (
    <div
      className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3"
      aria-busy="true"
      aria-label="Loading vehicles"
    >
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} aria-hidden>
          <div className="aspect-[4/3] rounded-[var(--radius-xl)] bg-[var(--color-surface-sunken)] motion-pulse-sfc" />
          <div className="mt-4 h-4 w-3/4 rounded-[var(--radius-sm)] bg-[var(--color-surface-sunken)] motion-pulse-sfc" />
          <div className="mt-2 h-4 w-1/3 rounded-[var(--radius-sm)] bg-[var(--color-surface-sunken)] motion-pulse-sfc" />
        </div>
      ))}
    </div>
  );
}

export function SearchError() {
  return (
    <LuxuryEmptyState
      title="The marketplace did not load."
      description="This is us, not you. Reloading usually settles it."
      actions={[{ label: "Try again", href: "/search" }]}
    />
  );
}

export function SearchOffline() {
  return (
    <LuxuryEmptyState
      title="You are offline."
      description="The marketplace will be here when the connection is."
    />
  );
}
