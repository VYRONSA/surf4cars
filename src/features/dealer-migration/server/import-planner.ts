import type { UnifiedVehicleRecord } from "@/domain/vehicle";
import { buildListingReadiness } from "@/features/inventory/server/listing-readiness";
import { createLogger } from "@/lib/observability/logger";

import { detectAdapter, parseDelimited, SOURCE_ADAPTERS } from "../adapters";
import type {
  ImportPlan,
  ImportSummary,
  MappedVehicle,
  PlannedRow,
  RowDecision,
} from "../domain/import.types";
import { proposeMapping } from "./column-mapping";
import { interpretRow } from "./row-interpreter";
import { isRejected, validateRow, type ValidationContext } from "./validation";

const log = createLogger("import-planner");

/**
 * The dry run. Nothing here writes.
 *
 * WHY PLANNING IS A SEPARATE STEP FROM IMPORTING
 * ==============================================
 * "Every import must remain reversible until publication" is easier to honour if the dealer sees
 * the whole outcome before a single row is written. A plan is a complete answer to "what will
 * happen" — every row, every issue, every duplicate decision, every readiness state — computed
 * without touching inventory. The dealer approves it, and only then does anything exist.
 *
 * It also means the expensive part is the part you can throw away. A 1 000-row file that turns out
 * to be mapped wrongly costs nothing but the dealer's attention.
 *
 * READINESS COMES FROM THE EXISTING ENGINE
 * ========================================
 * `buildListingReadiness` is the same function the dealer workspace uses. The brief is explicit:
 * never create a second scoring engine. A migrated vehicle and a hand-entered one are scored by the
 * same code, which is the only way the number means anything after the import is finished.
 */

/** Below this share of the readiness score a listing cannot sensibly be published. */
const CANNOT_PUBLISH_BELOW = 40;
const NEEDS_REVIEW_BELOW = 75;

export interface PlanInput {
  readonly dealershipId: string;
  readonly fileName: string;
  readonly content: string;
  /** Existing stock for this dealership, for duplicate detection. */
  readonly existing: readonly UnifiedVehicleRecord[];
  /** Live marketplace stock, for the unknown-make and unknown-model warnings. */
  readonly corpus: readonly UnifiedVehicleRecord[];
  readonly branchNames: readonly string[];
  /** Overrides the detected adapter when the dealer picked one. */
  readonly adapterId?: string;
}

/**
 * A candidate turned into the shape the readiness engine expects.
 *
 * Deliberately partial and deliberately honest: the fields the engine reads are populated from the
 * import and nothing else is invented. `media.photos` carries one entry per image URL, because at
 * plan time the count is all that is known and the count is all readiness uses.
 */
function toReadinessRecord(mapped: MappedVehicle): UnifiedVehicleRecord {
  return {
    core: {
      vin: mapped.vin ?? "",
      make: mapped.make ?? "",
      model: mapped.model ?? "",
      fuel: mapped.fuel ?? "",
      transmission: mapped.transmission ?? "",
      bodyType: mapped.bodyType ?? "",
      engine: mapped.engine ?? "",
      colour: mapped.colour ?? "",
      description: mapped.description ? [{ paragraphs: [mapped.description] }] : [],
    },
    pricing: { sellingPriceCents: mapped.priceCents ?? 0 },
    media: { photos: mapped.imageUrls.map((url) => ({ url })) },
  } as unknown as UnifiedVehicleRecord;
}

/**
 * Does this row already exist in the dealership's stock?
 *
 * Matched in order of how certain the identifier is. A VIN is the vehicle; a stock number is the
 * dealer's own reference and is reliable within one dealership; a registration is reliable until a
 * car is re-registered. Make/model/year is deliberately *not* used — a forecourt with four
 * identical Polos would report every one as a duplicate of the first.
 */
function findExisting(
  mapped: MappedVehicle,
  existing: readonly UnifiedVehicleRecord[],
): { readonly record: UnifiedVehicleRecord; readonly reason: string } | null {
  if (mapped.vin) {
    const key = mapped.vin.toUpperCase().replace(/\s/g, "");
    const hit = existing.find((record) => record.core.vin?.toUpperCase().replace(/\s/g, "") === key);
    if (hit) return { record: hit, reason: `same VIN as ${hit.core.title || "an existing listing"}` };
  }
  if (mapped.stockNumber) {
    const key = mapped.stockNumber.toUpperCase().trim();
    const hit = existing.find((record) => record.dealer.stockNumber?.toUpperCase().trim() === key);
    if (hit) return { record: hit, reason: `same stock number as ${hit.core.title || "an existing listing"}` };
  }
  if (mapped.registration) {
    const key = mapped.registration.toUpperCase().replace(/\s/g, "");
    const hit = existing.find(
      (record) => record.core.registration?.toUpperCase().replace(/\s/g, "") === key,
    );
    if (hit) return { record: hit, reason: `same registration as ${hit.core.title || "an existing listing"}` };
  }
  return null;
}

export function buildImportPlan(input: PlanInput): ImportPlan {
  const started = Date.now();

  const probe = parseDelimited(input.content, input.fileName, "probe");
  const adapter =
    (input.adapterId && SOURCE_ADAPTERS.find((entry) => entry.id === input.adapterId)) ||
    detectAdapter(probe.columns);

  const table = adapter.parse(input.content, input.fileName);
  const mapping = proposeMapping(table.columns, adapter);

  /* Vocabularies, built once rather than per row. On a 1 000-row file the difference between this
     and a scan per row is the difference between a second and a minute. */
  const knownMakes = new Set<string>();
  const knownModels = new Map<string, Set<string>>();
  for (const record of input.corpus) {
    const make = record.core.make?.trim().toLowerCase();
    const model = record.core.model?.trim().toLowerCase();
    if (!make) continue;
    knownMakes.add(make);
    if (model) {
      const models = knownModels.get(make) ?? new Set<string>();
      models.add(model);
      knownModels.set(make, models);
    }
  }

  const context: ValidationContext = {
    mapping: mapping.mapping,
    knownMakes,
    knownModels,
    branchNames: new Set(input.branchNames.map((name) => name.toLowerCase())),
    seenVins: new Map(),
    seenStock: new Map(),
    seenRegistrations: new Map(),
  };

  const rows: PlannedRow[] = [];

  for (const sourceRow of table.rows) {
    const { mapped, issues: readIssues } = interpretRow(sourceRow, mapping.mapping);
    const validationIssues = validateRow(sourceRow.rowNumber, mapped, context);
    const issues = [...readIssues, ...validationIssues];

    const readiness = buildListingReadiness(
      toReadinessRecord(mapped),
      mapped.equipmentSlugs.length,
    );

    const match = findExisting(mapped, input.existing);

    /*
      The default for a duplicate is `skip`, and that is a deliberate refusal.
      ======================================================================
      "Never overwrite existing vehicles automatically." A dealership re-importing yesterday's file
      after adding photographs to three cars would otherwise silently flatten the day's work. Keeping
      what already exists is the only default that cannot lose data; the dealer changes it per row,
      or in bulk, having seen the comparison.
    */
    let decision: RowDecision;
    if (isRejected(issues)) decision = "reject";
    else if (match) decision = "skip";
    else decision = "import";

    rows.push({
      rowNumber: sourceRow.rowNumber,
      raw: sourceRow.cells,
      mapped,
      issues,
      decision,
      matchedVehicleId: match?.record.id ?? null,
      matchReason: match?.reason ?? null,
      readinessScore: readiness.score,
      readinessState:
        readiness.score < CANNOT_PUBLISH_BELOW
          ? "cannot-publish"
          : readiness.score < NEEDS_REVIEW_BELOW
            ? "needs-review"
            : "ready",
    });
  }

  const summary: ImportSummary = {
    total: rows.length,
    toImport: rows.filter((row) => row.decision === "import").length,
    toUpdate: rows.filter((row) => row.decision === "update").length,
    toSkip: rows.filter((row) => row.decision === "skip").length,
    rejected: rows.filter((row) => row.decision === "reject").length,
    warnings: rows.reduce(
      (total, row) => total + row.issues.filter((issue) => issue.severity === "warning").length,
      0,
    ),
    ready: rows.filter((row) => row.decision !== "reject" && row.readinessState === "ready").length,
    needsReview: rows.filter((row) => row.decision !== "reject" && row.readinessState === "needs-review").length,
    cannotPublish: rows.filter((row) => row.decision !== "reject" && row.readinessState === "cannot-publish").length,
    imagesFound: rows.reduce((total, row) => total + row.mapped.imageUrls.length, 0),
    equipmentFound: rows.reduce((total, row) => total + row.mapped.equipmentSlugs.length, 0),
    descriptionsFound: rows.filter((row) => (row.mapped.description?.length ?? 0) >= 60).length,
  };

  log.info("import plan built", {
    rows: rows.length,
    ms: Date.now() - started,
    adapter: adapter.id,
  });

  return {
    sourceKind: adapter.id,
    sourceName: input.fileName,
    dealershipId: input.dealershipId,
    mapping,
    rows,
    summary,
  };
}
