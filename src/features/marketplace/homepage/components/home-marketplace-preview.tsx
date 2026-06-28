import Link from "next/link";

import { HeroImageBackground } from "@/components/ui/media";
import { Icon } from "@/components/ui/icons";
import { ArrowRight } from "@/components/ui/icons/registry";
import { Text } from "@/components/ui/typography";
import { PREMIUM_IMAGE_SIZES, PREMIUM_IMAGES } from "@/config/images";
import { HomeSection } from "@/features/marketplace/homepage/components/home-section";
import { homeLinkStyles } from "@/features/marketplace/homepage/components/home-shared";
import { HOME_SHOWCASE_LISTINGS } from "@/features/search/config/search-showcase-listings";
import { VehicleListingCard } from "@/features/search/components/vehicle-listing-card";

export function HomeMarketplacePreview() {
  return (
    <HomeSection
      id="marketplace"
      eyebrow="Marketplace"
      title="Listings, reimagined"
      description="The layout vehicles deserve — clarity, desire, and confidence. Live inventory connects in a future phase."
      className="overflow-hidden border-t border-[var(--color-border-subtle)]"
      backgroundSlot={
        <HeroImageBackground
          src={PREMIUM_IMAGES.sections.vehicleSearch}
          alt=""
          sizes={PREMIUM_IMAGE_SIZES.fullWidth}
          overlayVariant="sectionLight"
          objectPosition="landscape"
        />
      }
    >
      <div className="grid gap-5 lg:grid-cols-3 lg:gap-6">
        {HOME_SHOWCASE_LISTINGS.map((listing) => (
          <VehicleListingCard
            key={listing.id}
            listing={listing}
            href={`/vehicle/${listing.slug}`}
          />
        ))}
      </div>

      <Text variant="caption" tone="muted" className="mt-5 text-center">
        Preview listings — representative presentation until inventory integration.
      </Text>

      <div className="mt-8 flex justify-center">
        <Link href="/search" className={homeLinkStyles.ghost}>
          Explore Vehicles
          <Icon icon={ArrowRight} size="sm" aria-hidden />
        </Link>
      </div>
    </HomeSection>
  );
}
