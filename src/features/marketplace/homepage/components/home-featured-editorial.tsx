import Link from "next/link";

import { Icon } from "@/components/ui/icons";
import { ArrowRight } from "@/components/ui/icons/registry";
import { HomeEditorialVehicleCard } from "@/features/marketplace/homepage/components/home-editorial-vehicle-card";
import type { ShowcaseVehicleListing } from "@/features/search/config/search-showcase-listings";

/**
 * This Week's Featured Vehicles — the desire.
 *
 * Six cars, the first one given real size. The section's job is that someone clicks because of the
 * photograph, before they have read the price — so the cards carry six facts between them and nothing
 * more, and the grid is asymmetric so the eye has somewhere to land.
 *
 * Live stock only. The homepage this replaced rendered a hardcoded array whose own comment admitted
 * "live inventory connects in a future phase"; inventing stock on the front page of a marketplace is a
 * trust defect, so this renders nothing at all rather than fiction.
 */

export interface HomeFeaturedEditorialProps {
  readonly listings: readonly ShowcaseVehicleListing[];
  readonly eyebrow?: string;
  readonly title: string;
  readonly description?: string;
  readonly viewAllHref?: string;
  /** The homepage's first vehicle photograph is worth preloading; later sections are not. */
  readonly priority?: boolean;
  /**
   * `lead` gives the first card two columns and a 16:9 crop — right for the section a visitor meets
   * first, where one car should carry the page. `uniform` gives every card equal weight, which is
   * right for "latest arrivals": recency is not a ranking, and with three listings a lead card leaves
   * a stranded tile on a second row.
   */
  readonly layout?: "lead" | "uniform";
  /**
   * Which rail this is, stamped onto the section.
   *
   * The homepage renders several instances of this component and a verification pass has to be able
   * to tell them apart — "no vehicle appears in two rails" is not checkable if the rails are
   * indistinguishable in the markup.
   */
  readonly railKey?: string;
}

export function HomeFeaturedEditorial({
  listings,
  eyebrow,
  title,
  description,
  viewAllHref = "/search",
  priority = false,
  layout = "lead",
  railKey,
}: HomeFeaturedEditorialProps) {
  if (listings.length === 0) return null;

  /*
   * Vertical rhythm is tighter here than in the page's other sections, deliberately. The marque strip
   * above is 136px of navigation, and at the previous py-28 there were roughly 200px of nothing between
   * it and the first car — which read as the vehicles being a separate, later thing rather than the
   * point of the page. The whitespace that matters is around the photographs, not above the heading.
   */
  const [first, ...others] = listings;
  const lead = layout === "lead" ? first : null;
  const rest = layout === "lead" ? others : listings;

  return (
    <section
      data-rail={railKey}
      className="mx-auto w-full max-w-[var(--container-2xl)] px-6 py-16 sm:px-8 lg:px-10 lg:py-20"
    >
      <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-6">
        <div className="max-w-2xl">
          {eyebrow && (
            <p className="text-[length:var(--text-overline)] font-semibold uppercase tracking-[0.24em] text-[var(--color-muted)]">
              {eyebrow}
            </p>
          )}
          <h2 className="mt-3 text-[length:var(--text-h2)] font-semibold tracking-[-0.02em] text-[var(--color-foreground)]">
            {title}
          </h2>
          {description && (
            <p className="mt-3 text-[length:var(--text-body-md)] leading-relaxed text-[var(--color-muted-foreground)]">
              {description}
            </p>
          )}
        </div>

        <Link
          href={viewAllHref}
          className="motion-button group inline-flex items-center gap-2 border-b border-[var(--color-border-strong)] pb-1 text-[length:var(--text-body-md)] font-medium text-[var(--color-foreground)] hover:border-[var(--color-foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]"
        >
          Every vehicle
          <Icon
            icon={ArrowRight}
            aria-hidden
            className="size-4 transition-transform motion-hover group-hover:translate-x-1"
          />
        </Link>
      </div>

      {/*
        `items-start` so cards keep their own height. The lead card is a two-column 16:9 and the standard
        cards are single-column 3:2, so the two can never be the same height — stretched, the card beside
        the lead grew a panel of empty surface below its text. Aligned to the top it reads as an
        intentional editorial asymmetry, which is what it is.
      */}
      <div className="mt-10 grid grid-cols-1 items-start gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {lead && <HomeEditorialVehicleCard listing={lead} emphasis="lead" priority={priority} />}
        {rest.map((listing, index) => (
          <HomeEditorialVehicleCard
            key={listing.id}
            listing={listing}
            priority={priority && !lead && index === 0}
          />
        ))}
      </div>
    </section>
  );
}
