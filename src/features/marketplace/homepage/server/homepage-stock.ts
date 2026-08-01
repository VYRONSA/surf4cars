import { isApprovedForHomepage } from "@/config/editorial/editorial-curation";
import { loadEditorial, placementsForSlot } from "@/services/editorial/editorial.service";
import { selectFeatured } from "@/services/presentation";
import { getVehicleEngine } from "@/services/vehicle-engine/vehicle-engine.service";
import { toShowcaseVehicleListing } from "@/services/vehicle-engine/vehicle-projection.service";
import type { ShowcaseVehicleListing } from "@/features/search/config/search-showcase-listings";
import { createLogger } from "@/lib/observability/logger";

import { buildSearchFacets, EMPTY_FACETS, type SearchFacets } from "./homepage-facets";

const log = createLogger("homepage-stock");

export interface HomepageStock {
  /** Best-presented stock — complete listings with real photography. */
  readonly featured: readonly ShowcaseVehicleListing[];
  /**
   * Every published editorial collection, in the order the Founder arranged them.
   *
   * An array rather than a fixed field, because a campaign is a slot: "Spring Collection",
   * "Founder's Collection", "Performance Week" are the same shape as each other and as everything
   * that came before. Adding one is publishing a row, not shipping a deploy.
   */
  readonly collections: readonly EditorialSection[];
  /** Total marketplace-visible count, used for the hero's search label. */
  readonly total: number;
  /** Live stock count per body type, so category tiles state a real number. */
  readonly countsByBodyType: Readonly<Record<string, number>>;
  /** Live stock count per manufacturer, so the brand rail never offers a dead end. */
  readonly countsByMake: Readonly<Record<string, number>>;
  /**
   * The option lists the hero search offers, derived from this same stock.
   *
   * Carried on the stock payload rather than fetched separately so the dropdowns and the counts they
   * sit beside can never disagree — one read of the marketplace, one answer.
   */
  readonly facets: SearchFacets;
  /** The dealership with the deepest visible stock, and its best-presented vehicles. */
  readonly spotlight: DealerSpotlight | null;
  /**
   * Whether a person chose what is on this page.
   *
   * Carried so the Founder Editorial Console can say which of the two the marketplace is currently
   * rendering. The two are visually identical and editorially opposite.
   */
  readonly curated: boolean;
}

/** A curated rail on the homepage — a collection, a campaign, the Founder's own picks. */
export interface EditorialSection {
  readonly key: string;
  readonly headline: string;
  readonly description: string | null;
  readonly listings: readonly ShowcaseVehicleListing[];
}

/** One dealership, presented as itself rather than as a row in a directory. */
export interface DealerSpotlight {
  readonly dealer: string;
  readonly location: string;
  readonly stockCount: number;
  readonly verified: boolean;
  readonly inventory: readonly ShowcaseVehicleListing[];
}

const EMPTY: HomepageStock = {
  featured: [],
  collections: [],
  total: 0,
  countsByBodyType: {},
  countsByMake: {},
  facets: EMPTY_FACETS,
  spotlight: null,
  curated: false,
};

/**
 * Grid shapes, not counts.
 *
 * How many cards actually fill these rows is `tileableCount`'s problem — the featured grid gives its first
 * card two of three columns, which makes the tileable totals 2, 5 and 8 rather than 3, 6 and 9. That
 * arithmetic was got wrong by hand twice before it moved into the presentation layer.
 */
const FEATURED_GRID = { columns: 3, leadSpan: 2, limit: 5, editorial: true, mixed: true } as const;
const COLLECTION_GRID = { columns: 3, limit: 3, editorial: true, mixed: true } as const;
const SPOTLIGHT_GRID = { columns: 4, limit: 4 } as const;

/**
 * Loads the vehicles shown on the homepage from live marketplace stock.
 *
 * Featured stock is ranked by listing quality rather than recency: a buyer's first impression of the
 * marketplace should be its best-presented vehicles, and completeness is the honest proxy for that.
 * Vehicles without photography are excluded outright — on a page whose premise is "photography is
 * the product", an image-less card is worse than one fewer card.
 *
 * A read failure degrades to empty. The homepage renders its non-vehicle sections and omits the
 * vehicle ones; it never falls back to invented listings.
 */
export async function loadHomepageStock(): Promise<HomepageStock> {
  try {
    const engine = getVehicleEngine();
    const visible = await engine.listPublishable();

    const countsByBodyType: Record<string, number> = {};
    const countsByMake: Record<string, number> = {};
    for (const record of visible) {
      const bodyType = record.core.bodyType;
      if (bodyType) countsByBodyType[bodyType] = (countsByBodyType[bodyType] ?? 0) + 1;
      const make = record.core.make?.trim();
      if (make) countsByMake[make] = (countsByMake[make] ?? 0) + 1;
    }

    const listings = visible
      .map(toShowcaseVehicleListing)
      .filter((listing) => Boolean(listing.imageSrc));

    if (listings.length === 0) {
      return { ...EMPTY, total: visible.length, countsByBodyType, countsByMake, facets: buildSearchFacets(visible) };
    }

    /**
     * Ranked by listing completeness, then presented by the shared layer.
     *
     * Curation, one-card-per-photograph and the grid arithmetic all belong to `selectFeatured` — this
     * loader's only remaining opinion is the *order*, which is genuinely the homepage's to hold: a shop
     * window leads with its best-presented stock.
     */
    const byScore = [...listings].sort((a, b) => b.aiMatchScore - a.aiMatchScore);

    /* The Founder's allowlist, when there is one. Empty means "not curated yet", and the shop window
       falls back to the editorial photography standard rather than showing nothing. See
       `src/config/editorial/editorial-curation.ts`. */
    const curatable = byScore.filter((listing) => isApprovedForHomepage(listing.slug));

    /*
      Curation first, algorithm second.
      =================================
      The Founder's published choices win outright when they exist. Where a slot is empty or the
      editorial tables have not been created yet, the shop window falls back to the selection it has
      always made — so the marketplace never goes blank waiting for somebody to curate it, and the
      console reports which of the two is live rather than leaving it to be inferred.
    */
    const editorial = await loadEditorial({ publishedOnly: true });
    const byId = new Map(listings.map((listing) => [listing.id, listing]));

    const fromSlot = (slotKey: string): readonly ShowcaseVehicleListing[] =>
      placementsForSlot(editorial.value, slotKey)
        .map((placement) => byId.get(placement.subjectId))
        .filter((listing): listing is ShowcaseVehicleListing => Boolean(listing));

    /*
      CURATED FIRST, ALGORITHM SECOND — AND THAT ORDER IS LOAD-BEARING
      ===============================================================
      This block used to run the algorithmic featured rail first, reserve its photographs, and only
      then build the curated collections around what was left. A launch simulation caught what that
      costs: publishing three Founder's Picks rendered **one**. The other two shared a library
      photograph with a car the algorithm had already placed above, and the duplicate guard silently
      dropped them.

      Silently overruling a deliberate editorial choice is the one thing this system exists not to
      do. So the order is inverted: every curated placement is collected and its photographs
      reserved before the algorithm is allowed to choose anything, and the fallback rails are then
      built from what remains.

      The duplicate guard still runs — a page showing one photograph twice looks generated whatever
      the reason — but it now resolves in favour of the person, not the ranking.
    */
    const reserved = new Set<string>();

    const curatedFeatured = fromSlot("homepage-featured");
    for (const listing of curatedFeatured) reserved.add(listing.imageSrc);

    const curatedSections: EditorialSection[] = [];
    for (const entry of editorial.value) {
      if (entry.slot.kind !== "collection") continue;

      /* Deduped against earlier *curated* rails only. Two collections showing the same car is still
         a mistake, and the earlier slot wins because the Founder ordered them. */
      const chosen = fromSlot(entry.slot.key).filter((listing) => !reserved.has(listing.imageSrc));
      if (chosen.length === 0) continue;

      for (const listing of chosen) reserved.add(listing.imageSrc);
      curatedSections.push({
        key: entry.slot.key,
        headline: entry.slot.headline ?? entry.slot.title,
        description: entry.slot.description,
        listings: chosen,
      });
    }

    /* The algorithm now fills what curation left, never the other way round. */
    const featuredSelection = selectFeatured(curatable, FEATURED_GRID, reserved);
    const featured = curatedFeatured.length > 0 ? curatedFeatured : featuredSelection.listings;

    /* Nothing curated yet — the marketplace still needs a second rail, so the algorithm supplies one
       and says what it is. It disappears the moment a real collection is published. */
    const collections: EditorialSection[] = curatedSections.length > 0
      ? curatedSections
      : [
          {
            key: "weekend-escapes",
            headline: "Weekend escapes",
            description:
              "Cars for the drive you take because you want to, not because you have to.",
            listings: selectFeatured(curatable, COLLECTION_GRID, featuredSelection.usedImages).listings,
          },
        ].filter((section) => section.listings.length > 0);

    /**
     * The spotlight dealership.
     *
     * Chosen on stock depth, because that is the only claim the platform can actually stand behind
     * today — "most vehicles on the marketplace" is true or it is not. It is deliberately not a paid
     * placement dressed as an editorial choice, and when advertising does fund this slot the reason a
     * dealership appears here should change with it, visibly.
     */
    const byDealer = new Map<string, ShowcaseVehicleListing[]>();
    for (const listing of listings) {
      if (!listing.dealer) continue;
      const existing = byDealer.get(listing.dealer);
      if (existing) existing.push(listing);
      else byDealer.set(listing.dealer, [listing]);
    }

    const deepest = [...byDealer.entries()].sort((a, b) => b[1].length - a[1].length)[0];
    const spotlight: DealerSpotlight | null = deepest
      ? {
          dealer: deepest[0],
          location: deepest[1][0]?.location ?? "",
          stockCount: deepest[1].length,
          verified: deepest[1].some((listing) => listing.verified),
          inventory: selectFeatured(
            [...deepest[1]].sort((a, b) => b.aiMatchScore - a.aiMatchScore),
            SPOTLIGHT_GRID,
          ).listings,
        }
      : null;

    return {
      featured,
      collections,
      total: visible.length,
      countsByBodyType,
      countsByMake,
      facets: buildSearchFacets(visible),
      spotlight,
      curated: curatedFeatured.length > 0 || curatedSections.length > 0,
    };
  } catch (error) {
    log.error("homepage stock read failed", {
      message: error instanceof Error ? error.message : String(error),
    });
    return EMPTY;
  }
}
