import type { ColumnMapping, ImportIssue, MappedVehicle, SourceRow } from "../domain/import.types";

/**
 * Turning one dealer's row into one candidate vehicle — and saying what went wrong.
 *
 * THE RULE THAT SHAPES ALL OF THIS
 * ================================
 * "Never fabricate values during import."
 *
 * So there are no defaults anywhere below. A missing fuel type stays null; it does not become
 * "Petrol". An unparseable price stays null and raises an error; it does not become zero. This is
 * the same rule PCP-032 applied to the public site, and it matters more here: an invented value
 * entered during a 250-vehicle migration is indistinguishable from one the dealer typed, for ever.
 *
 * A field that cannot be read produces an issue naming the row, the dealer's own column and the
 * value. "Row 47, Mileage: could not read “78,000 km” as a number" is actionable. "Failed" is not.
 */

const clean = (value: string | undefined): string | null => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

/**
 * South African money, as dealers actually write it.
 *
 * "R 249 900", "249900", "R249,900.00", "249 900.00". The thousands separator may be a space, a
 * comma or a full stop, which is why this cannot be a single regex: `1.250` is one thousand two
 * hundred and fifty in a European export and one and a quarter in an American one. The rule used
 * here is that a final separator followed by exactly two digits is a decimal fraction, and anything
 * else is a grouping separator.
 */
function parseRand(raw: string): { cents: number | null; reason: string | null } {
  const withoutCurrency = raw.replace(/[Rr\s ]/g, "");
  if (!withoutCurrency) return { cents: null, reason: null };

  /* A leading minus is read rather than refused, so the validator can say "the price is negative"
     — which tells a dealer what to fix — instead of "it contains characters that are not part of a
     number", which tells them we could not be bothered to look. */
  const negative = withoutCurrency.startsWith("-");
  const stripped = negative ? withoutCurrency.slice(1) : withoutCurrency;
  if (!/^[\d.,]+$/.test(stripped)) {
    return { cents: null, reason: "it contains characters that are not part of a number" };
  }

  const lastComma = stripped.lastIndexOf(",");
  const lastDot = stripped.lastIndexOf(".");
  const lastSeparator = Math.max(lastComma, lastDot);
  const decimals = lastSeparator >= 0 ? stripped.length - lastSeparator - 1 : 0;

  let normalised: string;
  if (lastSeparator >= 0 && decimals === 2) {
    normalised = `${stripped.slice(0, lastSeparator).replace(/[.,]/g, "")}.${stripped.slice(lastSeparator + 1)}`;
  } else {
    normalised = stripped.replace(/[.,]/g, "");
  }

  const rand = Number(normalised);
  if (!Number.isFinite(rand)) return { cents: null, reason: "it is not a number" };
  return { cents: Math.round(rand * 100) * (negative ? -1 : 1), reason: null };
}

function parseWholeNumber(raw: string): number | null {
  const stripped = raw.replace(/[^\d]/g, "");
  if (!stripped) return null;
  const value = Number(stripped);
  return Number.isFinite(value) ? value : null;
}

/** Splits a features cell. Dealers use commas, semicolons, pipes and newlines interchangeably. */
function splitList(raw: string): string[] {
  return raw
    .split(/[;,|\n]/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

/** URLs only, and only ones that could actually be fetched. A bare filename is not an image. */
function splitUrls(raw: string): { urls: string[]; invalid: string[] } {
  const parts = raw.split(/[;,|\s\n]+/).map((entry) => entry.trim()).filter(Boolean);
  const urls: string[] = [];
  const invalid: string[] = [];
  for (const part of parts) {
    if (/^https?:\/\/\S+$/i.test(part)) urls.push(part);
    else invalid.push(part);
  }
  /* Deduplicated here rather than at media time: the same photograph listed twice in one cell is a
     property of the export, and the count the dealer is shown should be the real one. */
  return { urls: [...new Set(urls)], invalid };
}

export interface InterpretedRow {
  readonly mapped: MappedVehicle;
  readonly issues: readonly ImportIssue[];
}

export function interpretRow(row: SourceRow, mapping: ColumnMapping): InterpretedRow {
  const issues: ImportIssue[] = [];
  const cell = (field: keyof ColumnMapping): { value: string | null; column: string | null } => {
    const column = mapping[field];
    if (!column) return { value: null, column: null };
    return { value: clean(row.cells[column]), column };
  };

  const raise = (
    severity: ImportIssue["severity"],
    field: ImportIssue["field"],
    sourceColumn: string | null,
    value: string | null,
    message: string,
  ) => {
    issues.push({ severity, rowNumber: row.rowNumber, field, sourceColumn, value, message });
  };

  const price = cell("priceRand");
  let priceCents: number | null = null;
  if (price.value) {
    const parsed = parseRand(price.value);
    priceCents = parsed.cents;
    if (parsed.cents === null) {
      raise("error", "priceRand", price.column, price.value, `Could not read the price because ${parsed.reason}.`);
    }
  }

  const year = cell("year");
  let parsedYear: number | null = null;
  if (year.value) {
    parsedYear = parseWholeNumber(year.value);
    if (parsedYear === null) {
      raise("error", "year", year.column, year.value, "Could not read the model year as a number.");
    }
  }

  const mileage = cell("mileageKm");
  let parsedMileage: number | null = null;
  if (mileage.value) {
    parsedMileage = parseWholeNumber(mileage.value);
    if (parsedMileage === null) {
      raise("error", "mileageKm", mileage.column, mileage.value, "Could not read the mileage as a number.");
    }
  }

  const images = cell("imageUrls");
  const { urls, invalid } = images.value ? splitUrls(images.value) : { urls: [], invalid: [] };
  if (invalid.length > 0) {
    raise(
      "warning",
      "imageUrls",
      images.column,
      invalid.slice(0, 3).join(", "),
      `${invalid.length} photograph ${invalid.length === 1 ? "entry is" : "entries are"} not a web address and will be skipped. Photographs must be links beginning http:// or https://.`,
    );
  }

  const equipment = cell("equipment");
  const equipmentRaw = equipment.value ? splitList(equipment.value) : [];

  return {
    mapped: {
      vin: cell("vin").value,
      stockNumber: cell("stockNumber").value,
      registration: cell("registration").value,
      make: cell("make").value,
      model: cell("model").value,
      variant: cell("variant").value,
      year: parsedYear,
      mileageKm: parsedMileage,
      fuel: cell("fuel").value,
      transmission: cell("transmission").value,
      colour: cell("colour").value,
      bodyType: cell("bodyType").value,
      engine: cell("engine").value,
      priceCents,
      description: cell("description").value,
      /* Raw labels here; the equipment matcher resolves them to canonical slugs against
         `equipment_items.synonyms`, which is where that vocabulary already lives. */
      equipmentSlugs: equipmentRaw,
      imageUrls: urls,
      branchId: null,
    },
    issues,
  };
}
