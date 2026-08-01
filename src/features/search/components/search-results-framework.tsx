"use client";

import type { ReactNode } from "react";

import { PublicPagination } from "@/components/public/pagination";
import { SearchCatalogueHeader } from "@/features/search/components/search-catalogue-header";
import { SearchMobileFiltersDrawer } from "@/features/search/components/search-mobile-filters-drawer";
import { SearchNoResults } from "@/features/search/components/search-empty-states";
import { SearchUiProvider } from "@/features/search/context/search-ui-context";
import { cn } from "@/utils";

export interface SearchResultsFrameworkProps {
  readonly resultsSlot?: ReactNode;
  readonly emptySlot?: ReactNode;
  readonly className?: string;
  readonly resultsCount?: number;
  /** Composed from the active filters by the server component. */
  readonly heading?: string;
  readonly subheading?: string;
  /** The collection the buyer asked for, when they asked for one. Read only by the empty state. */
  readonly emptySubject?: string;
}

export function SearchResultsFramework(props: SearchResultsFrameworkProps) {
  return (
    <SearchUiProvider>
      <SearchResultsFrameworkInner {...props} />
    </SearchUiProvider>
  );
}

/**
 * The catalogue.
 *
 * Header, photographs, pagination. Everything between the top of the page and the first vehicle that
 * was not one of those three has gone:
 *
 *   breadcrumbs        "Home / Search" above a page reached from a nav link marked Search
 *   mode tabs          Intelligent and Classic rendered identical content — the `if` and the `else`
 *                      branches of this file were the same two lines
 *   quick filters      ten chips that set local state and filtered nothing
 *   toolbar            a bordered box holding one working control and six disabled ones
 *   advanced drawer    a second copy of the filter drawer whose footer buttons were all disabled
 *   map view           a dashed placeholder reading "Map view — coming soon"
 *
 * That is roughly 380px of chrome on a 1440px viewport, which is most of the first screen. The page
 * now opens on cars.
 */
function SearchResultsFrameworkInner({
  resultsSlot,
  emptySlot,
  className,
  resultsCount,
  heading = "Every vehicle",
  subheading,
  emptySubject,
}: SearchResultsFrameworkProps) {
  /* `mt-16` on the pagination already gives the catalogue its closing breath; another 128px below it
     left roughly 190px of empty page above the footer, which reads as the grid having failed to load
     rather than as generosity. */
  return (
    <div className={cn("pb-14 lg:pb-16", className)}>
      <div className="mx-auto max-w-[var(--container-2xl)] px-5 lg:px-8">
        <SearchCatalogueHeader
          resultsCount={resultsCount}
          heading={heading}
          subheading={subheading}
        />

        {/*
          The empty state is not a grid cell.
          ==================================
          It used to render inside this grid, so "No results found" occupied one of three columns and
          left two thirds of the page blank beside it — the single largest piece of dead space on the
          marketplace, on the page where a disappointed buyer is paying most attention.
        */}
        {resultsSlot ? (
          /* Wider gutters than the old two-column layout allowed, and three cards across at every
             desktop width. The photograph is the product; it gets the room. */
          <div
            className="mt-8 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:mt-10 lg:grid-cols-3"
            aria-live="polite"
            aria-label="Search results"
          >
            {resultsSlot}
          </div>
        ) : (
          <div aria-live="polite">{emptySlot ?? <SearchNoResults subject={emptySubject} />}</div>
        )}

        {/* No pagination for nothing. It rendered a red, current-page "1" under an empty result set,
            which is a control offering to page through zero vehicles. */}
        {resultsSlot && (
          <div className="mt-16">
            <PublicPagination showInfo={false} />
          </div>
        )}
      </div>

      <SearchMobileFiltersDrawer />
    </div>
  );
}
