/**
 * The vocabulary the whole migration platform shares.
 *
 * ONE ENGINE, EVERYTHING ELSE AN ADAPTER
 * ======================================
 * Phase 13 of the brief asks whether another importer can be added without changing the import
 * engine. The answer is yes exactly to the degree that adapters are confined to one job: turning a
 * file into `SourceTable`. Everything downstream — mapping, validation, duplicate detection,
 * readiness, writing, reverting — operates on `SourceTable` and has no idea whether it came from a
 * CSV, an AutoTrader export or a DMS API.
 *
 * That is the entire architectural claim, and it is worth stating as a rule: **an adapter may not
 * validate, may not map to canonical fields, and may not touch the database.** The moment one does,
 * the second adapter has to reimplement it and the third disagrees with both.
 *
 *      CSV ─┐
 *   Excel ──┤
 *  AutoTrader ─┤──► SourceTable ──► mapping ──► validation ──► duplicate check ──► plan ──► execute
 *  Cars.co.za ─┤                       │             │                │
 *      DMS ────┘                    (Phase 4)     (Phase 5)        (Phase 8)
 */

/** A file reduced to a header row and data rows. The only thing an adapter produces. */
export interface SourceTable {
  /** Column headers exactly as the dealer's file spells them. Never normalised here. */
  readonly columns: readonly string[];
  readonly rows: readonly SourceRow[];
  /** Which adapter read this, recorded on the batch so history survives an adapter change. */
  readonly sourceKind: string;
  readonly sourceName: string;
}

export interface SourceRow {
  /** 1-based and counting the header, so it matches what the dealer sees in Excel. */
  readonly rowNumber: number;
  readonly cells: Readonly<Record<string, string>>;
}

/* ── Canonical fields ─────────────────────────────────────────────────────────────────────────
   The complete set a vehicle listing can carry from an import. Adding one here is the only change
   needed to teach every adapter about a new field, because adapters do not name fields at all.
   ──────────────────────────────────────────────────────────────────────────────────────────── */

export const CANONICAL_FIELDS = [
  "vin",
  "stockNumber",
  "registration",
  "make",
  "model",
  "variant",
  "year",
  "mileageKm",
  "fuel",
  "transmission",
  "colour",
  "bodyType",
  "engine",
  "priceRand",
  "description",
  "equipment",
  "imageUrls",
  "branch",
] as const;

export type CanonicalField = (typeof CANONICAL_FIELDS)[number];

/** Source column → canonical field. Columns absent from this are reported, never dropped quietly. */
export type ColumnMapping = Readonly<Partial<Record<CanonicalField, string>>>;

export interface MappingProposal {
  readonly mapping: ColumnMapping;
  /**
   * Columns the mapper could not place.
   *
   * Carried all the way to the import report and stored on the batch. "Never silently discard
   * imported data" is mostly this: a dealership's export has a "Warranty Expiry" column, SURF4CARS
   * has nowhere to put it yet, and the dealer is entitled to know it was left behind rather than
   * discover it missing three weeks later.
   */
  readonly ignoredColumns: readonly string[];
  /** Per field, how the column was chosen — so a wrong guess can be understood and corrected. */
  readonly reasons: Readonly<Partial<Record<CanonicalField, string>>>;
}

/* ── Issues ──────────────────────────────────────────────────────────────────────────────────── */

export type IssueSeverity = "error" | "warning";

export interface ImportIssue {
  readonly severity: IssueSeverity;
  /** 1-based source line. Every issue names one. */
  readonly rowNumber: number;
  readonly field: CanonicalField | "row";
  /** The dealer's own column name, so the message points at their spreadsheet, not our schema. */
  readonly sourceColumn: string | null;
  /** The offending value, quoted back. */
  readonly value: string | null;
  /** Written to be read by a dealer. Never "Failed", never a code. */
  readonly message: string;
}

/* ── A planned row ───────────────────────────────────────────────────────────────────────────── */

export type RowDecision = "import" | "update" | "skip" | "reject";

export interface MappedVehicle {
  readonly vin: string | null;
  readonly stockNumber: string | null;
  readonly registration: string | null;
  readonly make: string | null;
  readonly model: string | null;
  readonly variant: string | null;
  readonly year: number | null;
  readonly mileageKm: number | null;
  readonly fuel: string | null;
  readonly transmission: string | null;
  readonly colour: string | null;
  readonly bodyType: string | null;
  readonly engine: string | null;
  readonly priceCents: number | null;
  readonly description: string | null;
  readonly equipmentSlugs: readonly string[];
  readonly imageUrls: readonly string[];
  readonly branchId: string | null;
}

export interface PlannedRow {
  readonly rowNumber: number;
  readonly raw: Readonly<Record<string, string>>;
  readonly mapped: MappedVehicle;
  readonly issues: readonly ImportIssue[];
  /**
   * What will happen, and why.
   *
   * `reject` is set only by the validator, for an error-severity issue. Duplicates never
   * auto-resolve: a matched row defaults to `skip` — keep what is already published — and the
   * dealer changes it. "Never overwrite existing vehicles automatically" is enforced by this
   * default, not by a confirmation dialogue somebody can click through.
   */
  readonly decision: RowDecision;
  readonly matchedVehicleId: string | null;
  readonly matchReason: string | null;
  /** From the shared readiness engine — never a second scoring system. */
  readonly readinessScore: number;
  readonly readinessState: "ready" | "needs-review" | "cannot-publish";
}

export interface ImportPlan {
  readonly sourceKind: string;
  readonly sourceName: string;
  readonly dealershipId: string;
  readonly mapping: MappingProposal;
  readonly rows: readonly PlannedRow[];
  readonly summary: ImportSummary;
}

export interface ImportSummary {
  readonly total: number;
  readonly toImport: number;
  readonly toUpdate: number;
  readonly toSkip: number;
  readonly rejected: number;
  readonly warnings: number;
  readonly ready: number;
  readonly needsReview: number;
  readonly cannotPublish: number;
  readonly imagesFound: number;
  readonly equipmentFound: number;
  readonly descriptionsFound: number;
}
