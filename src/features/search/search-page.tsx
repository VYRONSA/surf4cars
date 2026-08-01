import { buildSearchHeading } from "@/features/search/config/search-headings";
import { SearchResultsFramework } from "@/features/search/components/search-results-framework";
import { VehicleListingCard } from "@/features/search/components/vehicle-listing-card";
import { getVehicleSearchService } from "@/services/vehicle-engine";
import { buildVehicleSearchQuery, parseSearchState } from "@/features/search/utils/search-query";

export interface SearchPageProps {
  readonly searchParams?: Record<string, string | string[] | undefined>;
}

export async function SearchPage({ searchParams }: SearchPageProps) {
  const searchState = parseSearchState(searchParams ?? {});
  const query = buildVehicleSearchQuery(searchState);
  const { listings, total } = await getVehicleSearchService().searchListingsPage(query);
  const { heading, subheading, isFiltered } = buildSearchHeading(searchState);

  return (
    <SearchResultsFramework
      // Total matches, not the page length — otherwise a paged result set reports "1 results".
      resultsCount={total}
      heading={heading}
      subheading={subheading}
      emptySubject={isFiltered ? heading : undefined}
      // Omitted when empty so the framework can fall through to its no-results state; an empty
      // fragment is truthy and would suppress it.
      resultsSlot={
        listings.length > 0
          ? (
            <>
              {listings.map((listing) => (
                <VehicleListingCard
                  key={listing.id}
                  listing={listing}
                  href={`/vehicle/${listing.slug}`}
                />
              ))}
            </>
          )
          : undefined
      }
    />
  );
}
