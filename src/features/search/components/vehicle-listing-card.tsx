import { orNotSpecified } from "@/features/vehicle/config/unspecified";
import Link from "next/link";
import Image from "next/image";

import { Icon } from "@/components/ui/icons";
import { BadgeCheck } from "@/components/ui/icons/registry";
import { PhotographPending } from "@/components/ui/media";
import { VehicleCardV2, type VehicleCardV2Props } from "@/features/search/components/vehicle-card-v2";
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
      /* `homePolish.listingCard` came off with the border: it set a border colour, a raised surface
         and a shadow on a card that now has none of the three, so it was painting a panel behind a
         photograph that reads better against the page. */
      className={cn(href && "cursor-pointer", className)}
      /* An unphotographed listing says so. It used to lead with a stock Porsche — see
         `PhotographPending`. Search keeps these cars because they are genuinely for sale and a buyer
         searching the make should find them; the shop-window rails drop them on their own, because
         `isEligibleForDisplay` already treats an empty `imageSrc` as unfit to represent the place. */
      imageSlot={
        listing.imageSrc ? (
          <>
            <Image
              src={listing.imageSrc}
              alt={listing.title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-transform duration-[var(--duration-slower)] ease-[var(--ease-premium)] group-hover:scale-[1.04]"
              style={{ objectPosition: listing.imagePosition }}
            />
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/45 to-transparent"
              aria-hidden
            />
          </>
        ) : (
          <PhotographPending vehicleTitle={listing.title} />
        )
      }
      /**
       * The AI match chip is gone.
       *
       * It rendered on every card, in blue, above the vehicle's own name — and on the marketplace it
       * read 82% on almost all of them, because the score is a listing-completeness proxy rather than a
       * match against anything this buyer asked for. A number that never varies is not information, and
       * it was the first thing the eye hit on a card whose job is to sell a photograph and a price. The
       * blue also fought the brand's red, which is the one accent the design system allows.
       *
       * It returns when it means something — a real match against a real query, and then it belongs on
       * the result, not on every tile.
       */
      titleSlot={
        <h3 className="line-clamp-2 text-[length:var(--text-h5)] font-semibold leading-[var(--leading-snug)] tracking-[-0.01em] text-[var(--color-foreground)]">
          {listing.title}
        </h3>
      }
      /*
        The finance estimate has come off the tile.
        =========================================
        "from R 7 269 p/m" under every price is a second number competing with the first, and it is
        the softer of the two — an estimate at an assumed deposit, term and rate that no buyer on
        this page has given us. Twenty-four of them turns a catalogue into a finance table.

        It is not deleted, it is relocated: the vehicle page shows the estimate beside the calculator
        that produces it, where the assumptions behind the number are visible next to the number.
      */
      priceSlot={
        <p className="text-[length:var(--text-h4)] font-semibold tabular-nums tracking-[-0.02em] text-[var(--color-foreground)]">
          {listing.price}
        </p>
      }
      yearSlot={<span className="tabular-nums">{listing.year}</span>}
      mileageSlot={<span className="tabular-nums">{listing.mileage}</span>}
      fuelSlot={<span>{orNotSpecified(listing.fuel)}</span>}
      transmissionSlot={<span>{orNotSpecified(listing.transmission)}</span>}
      locationSlot={
        <p className="text-[length:var(--text-body-sm)] text-[var(--color-muted)]">
          {listing.location}
        </p>
      }
      /*
        Verification, in white rather than in brand red.
        ==============================================
        The badge was `bg-primary` — the one accent the design system reserves — and it rendered on
        essentially every card, because essentially every dealer is verified. Twenty-four red pills
        on a results page do not make verification feel important; they make red mean nothing, and by
        the time the eye reaches the genuine red on the page it has already learned to skip it.

        A tick in the platform's green with the mark set in white says the same thing more quietly,
        and gives the red back its scarcity.

        The dealer's shopfront icon has gone with it: it sat in front of a dealership's name, which
        is already unmistakably a dealership's name, and the pill had to truncate that name to
        "Sunward …" to make room for the picture of a shop.
      */
      dealerBadgeSlot={
        <span className="inline-flex min-w-0 items-center gap-2 rounded-[var(--radius-pill)] border border-white/15 bg-black/50 px-3 py-1.5 text-[length:var(--text-caption)] text-white backdrop-blur-md">
          {listing.verified && (
            <Icon
              icon={BadgeCheck}
              aria-label="Verified dealer"
              className="size-3.5 shrink-0 text-[var(--color-success)]"
            />
          )}
          <span className="truncate font-medium">{listing.dealer}</span>
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
