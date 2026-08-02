import Image from "next/image";
import Link from "next/link";

import { Icon } from "@/components/ui/icons";
import { ArrowRight, BadgeCheck, MapPin } from "@/components/ui/icons/registry";
import { PREMIUM_IMAGES } from "@/config/images/premium-images";
import { MediaAttribution, PhotographPending } from "@/components/ui/media";
import type { DealerSpotlight } from "@/features/marketplace/homepage/server/homepage-stock";

/**
 * Dealer Spotlight — the trust.
 *
 * The last section, and the only one about somebody other than the buyer. It replaces a three-card
 * dealer block that read as a directory: logo, name, "view profile". A directory tells you dealerships
 * exist. This is supposed to make one of them feel like a business you would walk into, because the
 * hardest thing a marketplace has to sell is not a car, it is the person selling it.
 *
 * Everything stated here is read from live stock. The dealership is chosen on stock depth — the one
 * claim the platform can currently stand behind — and the verification badge appears only where the
 * records actually carry it. Nothing here is a placeholder or a persuasive round number, because a
 * trust section that invents its evidence is worse than no trust section.
 *
 * The cover photograph comes from the premium library's dealer slot, so approving a candidate on the
 * review board re-dresses this section with no code change.
 */

export interface HomeDealerSpotlightProps {
  readonly spotlight: DealerSpotlight;
}

export function HomeDealerSpotlight({ spotlight }: HomeDealerSpotlightProps) {
  const formattedStock = spotlight.stockCount.toLocaleString("en-ZA").replace(/,/g, " ");

  return (
    <section
      aria-labelledby="spotlight-heading"
      className="border-y border-[var(--color-border-subtle)] bg-[var(--color-surface)]/40"
    >
      <div className="mx-auto w-full max-w-[var(--container-2xl)] px-6 py-20 sm:px-8 lg:px-10 lg:py-28">
        <p className="text-[length:var(--text-overline)] font-semibold uppercase tracking-[0.24em] text-[var(--color-muted)]">
          Dealer spotlight
        </p>

        <div className="mt-8 overflow-hidden rounded-[var(--radius-2xl)] border border-[var(--color-border)] bg-[var(--color-background)]">
          <div className="relative isolate aspect-[21/9] w-full">
            <Image
              src={PREMIUM_IMAGES.dealers.profile}
              alt=""
              fill
              sizes="100vw"
              className="object-cover"
            />
            <div
              aria-hidden
              className="absolute inset-0 bg-[linear-gradient(to_top,rgba(8,8,8,0.94)_0%,rgba(8,8,8,0.5)_44%,rgba(8,8,8,0.1)_82%)]"
            />
            <MediaAttribution mediaId="dealer-cover" />

            <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8 lg:p-10">
              <div className="flex flex-wrap items-center gap-3">
                {spotlight.verified && (
                  <span className="inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] bg-[var(--color-glass-strong)] px-3 py-1 text-[length:var(--text-caption)] font-semibold uppercase tracking-[0.14em] text-[var(--color-foreground)] backdrop-blur-[var(--glass-blur-sm)]">
                    <Icon icon={BadgeCheck} aria-hidden className="size-3.5 text-[var(--color-success)]" />
                    Verified dealer
                  </span>
                )}
                {spotlight.location && (
                  <span className="inline-flex items-center gap-1.5 text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)]">
                    <Icon icon={MapPin} aria-hidden className="size-4" />
                    {spotlight.location}
                  </span>
                )}
              </div>

              <div className="mt-4 flex items-center gap-4">
                {/* The dealership's own mark, and nothing in its place when they have not supplied
                    one — a generated monogram would be us inventing their branding. */}
                {spotlight.logoUrl ? (
                  <span className="inline-flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-[var(--radius-lg)] bg-[var(--color-glass-strong)] backdrop-blur-[var(--glass-blur-sm)]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={spotlight.logoUrl}
                      alt=""
                      className="size-full object-contain p-2"
                      loading="lazy"
                      decoding="async"
                    />
                  </span>
                ) : null}
                <h2
                  id="spotlight-heading"
                  className="max-w-2xl text-[length:var(--text-h2)] font-semibold leading-[1.08] tracking-[-0.02em] text-[var(--color-foreground)]"
                >
                  {spotlight.dealer}
                </h2>
              </div>

              {/* Written by the Founder on the placement. Absent rather than inferred from stock. */}
              {spotlight.speciality ? (
                <p className="mt-3 max-w-xl text-[length:var(--text-body-lg)] leading-relaxed text-[var(--color-muted-foreground)]">
                  {spotlight.speciality}
                </p>
              ) : null}

              <p className="mt-3 max-w-xl text-[length:var(--text-body-md)] text-[var(--color-muted-foreground)]">
                {formattedStock} vehicles on the marketplace.
              </p>

              {spotlight.href ? (
                <Link
                  href={spotlight.href}
                  className="motion-button mt-6 inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-lg)] bg-[var(--color-foreground)] px-6 py-3 text-[length:var(--text-button)] font-semibold text-[var(--color-background)] transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]"
                >
                  Visit {spotlight.dealer}
                  <Icon icon={ArrowRight} aria-hidden className="size-4" />
                </Link>
              ) : null}
            </div>
          </div>

          {spotlight.inventory.length > 0 && (
            <div className="p-6 sm:p-8 lg:p-10">
              <div className="flex flex-wrap items-baseline justify-between gap-4">
                <h3 className="text-[length:var(--text-h5)] font-semibold text-[var(--color-foreground)]">
                  From their floor
                </h3>
                <Link
                  href={`/search?dealer=${encodeURIComponent(spotlight.dealer)}`}
                  className="motion-button group inline-flex items-center gap-2 border-b border-[var(--color-border-strong)] pb-1 text-[length:var(--text-body-sm)] font-medium text-[var(--color-foreground)] hover:border-[var(--color-foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]"
                >
                  See all {formattedStock} vehicles
                  <Icon
                    icon={ArrowRight}
                    aria-hidden
                    className="size-4 transition-transform motion-hover group-hover:translate-x-1"
                  />
                </Link>
              </div>

              <ul className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
                {spotlight.inventory.map((listing) => (
                  <li key={listing.id}>
                    <Link
                      href={`/vehicle/${listing.slug}`}
                      className="group block overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-border)] motion-card hover:border-[var(--color-border-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]"
                    >
                      <div className="relative aspect-[3/2]">
                        {listing.imageSrc ? (
                          <Image
                            src={listing.imageSrc}
                            alt={listing.title}
                            fill
                            sizes="(max-width: 1024px) 50vw, 25vw"
                            style={{ objectPosition: listing.imagePosition }}
                            className="object-cover transition-transform duration-[var(--duration-slower)] ease-[var(--ease-premium)] group-hover:scale-[1.05]"
                          />
                        ) : (
                          <PhotographPending vehicleTitle={listing.title} />
                        )}
                      </div>
                      <div className="p-3">
                        <p className="truncate text-[length:var(--text-body-sm)] font-medium text-[var(--color-foreground)]">
                          {listing.title}
                        </p>
                        <p className="mt-1 text-[length:var(--text-body-sm)] font-semibold tabular-nums text-[var(--color-foreground)]">
                          {listing.price}
                        </p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
