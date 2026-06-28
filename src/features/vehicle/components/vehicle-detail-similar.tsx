import Link from "next/link";

import { Icon } from "@/components/ui/icons";
import { ArrowRight } from "@/components/ui/icons/registry";
import { Text } from "@/components/ui/typography";
import { homeLinkStyles } from "@/features/marketplace/homepage/components/home-shared";
import { VehicleListingCard } from "@/features/search/components/vehicle-listing-card";
import { vehiclePolish } from "@/features/vehicle/config/vehicle-shared";
import { getVehicleBySlug } from "@/features/vehicle/config/vehicle-showcase-details";
import { vehicleDetailToListing } from "@/features/vehicle/utils/vehicle-detail-to-listing";
import { cn } from "@/utils";

export interface VehicleDetailSimilarProps {
  readonly similarSlugs: readonly string[];
  readonly currentSlug: string;
  readonly className?: string;
}

export function VehicleDetailSimilar({
  similarSlugs,
  currentSlug,
  className,
}: VehicleDetailSimilarProps) {
  const similar = similarSlugs
    .filter((slug) => slug !== currentSlug)
    .slice(0, 6)
    .map((slug) => getVehicleBySlug(slug))
    .filter(Boolean)
    .map((vehicle) => vehicleDetailToListing(vehicle!));

  if (similar.length === 0) return null;

  return (
    <section
      className={cn(vehiclePolish.section, "border-t border-[var(--color-border-subtle)] pt-10 lg:pt-14", className)}
      aria-labelledby="vehicle-similar-heading"
    >
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Text variant="overline" tone="primary" className="mb-2 block">
            You may also like
          </Text>
          <h2 id="vehicle-similar-heading" className={vehiclePolish.sectionTitle}>
            Similar vehicles
          </h2>
        </div>
        <Link href="/search" className={homeLinkStyles.ghost}>
          View all
          <Icon icon={ArrowRight} size="sm" aria-hidden />
        </Link>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {similar.map((listing) => (
          <VehicleListingCard key={listing.id} listing={listing} href={`/vehicle/${listing.slug}`} />
        ))}
      </div>
    </section>
  );
}
