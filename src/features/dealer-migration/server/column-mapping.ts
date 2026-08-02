import type { SourceAdapter } from "../adapters";
import {
  CANONICAL_FIELDS,
  type CanonicalField,
  type ColumnMapping,
  type MappingProposal,
} from "../domain/import.types";

/**
 * Working out which of the dealer's columns is which.
 *
 * WHY THIS IS ALIASES AND NOT CLEVERNESS
 * ======================================
 * Every dealer export in South Africa spells the same eighteen things differently — "Odometer",
 * "Mileage", "KMs", "Km Reading". The temptation is fuzzy matching or an LLM. Both fail in the same
 * expensive way: they are right most of the time, silently wrong occasionally, and the dealer only
 * discovers which when a buyer asks why the car has 2 019 kilometres on it.
 *
 * So this is a table of aliases, scored, with the winning reason recorded and shown to the dealer
 * before anything is imported. A mapping a dealer can read and correct beats one they have to trust.
 *
 * THE SCORE EXISTS TO BREAK TIES HONESTLY
 * =======================================
 * Exact alias beats prefix beats contains. Without the ordering, a file containing both "Price" and
 * "Price Including VAT" resolves by whichever the spreadsheet happened to list first.
 */

/**
 * Canonical field → the column names dealers actually use.
 *
 * Compared after lower-casing and stripping non-alphanumerics, so "Stock No.", "stock_no" and
 * "StockNo" are one entry rather than three.
 */
const ALIASES: Record<CanonicalField, readonly string[]> = {
  vin: ["vin", "vinnumber", "chassis", "chassisnumber", "vinchassis"],
  stockNumber: ["stock", "stockno", "stocknumber", "stockcode", "stockid", "stockref", "ref", "reference"],
  registration: ["registration", "reg", "regno", "registrationno", "registrationnumber", "licence", "licenceplate"],
  make: ["make", "manufacturer", "brand", "marque"],
  model: ["model", "modelname"],
  variant: ["variant", "derivative", "trim", "version", "spec", "modelvariant"],
  year: ["year", "modelyear", "regyear", "yearmodel", "firstregistration"],
  mileageKm: ["mileage", "km", "kms", "odometer", "kilometres", "kilometers", "mileagekm", "kmreading"],
  fuel: ["fuel", "fueltype", "petroldiesel"],
  transmission: ["transmission", "gearbox", "gears", "transmissiontype"],
  colour: ["colour", "color", "exteriorcolour", "exteriorcolor", "paint"],
  bodyType: ["bodytype", "body", "bodystyle", "vehicletype", "cartype"],
  engine: ["engine", "enginesize", "enginecapacity", "cc", "displacement", "enginedescription"],
  priceRand: ["price", "sellingprice", "askingprice", "retailprice", "advertisedprice", "amount"],
  description: ["description", "comments", "notes", "adverttext", "adverttext", "details", "remarks"],
  equipment: ["equipment", "features", "extras", "options", "accessories", "specification"],
  imageUrls: ["images", "imageurls", "photos", "photourls", "pictures", "imagelinks", "media"],
  branch: ["branch", "branchname", "location", "site", "dealership", "dealerbranch"],
};

const normalise = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");

/**
 * Columns that must never be auto-mapped to a public field, whatever they look like.
 *
 * THIS IS THE MOST DANGEROUS PART OF THE MAPPER
 * =============================================
 * "Cost Price", "Purchase Price" and "Trade Price" all end in "price", so a generic alias match
 * scores them exactly as highly as "Retail Price" — and on a file that lists cost first, the mapper
 * would publish a dealership's buying price to the open marketplace. "Internal Notes" ends in
 * "notes" and would become the public description.
 *
 * Both were found by the verification suite before either shipped. Neither is a hypothetical: cost
 * columns are present in every DMS export I modelled, because that is where a dealer's margin lives.
 *
 * These columns are not merely skipped — they are reported as ignored, so a dealer who genuinely
 * wanted one mapped can do it deliberately rather than discovering the platform guessed.
 */
const NEVER_AUTO_MAP = /(^|[^a-z])(cost|purchase|trade|tradein|buying|bought|internal|private|admin|margin|profit|floorplan)([^a-z]|$)/i;

const isProtected = (column: string) => NEVER_AUTO_MAP.test(column);

interface Candidate {
  readonly column: string;
  readonly score: number;
  readonly reason: string;
}

function scoreColumn(column: string, aliases: readonly string[]): Candidate | null {
  const normalised = normalise(column);
  if (!normalised) return null;

  for (const alias of aliases) {
    if (normalised === alias) {
      return { column, score: 100, reason: `“${column}” matches ${alias} exactly` };
    }
  }
  for (const alias of aliases) {
    if (normalised.startsWith(alias) || normalised.endsWith(alias)) {
      return { column, score: 70, reason: `“${column}” starts or ends with ${alias}` };
    }
  }
  for (const alias of aliases) {
    /* Guard against a three-letter alias matching inside an unrelated word — "reg" inside
       "Region" would otherwise claim the registration column on any file with a region. */
    if (alias.length >= 5 && normalised.includes(alias)) {
      return { column, score: 40, reason: `“${column}” contains ${alias}` };
    }
  }
  return null;
}

export function proposeMapping(
  columns: readonly string[],
  adapter?: SourceAdapter,
): MappingProposal {
  const mapping: Partial<Record<CanonicalField, string>> = {};
  const reasons: Partial<Record<CanonicalField, string>> = {};
  const claimed = new Set<string>();

  /*
    Two passes, strongest first.
    ===========================
    Resolving fields in declaration order lets an early field take a column a later one would have
    matched exactly — "Model" claiming "Model Year" before `year` is considered. Collecting every
    candidate and awarding the highest score first removes the ordering dependency entirely.
  */
  const candidates: { field: CanonicalField; candidate: Candidate }[] = [];

  for (const field of CANONICAL_FIELDS) {
    const hints = adapter?.columnHints?.[field] ?? [];
    const aliases = [...hints, ...ALIASES[field]];
    for (const column of columns) {
      /* A protected column is never claimed automatically. It falls through to `ignoredColumns`,
         where the dealer sees it was left alone and can map it by hand if they meant to. */
      if (isProtected(column)) continue;
      const scored = scoreColumn(column, aliases);
      if (scored) {
        /* A source-specific hint is a stronger signal than a generic alias: AutoTrader calling its
           variant column "Derivative" is a fact about AutoTrader, not a guess. */
        const boosted = hints.some((hint) => normalise(column) === hint)
          ? { ...scored, score: 120, reason: `“${column}” is the ${adapter?.label} name for this field` }
          : scored;
        candidates.push({ field, candidate: boosted });
      }
    }
  }

  candidates.sort((a, b) => b.candidate.score - a.candidate.score);

  for (const { field, candidate } of candidates) {
    if (mapping[field] || claimed.has(candidate.column)) continue;
    mapping[field] = candidate.column;
    reasons[field] = candidate.reason;
    claimed.add(candidate.column);
  }

  /*
    Everything the mapper could not place, reported.
    ===============================================
    "Unknown columns must never disappear." This list travels to the review screen, into the batch
    record, and out again in the import report — so a dealership whose export carries "Warranty
    Expiry" learns SURF4CARS had nowhere to put it, rather than discovering the gap weeks later.
  */
  const ignoredColumns = columns.filter((column) => column.trim() && !claimed.has(column));

  return { mapping: mapping as ColumnMapping, ignoredColumns, reasons };
}
