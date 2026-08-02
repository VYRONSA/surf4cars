import type { ColumnMapping, ImportIssue, MappedVehicle } from "../domain/import.types";

/**
 * Everything that can be wrong with a row, and how to say it.
 *
 * TWO SEVERITIES, ONE DISTINCTION
 * ===============================
 *   error    the row cannot become a listing. It is rejected and nothing is written.
 *   warning  the row imports, and the dealer is told what will be thin about it.
 *
 * The line between them is whether a buyer would be misled or the platform would hold a nonsense
 * record. A vehicle with no photographs is a warning — it is a real car and the dealer may be about
 * to add them. A vehicle with a negative price is an error, because publishing it would show a
 * buyer something untrue.
 *
 * WHY EVERY MESSAGE IS A SENTENCE
 * ===============================
 * "Every rejected record must explain why." A dealer migrating 250 vehicles at four in the
 * afternoon needs to fix problems, not decode them. Each message names the value, says what is
 * wrong with it, and where it is possible says what to do — and the row and column travel with it
 * so their spreadsheet can be opened at the right cell.
 */

/** A vehicle cannot be from further ahead than next year's models, which arrive late in the year. */
const MAX_FUTURE_YEARS = 1;
const EARLIEST_PLAUSIBLE_YEAR = 1900;
/** Roughly twice the highest odometer reading a road car realistically reaches. */
const IMPLAUSIBLE_MILEAGE_KM = 2_000_000;
/** Below this a price is far more likely to be a typo or a monthly instalment than an asking price. */
const IMPLAUSIBLE_PRICE_CENTS = 100_000;

export interface ValidationContext {
  readonly mapping: ColumnMapping;
  /** Makes present in live marketplace stock, for the unknown-make warning. */
  readonly knownMakes: ReadonlySet<string>;
  /** Models per make, likewise. */
  readonly knownModels: ReadonlyMap<string, ReadonlySet<string>>;
  /** Branch names this dealership actually has. */
  readonly branchNames: ReadonlySet<string>;
  /** VIN / stock / registration already used *within this file*, for in-file duplicates. */
  readonly seenVins: Map<string, number>;
  readonly seenStock: Map<string, number>;
  readonly seenRegistrations: Map<string, number>;
}

export function validateRow(
  rowNumber: number,
  mapped: MappedVehicle,
  context: ValidationContext,
): readonly ImportIssue[] {
  const issues: ImportIssue[] = [];
  const column = (field: keyof ColumnMapping) => context.mapping[field] ?? null;

  const raise = (
    severity: ImportIssue["severity"],
    field: ImportIssue["field"],
    sourceColumn: string | null,
    value: string | null,
    message: string,
  ) => issues.push({ severity, rowNumber, field, sourceColumn, value, message });

  /* ── Identity ──────────────────────────────────────────────────────────────────────────────
     A listing needs enough to be one vehicle rather than a row of text. Make, model and price are
     the floor: without them there is nothing to publish and nothing a buyer could search for.
     ─────────────────────────────────────────────────────────────────────────────────────────── */

  if (!mapped.make) {
    raise("error", "make", column("make"), null, "No make. A listing cannot be created without one.");
  }
  if (!mapped.model) {
    raise("error", "model", column("model"), null, "No model. A listing cannot be created without one.");
  }

  if (mapped.priceCents === null) {
    raise(
      "error",
      "priceRand",
      column("priceRand"),
      null,
      "No asking price. Buyers filter by price before anything else, so a listing without one cannot be published.",
    );
  } else if (mapped.priceCents < 0) {
    raise("error", "priceRand", column("priceRand"), String(mapped.priceCents / 100), "The price is negative.");
  } else if (mapped.priceCents > 0 && mapped.priceCents < IMPLAUSIBLE_PRICE_CENTS) {
    raise(
      "warning",
      "priceRand",
      column("priceRand"),
      `R${Math.round(mapped.priceCents / 100)}`,
      "This price is under R1 000. If it is a monthly instalment rather than the asking price, the wrong column may be mapped.",
    );
  }

  /* ── Year ─────────────────────────────────────────────────────────────────────────────────── */

  if (mapped.year !== null) {
    const nextYear = new Date().getFullYear() + MAX_FUTURE_YEARS;
    if (mapped.year > nextYear) {
      raise(
        "error",
        "year",
        column("year"),
        String(mapped.year),
        `${mapped.year} is further ahead than next year's models. Check whether this column holds a registration date rather than a model year.`,
      );
    } else if (mapped.year < EARLIEST_PLAUSIBLE_YEAR) {
      raise("error", "year", column("year"), String(mapped.year), `${mapped.year} is not a plausible model year.`);
    }
  } else if (context.mapping.year) {
    raise("warning", "year", column("year"), null, "No model year. Buyers filter by year, so this vehicle will be missed by those searches.");
  }

  /* ── Mileage ──────────────────────────────────────────────────────────────────────────────── */

  if (mapped.mileageKm !== null) {
    if (mapped.mileageKm < 0) {
      raise("error", "mileageKm", column("mileageKm"), String(mapped.mileageKm), "The mileage is negative.");
    } else if (mapped.mileageKm > IMPLAUSIBLE_MILEAGE_KM) {
      raise(
        "error",
        "mileageKm",
        column("mileageKm"),
        String(mapped.mileageKm),
        `${mapped.mileageKm.toLocaleString("en-ZA")} km is not a plausible reading. Check whether this figure is in metres or includes the price.`,
      );
    }
  } else if (context.mapping.mileageKm) {
    raise("warning", "mileageKm", column("mileageKm"), null, "No mileage. It is one of the first things a buyer looks for.");
  }

  /* ── Duplicates within the file itself ─────────────────────────────────────────────────────
     Distinct from the duplicate check against existing stock, which happens later and is the
     dealer's decision. A file containing the same VIN twice is a fault in the file, and importing
     both would create two listings for one car on the dealer's own forecourt.
     ─────────────────────────────────────────────────────────────────────────────────────────── */

  if (mapped.vin) {
    const key = mapped.vin.toUpperCase();
    const first = context.seenVins.get(key);
    if (first !== undefined) {
      raise("error", "vin", column("vin"), mapped.vin, `This VIN also appears on row ${first} of this file.`);
    } else {
      context.seenVins.set(key, rowNumber);
    }
    if (mapped.vin.replace(/\s/g, "").length !== 17) {
      raise(
        "warning",
        "vin",
        column("vin"),
        mapped.vin,
        "A VIN is normally 17 characters. This one will still import, but check it before publishing.",
      );
    }
  }

  if (mapped.stockNumber) {
    const key = mapped.stockNumber.toUpperCase();
    const first = context.seenStock.get(key);
    if (first !== undefined) {
      raise("error", "stockNumber", column("stockNumber"), mapped.stockNumber, `This stock number also appears on row ${first} of this file.`);
    } else {
      context.seenStock.set(key, rowNumber);
    }
  }

  if (mapped.registration) {
    const key = mapped.registration.toUpperCase().replace(/\s/g, "");
    const first = context.seenRegistrations.get(key);
    if (first !== undefined) {
      raise("error", "registration", column("registration"), mapped.registration, `This registration also appears on row ${first} of this file.`);
    } else {
      context.seenRegistrations.set(key, rowNumber);
    }
  }

  /* ── Content completeness — warnings, never errors ─────────────────────────────────────────
     The brief's rule from PCP-035 carries over: reward completeness, never punish incompleteness.
     These are the things that will make the listing weak, said once, at the point the dealer can
     still do something about them in bulk.
     ─────────────────────────────────────────────────────────────────────────────────────────── */

  if (mapped.imageUrls.length === 0) {
    raise(
      "warning",
      "imageUrls",
      column("imageUrls"),
      null,
      "No photographs. Listings without photographs are filtered out before a buyer reads anything else.",
    );
  } else if (mapped.imageUrls.length < 6) {
    raise(
      "warning",
      "imageUrls",
      column("imageUrls"),
      String(mapped.imageUrls.length),
      `Only ${mapped.imageUrls.length} photograph${mapped.imageUrls.length === 1 ? "" : "s"}. Six or more is where a gallery stops looking like an afterthought.`,
    );
  }

  if (!mapped.description || mapped.description.length < 60) {
    raise(
      "warning",
      "description",
      column("description"),
      mapped.description ? `${mapped.description.length} characters` : null,
      "No description worth publishing. Your own words are the only part of a listing a competitor cannot copy.",
    );
  }

  if (mapped.equipmentSlugs.length === 0) {
    raise("warning", "equipment", column("equipment"), null, "No equipment listed. Specification is the most common question a dealer answers by telephone.");
  }

  /* ── Vocabulary — warnings, because the marketplace is not the world ───────────────────────
     An unknown make is usually a spelling variant ("Mercedes" for "Mercedes-Benz") and occasionally
     a marque SURF4CARS genuinely has none of. Rejecting on it would refuse the first Cupra ever
     listed, so it warns and imports.
     ─────────────────────────────────────────────────────────────────────────────────────────── */

  if (mapped.make && context.knownMakes.size > 0 && !context.knownMakes.has(mapped.make.toLowerCase())) {
    raise(
      "warning",
      "make",
      column("make"),
      mapped.make,
      `No other vehicle on SURF4CARS is listed as “${mapped.make}”. If this is a spelling variant, buyers filtering by make will not find it.`,
    );
  } else if (mapped.make && mapped.model) {
    const models = context.knownModels.get(mapped.make.toLowerCase());
    if (models && models.size > 0 && !models.has(mapped.model.toLowerCase())) {
      raise(
        "warning",
        "model",
        column("model"),
        mapped.model,
        `No other ${mapped.make} on SURF4CARS is listed as “${mapped.model}”. Check the spelling if buyers should find it by model.`,
      );
    }
  }

  return issues;
}

/** A row is rejected when anything about it would make a false or unpublishable listing. */
export const isRejected = (issues: readonly ImportIssue[]): boolean =>
  issues.some((issue) => issue.severity === "error");
