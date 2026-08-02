import type { SearchQueryState } from "@/features/search/utils/search-query";
import { buildVehicleSearchQuery, serializeSearchState } from "@/features/search/utils/search-query";
import { createLogger } from "@/lib/observability/logger";
import { getVehicleSearchService } from "@/services/vehicle-engine";

const log = createLogger("search-intelligence");

/**
 * Why a search returned almost nothing, and which filter is responsible.
 *
 * WHAT THIS REPLACES
 * ==================
 * A page that said "Nothing matches that combination today" and offered four collections. Honest,
 * and useless at the moment it appears: the buyer knows nothing matched — what they cannot see is
 * *which* of the five things they asked for is the one doing the excluding.
 *
 * HOW THE ANSWER IS DERIVED
 * =========================
 * By actually running the search again with each filter removed in turn, and reporting what comes
 * back. No heuristics, no guessing at which filter is "probably" the narrow one: if dropping
 * "Manual" takes a search from 2 results to 47 and dropping "Diesel" takes it to 4, the buyer is
 * told the first one, because it is measurably true.
 *
 * WHY IT IS BOUNDED
 * =================
 * This costs one extra query per active filter, so it runs only when the result set is small enough
 * for the question to be worth asking. A healthy search does not pay for it.
 */

/** At or below this many results, a buyer needs help rather than a longer list. */
export const FEW_RESULTS_THRESHOLD = 4;

export interface RelaxOption {
  /** "Manual transmission", "Under R300 000" — the filter as the buyer set it. */
  readonly label: string;
  /** Results if this one filter were removed. */
  readonly count: number;
  /** The search with that filter dropped, ready to link. */
  readonly href: string;
}

export interface SearchIntelligence {
  readonly total: number;
  /** Every filter currently narrowing the search, in the buyer's words. */
  readonly activeFilters: readonly string[];
  /** Ordered by how much each would open up, widest first. Only ones that genuinely help. */
  readonly relax: readonly RelaxOption[];
}

const rand = (cents: number) => `R${Math.round(cents / 100).toLocaleString("en-ZA").replace(/,/g, " ")}`;

/**
 * Every filter this search is applying, paired with the state that would drop it.
 *
 * Written as data rather than as a chain of `if`s because the relax step needs both the label and
 * the reduced state for each one, and keeping those together is what stops a filter appearing in the
 * summary that the "remove" link then fails to remove.
 */
function describeFilters(state: SearchQueryState): readonly {
  readonly label: string;
  readonly without: SearchQueryState;
}[] {
  const entries: { label: string; without: SearchQueryState }[] = [];
  const drop = (key: keyof SearchQueryState): SearchQueryState => ({ ...state, [key]: undefined, page: 1 });

  if (state.make) entries.push({ label: state.make, without: drop("make") });
  if (state.model) entries.push({ label: state.model, without: drop("model") });
  if (state.bodyType) entries.push({ label: state.bodyType, without: drop("bodyType") });
  if (state.fuel) entries.push({ label: state.fuel, without: drop("fuel") });
  if (state.transmission) entries.push({ label: `${state.transmission} transmission`, without: drop("transmission") });
  if (state.province) entries.push({ label: state.province, without: drop("province") });
  if (state.priceMaxCents) entries.push({ label: `Under ${rand(state.priceMaxCents)}`, without: drop("priceMaxCents") });
  if (state.priceMinCents) entries.push({ label: `Over ${rand(state.priceMinCents)}`, without: drop("priceMinCents") });
  if (state.mileageMaxKm)
    entries.push({
      label: `Under ${state.mileageMaxKm.toLocaleString("en-ZA").replace(/,/g, " ")} km`,
      without: drop("mileageMaxKm"),
    });
  if (state.yearMin) entries.push({ label: `${state.yearMin} or newer`, without: drop("yearMin") });
  if (state.query) entries.push({ label: `“${state.query}”`, without: drop("query") });

  return entries;
}

export async function loadSearchIntelligence(
  state: SearchQueryState,
  total: number,
): Promise<SearchIntelligence | null> {
  const filters = describeFilters(state);

  /* Nothing to explain: either the search is returning plenty, or it is the whole marketplace and
     there is no filter to blame. */
  if (total > FEW_RESULTS_THRESHOLD || filters.length === 0) return null;

  try {
    const service = getVehicleSearchService();

    const measured = await Promise.all(
      filters.map(async (filter) => {
        const { total: without } = await service.searchListingsPage(
          buildVehicleSearchQuery({ ...filter.without, page: 1 }),
        );
        return {
          label: filter.label,
          count: without,
          href: `/search${serializeSearchState({ ...filter.without, page: 1 })}`,
        };
      }),
    );

    return {
      total,
      activeFilters: filters.map((filter) => filter.label),
      /* Only options that actually open the search up. A "remove this" link that returns the same
         two cars is a suggestion that wastes a click and costs trust. */
      relax: measured.filter((option) => option.count > total).sort((a, b) => b.count - a.count),
    };
  } catch (error) {
    log.error("search intelligence failed", {
      message: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}
