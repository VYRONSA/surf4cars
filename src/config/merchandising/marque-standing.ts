/**
 * SURF4CARS — marque standing and performance badges.
 *
 * The reference data behind homepage merchandising: which manufacturers read as aspirational, and
 * which model designations denote a genuine performance car rather than a styling package.
 *
 * WHY THIS IS A DATA FILE AND NOT A BRAND LIST INSIDE A RAIL
 * =========================================================
 * The brief is explicit that the homepage must not be a hardcoded brand list, and it is right: a rail
 * defined as "show me Porsches" breaks the day a Porsche sells and cannot express why a Ranger Raptor
 * belongs beside one. So no rail names a marque. Standing is *one signal* among four that
 * `vehicle-merchandising.service.ts` weighs — alongside a genuine performance designation, the
 * vehicle's price standing within the live marketplace, and its body style.
 *
 * A register is still unavoidable, because marque standing is not derivable from the data we hold.
 * Nothing in a listing says a Rolls-Royce is more aspirational than a Renault; price correlates but
 * does not decide it, or a well-specified double cab would outrank a used 911. This is a judgement,
 * recorded as data so it can be read at a glance, changed in one line and reviewed in a diff — the
 * same treatment `editorial-curation.ts` gets, for the same reason.
 *
 * THE PART THAT MATTERS MOST: A TRIM IS NOT A PERFORMANCE CAR
 * ==========================================================
 * "AMG Line", "M Sport", "S line", "R-Dynamic", "GT-Line", "N Line" and "F Sport" are appearance
 * packages — bumpers, badges, wheels and seat stitching. They share their letters with the genuine
 * article and nothing else: a C200 AMG Line is a four-cylinder saloon, and a C63 AMG is not.
 *
 * This is not a hypothetical. The live inventory carries eight "R-Dynamic", six "GT-Line", five
 * "S line" and one "AMG Line", and no genuine AMG, M or RS at all. A naive `/AMG|GT|RS/` match would
 * have merchandised a Kia Sonet GT-Line into a rail promising supercars — a claim the platform could
 * not defend, made convincingly enough that nobody would check. Exactly the failure AGENTS.md names:
 * an obviously fake placeholder gets fixed, a convincing one gets trusted.
 *
 * So `TRIM_PACKAGES` is stripped from the designation *before* any badge is matched, and badges are
 * scoped per marque — "RS" means a performance Audi, and on a Toyota Hilux Legend RS it means a decal.
 */

export type MarqueStanding = "exotic" | "luxury" | "mainstream";

const slug = (value: string): string =>
  value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

/**
 * Marques whose ordinary models are aspirational in themselves.
 *
 * The test applied: would a person photograph this car in a car park because of what it is? That is a
 * lower bar than "supercar" and a much higher one than "expensive" — it is why Porsche is here and a
 * top-specification Land Cruiser, which costs more than several of these, is not.
 */
const EXOTIC_MARQUES: ReadonlySet<string> = new Set([
  "ferrari",
  "lamborghini",
  "mclaren",
  "aston-martin",
  "bentley",
  "rolls-royce",
  "maserati",
  "porsche",
  "bugatti",
  "koenigsegg",
  "pagani",
  "lotus",
]);

/**
 * Marques whose ordinary models are premium — the second rail.
 *
 * "Range Rover" appears alongside "Land Rover" because South African listings record it both ways,
 * and a register that only knows one spelling silently misses half the stock. The same reasoning that
 * cost this platform fifty invisible dealerships over two spellings of `onboarding_status`.
 */
const LUXURY_MARQUES: ReadonlySet<string> = new Set([
  "bmw",
  "mercedes-benz",
  "mercedes",
  "audi",
  "lexus",
  "volvo",
  "land-rover",
  "range-rover",
  "jaguar",
  "genesis",
  "alfa-romeo",
  "mini",
  "infiniti",
  "cadillac",
]);

/** Where a manufacturer sits. Unknown marques are `mainstream`, never guessed upward. */
export function marqueStanding(make: string | null | undefined): MarqueStanding {
  if (!make) return "mainstream";
  const key = slug(make);
  if (EXOTIC_MARQUES.has(key)) return "exotic";
  if (LUXURY_MARQUES.has(key)) return "luxury";
  return "mainstream";
}

/**
 * Appearance and equipment packages, removed before any performance badge is read.
 *
 * Every entry here is a trim level sold on an ordinary drivetrain. Order matters only in that longer
 * strings must be stripped before the shorter ones they contain.
 */
const TRIM_PACKAGES: readonly RegExp[] = [
  /\bAMG[\s-]?Line\b/gi,
  /\bM[\s-]?Sport(?:\s+Package)?\b/gi,
  /\bS[\s-]?line\b/gi,
  /\bR[\s-]?Dynamic\b/gi,
  /\bGT[\s-]?Line\b/gi,
  /\bN[\s-]?Line\b/gi,
  /\bR[\s-]?Line\b/gi,
  /\bF[\s-]?Sport\b/gi,
  /\bSport[\s-]?Line\b/gi,
  /\bBlack[\s-]?Edition\b/gi,
  /\bExclusive[\s-]?Line\b/gi,
];

const stripTrimPackages = (designation: string): string =>
  TRIM_PACKAGES.reduce((text, pattern) => text.replace(pattern, " "), designation);

/**
 * Genuine performance designations, scoped to the marque that uses them.
 *
 * Scoped rather than global because the same letters mean different things on different badges. "RS"
 * on an Audi is Quattro GmbH; on a Toyota Hilux Legend RS it is a sticker pack. "R" on a Golf is the
 * flagship; on a Honda it is a colour. A global pattern cannot tell those apart, and the live
 * inventory contains the Hilux case today.
 *
 * Absent marques simply have no recognised badge, which costs nothing: standing and price still
 * apply. Adding one is a line, and a wrong entry is visible in a diff rather than buried in a score.
 */
const PERFORMANCE_BADGES: Readonly<Record<string, readonly RegExp[]>> = {
  bmw: [/\bM[2-8]\b/i, /\bX[1-7]\s?M\b/i, /\bM\d{3}i\b/i, /\bCompetition\b/i],
  "mercedes-benz": [/\bAMG\b/i, /\b[ACEGS]\s?(?:45|55|63|65)\b/i, /\bBlack\s?Series\b/i],
  mercedes: [/\bAMG\b/i, /\b[ACEGS]\s?(?:45|55|63|65)\b/i],
  audi: [/\bRS\s?[0-9Q]\b/i, /\bS[1-8]\b/i],
  porsche: [/\bGT[234]\b/i, /\bTurbo\b/i, /\bGTS\b/i, /\bSpeedster\b/i],
  "land-rover": [/\bSVR\b/i, /\bSV\s?Autobiography\b/i, /\bSVO?\b/i],
  "range-rover": [/\bSVR\b/i, /\bSV\s?Autobiography\b/i, /\bSVO?\b/i],
  jaguar: [/\bSVR\b/i],
  ford: [/\bRaptor\b/i, /\bST\b/i, /\bRS\b/i, /\bShelby\b/i, /\bGT500?\b/i],
  volkswagen: [/\bGTI\b/i, /\bGolf\s?R\b/i, /\bR32\b/i, /\bGTD\b/i],
  toyota: [/\bGR\s?(?:Yaris|Corolla|Supra|86)\b/i],
  nissan: [/\bNismo\b/i, /\bGT-?R\b/i],
  honda: [/\bType\s?R\b/i],
  hyundai: [/\b(?:i20|i30|Kona)\s?N\b/i],
  subaru: [/\bSTI?\b/i, /\bWRX\b/i],
  lexus: [/\b(?:RC|GS|IS|LC)\s?F\b/i],
  kia: [/\bStinger\s?GT\b/i],
  renault: [/\bR\.?S\.?\b/i, /\bAlpine\b/i],
  abarth: [/\b\d{3}\b/i],
};

/**
 * The genuine performance designation in a model and variant, or `null`.
 *
 * Returns the matched text rather than a boolean so the reason can be shown — a merchandising
 * decision a Founder cannot interrogate is one they cannot correct.
 */
export function performanceBadge(
  make: string | null | undefined,
  model: string | null | undefined,
  variant?: string | null,
): string | null {
  if (!make) return null;
  const patterns = PERFORMANCE_BADGES[slug(make)];
  if (!patterns) return null;

  const designation = stripTrimPackages(`${model ?? ""} ${variant ?? ""}`.trim());
  if (!designation.trim()) return null;

  for (const pattern of patterns) {
    const found = designation.match(pattern);
    if (found) return found[0].trim();
  }

  return null;
}

/**
 * Body styles that read as sporting regardless of what wears them.
 *
 * A coupé is a choice made against practicality, which is the whole of the signal here.
 */
const SPORTING_BODIES: ReadonlySet<string> = new Set([
  "coupe",
  "coupé",
  "convertible",
  "cabriolet",
  "roadster",
  "targa",
  "spider",
  "spyder",
  "sports",
  "sports car",
]);

export const isSportingBody = (bodyType: string | null | undefined): boolean =>
  Boolean(bodyType) && SPORTING_BODIES.has(String(bodyType).toLowerCase().trim());

export const isSuvBody = (bodyType: string | null | undefined): boolean =>
  /\bsuv\b|crossover/i.test(String(bodyType ?? ""));

/**
 * The remaining body-style questions the homepage segments ask.
 *
 * Written as patterns rather than as an enumerated list because `inventory_vehicles.body_type` is
 * free text supplied by dealers and importers: the live table already holds "Double Cab", "MPV",
 * "Hatch" and `null`, and an import from another platform will bring its own vocabulary. A set of
 * exact strings would silently drop everything it had not been told about, and a vehicle missing
 * from a rail looks identical to a vehicle that does not exist.
 *
 * `isCommercialBody` is tested before `isMpvBody` wherever both could match, because a panel van is
 * a working vehicle and a people carrier is a family one, and the words overlap.
 */
export const isSedanBody = (bodyType: string | null | undefined): boolean =>
  /\bsedan\b|\bsaloon\b/i.test(String(bodyType ?? ""));

export const isCommercialBody = (bodyType: string | null | undefined): boolean =>
  /\bdouble\s?cab\b|\bsingle\s?cab\b|\bextended\s?cab\b|\bsuper\s?cab\b|\bking\s?cab\b|\bbakkie\b|\bpick[\s-]?up\b|\bpanel\s?van\b|\bchassis\s?cab\b|\btruck\b|\bcommercial\b/i.test(
    String(bodyType ?? ""),
  );

export const isMpvBody = (bodyType: string | null | undefined): boolean =>
  /\bmpv\b|\bpeople\s?(?:carrier|mover)\b|\bminivan\b|\bmini\s?bus\b|\bcombi\b/i.test(String(bodyType ?? ""));

export const isEstateBody = (bodyType: string | null | undefined): boolean =>
  /\bestate\b|\bwagon\b|\btouring\b|\bavant\b|\bsportbrake\b|\bshooting\s?brake\b/i.test(
    String(bodyType ?? ""),
  );
