import Link from "next/link";

import { Icon } from "@/components/ui/icons";
import { ArrowRight, BadgeCheck } from "@/components/ui/icons/registry";
import { vehiclePolish } from "@/features/vehicle/config/vehicle-shared";
import { describeVerificationForCustomer } from "@/domain/vehicle";
import type { VehicleDealerProfile } from "@/features/vehicle/types/vehicle.types";
import { cn } from "@/utils";

export interface VehicleDetailDealerProps {
  readonly dealer: VehicleDealerProfile;
  readonly className?: string;
}

/**
 * Who is selling it.
 *
 * Was a glass card containing a 64px monogram tile, the name, a red Verified badge, a star rating, a
 * response time, and then three further bordered tiles inside it — each with its own icon, label and
 * value — for years in business, vehicles in stock and dealer type. Six containers to say four things
 * about a business, on a page already carrying nine such cards.
 *
 * "Dealer type: Premium franchise" has gone entirely. It was hardcoded on every listing regardless of
 * the dealership, which makes it a claim about somebody else's business that nobody checked — exactly
 * the kind of believable fabrication that is worse than an obvious gap.
 *
 * PCP-032: THE REST OF IT WENT THE SAME WAY
 * =========================================
 * This card was still printing a 4.8 star rating from 24 reviews, eight years in business and
 * "responds within 15 minutes" — for every dealership on the platform, from five hardcoded literals.
 * There is no reviews table in this schema, no response-time measurement and no trading-since date.
 *
 * One number survived: vehicles in stock, which was always counted from live listings.
 *
 * What replaces the rest is not a smaller set of claims — it is an honest absence. A dealership with
 * no reviews reads "No reviews yet", because that is a fact and it is also useful: it tells a buyer
 * this is a new listing rather than one everybody has ignored.
 */
export function VehicleDetailDealer({ dealer, className }: VehicleDetailDealerProps) {
  const verificationLabel = describeVerificationForCustomer(dealer.verificationStatus);

  /*
    "No reviews yet" is stated; everything unknown is simply absent.
    ==============================================================
    The difference matters. Zero reviews is a measured fact and worth saying — it tells a buyer the
    silence is newness rather than a bad record. An unknown response time is not a fact about the
    dealership at all, it is a gap in our instrumentation, and printing "Response time unknown"
    would make our missing data look like their shortcoming.
  */
  const facts = [
    dealer.rating !== null && dealer.reviewCount > 0
      ? `${dealer.rating.toFixed(1)} from ${dealer.reviewCount} review${dealer.reviewCount === 1 ? "" : "s"}`
      : "No reviews yet",
    dealer.yearsInBusiness !== null
      ? `${dealer.yearsInBusiness} ${dealer.yearsInBusiness === 1 ? "year" : "years"} in business`
      : null,
    dealer.vehiclesInStock > 0
      ? `${dealer.vehiclesInStock} ${dealer.vehiclesInStock === 1 ? "vehicle" : "vehicles"} in stock`
      : null,
    dealer.responseTime ? `Responds ${dealer.responseTime.toLowerCase()}` : null,
  ].filter((fact): fact is string => Boolean(fact));

  return (
    <section className={cn(vehiclePolish.section, className)} aria-labelledby="vehicle-dealer-heading">
      <h2 id="vehicle-dealer-heading" className={vehiclePolish.sectionTitle}>
        The dealership
      </h2>

      <div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <h3 className="text-[length:var(--text-h5)] font-semibold tracking-[var(--tracking-heading)]">
            {dealer.name}
          </h3>
          {verificationLabel && (
            <span className="inline-flex items-center gap-1.5 text-[length:var(--text-caption)] font-medium uppercase tracking-[0.14em] text-[var(--color-muted-foreground)]">
              <Icon icon={BadgeCheck} aria-hidden className="size-4 text-[var(--color-success)]" />
              {verificationLabel}
            </span>
          )}
        </div>

        {/*
          Only the facts that exist, joined by separators that adapt to how many there are.
          ==============================================================================
          Built from an array rather than written inline because the number of facts is now variable.
          Hardcoding four with three separators is how a card ends up reading "· · 12 vehicles in
          stock" the first time one of them is missing.
        */}
        <p className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)]">
          {facts.map((fact, index) => (
            <span key={fact} className="inline-flex items-center gap-3">
              {index > 0 && <Separator />}
              <span>{fact}</span>
            </span>
          ))}
        </p>

        <Link
          href={`/dealers/${dealer.slug}`}
          className="motion-button group mt-6 inline-flex items-center gap-2 border-b border-[var(--color-border-strong)] pb-1 text-[length:var(--text-body-md)] font-medium text-[var(--color-foreground)] hover:border-[var(--color-foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]"
        >
          See everything {dealer.name} has
          <Icon
            icon={ArrowRight}
            aria-hidden
            className="size-4 transition-transform motion-hover group-hover:translate-x-0.5"
          />
        </Link>
      </div>
    </section>
  );
}

function Separator() {
  return (
    <span aria-hidden className="text-[var(--color-border-strong)]">
      /
    </span>
  );
}
