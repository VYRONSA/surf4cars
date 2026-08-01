import Image from "next/image";
import Link from "next/link";

import { Icon } from "@/components/ui/icons";
import { BadgeCheck } from "@/components/ui/icons/registry";
import { PhotographPending } from "@/components/ui/media";
import type { ShowcaseVehicleListing } from "@/features/search/config/search-showcase-listings";
import { cn } from "@/utils";

/**
 * An editorial vehicle card.
 *
 * A deliberate alternative to `VehicleListingCard`, not a replacement for it — the two answer
 * different questions. On a results page a buyer is comparing, so fuel, transmission, finance estimate,
 * match score, favourite, compare and share all earn their place. On the homepage nobody is comparing
 * yet; they are deciding whether this marketplace is worth their evening. Every element that helps a
 * comparison is noise against that, and eleven small facts around a photograph is what makes a page
 * look like classifieds.
 *
 * So the hierarchy is fixed and short: photograph, name, price, three essentials, dealer. Nothing else,
 * including nothing clever. The card exists to frame the photograph.
 *
 * Duplication was weighed and rejected: sharing one component behind a `variant` prop would mean every
 * future change to the results card reasoning about a layout that shares none of its purpose, and the
 * two have no styling in common beyond design-system tokens.
 */

export interface HomeEditorialVehicleCardProps {
  readonly listing: ShowcaseVehicleListing;
  /** The lead card runs wider and taller, and sets the section's tone. */
  readonly emphasis?: "lead" | "standard";
  readonly priority?: boolean;
}

export function HomeEditorialVehicleCard({
  listing,
  emphasis = "standard",
  priority = false,
}: HomeEditorialVehicleCardProps) {
  const lead = emphasis === "lead";

  return (
    /*
      Borderless, like the results card.
      =================================
      The card was a bordered, surfaced box that lifted and turned its border red on hover. Nine of
      them on the homepage and six on a dealer's floor read as a grid of tiles rather than a wall of
      photography, and the red border on approach spent the brand accent on a hover state.

      The photograph's own edge is the card's edge now. The red is kept for the rule that draws
      itself under the content — one accent, on the element the eye is already on.
    */
    <Link
      href={`/vehicle/${listing.slug}`}
      className={cn(
        "group relative isolate block",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]",
        lead && "sm:col-span-2",
      )}
    >
      <div
        className={cn(
          "relative overflow-hidden rounded-[var(--radius-xl)] bg-[var(--color-surface-sunken)]",
          lead ? "aspect-[16/9]" : "aspect-[4/3]",
        )}
      >
        {/* Curation should keep an unphotographed listing out of a shop window entirely, so this
            branch is a backstop rather than the expected case — but a dealer floor shows everything
            a dealership has, including a car photographed after it was listed. */}
        {listing.imageSrc ? (
          <Image
            src={listing.imageSrc}
            alt={listing.title}
            fill
            sizes={lead ? "(max-width: 640px) 100vw, 66vw" : "(max-width: 640px) 100vw, 33vw"}
            priority={priority}
            style={{ objectPosition: listing.imagePosition }}
            className="object-cover transition-transform duration-[var(--duration-slower)] ease-[var(--ease-premium)] group-hover:scale-[1.04]"
          />
        ) : (
          <PhotographPending vehicleTitle={listing.title} />
        )}

        {/*
          Verification is the one badge that survives the cull. It is not a feature of the listing, it
          is the reason to believe the listing — and a marketplace's whole proposition is that someone
          checked. Everything else that used to sit here belongs on the results page.
        */}
        {listing.verified && (
          <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] bg-[var(--color-glass-strong)] px-2.5 py-1 text-[length:var(--text-caption)] font-semibold uppercase tracking-[0.14em] text-[var(--color-foreground)] backdrop-blur-[var(--glass-blur-sm)]">
            <Icon icon={BadgeCheck} aria-hidden className="size-3.5 text-[var(--color-success)]" />
            Verified
          </span>
        )}
      </div>

      <div className={cn("pt-4", lead && "lg:pt-5")}>
        <h3
          className={cn(
            "font-semibold tracking-[-0.015em] text-[var(--color-foreground)]",
            lead ? "text-[length:var(--text-h3)]" : "text-[length:var(--text-h5)]",
          )}
        >
          {listing.title}
        </h3>

        <p
          className={cn(
            "mt-2 font-semibold tabular-nums text-[var(--color-foreground)]",
            lead ? "text-[length:var(--text-h4)]" : "text-[length:var(--text-body-lg)]",
          )}
        >
          {listing.price}
        </p>

        {/* Three essentials, as one quiet line. A buyer scanning wants year, distance, and who has it. */}
        <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)]">
          <span className="tabular-nums">{listing.year}</span>
          <span aria-hidden className="text-[var(--color-border-strong)]">
            /
          </span>
          <span className="tabular-nums">{listing.mileage}</span>
          <span aria-hidden className="text-[var(--color-border-strong)]">
            /
          </span>
          <span className="truncate">{listing.dealer}</span>
        </p>

        {/* The red accent, drawn under the card's content on approach. */}
        <span
          aria-hidden
          className="mt-4 block h-px w-8 origin-left bg-[var(--color-primary)] transition-transform duration-[var(--duration-slower)] ease-[var(--ease-premium)] group-hover:scale-x-[3]"
        />
      </div>
    </Link>
  );
}
