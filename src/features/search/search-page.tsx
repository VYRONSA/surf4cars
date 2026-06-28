import { SearchResultsFramework } from "@/features/search/components/search-results-framework";
import { VehicleListingCard } from "@/features/search/components/vehicle-listing-card";
import { SHOWCASE_VEHICLE_LISTINGS } from "@/features/search/config/search-showcase-listings";

export function SearchPage() {
  return (
    <SearchResultsFramework
      resultsSlot={
        <>
          {SHOWCASE_VEHICLE_LISTINGS.map((listing) => (
            <VehicleListingCard
              key={listing.id}
              listing={listing}
              href={`/vehicle/${listing.slug}`}
            />
          ))}
        </>
      }
    />
  );
}
