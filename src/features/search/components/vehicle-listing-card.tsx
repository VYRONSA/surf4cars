import Link from "next/link";
import Image from "next/image";

import { Icon } from "@/components/ui/icons";
import { BadgeCheck, Bot, MapPin, Store } from "@/components/ui/icons/registry";
import { VehicleCardV2, type VehicleCardV2Props } from "@/features/search/components/vehicle-card-v2";
import { homePolish } from "@/features/marketplace/homepage/components/home-shared";
import type { ShowcaseVehicleListing } from "@/features/search/config/search-showcase-listings";
import { cn } from "@/utils";

export interface VehicleListingCardProps extends Omit<VehicleCardV2Props, "imageSlot" | "dealerBadgeSlot" | "titleSlot" | "priceSlot" | "yearSlot" | "mileageSlot" | "transmissionSlot" | "fuelSlot" | "locationSlot" | "aiMatchSlot"> {
  readonly listing: ShowcaseVehicleListing;
  readonly href?: string;
}

export function VehicleListingCard({ listing, className, href, ...props }: VehicleListingCardProps) {
  const card = (
    <VehicleCardV2
      {...props}
      featured={listing.featured}
      reducedPrice={listing.reducedPrice}
      className={cn(homePolish.listingCard, href && "cursor-pointer", className)}
      imageSlot={
        <>
          <Image
            src={listing.imageSrc}
            alt={listing.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover motion-card group-hover:scale-[1.015]"
            style={{ objectPosition: listing.imagePosition }}
          />
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/35 to-transparent"
            aria-hidden
          />
        </>
      }
      aiMatchSlot={
        <div className="inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] border border-[var(--color-secondary)]/15 bg-[var(--color-secondary-muted)] px-2.5 py-1">
          <Icon icon={Bot} size="xs" tone="primary" aria-hidden />
          <span className="text-[length:var(--text-caption)] font-medium text-[var(--color-secondary)]">
            AI Match {listing.aiMatchScore}%
          </span>
        </div>
      }
      titleSlot={
        <h3 className="line-clamp-2 text-[length:var(--text-body-md)] font-semibold leading-[var(--leading-snug)] tracking-[var(--tracking-heading)]">
          {listing.title}
        </h3>
      }
      priceSlot={
        <div className="space-y-0.5">
          <p className="text-[length:var(--text-h4)] font-semibold tracking-[var(--tracking-heading)] text-[var(--color-foreground)]">
            {listing.price}
          </p>
          <p className="text-[length:var(--text-caption)] text-[var(--color-muted-foreground)]">
            {listing.financeEstimate}
          </p>
        </div>
      }
      yearSlot={<span className="tabular-nums">{listing.year}</span>}
      mileageSlot={<span className="tabular-nums">{listing.mileage}</span>}
      fuelSlot={<span>{listing.fuel}</span>}
      transmissionSlot={<span>{listing.transmission}</span>}
      locationSlot={
        <div className="flex items-center gap-1.5 text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)]">
          <Icon icon={MapPin} size="xs" tone="muted" aria-hidden />
          <span>{listing.location}</span>
        </div>
      }
      dealerBadgeSlot={
        <span className="inline-flex max-w-[calc(100%-0.5rem)] items-center gap-1.5 rounded-[var(--radius-pill)] border border-white/20 bg-black/45 px-2.5 py-1 text-[length:var(--text-caption)] text-white backdrop-blur-md">
          <Icon icon={Store} size="xs" aria-hidden />
          <span className="max-w-[110px] truncate font-medium">{listing.dealer}</span>
          {listing.verified && (
            <span className="inline-flex items-center gap-0.5 rounded-[var(--radius-sm)] bg-[var(--color-primary)]/90 px-1.5 py-0.5 text-[length:var(--text-caption)] font-medium text-white">
              <Icon icon={BadgeCheck} size="xs" aria-hidden />
              Verified
            </span>
          )}
        </span>
      }
    />
  );

  if (href) {
    return (
      <Link
        href={href}
        className="group block rounded-[var(--radius-2xl)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]"
      >
        {card}
      </Link>
    );
  }

  return card;
}
