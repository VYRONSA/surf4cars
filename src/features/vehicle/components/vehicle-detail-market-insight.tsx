import { Icon } from "@/components/ui/icons";
import { Info } from "@/components/ui/icons/registry";
import { ProvenanceNote } from "@/components/ui/shared";
import type { MarketInsight } from "@/features/vehicle/server/market-insight";
import { VehicleUnavailable } from "@/features/vehicle/components/vehicle-unavailable";
import { vehiclePolish } from "@/features/vehicle/config/vehicle-shared";
import { cn } from "@/utils";

/**
 * Where this vehicle sits against the rest of the marketplace.
 *
 * Every figure comes from stock listed on SURF4CARS today — see `loadMarketInsight`. Nothing is modelled
 * or bought in, which is the whole reason it is worth showing: a buyer can check any claim here by running
 * the same search.
 *
 * What it deliberately does not say is what the car is *worth*. We have no valuation model, and a confident
 * wrong valuation would cost a buyer real money. "Priced below 8 of 12 comparable XC60s" is a fact;
 * "market value R 740 000" would be a guess wearing a suit.
 */

const rand = (value: number) => `R ${Math.round(value).toLocaleString("en-ZA").replace(/,/g, " ")}`;
const km = (value: number) => `${Math.round(value).toLocaleString("en-ZA").replace(/,/g, " ")} km`;

const STANDING_COPY = {
  "below-market": {
    headline: "Priced below most comparable listings",
    tone: "text-[var(--color-success)]",
  },
  "around-market": {
    headline: "Priced in line with comparable listings",
    tone: "text-[var(--color-foreground)]",
  },
  "above-market": {
    headline: "Priced above most comparable listings",
    tone: "text-[var(--color-warning)]",
  },
} as const;

export interface VehicleDetailMarketInsightProps {
  readonly insight: MarketInsight | null;
  readonly price: number;
  readonly className?: string;
}

export function VehicleDetailMarketInsight({
  insight,
  price,
  className,
}: VehicleDetailMarketInsightProps) {
  return (
    <section className={cn(vehiclePolish.section, className)} aria-labelledby="market-insight-heading">
      <h2 id="market-insight-heading" className={cn(vehiclePolish.sectionTitle, "mb-6")}>
        How this compares
      </h2>

      {!insight ? (
        <VehicleUnavailable
          title="Not enough comparable stock to draw a conclusion"
          detail="Market position is only shown when at least four comparable vehicles of the same make and model are listed. Below that, a percentage would be arithmetic rather than insight."
        />
      ) : (
        <div className="rounded-[var(--radius-2xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 lg:p-8">
          <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
            <h3
              className={cn(
                "text-[length:var(--text-h4)] font-semibold tracking-[-0.015em]",
                STANDING_COPY[insight.standing].tone,
              )}
            >
              {STANDING_COPY[insight.standing].headline}
            </h3>
            <div className="text-right">
              <p className="text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)]">
                Against {insight.comparableCount} other {insight.make} {insight.model}
                {insight.comparableCount === 1 ? "" : "s"} on SURF4CARS
              </p>
              {/* Counted stock, derived position — the two halves of this module have different footing. */}
              <ProvenanceNote kind="calculated" label="Position calculated from live listings" className="mt-1.5" />
            </div>
          </div>

          {/*
            One bar, showing the real spread and where this car falls in it. A range a buyer can see is
            more useful than a score they have to trust.
          */}
          <div className="mt-8">
            <div className="relative h-2 rounded-[var(--radius-pill)] bg-[var(--color-surface-sunken)]">
              <div
                className="absolute inset-y-0 rounded-[var(--radius-pill)] bg-[var(--color-border-strong)]"
                style={{ left: "0%", right: "0%" }}
                aria-hidden
              />
              <div
                className="absolute -top-1 size-4 -translate-x-1/2 rounded-full border-2 border-[var(--color-background)] bg-[var(--color-primary)]"
                style={{ left: `${Math.min(98, Math.max(2, insight.pricePercentile))}%` }}
                aria-hidden
              />
            </div>

            <div className="mt-3 flex justify-between text-[length:var(--text-body-sm)] tabular-nums text-[var(--color-muted-foreground)]">
              <span>{rand(insight.lowestPrice)}</span>
              <span className="font-semibold text-[var(--color-foreground)]">{rand(price)}</span>
              <span>{rand(insight.highestPrice)}</span>
            </div>
            <p className="mt-1 text-center text-[length:var(--text-caption)] uppercase tracking-[0.16em] text-[var(--color-muted)]">
              Lowest · this vehicle · highest
            </p>
          </div>

          <dl className="mt-8 grid gap-6 border-t border-[var(--color-border-subtle)] pt-6 sm:grid-cols-3">
            <div>
              <dt className="text-[length:var(--text-caption)] uppercase tracking-[0.16em] text-[var(--color-muted)]">
                Median asking price
              </dt>
              <dd className="mt-1 text-[length:var(--text-h5)] font-semibold tabular-nums text-[var(--color-foreground)]">
                {rand(insight.medianPrice)}
              </dd>
            </div>
            <div>
              <dt className="text-[length:var(--text-caption)] uppercase tracking-[0.16em] text-[var(--color-muted)]">
                Priced below
              </dt>
              <dd className="mt-1 text-[length:var(--text-h5)] font-semibold tabular-nums text-[var(--color-foreground)]">
                {100 - insight.pricePercentile}% of them
              </dd>
            </div>
            <div>
              <dt className="text-[length:var(--text-caption)] uppercase tracking-[0.16em] text-[var(--color-muted)]">
                Median mileage
              </dt>
              <dd className="mt-1 text-[length:var(--text-h5)] font-semibold tabular-nums text-[var(--color-foreground)]">
                {km(insight.medianMileageKm)}
              </dd>
            </div>
          </dl>

          {/*
            The honesty note. Price is one variable; condition, history and specification are others we do
            not model. Saying so is what separates intelligence from a scoreboard.
          */}
          <p className="mt-6 flex items-start gap-2 text-[length:var(--text-body-sm)] leading-relaxed text-[var(--color-muted)]">
            <Icon icon={Info} aria-hidden className="mt-0.5 size-4 shrink-0" />
            <span>
              Compared on make and model only. Condition, service history, specification and mileage all
              move price, and this comparison does not adjust for them — a higher asking price is often the
              better car. {insight.mileageKm > 0 && (
                <>
                  This example shows {km(insight.mileageKm)} against a median of {km(insight.medianMileageKm)}.
                </>
              )}
            </span>
          </p>
        </div>
      )}
    </section>
  );
}

