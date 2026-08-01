import Link from "next/link";

import { Icon } from "@/components/ui/icons";
import { ArrowRight } from "@/components/ui/icons/registry";
import { selectSimilarVehicles } from "@/services/presentation";
import { homeLinkStyles } from "@/features/marketplace/homepage/components/home-shared";
import { VehicleListingCard } from "@/features/search/components/vehicle-listing-card";
import type { ShowcaseVehicleListing } from "@/features/search/config/search-showcase-listings";
import { vehiclePolish } from "@/features/vehicle/config/vehicle-shared";
import { cn } from "@/utils";

export interface VehicleDetailSimilarProps {
  /** Already projected by the Vehicle Engine — this component does not resolve vehicle data. */
  readonly listings: readonly ShowcaseVehicleListing[];
  readonly currentSlug: string;
  readonly className?: string;
}

export function VehicleDetailSimilar({
  listings,
  currentSlug,
  className,
}: VehicleDetailSimilarProps) {
  /**
   * Curation, deduplication and row arithmetic all belong to the presentation layer.
   *
   * This rail carries a buyer onward, so it is exactly where a bad photograph does the most damage — it
   * used to read straight from projected listings and could offer the collision photograph as somebody's
   * suggested next car. It also sliced to a flat six, which left four cards and a hole in a
   * three-column grid. Both are now the platform's answer rather than this component's.
   */
  const similar = selectSimilarVehicles(listings, currentSlug);

  if (similar.length === 0) return null;

  return (
    <section
      className={cn(vehiclePolish.section, "border-t border-[var(--color-border-subtle)] pt-10 lg:pt-14", className)}
      aria-labelledby="vehicle-similar-heading"
    >
      <div className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        {/* The red "YOU MAY ALSO LIKE" eyebrow said nothing "Similar vehicles" does not. */}
        <h2 id="vehicle-similar-heading" className={vehiclePolish.sectionTitle}>
          Similar vehicles
        </h2>
        <Link href="/search" className={homeLinkStyles.ghost}>
          View all
          <Icon icon={ArrowRight} size="sm" aria-hidden />
        </Link>
      </div>

      <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 xl:grid-cols-3">
        {similar.map((listing) => (
          <VehicleListingCard key={listing.id} listing={listing} href={`/vehicle/${listing.slug}`} />
        ))}
      </div>
    </section>
  );
}
