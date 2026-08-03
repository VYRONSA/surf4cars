/**
 * SURF FOR CARS — homepage merchandising.
 *
 * Which vehicles lead the shop window, and in what order.
 *
 * THE QUESTION THIS ANSWERS
 * =========================
 * `vehicle-presentation.service.ts` answers "is this vehicle fit to represent the marketplace" — a
 * question about the photograph and the listing. This answers a different one: "of the vehicles that
 * are fit, which should a visitor meet first?"
 *
 * Ranking by listing completeness alone answered it with whatever was best filled in, which is a
 * statement about admin rather than about cars. The Founder's instruction is that the first rail
 * should create aspiration: a visitor should think *these are incredible cars* before they think *I
 * need to search*.
 *
 * FOUR SIGNALS, NOT A BRAND LIST
 * ==============================
 * A rail defined as "show me the Porsches" cannot express why a Ranger Raptor belongs beside one, and
 * empties the moment the Porsche sells. So a vehicle's standing is weighed from four independent
 * signals, any of which can carry it:
 *
 *   marque      is this manufacturer aspirational in itself?     `marque-standing.ts`
 *   badge       is this a genuine performance model?             `performanceBadge`
 *   price       where does it sit in *this* marketplace?         percentile, not a fixed rand figure
 *   body        does the shape read as a choice, not a purchase? coupé, convertible, prestige SUV
 *
 * Price is a percentile of live published stock rather than a threshold, deliberately. "Over a
 * million rand" is a claim that rots — it means something different each year and something different
 * again on a marketplace of bakkies than on one of saloons. A percentile is self-calibrating and
 * cannot go stale.
 *
 * WHAT THIS MUST NEVER DO
 * =======================
 * Promote a vehicle past the photography standard. The Founder's rule is explicit — never feature
 * poor-quality photography simply because a vehicle is expensive — and the ordering here is applied
 * *before* `selectFeatured`, which applies the editorial standard afterwards and independently. An
 * expensive car with a forecourt photograph ranks first and is then dropped, exactly as it should be.
 *
 * The tension is real rather than theoretical: on the current library it is precisely the premium end
 * of the inventory — the X5, the XC90, the F-Pace, the Macan — whose lead frames are motor-show
 * stands and dealership forecourts. Merchandising cannot resolve that, and must not paper over it.
 */
import {
  isCommercialBody,
  isEstateBody,
  isMpvBody,
  isSedanBody,
  isSportingBody,
  isSuvBody,
  marqueStanding,
  performanceBadge,
  type MarqueStanding,
} from "@/config/merchandising/marque-standing";

import type { PresentableListing } from "./vehicle-presentation.service";

/** What merchandising needs to know about a vehicle beyond what presentation needs. */
export interface MerchandisableVehicle extends PresentableListing {
  readonly model?: string;
  readonly variant?: string | null;
  /** Asking price in cents. Absent means the price signal is simply not read for this vehicle. */
  readonly priceCents?: number;
}

/**
 * Where a vehicle belongs on the page.
 *
 * Three tiers because the brief describes three bands — aspirational, premium luxury, then the
 * broader marketplace — and because a fourth would be a distinction no visitor could see.
 */
export type MerchandisingTier = "exceptional" | "premium" | "everyday";

export interface AspirationVerdict {
  readonly tier: MerchandisingTier;
  /** Ordering weight within a tier. Not shown to anybody; comparable only against itself. */
  readonly score: number;
  readonly marque: MarqueStanding;
  /** The matched designation, e.g. "Raptor". Null when the vehicle carries none. */
  readonly badge: string | null;
  readonly priceBand: "top" | "upper" | "mid" | null;
  /** Plain-language justification, so a Founder can see what the rail reasoned from. */
  readonly reasons: readonly string[];
}

/**
 * The price distribution of the live marketplace, against which a vehicle is judged expensive.
 *
 * Null below a floor of twelve priced vehicles. A percentile computed from four cars describes those
 * four cars and nothing else, and a rail that called the third-cheapest vehicle on the platform
 * "top of the market" would be worse than one that made no price claim at all.
 */
export interface MarketPriceContext {
  readonly upper: number;
  readonly top: number;
  readonly sample: number;
}

const MINIMUM_PRICED_SAMPLE = 12;

const percentile = (sorted: readonly number[], fraction: number): number =>
  sorted[Math.min(sorted.length - 1, Math.max(0, Math.floor(sorted.length * fraction)))] ?? 0;

export function buildPriceContext(pricesCents: readonly number[]): MarketPriceContext | null {
  const priced = pricesCents.filter((value) => Number.isFinite(value) && value > 0).sort((a, b) => a - b);
  if (priced.length < MINIMUM_PRICED_SAMPLE) return null;
  return { upper: percentile(priced, 0.75), top: percentile(priced, 0.92), sample: priced.length };
}

/** Weights. Relative only — the absolute numbers mean nothing outside this function. */
const WEIGHT = {
  exoticMarque: 100,
  luxuryMarque: 45,
  badge: 70,
  topPrice: 40,
  upperPrice: 18,
  sportingBody: 30,
  prestigeSuv: 12,
} as const;

/**
 * How aspirational is this vehicle, and why.
 *
 * Every signal is optional. A record missing a body type or a price is judged on what it does carry
 * rather than penalised for the gap — a missing field is an incomplete record, not a modest car, and
 * scoring it as one would quietly bias the shop window towards whoever fills in forms.
 */
export function classifyAspiration(
  vehicle: MerchandisableVehicle,
  prices: MarketPriceContext | null,
): AspirationVerdict {
  const reasons: string[] = [];
  let score = 0;

  const marque = marqueStanding(vehicle.make);
  if (marque === "exotic") {
    score += WEIGHT.exoticMarque;
    reasons.push(`${vehicle.make} is an aspirational marque`);
  } else if (marque === "luxury") {
    score += WEIGHT.luxuryMarque;
    reasons.push(`${vehicle.make} is a premium marque`);
  }

  const badge = performanceBadge(vehicle.make, vehicle.model, vehicle.variant);
  if (badge) {
    score += WEIGHT.badge;
    reasons.push(`${badge} is a performance model, not a trim package`);
  }

  let priceBand: AspirationVerdict["priceBand"] = null;
  if (prices && typeof vehicle.priceCents === "number" && vehicle.priceCents > 0) {
    if (vehicle.priceCents >= prices.top) {
      priceBand = "top";
      score += WEIGHT.topPrice;
      reasons.push("among the most expensive vehicles listed");
    } else if (vehicle.priceCents >= prices.upper) {
      priceBand = "upper";
      score += WEIGHT.upperPrice;
      reasons.push("priced in the upper quarter of the marketplace");
    } else {
      priceBand = "mid";
    }
  }

  const sporting = isSportingBody(vehicle.bodyType);
  const prestigeSuv = isSuvBody(vehicle.bodyType) && marque !== "mainstream";
  if (sporting) {
    score += WEIGHT.sportingBody;
    reasons.push(`a ${String(vehicle.bodyType).toLowerCase()} is a car chosen rather than needed`);
  } else if (prestigeSuv) {
    score += WEIGHT.prestigeSuv;
    reasons.push("a premium SUV");
  }

  /*
    Tiering, stated as rules rather than as a score threshold.

    A threshold on the combined score would let three weak signals add up to a supercar — a luxury
    marque with a good price and an SUV body would out-score a genuine performance car, which is
    precisely backwards. So the tier is decided by what a vehicle *is*, and the score only orders
    vehicles already in the same tier.
  */
  const exceptional =
    marque === "exotic"
    || badge !== null
    || (marque === "luxury" && priceBand === "top")
    || (priceBand === "top" && sporting);

  const premium = marque === "luxury" || priceBand === "top" || priceBand === "upper";

  return {
    tier: exceptional ? "exceptional" : premium ? "premium" : "everyday",
    score,
    marque,
    badge,
    priceBand,
    reasons,
  };
}

export interface MerchandisedVehicle<T> {
  readonly vehicle: T;
  readonly verdict: AspirationVerdict;
}

/**
 * Rank a set of vehicles by aspiration, highest first.
 *
 * Ties keep the caller's incoming order, which is how listing quality stays the second-order sort
 * without this function having to know what listing quality is.
 */
export function rankByAspiration<T extends MerchandisableVehicle>(
  vehicles: readonly T[],
  prices: MarketPriceContext | null,
): readonly MerchandisedVehicle<T>[] {
  return vehicles
    .map((vehicle, index) => ({ vehicle, verdict: classifyAspiration(vehicle, prices), index }))
    .sort((a, b) => b.verdict.score - a.verdict.score || a.index - b.index)
    .map(({ vehicle, verdict }) => ({ vehicle, verdict }));
}

/**
 * The words a rail has earned.
 *
 * WHY THE HEADLINE IS COMPUTED AND NOT WRITTEN
 * ============================================
 * The obvious implementation gives rail one a fixed title — "Supercars", "Extraordinary machines" —
 * and fills it with the best available. That is a fabricated claim on any day the inventory cannot
 * support it, and inventory is exactly the thing that changes without a deploy. On the stock live at
 * the time of writing, a fixed supercar headline would sit above a Ford Ranger.
 *
 * So the copy is a function of what actually got selected. The rail can say "extraordinary" only
 * while something extraordinary is in it, and quietly says something more modest when it is not.
 * Nobody has to remember to change it, and it cannot drift out of step with the cars.
 */
export interface RailCopy {
  readonly eyebrow: string;
  readonly headline: string;
  readonly description: string | null;
}

export function railCopy(
  tier: MerchandisingTier,
  verdicts: readonly AspirationVerdict[],
): RailCopy {
  const total = verdicts.length;

  /*
    A plural claim must be true of every card, not most of them.
    ===========================================================
    This rule was arrived at in two corrections, both caught by looking at the rendered page rather
    than by reasoning about the code.

    The first version asked `verdicts.some(...)`, and produced "Genuine performance models — the
    badge on these is engineering, not trim" above one Ranger Raptor and four ordinary premium SUVs.
    Requiring a majority fixed that case and quietly broke a smaller one: as the photography standard
    thinned the rail to two cards, a single Raptor beside an Audi A3 was again a majority, and the
    same plural sentence reappeared over a car that is not a performance model at all.

    A threshold cannot fix this, because the problem is not proportion — it is that "these are X" is a
    statement about all of them. So the strong headlines require every card to qualify, and the mixed
    cases below have their own sentences. `luxuryShare` keeps a majority test because "Premium
    marques" heads a rail rather than describing each car in it.
  */
  const every = (predicate: (verdict: AspirationVerdict) => boolean): boolean =>
    total > 0 && verdicts.every(predicate);

  const allExotic = every((verdict) => verdict.marque === "exotic");
  const allBadged = every((verdict) => verdict.badge !== null);
  const luxuryShare = total === 0 ? 0 : verdicts.filter((v) => v.marque === "luxury").length / total;
  const standoutCount = verdicts.filter((v) => v.marque === "exotic" || v.badge !== null).length;
  const allAtLeastPremium = total > 0 && verdicts.every((verdict) => verdict.tier !== "everyday");
  /* Every card is either a genuine standout or carries a marque that is premium in its own right —
     as opposed to merely being expensive, which is a different claim. */
  const everyCardIsStandoutOrPrestigeMarque =
    total > 0 && verdicts.every((verdict) => verdict.marque !== "mainstream" || verdict.badge !== null);

  if (tier === "exceptional") {
    if (allExotic) {
      return {
        eyebrow: "The collection",
        headline: "Cars you do not see every day",
        description: "Marques that were never built to be sensible, listed by South African dealerships.",
      };
    }
    if (allBadged) {
      return {
        eyebrow: "The collection",
        headline: "Built to be driven",
        description: "Genuine performance models — the badge on these is engineering, not trim.",
      };
    }
    /*
      "Prestige" is a claim about the marque, not about the price.
      ===========================================================
      This branch first tested `allAtLeastPremium`, which is true of any car in the upper quarter of
      the market — so the rail introduced a Kia Sportage, a VW Amarok and a Toyota Prado as "the
      premium marques listed beside it". They are good vehicles and they are not premium marques;
      they reached the rail on price alone. The same failure as the one above, one level finer.
    */
    if (standoutCount > 0 && everyCardIsStandoutOrPrestigeMarque) {
      return {
        eyebrow: "The collection",
        headline: "Performance and prestige",
        description: "Genuine performance, alongside the premium marques listed beside it.",
      };
    }
    if (standoutCount > 0 && allAtLeastPremium) {
      return {
        eyebrow: "The collection",
        headline: "Performance, and the upper end of the market",
        description: "A genuine performance model, alongside the highest-priced vehicles listed today.",
      };
    }
    /* Nothing extraordinary survived. Say less rather than saying it anyway. */
    return {
      eyebrow: "The collection",
      headline: "The best of what is listed today",
      description: allAtLeastPremium
        ? "Premium marques, photographed well enough to lead the page."
        : null,
    };
  }

  if (tier === "premium") {
    if (luxuryShare >= 0.5) {
      return {
        eyebrow: "Luxury",
        headline: "Premium marques",
        description: "Executive saloons, luxury SUVs, and the cars families move up to.",
      };
    }
    /* Mostly mainstream marques that reached this rail on price. Say that, rather than "luxury". */
    return {
      eyebrow: "Luxury",
      headline: "The upper end of the marketplace",
      description: "The most expensive vehicles currently listed by our dealerships.",
    };
  }

  return {
    eyebrow: "Available now",
    headline: "Cars you can buy today",
    description: null,
  };
}

/* ── Homepage segments ────────────────────────────────────────────────────────────────────────── */

/**
 * The bands the homepage sells in, in the order a visitor meets them.
 *
 * WHY MEMBERSHIP IS A RULE AND THE HEADING IS FIXED
 * =================================================
 * The rails built before these had computed headings, because their membership was "the best we
 * have" and a fixed heading would have made claims the stock could not support. These are different:
 * a vehicle is in "Bakkies & Commercial" because it *is* a double cab, and in "Premium SUVs" because
 * it is an SUV in the upper price band. The heading is a definition rather than a boast, so it can be
 * written down — and a segment with nothing in it renders nothing at all rather than a heading over
 * an apology.
 *
 * WHY ASSIGNMENT IS EXCLUSIVE AND ORDERED
 * =======================================
 * A vehicle may appear in exactly one rail — the brief asks for that directly, and it is also the
 * only way six rails on one page can avoid reading as the same stock shuffled six times. So the
 * first segment that claims a vehicle keeps it, and the order below is both the assignment priority
 * and the display order. That makes the ordering load-bearing: `luxury` sits above `premium-suv`, so
 * a BMW X5 is a luxury vehicle rather than a premium SUV, and `premium-suv` collects the mainstream
 * marques that earn their place on price instead.
 */
export type MarketSegment =
  | "sports-performance"
  | "luxury"
  | "premium-suv"
  | "executive-sedan"
  | "family"
  | "commercial";

export interface SegmentDefinition {
  readonly segment: MarketSegment;
  readonly eyebrow: string;
  readonly headline: string;
  readonly description: string;
  /** True when this vehicle belongs to the segment. Evaluated in array order; first match wins. */
  readonly claims: (vehicle: MerchandisableVehicle, verdict: AspirationVerdict) => boolean;
}

const isUpperPriced = (verdict: AspirationVerdict): boolean =>
  verdict.priceBand === "top" || verdict.priceBand === "upper";

export const HOMEPAGE_SEGMENTS: readonly SegmentDefinition[] = [
  {
    segment: "sports-performance",
    eyebrow: "The collection",
    headline: "Sports & performance",
    description: "Genuine performance models and the marques built around them.",
    claims: (vehicle, verdict) =>
      verdict.marque === "exotic" || verdict.badge !== null || isSportingBody(vehicle.bodyType),
  },
  {
    segment: "luxury",
    eyebrow: "Luxury",
    headline: "Luxury vehicles",
    description: "The premium marques, listed by South African dealerships.",
    claims: (_vehicle, verdict) => verdict.marque === "luxury" || verdict.marque === "exotic",
  },
  {
    segment: "premium-suv",
    eyebrow: "Premium SUVs",
    headline: "Premium SUVs",
    /* Every car reaching this rail has passed the `luxury` rail above, so it is here on price. Say
       so, rather than implying a marque standing these vehicles do not carry. */
    description: "The largest and best-equipped SUVs currently listed.",
    claims: (vehicle, verdict) => isSuvBody(vehicle.bodyType) && isUpperPriced(verdict),
  },
  {
    segment: "executive-sedan",
    eyebrow: "Executive",
    headline: "Executive sedans",
    description: "Saloons for the drive to work and the drive that matters.",
    claims: (vehicle, verdict) => isSedanBody(vehicle.bodyType) && isUpperPriced(verdict),
  },
  {
    segment: "family",
    eyebrow: "Family",
    headline: "Family vehicles",
    description: "Room for everyone, and everything they bring.",
    claims: (vehicle) =>
      isMpvBody(vehicle.bodyType) || isEstateBody(vehicle.bodyType) || isSuvBody(vehicle.bodyType),
  },
  {
    segment: "commercial",
    eyebrow: "Work",
    headline: "Bakkies & commercial",
    description: "The vehicles that keep everything else running.",
    claims: (vehicle) => isCommercialBody(vehicle.bodyType),
  },
];

/**
 * Which homepage rail a vehicle belongs to, or `null` when none claims it.
 *
 * `null` is a real answer and not a failure: an ordinary hatchback is none of these things, and it
 * reaches the visitor through the marketplace rail further down rather than being forced into a
 * segment it does not fit. Padding a rail is how "Premium SUVs" ends up containing a Polo Vivo.
 */
export function classifySegment(
  vehicle: MerchandisableVehicle,
  verdict: AspirationVerdict,
): MarketSegment | null {
  for (const definition of HOMEPAGE_SEGMENTS) {
    if (definition.claims(vehicle, verdict)) return definition.segment;
  }
  return null;
}
