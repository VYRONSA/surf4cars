/**
 * Turning a sentence into filters.
 *
 * THE DEFECT THIS FIXES
 * =====================
 * Free text was matched as one substring against a vehicle's search document:
 *
 *     items.filter((item) => searchText.includes("family suv under r500 000 in cape town"))
 *
 * No vehicle's text contains that sentence, so every descriptive search returned nothing — including
 * the four example chips printed on the hero, which exist to teach people that describing works.
 * Measured: "Toyota Hilux" → 9 results, "Family SUV under R500 000 in Cape Town" → 0.
 *
 * A control that invites a sentence and answers with an empty page is worse than one that never
 * offered. The brief's rule for this hero is that nothing may be decorative, and a suggestion chip
 * that returns nothing is decoration with a click target.
 *
 * WHAT IT DOES
 * ============
 * Reads the signals a car buyer actually puts in a sentence — a budget, a body style, a fuel, a
 * gearbox, a province, "low mileage" — and turns them into the filters the search already supports.
 * Whatever is left over stays as text, so a marque or model in the sentence still narrows it.
 *
 * WHAT IT DELIBERATELY DOES NOT DO
 * ================================
 * It does not guess. Every rule below matches an explicit word or a number; there is no scoring, no
 * fuzzy matching and no synonym expansion beyond the handful of South African usages that are simply
 * the same thing said differently ("bakkie" is a double cab). A filter applied because an algorithm
 * felt confident is how somebody ends up with a shortlist that quietly excluded what they asked for.
 *
 * It is also not an AI. If that arrives later this is the seam it replaces.
 */

export interface InterpretedDescription {
  readonly priceMinCents?: number;
  readonly priceMaxCents?: number;
  readonly mileageMaxKm?: number;
  readonly bodyType?: string;
  readonly fuel?: string;
  readonly transmission?: string;
  readonly province?: string;
  readonly yearMin?: number;
  /** What is left after the recognised signals are removed — usually a marque or model. */
  readonly residual: string;
  /** True when at least one structured signal was recognised. */
  readonly interpreted: boolean;
}

/* Body styles as they appear in the data, plus the words South Africans actually use for them. */
const BODY_TYPES: readonly (readonly [string, readonly string[]])[] = [
  ["SUV", ["suv", "suvs", "crossover", "4x4"]],
  ["Double Cab", ["double cab", "double-cab", "bakkie", "bakkies", "pickup", "pick-up", "ute"]],
  ["Hatchback", ["hatchback", "hatch", "hatchbacks"]],
  ["Sedan", ["sedan", "sedans", "saloon"]],
  ["Coupe", ["coupe", "coupé"]],
  ["Station Wagon", ["station wagon", "estate", "wagon"]],
  ["Panel Van", ["panel van", "van", "vans"]],
  ["MPV", ["mpv", "people carrier", "people mover", "minivan"]],
  ["Convertible", ["convertible", "cabriolet", "roadster"]],
];

const FUELS: readonly (readonly [string, readonly string[]])[] = [
  ["Diesel", ["diesel"]],
  ["Petrol", ["petrol", "gasoline"]],
  ["Hybrid", ["hybrid"]],
  ["Electric", ["electric", "ev", "battery"]],
];

const TRANSMISSIONS: readonly (readonly [string, readonly string[]])[] = [
  ["Automatic", ["automatic", "auto"]],
  ["Manual", ["manual", "stick"]],
];

/* Cities map to the province the search actually filters on — there is no city filter in the
   repository, so "in Cape Town" has to become Western Cape or it does nothing at all. */
const PROVINCES: readonly (readonly [string, readonly string[]])[] = [
  ["Western Cape", ["western cape", "cape town", "stellenbosch", "paarl", "george", "somerset west"]],
  ["Gauteng", ["gauteng", "johannesburg", "joburg", "jhb", "pretoria", "sandton", "centurion", "midrand", "roodepoort"]],
  ["KwaZulu-Natal", ["kwazulu-natal", "kwazulu natal", "kzn", "durban", "pietermaritzburg", "umhlanga", "ballito"]],
  ["Eastern Cape", ["eastern cape", "gqeberha", "port elizabeth", "east london", "mthatha"]],
  ["Free State", ["free state", "bloemfontein", "welkom"]],
  ["Mpumalanga", ["mpumalanga", "nelspruit", "mbombela", "witbank", "emalahleni"]],
  ["North West", ["north west", "rustenburg", "potchefstroom", "klerksdorp"]],
  ["Limpopo", ["limpopo", "polokwane", "tzaneen"]],
  ["Northern Cape", ["northern cape", "kimberley", "upington"]],
];

/*
  Words that carry no filter and match no vehicle.
  ===============================================
  These are why the residual has to be cleaned rather than passed through. "Reliable first car with
  low mileage" reduces to a mileage ceiling; leaving "reliable first car" as text would re-introduce
  the original bug one word at a time, because no listing's text contains "reliable".
*/
const STOP_WORDS = new Set([
  "a", "an", "the", "for", "with", "and", "or", "in", "at", "on", "to", "of", "my", "me", "i",
  "want", "need", "looking", "look", "find", "show", "something", "some", "any", "car", "cars",
  "vehicle", "vehicles", "good", "great", "nice", "best", "cheap", "affordable", "reliable",
  "family", "first", "daily", "weekend", "small", "big", "large", "under", "below", "less", "than",
  "max", "maximum", "min", "minimum", "over", "above", "around", "about", "that", "can", "is",
  "low", "high", "mileage", "km", "kms", "kilometres", "kilometers", "price", "budget", "up",
  "commute", "commuting", "tow", "boat", "economical", "economic", "spacious", "practical",
  "comfortable", "safe", "new", "used", "second", "hand", "please", "R", "r",
]);

/** "R500 000", "R500,000", "500k", "R1.2m" → cents. */
function parseAmountToCents(raw: string): number | undefined {
  const cleaned = raw.replace(/[r\s,]/gi, "").toLowerCase();
  const match = cleaned.match(/^(\d+(?:\.\d+)?)(k|m)?$/);
  if (!match) return undefined;
  const value = Number(match[1]);
  if (!Number.isFinite(value)) return undefined;
  const multiplier = match[2] === "m" ? 1_000_000 : match[2] === "k" ? 1_000 : 1;
  const rands = value * multiplier;
  /* Below R1 000 the number is almost certainly not a price — it is a model designation like "320"
     or a year fragment. Applying it as a ceiling would return nothing and look like a broken search. */
  if (rands < 1_000) return undefined;
  return Math.round(rands * 100);
}

function findTerm(
  text: string,
  table: readonly (readonly [string, readonly string[]])[],
): { readonly value: string; readonly matched: string } | undefined {
  /* Longest synonym first, so "double cab" is not consumed by "cab" and "cape town" beats "cape". */
  const candidates = table
    .flatMap(([value, synonyms]) => synonyms.map((synonym) => ({ value, synonym })))
    .sort((a, b) => b.synonym.length - a.synonym.length);

  for (const { value, synonym } of candidates) {
    const pattern = new RegExp(`(?:^|\\W)${synonym.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:$|\\W)`, "i");
    if (pattern.test(text)) return { value, matched: synonym };
  }
  return undefined;
}

export function interpretDescription(input: string): InterpretedDescription {
  const original = input.trim();
  if (!original) return { residual: "", interpreted: false };

  let working = ` ${original.toLowerCase()} `;
  const consume = (needle: string) => {
    working = working.replace(new RegExp(needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"), " ");
  };

  const result: {
    priceMinCents?: number;
    priceMaxCents?: number;
    mileageMaxKm?: number;
    bodyType?: string;
    fuel?: string;
    transmission?: string;
    province?: string;
    yearMin?: number;
  } = {};

  /* ── Mileage, before price: "under 50 000 km" must not be read as R50 000 ────────────────── */
  const mileage = working.match(/(?:under|below|less than|max|up to)?\s*([\d\s,]{2,12})\s*(?:km|kms|kilometres|kilometers)\b/i);
  if (mileage) {
    const km = Number((mileage[1] ?? "").replace(/[\s,]/g, ""));
    if (Number.isFinite(km) && km > 0) {
      result.mileageMaxKm = km;
      consume(mileage[0]);
    }
  } else if (/\blow mileage\b/i.test(working)) {
    /* A stated convention rather than a guess: "low mileage" is the phrase in the hero's own example
       chip, and it has to mean *something* or the chip returns everything. 60 000 km is the usual
       trade line between "low" and "average" for a used car in this market. */
    result.mileageMaxKm = 60_000;
    consume("low mileage");
  }

  /* ── Price ──────────────────────────────────────────────────────────────────────────────── */
  const between = working.match(/between\s*(r?\s?[\d\s,.]+k?m?)\s*(?:and|-|to)\s*(r?\s?[\d\s,.]+k?m?)/i);
  if (between) {
    const low = parseAmountToCents(between[1] ?? "");
    const high = parseAmountToCents(between[2] ?? "");
    if (low && high) {
      result.priceMinCents = Math.min(low, high);
      result.priceMaxCents = Math.max(low, high);
      consume(between[0]);
    }
  } else {
    const ceiling = working.match(/(?:under|below|less than|max|maximum|up to|cheaper than)\s*(r?\s?[\d\s,.]+k?m?)/i);
    if (ceiling) {
      const cents = parseAmountToCents(ceiling[1] ?? "");
      if (cents) {
        result.priceMaxCents = cents;
        consume(ceiling[0]);
      }
    }
    const floor = working.match(/(?:over|above|more than|from|at least)\s*(r?\s?[\d\s,.]+k?m?)/i);
    if (floor) {
      const cents = parseAmountToCents(floor[1] ?? "");
      if (cents) {
        result.priceMinCents = cents;
        consume(floor[0]);
      }
    }
  }

  /* ── Year ───────────────────────────────────────────────────────────────────────────────── */
  const year = working.match(/\b(?:from|after|newer than)\s*((?:19|20)\d{2})\b/i);
  if (year) {
    result.yearMin = Number(year[1] ?? "");
    consume(year[0]);
  }

  /* ── Vocabulary ─────────────────────────────────────────────────────────────────────────── */
  for (const [table, key] of [
    [BODY_TYPES, "bodyType"],
    [FUELS, "fuel"],
    [TRANSMISSIONS, "transmission"],
    [PROVINCES, "province"],
  ] as const) {
    const found = findTerm(working, table);
    if (found) {
      (result as Record<string, unknown>)[key] = found.value;
      consume(found.matched);
    }
  }

  /* ── Residual ───────────────────────────────────────────────────────────────────────────── */
  const residual = working
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .split(/\s+/)
    .filter((token) => token && !STOP_WORDS.has(token) && !/^\d+$/.test(token))
    .join(" ")
    .trim();

  const interpreted = Object.values(result).some((value) => value !== undefined);

  return { ...result, residual, interpreted };
}
