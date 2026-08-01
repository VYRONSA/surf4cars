import { vehiclePolish } from "@/features/vehicle/config/vehicle-shared";
import type { MarketInsight } from "@/features/vehicle/server/market-insight";
import type { VehicleDetail } from "@/features/vehicle/types/vehicle.types";
import { cn } from "@/utils";

/**
 * Key highlights — the two or three things about this car worth knowing before the specification.
 *
 * WHAT THIS IS NOT
 * ================
 * It is not a summary of the specification table below it, and it is not a marketing list. The
 * temptation with a section called "highlights" is to fill it — "Diesel engine", "SUV body",
 * "Finished in Fusion Red" — which is exactly what the old Features section did, one heading above
 * the table it was restating. Restating a fact does not promote it to a highlight.
 *
 * WHAT EARNS A PLACE
 * ==================
 * A fact is a highlight only when it is *comparative* or *unusual*: something a buyer could not have
 * assumed from the make, model and year at the top of the page. Every entry below is computed from a
 * real measurement against real marketplace stock, and every one of them can be checked by running
 * the same search.
 *
 * Where nothing qualifies, the section does not render. An empty highlights strip is better than a
 * padded one, and a padded one is how a buyer learns to skip the section entirely.
 */

export interface VehicleDetailHighlightsProps {
  readonly vehicle: VehicleDetail;
  readonly insight: MarketInsight | null;
  readonly className?: string;
}

interface Highlight {
  readonly id: string;
  readonly value: string;
  readonly detail: string;
}

const formatKm = (km: number): string => `${Math.round(km).toLocaleString("en-ZA").replace(/,/g, " ")} km`;

function buildHighlights(vehicle: VehicleDetail, insight: MarketInsight | null): Highlight[] {
  const highlights: Highlight[] = [];

  /*
    Distance against the median for this exact model.

    The single most useful comparative fact a used-car page can carry, and the one a buyer cannot
    work out alone. Only stated when the gap is worth stating: within 15% of the median is "an
    ordinary example", and calling that a highlight would be the padding this section exists without.
  */
  if (insight && insight.medianMileageKm > 0) {
    const ratio = insight.mileageKm / insight.medianMileageKm;
    if (ratio <= 0.85) {
      highlights.push({
        id: "mileage",
        value: formatKm(insight.mileageKm),
        detail: `Against a median of ${formatKm(insight.medianMileageKm)} across ${insight.comparableCount} comparable ${insight.model} listings.`,
      });
    }
  }

  /* Price position, but only where it favours the buyer — and only as the percentile itself, which
     is a measurement, rather than as "a great deal", which is a claim. */
  if (insight && insight.standing === "below-market" && insight.comparableCount >= 4) {
    highlights.push({
      id: "price",
      value: `Below ${100 - insight.pricePercentile}% of comparable listings`,
      detail: `Measured against ${insight.comparableCount} other ${insight.make} ${insight.model} on SURF4CARS right now.`,
    });
  }

  /*
    Photographic completeness.

    A highlight rather than a boast: on a marketplace where most listings carry a handful of frames,
    a fully photographed car is genuinely rarer, and it is the thing this platform asks dealers for.
  */
  const dealerPhotographs = vehicle.gallery.filter((image) => image.provenance === "dealer").length;
  if (dealerPhotographs >= 6) {
    highlights.push({
      id: "photography",
      value: `${dealerPhotographs} photographs`,
      detail: "Taken by the dealership, of this vehicle — inside, outside and underneath.",
    });
  }

  return highlights;
}

export function VehicleDetailHighlights({
  vehicle,
  insight,
  className,
}: VehicleDetailHighlightsProps) {
  const highlights = buildHighlights(vehicle, insight);

  if (highlights.length === 0) return null;

  return (
    <section
      className={cn(vehiclePolish.section, className)}
      aria-labelledby="vehicle-highlights-heading"
    >
      <h2 id="vehicle-highlights-heading" className={vehiclePolish.sectionTitle}>
        Worth knowing
      </h2>

      <ul className="grid gap-x-12 gap-y-8 sm:grid-cols-2">
        {highlights.map((highlight) => (
          <li key={highlight.id}>
            <p className="text-[length:var(--text-h4)] font-semibold tracking-[-0.02em] text-[var(--color-foreground)]">
              {highlight.value}
            </p>
            <p className="mt-2 text-[length:var(--text-body-sm)] leading-relaxed text-[var(--color-muted-foreground)]">
              {highlight.detail}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
