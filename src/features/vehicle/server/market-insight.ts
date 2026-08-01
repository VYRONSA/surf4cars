/**
 * Market insight, computed from the marketplace's own stock.
 *
 * Every number here is derived from vehicles genuinely listed on SURF4CARS right now. Nothing is modelled,
 * predicted or bought in. That constraint is what makes the module worth showing: a buyer can verify any
 * claim it makes by running the same search.
 *
 * The alternative — a "market value" figure from a valuation model we do not have — would be the single
 * most damaging thing this page could contain. A confident wrong valuation costs a buyer money and costs
 * the platform its only real asset, which is that its numbers can be trusted.
 *
 * Where the comparison set is too small to say anything, this returns null and the page says so.
 */
import type { UnifiedVehicleRecord } from "@/domain/vehicle";
import { isMarketplaceVisible } from "@/services/vehicle-engine/vehicle-projection.service";
import { getVehicleEngine } from "@/services/vehicle-engine";
import { createLogger } from "@/lib/observability/logger";

const log = createLogger("market-insight");

/**
 * Below this, percentiles are noise.
 *
 * Three comparable cars cannot establish a market position — "cheaper than one of the other two" is not
 * insight, and dressing it up as one is how a trustworthy module becomes a misleading one.
 */
const MINIMUM_COMPARABLES = 4;

export interface MarketInsight {
  readonly make: string;
  readonly model: string;
  /** How many comparable vehicles this is measured against, excluding itself. */
  readonly comparableCount: number;
  readonly lowestPrice: number;
  readonly highestPrice: number;
  readonly medianPrice: number;
  /** 0–100. The share of comparables priced below this one. */
  readonly pricePercentile: number;
  readonly medianMileageKm: number;
  readonly mileageKm: number;
  /** Plain-language position, for a heading. */
  readonly standing: "below-market" | "around-market" | "above-market";
}

const median = (values: readonly number[]): number => {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? Math.round(((sorted[middle - 1] ?? 0) + (sorted[middle] ?? 0)) / 2)
    : (sorted[middle] ?? 0);
};

/**
 * Compare one vehicle against every other listing of the same make and model.
 *
 * Matched on make and model rather than on variant: variants split the set into ones and twos, and a buyer
 * comparing an XC60 B4 against other XC60s is making the comparison they actually care about. Year and
 * mileage differences are surfaced alongside the price rather than corrected for — an adjustment model is
 * exactly the kind of invented precision this module exists to avoid.
 */
export async function loadMarketInsight(vehicle: {
  readonly id: string;
  readonly make: string;
  readonly model: string;
  readonly priceNumeric: number;
  readonly mileage: string;
}): Promise<MarketInsight | null> {
  if (!vehicle.make || !vehicle.model) return null;

  try {
    const all = await getVehicleEngine().listPublishable();

    const comparables = all.filter(
      (record: UnifiedVehicleRecord) =>
        record.id !== vehicle.id &&
        isMarketplaceVisible(record) &&
        record.core.make === vehicle.make &&
        record.core.model === vehicle.model,
    );

    if (comparables.length < MINIMUM_COMPARABLES) return null;

    const prices = comparables.map((record) => Math.round(record.pricing.sellingPriceCents / 100));
    const mileages = comparables.map((record) => record.core.mileageKm);

    const cheaper = prices.filter((price) => price < vehicle.priceNumeric).length;
    const pricePercentile = Math.round((cheaper / prices.length) * 100);

    /* A ±12% band around the median reads as "about the same money" to a buyer. Outside it, the
       difference is large enough to be worth a sentence. */
    const medianPrice = median(prices);
    const ratio = medianPrice > 0 ? vehicle.priceNumeric / medianPrice : 1;
    const standing = ratio < 0.88 ? "below-market" : ratio > 1.12 ? "above-market" : "around-market";

    return {
      make: vehicle.make,
      model: vehicle.model,
      comparableCount: comparables.length,
      lowestPrice: Math.min(...prices),
      highestPrice: Math.max(...prices),
      medianPrice,
      pricePercentile,
      medianMileageKm: median(mileages),
      mileageKm: Number(String(vehicle.mileage).replace(/[^\d]/g, "")) || 0,
      standing,
    };
  } catch (error) {
    /* Insight is an enhancement — a failure here must never take the listing down with it. */
    log.error("market insight failed", {
      message: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}
