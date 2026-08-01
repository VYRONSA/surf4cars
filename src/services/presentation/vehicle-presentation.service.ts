/**
 * SURF FOR CARS — vehicle presentation.
 *
 * One answer to "how do we show vehicles", for every surface that shows them.
 *
 * WHY THIS EXISTS
 * ===============
 * The rules for presenting stock were invented three times, on three pages, and drifted immediately.
 * The homepage deduplicated repeated models; the marketplace did not, so the same Hilux Raider appeared
 * twice on one screen. The homepage filtered unusable photography; the search page and the "similar
 * vehicles" rail did not, so a customer one click from a curated shop window was shown a road traffic
 * collision. Each page's rules were individually defensible and collectively incoherent.
 *
 * The failure mode is worth naming, because it will recur otherwise: presentation logic written inside a
 * page is invisible to every other page, so improving it improves one surface and silently widens the gap
 * to the rest. There is no "homepage version" of quality. There is one standard, and when it improves,
 * everything improves.
 *
 * WHAT BELONGS HERE
 * =================
 * Decisions about *how stock is shown*: which photograph leads, which vehicles are fit to represent the
 * marketplace, how many fill a grid without stranding a tile, which marques are worth offering.
 *
 * WHAT DOES NOT
 * =============
 * Anything about what a vehicle *is*. Pricing, availability, search relevance and the records themselves
 * belong to the Vehicle Engine. This layer never invents or hides a vehicle — a car excluded from a shop
 * window is still searchable, still counted, still reachable by direct link. Curation decides what
 * *represents* the marketplace, never what is in it.
 */
import { isEditorialGrade, isPresentablePhotograph } from "@/config/media";
import type { ShowcaseVehicleListing } from "@/features/search/config/search-showcase-listings";

/** The minimum a surface needs from a listing to present it. Keeps this service usable by any shape. */
export interface PresentableListing {
  readonly id: string;
  readonly imageSrc: string;
  /** Optional, and only read by shop-window curation. Absent listings never block a selection. */
  readonly bodyType?: string;
  readonly make?: string;
}

/**
 * Is this listing fit to represent the marketplace?
 *
 * Two requirements, both about the photograph. It must exist — on a platform whose premise is that
 * photography is the product, a card with no image is worse than one fewer card — and it must be one a
 * customer should see. See `src/config/media/vehicle-photography-policy.ts`.
 *
 * Lead-image *selection* happens upstream in the Vehicle Engine's projection, which already skips an
 * unusable frame in favour of the vehicle's next acceptable one. This is the backstop for the case where
 * every photograph a vehicle has is unusable.
 */
export const isEligibleForDisplay = (listing: PresentableListing): boolean =>
  Boolean(listing.imageSrc) && isPresentablePhotograph(listing.imageSrc);

/**
 * Remove listings that should not represent the marketplace.
 *
 * Deliberately not called "filter": the vehicles are not removed from the platform, only from the grid
 * that speaks for it.
 */
export function curateForDisplay<T extends PresentableListing>(listings: readonly T[]): readonly T[] {
  return listings.filter(isEligibleForDisplay);
}

/**
 * One card per photograph.
 *
 * Keyed on the image rather than the title, because two trims of one model ("X5 xDrive40i" and "X5 M50d")
 * are different titles sharing a single photograph — and to anyone looking at the page, two cards with the
 * same picture are a duplicate regardless of what the headings say. The marketplace showed the same Hilux
 * Raider and the same Land Cruiser twice each for exactly this reason.
 *
 * Order is preserved, so the caller's ranking decides which example of a model survives.
 */
export function dedupeByPhotograph<T extends PresentableListing>(
  listings: readonly T[],
  alreadyShown: ReadonlySet<string> = new Set(),
): readonly T[] {
  const seen = new Set(alreadyShown);
  const kept: T[] = [];

  for (const listing of listings) {
    if (seen.has(listing.imageSrc)) continue;
    seen.add(listing.imageSrc);
    kept.push(listing);
  }

  return kept;
}

/**
 * How many cards fill whole rows.
 *
 * A grid that leaves one tile alone on a final row reads as a loading failure rather than as a short list,
 * and this has now been got wrong twice by hand — once on the homepage's featured grid, once on the
 * vehicle page's similar rail. The arithmetic is stated once here instead.
 *
 * `leadSpan` is how many columns the first card occupies. With a lead of 2 in a 3-column grid the units
 * are `leadSpan + n`, so the totals that fill are 2, 5, 8 … rather than 3, 6, 9.
 */
export function tileableCount(available: number, columns: number, leadSpan = 1): number {
  if (available <= 0 || columns <= 0) return 0;

  for (let count = Math.min(available, columns * 4); count > 0; count -= 1) {
    const units = leadSpan + (count - 1);
    if (units % columns === 0) return count;
  }

  /* Below one full row there is nothing to strand — show what there is. */
  return Math.min(available, columns);
}

/**
 * One vehicle per visual character.
 *
 * A shop window ranked purely on listing quality produced this: Volvo XC90, BMW X5, Volvo XC60,
 * Jaguar F-Pace, Porsche Macan. Five premium SUVs, two of them Volvos, filling the whole featured
 * grid — a filtered query wearing an editor's byline. Ranking by any single measure converges,
 * because the measure is the same for every candidate.
 *
 * So the pass takes the best of each body style before it takes the second of any, and never two of
 * one marque. It is a *pass*, not a filter: once every style is represented it falls back to the
 * ranked order, so a small marketplace still fills its grid rather than showing three cards and a
 * hole.
 *
 * Ordering is preserved within each style, so the caller's ranking still decides *which* SUV.
 */
function diversify<T extends PresentableListing>(ranked: readonly T[], limit: number): readonly T[] {
  const picked: T[] = [];
  const seenStyles = new Set<string>();
  const seenMakes = new Set<string>();

  const key = (value: string | undefined) => (value ?? "").trim().toLowerCase();

  for (const listing of ranked) {
    if (picked.length >= limit) break;
    const style = key(listing.bodyType);
    const make = key(listing.make);
    /* An unknown style never blocks — a missing body type is a gap in the record, and punishing a
       listing for it would quietly bias the shop window towards well-filled-in rows. */
    if (style && seenStyles.has(style)) continue;
    if (make && seenMakes.has(make)) continue;
    picked.push(listing);
    if (style) seenStyles.add(style);
    if (make) seenMakes.add(make);
  }

  /* Second pass: fill any remaining slots from the ranked order, still one per marque. */
  for (const listing of ranked) {
    if (picked.length >= limit) break;
    if (picked.includes(listing)) continue;
    const make = key(listing.make);
    if (make && seenMakes.has(make)) continue;
    picked.push(listing);
    if (make) seenMakes.add(make);
  }

  /* Third pass: a marketplace too small to obey either rule still gets a full grid. */
  for (const listing of ranked) {
    if (picked.length >= limit) break;
    if (!picked.includes(listing)) picked.push(listing);
  }

  return picked;
}

export interface FeaturedSelection<T> {
  readonly listings: readonly T[];
  /** Photographs already spent, so a following rail does not repeat them. */
  readonly usedImages: ReadonlySet<string>;
}

/**
 * The vehicles that represent the marketplace in a shop window.
 *
 * Curated, deduplicated, ranked by the caller, and cut to a count that fills whole rows. `exclude` lets a
 * second rail on the same page avoid repeating the first one's photographs — "latest arrivals" showing the
 * same three cars as "featured" is the kind of thing only the reader notices.
 */
export function selectFeatured<T extends PresentableListing>(
  ranked: readonly T[],
  {
    columns,
    leadSpan = 1,
    limit,
    editorial = false,
    mixed = false,
  }: {
    columns: number;
    leadSpan?: number;
    limit: number;
    /** Apply the editorial photography standard — for surfaces that speak for the marketplace. */
    editorial?: boolean;
    /** One vehicle per body style and per marque. */
    mixed?: boolean;
  },
  exclude: ReadonlySet<string> = new Set(),
): FeaturedSelection<T> {
  const curated = curateForDisplay(ranked);

  /*
    The editorial standard is opt-in per surface, not global.

    Search must keep showing a car photographed on a forecourt — it is the right car, genuinely for
    sale, and a buyer searching that model should find it. The homepage must not, because the
    homepage is a claim about the marketplace rather than a list of it. Same listing, two surfaces,
    two different questions.
  */
  const eligible = editorial
    ? curated.filter((listing) => isEditorialGrade(listing.imageSrc))
    : curated;

  const pool = dedupeByPhotograph(eligible, exclude);

  /*
    One extraordinary photograph beats six average ones.
    ===================================================
    `tileableCount` exists to stop a grid stranding a single card on a final row, and it does that by
    rounding *down* to a whole row. With a lead card spanning two of three columns the fillable
    totals are 2, 5, 8 — so a pool of one returned nothing, and a section with a single outstanding
    frame rendered empty rather than rendering that frame.

    That was the right arithmetic while the constraint was "we have plenty of adequate images and a
    grid to fill". It is the wrong arithmetic now: the editorial standard is deliberately shrinking
    these pools, and commissioned photography will arrive a few frames at a time rather than in
    complete sets.

    So a pool of exactly one is allowed through as a lead card on its own. It is a deliberate
    exception, not a loosening — two cards in a three-column row still round down to the lead alone,
    because two is the shape that looks broken.
  */
  const capped = Math.min(pool.length, limit);
  const count = capped === 1 ? 1 : tileableCount(capped, columns, leadSpan);
  const listings = mixed ? diversify(pool, count) : pool.slice(0, count);

  return {
    listings,
    usedImages: new Set([...exclude, ...listings.map((listing) => listing.imageSrc)]),
  };
}

/**
 * A rail of related vehicles — "similar", "more from this dealer", "also viewed".
 *
 * The same rules as a shop window, plus the current vehicle removed. Uniform cards, so `leadSpan` is 1.
 */
export function selectRail<T extends PresentableListing & { readonly slug?: string }>(
  listings: readonly T[],
  { columns, limit, excludeSlug }: { columns: number; limit: number; excludeSlug?: string },
): readonly T[] {
  const pool = excludeSlug ? listings.filter((listing) => listing.slug !== excludeSlug) : listings;
  return selectFeatured(pool, { columns, limit }).listings;
}

/** Convenience for the common case: a showcase listing rail on a three-column grid. */
export const selectSimilarVehicles = (
  listings: readonly ShowcaseVehicleListing[],
  currentSlug: string,
): readonly ShowcaseVehicleListing[] =>
  selectRail(listings, { columns: 3, limit: 6, excludeSlug: currentSlug });
