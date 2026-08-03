import Image from "next/image";
import Link from "next/link";

import { Icon } from "@/components/ui/icons";
import { ArrowRight, BadgeCheck, MapPin } from "@/components/ui/icons/registry";
import { MediaAttribution } from "@/components/ui/media";
import type { DealerSpotlight } from "@/features/marketplace/homepage/server/homepage-stock";
import { cn } from "@/utils";

/**
 * Dealer Spotlight — a paid placement, presented as one.
 *
 * WHAT THIS REPLACES, AND WHY IT HAD TO BE REBUILT RATHER THAN RESTYLED
 * ====================================================================
 * The previous version was a cover photograph with the dealership's name on it, followed by a
 * four-up grid of their stock under the heading "From their floor". Structurally that is a vehicle
 * rail with a dealership's name above it — which is exactly what the rest of this page already is,
 * so the section read as one more listing block and the dealership read as a caption.
 *
 * This slot is specified as a commercial product that Premium and Platinum dealerships will buy. A
 * business paying for it is buying *their* presence, not another six cards of stock, and the layout
 * has to make that structurally true rather than decoratively true:
 *
 *   the photograph is the section     full-bleed, and the tallest element on the page
 *   the dealership is the subject     mark, name, city and speciality set as a profile, not a label
 *   the evidence is theirs            stock count, verification, and their own words
 *   two ways in, not six ways out     View dealership, Browse inventory — and no vehicle cards
 *
 * Removing the stock grid is the substantive change. It cost the page nothing — every one of those
 * vehicles is already reachable from the rails above and from the dealership's own page — and it is
 * what turns the section from a merchandising rail into a dealership profile.
 *
 * NOTHING HERE IS INVENTED
 * ========================
 * Every fact is read from the dealership record or from the Founder's placement. The speciality is
 * the placement's `story` and is absent when unwritten, never inferred from what they happen to
 * stock. The mark is theirs or there is no mark. The verification badge appears only where the
 * record carries it. A commercial slot that embellishes its occupant is a liability to the
 * dealership that paid for it.
 *
 * The cover is the dealership's own photograph or none at all — see the panel below for why that
 * replaced a SURF4CARS library frame.
 */

export interface HomeDealerSpotlightProps {
  readonly spotlight: DealerSpotlight;
}

export function HomeDealerSpotlight({ spotlight }: HomeDealerSpotlightProps) {
  const formattedStock = spotlight.stockCount.toLocaleString("en-ZA").replace(/,/g, " ");
  const vehicleWord = spotlight.stockCount === 1 ? "vehicle" : "vehicles";

  return (
    <section
      aria-labelledby="spotlight-heading"
      data-testid="dealer-spotlight"
      className="relative isolate border-y border-[var(--color-border-subtle)]"
    >
      {/*
        Their photograph, or no photograph.
        ==================================
        This section used to render a SURF4CARS library frame — a Cape Town showroom at blue hour —
        full-bleed behind a named dealership's name. Nobody wrote the words "these are their
        premises" and the layout said it anyway, which is the failure AGENTS.md exists to prevent: an
        obviously fake placeholder gets fixed, a convincing one gets trusted. At the size this
        section now runs, and on a slot dealerships will pay for, that inference is not a small one.

        So a cover is something the dealership supplies. Where they have not, the panel below is
        deliberately *graphic* rather than photographic: nothing about a gradient can be mistaken for
        a building. It is the "tasteful premium placeholder" the brief asks for, and its whole job is
        to be handsome and to make no claim.

        One scrim, weighted left. An earlier version stacked a horizontal and a vertical gradient,
        each defensible alone and together almost opaque — the section rendered as a black band with
        type on it, and the brief asks for large premium photography.
      */}
      <div className="absolute inset-0 -z-10">
        {spotlight.coverImageUrl ? (
          <>
            <Image
              src={spotlight.coverImageUrl}
              alt={`${spotlight.dealer} premises`}
              fill
              sizes="100vw"
              priority={false}
              className="object-cover object-right"
            />
            <div
              aria-hidden
              className="absolute inset-0 bg-[linear-gradient(to_right,rgba(8,8,8,0.95)_0%,rgba(8,8,8,0.86)_26%,rgba(8,8,8,0.55)_50%,rgba(8,8,8,0.12)_78%,rgba(8,8,8,0)_100%)]"
            />
          </>
        ) : (
          /* No photograph of anything. A dark field, a diagonal sheen and the page's own wash — the
             visual language of the brand rather than a picture of somebody's forecourt. */
          <div
            aria-hidden
            className="absolute inset-0 bg-[radial-gradient(120%_120%_at_18%_20%,rgba(38,46,60,0.95)_0%,rgba(16,20,27,0.98)_46%,rgba(10,12,16,1)_100%)]"
          >
            <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(255,255,255,0.05)_0%,rgba(255,255,255,0)_38%,rgba(255,255,255,0.03)_62%,rgba(255,255,255,0)_100%)]" />
          </div>
        )}
        {/* A whisper at the very bottom only, so the section meets the one below it cleanly. */}
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-24 bg-[linear-gradient(to_top,rgba(8,8,8,0.55)_0%,rgba(8,8,8,0)_100%)]"
        />
        {spotlight.coverImageUrl && spotlight.coverProvenance !== "dealer" && (
          <MediaAttribution mediaId="dealer-cover" />
        )}
      </div>

      <div className="mx-auto flex min-h-[34rem] w-full max-w-[var(--container-2xl)] flex-col justify-center px-6 py-24 sm:px-8 lg:min-h-[40rem] lg:px-10 lg:py-32">
        <div className="max-w-2xl">
          <p className="text-[length:var(--text-overline)] font-semibold uppercase tracking-[0.24em] text-[var(--color-muted)]">
            Dealer spotlight
          </p>

          <div className="mt-8 flex items-center gap-5">
            {/* The dealership's own mark, and nothing in its place when they have not supplied one —
                a generated monogram would be us inventing their branding. */}
            {spotlight.logoUrl ? (
              <span className="inline-flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-glass-strong)] backdrop-blur-[var(--glass-blur-sm)] sm:size-20">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={spotlight.logoUrl}
                  alt={`${spotlight.dealer} logo`}
                  className="size-full object-contain p-2.5"
                  loading="lazy"
                  decoding="async"
                />
              </span>
            ) : null}

            <div className="min-w-0">
              <h2
                id="spotlight-heading"
                className="text-[length:var(--text-h1)] font-semibold leading-[1.04] tracking-[-0.025em] text-[var(--color-foreground)]"
              >
                {spotlight.dealer}
              </h2>

              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                {spotlight.location && (
                  <span className="inline-flex items-center gap-1.5 text-[length:var(--text-body-md)] text-[var(--color-muted-foreground)]">
                    <Icon icon={MapPin} aria-hidden className="size-4" />
                    {spotlight.location}
                  </span>
                )}
                {spotlight.verified && (
                  <span className="inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] bg-[var(--color-glass-strong)] px-3 py-1 text-[length:var(--text-caption)] font-semibold uppercase tracking-[0.14em] text-[var(--color-foreground)] backdrop-blur-[var(--glass-blur-sm)]">
                    <Icon icon={BadgeCheck} aria-hidden className="size-3.5 text-[var(--color-success)]" />
                    Verified dealer
                  </span>
                )}
              </div>
            </div>
          </div>

          {/*
            The dealership's own line first, then the Founder's. Both optional, neither generated:
            the promotional headline is written by the business, the speciality by the editor placing
            them here. Where both are absent the section simply says less.
          */}
          {spotlight.promotionalHeadline ? (
            <p className="mt-8 max-w-xl text-balance text-[length:var(--text-h4)] font-medium leading-snug tracking-[-0.01em] text-[var(--color-foreground)]">
              {spotlight.promotionalHeadline}
            </p>
          ) : null}

          {spotlight.speciality ? (
            <p
              className={cn(
                "max-w-xl text-balance text-[length:var(--text-body-lg)] leading-relaxed text-[var(--color-foreground)]/90",
                spotlight.promotionalHeadline ? "mt-4" : "mt-8",
              )}
            >
              {spotlight.speciality}
            </p>
          ) : null}

          {/* The one number this section can prove, given the weight of a figure on a paid slot. */}
          <dl className="mt-8 flex flex-wrap gap-x-12 gap-y-4">
            <div>
              <dt className="text-[length:var(--text-caption)] font-medium uppercase tracking-[0.16em] text-[var(--color-muted)]">
                On the marketplace
              </dt>
              <dd className="mt-1 text-[length:var(--text-h3)] font-semibold tabular-nums tracking-[-0.02em] text-[var(--color-foreground)]">
                {formattedStock} {vehicleWord}
              </dd>
            </div>
          </dl>

          <div className="mt-10 flex flex-wrap items-center gap-3">
            {spotlight.href ? (
              <Link
                href={spotlight.href}
                className="motion-button inline-flex min-h-12 items-center gap-2 rounded-[var(--radius-lg)] bg-[var(--color-foreground)] px-7 py-3 text-[length:var(--text-button)] font-semibold text-[var(--color-background)] transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]"
              >
                View dealership
                <Icon icon={ArrowRight} aria-hidden className="size-4" />
              </Link>
            ) : null}

            <Link
              href={`/search?dealer=${encodeURIComponent(spotlight.dealer)}`}
              className="motion-button inline-flex min-h-12 items-center gap-2 rounded-[var(--radius-lg)] border border-[var(--color-border-strong)] bg-[var(--color-glass)] px-7 py-3 text-[length:var(--text-button)] font-semibold text-[var(--color-foreground)] backdrop-blur-[var(--glass-blur-sm)] transition-colors hover:bg-[var(--color-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]"
            >
              Browse inventory
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
