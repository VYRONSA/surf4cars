/**
 * Collection links — the chips above the catalogue.
 *
 * These replaced `QUICK_FILTERS`, which was ten labels backed by nothing. Clicking "Luxury" set a
 * local `activeQuickFilters` array, highlighted the chip, and left the results exactly as they were.
 * Half of them ("Luxury", "Family", "Performance", "Popular", "Price Reduced") had no field to filter
 * on in the first place — there is no luxury flag on a listing.
 *
 * A control that lights up and does nothing is the convincing kind of fake: nobody reports it, they
 * just quietly conclude the search is broken. So each entry now carries the query it runs, every one
 * of them maps to a field the search service actually filters on, and the chip is a link — which also
 * makes each collection a real URL a buyer can bookmark and Google can index.
 */
export interface CollectionLinkDefinition {
  readonly id: string;
  readonly label: string;
  /** Query string appended to `/search`. Must map to filters `parseSearchState` understands. */
  readonly query: string;
}

export const COLLECTION_LINKS: readonly CollectionLinkDefinition[] = [
  { id: "suv", label: "SUVs", query: "bodyType=SUV" },
  { id: "double-cab", label: "Double cabs", query: "bodyType=Double%20Cab" },
  { id: "hatchback", label: "Hatchbacks", query: "bodyType=Hatchback" },
  { id: "automatic", label: "Automatic", query: "transmission=Automatic" },
  { id: "diesel", label: "Diesel", query: "fuel=Diesel" },
  { id: "electric", label: "Electric", query: "fuel=Electric" },
  { id: "low-mileage", label: "Under 50 000 km", query: "mileageMax=50000" },
  { id: "under-300k", label: "Under R300 000", query: "priceMax=30000000" },
] as const;

export interface ExampleSearchQuery {
  readonly id: string;
  readonly query: string;
}

export const EXAMPLE_SEARCH_QUERIES: readonly ExampleSearchQuery[] = [
  { id: "family-suv", query: "I need a reliable family SUV." },
  { id: "double-cab", query: "Show me double cabs under R500 000." },
  { id: "hatchback", query: "I need a fuel efficient hatchback." },
  { id: "first-car", query: "Best first car." },
] as const;

/**
 * Sort options, restricted to the orderings the search service can actually perform.
 *
 * The previous list offered "Newest First", "Lowest Mileage" and "Nearest" under ids the query parser
 * rejects (`newest`, `mileage`, `distance`), so the menu was rendered with every item disabled — six
 * greyed-out lines that looked like a permissions problem rather than a design decision.
 *
 * The sorting itself was never missing: `parseSort` has accepted `price-asc`, `price-desc`,
 * `year-desc` and `mileage-asc` all along, and `buildVehicleSearchQuery` passes them straight through.
 * Only the ids were wrong. "Nearest" is gone rather than renamed, because sorting by distance needs a
 * buyer location the platform does not ask for.
 */
export const SORT_OPTIONS = [
  { id: "relevance", label: "Most relevant" },
  { id: "price-asc", label: "Price, lowest first" },
  { id: "price-desc", label: "Price, highest first" },
  { id: "year-desc", label: "Newest model year" },
  { id: "mileage-asc", label: "Lowest mileage" },
] as const;

export type SearchViewMode = "grid" | "list";
