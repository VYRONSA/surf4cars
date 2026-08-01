import Link from "next/link";

import { Icon } from "@/components/ui/icons";
import { ArrowRight, BadgeCheck, Star } from "@/components/ui/icons/registry";
import { vehiclePolish } from "@/features/vehicle/config/vehicle-shared";
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
 */
export function VehicleDetailDealer({ dealer, className }: VehicleDetailDealerProps) {
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
          {dealer.verified && (
            <span className="inline-flex items-center gap-1.5 text-[length:var(--text-caption)] font-medium uppercase tracking-[0.14em] text-[var(--color-muted-foreground)]">
              <Icon icon={BadgeCheck} aria-hidden className="size-4 text-[var(--color-success)]" />
              Verified by SURF4CARS
            </span>
          )}
        </div>

        {/* One line of facts rather than three bordered tiles. */}
        <p className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)]">
          <span className="inline-flex items-center gap-1.5">
            <Icon icon={Star} aria-hidden className="size-4 text-[var(--color-accent)]" />
            <span className="font-medium text-[var(--color-foreground)]">
              {dealer.rating.toFixed(1)}
            </span>
            <span>({dealer.reviewCount} reviews)</span>
          </span>
          <Separator />
          <span>
            {dealer.yearsInBusiness} {dealer.yearsInBusiness === 1 ? "year" : "years"} in business
          </span>
          <Separator />
          <span>{dealer.vehiclesInStock} vehicles in stock</span>
          <Separator />
          <span>Responds {dealer.responseTime.toLowerCase()}</span>
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
