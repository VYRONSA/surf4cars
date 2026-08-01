import type { UnifiedVehicleRecord } from "@/domain/vehicle";

/**
 * The options the hero search offers, derived from the stock it will search.
 *
 * WHY THESE ARE NOT A CONSTANT
 * ============================
 * A hardcoded list of makes is a promise the marketplace cannot keep. Offer "Ferrari" in a dropdown
 * with no Ferrari on the platform and the visitor's first action returns nothing — on the hero,
 * before they have seen a single car. The one thing a search control must never do is teach somebody
 * that searching here does not work.
 *
 * So every option below comes from the same `visible` array the rest of the homepage is built from.
 * If a make is listed, there is stock behind it; the counts are real; and when the last Hilux sells,
 * the option disappears on the next render without anyone editing a file.
 *
 * This is the same rule AGENTS.md states for contact details, applied to search vocabulary: an
 * option that looks plausible and returns nothing is worse than an option that was never offered.
 *
 * MODELS ARE KEYED BY MAKE
 * ========================
 * "3 Series" is meaningless without BMW, and a flat model list would let somebody select
 * Toyota + 3 Series and get an empty page they had every reason to expect results from. The hero
 * narrows models to the selected make and disables the control until one is chosen.
 */

export interface FacetOption {
  readonly value: string;
  readonly count: number;
}

export interface SearchFacets {
  readonly makes: readonly FacetOption[];
  /** Models available per make, keyed by the exact make string used in `makes`. */
  readonly modelsByMake: Readonly<Record<string, readonly FacetOption[]>>;
  readonly bodyTypes: readonly FacetOption[];
  readonly provinces: readonly FacetOption[];
  /**
   * Dealerships with at least one vehicle a buyer can actually reach.
   *
   * Counted rather than taken from a status column, because there is no verification column to take
   * it from: `vehicle-platform.repository.ts` hardcodes `verified: true` — along with a 4.8 rating
   * and 24 reviews — for every dealership on the platform. A hero that said "128 verified dealers"
   * would be repeating that fabrication in the largest type on the site.
   *
   * "Dealerships listing stock" is a fact. It is also the more useful number: it tells a buyer how
   * much of the market is here.
   */
  readonly dealershipCount: number;
}

export const EMPTY_FACETS: SearchFacets = {
  makes: [],
  modelsByMake: {},
  bodyTypes: [],
  provinces: [],
  dealershipCount: 0,
};

const byCountThenName = (a: FacetOption, b: FacetOption) =>
  b.count - a.count || a.value.localeCompare(b.value);

/** Alphabetical, because a dropdown is scanned for a known name rather than ranked. */
const byName = (a: FacetOption, b: FacetOption) => a.value.localeCompare(b.value);

function tally(counts: Map<string, number>, value: string | null | undefined): void {
  const trimmed = value?.trim();
  if (!trimmed) return;
  counts.set(trimmed, (counts.get(trimmed) ?? 0) + 1);
}

const toOptions = (counts: Map<string, number>): FacetOption[] =>
  [...counts].map(([value, count]) => ({ value, count }));

export function buildSearchFacets(visible: readonly UnifiedVehicleRecord[]): SearchFacets {
  const makes = new Map<string, number>();
  const bodyTypes = new Map<string, number>();
  const provinces = new Map<string, number>();
  const models = new Map<string, Map<string, number>>();
  const dealerships = new Set<string>();

  for (const record of visible) {
    const make = record.core.make?.trim();
    tally(makes, make);
    tally(bodyTypes, record.core.bodyType);
    tally(provinces, record.dealer?.province);
    if (record.tenantId) dealerships.add(record.tenantId);

    const model = record.core.model?.trim();
    if (make && model) {
      const forMake = models.get(make) ?? new Map<string, number>();
      forMake.set(model, (forMake.get(model) ?? 0) + 1);
      models.set(make, forMake);
    }
  }

  const modelsByMake: Record<string, readonly FacetOption[]> = {};
  for (const [make, counts] of models) {
    modelsByMake[make] = toOptions(counts).sort(byName);
  }

  return {
    /* Makes by depth of stock: the marques a visitor is most likely to want are the ones the
       marketplace actually has, and a 40-item alphabetical list buries them. */
    makes: toOptions(makes).sort(byCountThenName),
    modelsByMake,
    bodyTypes: toOptions(bodyTypes).sort(byCountThenName),
    provinces: toOptions(provinces).sort(byName),
    dealershipCount: dealerships.size,
  };
}

/**
 * Price bands, in cents, matching the `priceMin` / `priceMax` the search route already parses.
 *
 * Fixed rather than derived. A band computed from current stock moves every time a car is listed,
 * so the same dropdown offers "Under R247 000" one day and "Under R251 000" the next — which reads
 * as a bug and makes a shared link meaningless. Round numbers are what people search in.
 */
export const PRICE_BANDS: readonly { readonly label: string; readonly cents: number }[] = [
  { label: "R50 000", cents: 5_000_000 },
  { label: "R100 000", cents: 10_000_000 },
  { label: "R150 000", cents: 15_000_000 },
  { label: "R200 000", cents: 20_000_000 },
  { label: "R300 000", cents: 30_000_000 },
  { label: "R400 000", cents: 40_000_000 },
  { label: "R500 000", cents: 50_000_000 },
  { label: "R750 000", cents: 75_000_000 },
  { label: "R1 000 000", cents: 100_000_000 },
  { label: "R1 500 000", cents: 150_000_000 },
  { label: "R2 000 000", cents: 200_000_000 },
];
