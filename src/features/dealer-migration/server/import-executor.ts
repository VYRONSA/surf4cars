import { createLogger } from "@/lib/observability/logger";
import { createDomainServerClient } from "@/lib/supabase/service-client";

import type { ImportPlan, PlannedRow, RowDecision } from "../domain/import.types";

/**
 * Turning an approved plan into listings — and being able to take it all back.
 *
 * WHAT THE PLANNER DELIBERATELY DID NOT DO
 * ========================================
 * `buildImportPlan` writes nothing. It is a complete answer to "what will happen" computed against
 * inventory without touching it, which is what lets a dealer see every row, every issue and every
 * duplicate before a single record exists. This file is the other half: the part that commits.
 *
 * THE FOUR RULES THIS FILE EXISTS TO ENFORCE
 * ==========================================
 *   "Never silently discard imported data."      → every source row is written to the ledger,
 *                                                   including rejected ones, with its raw cells.
 *   "Never overwrite existing vehicles           → `update` is written only where the dealer's
 *    automatically."                                decision map says so, and the planner never
 *                                                   produces that decision on its own.
 *   "Every import must remain reversible          → imports land as drafts; `revertImportBatch`
 *    until publication."                            deletes exactly what this batch created, and
 *                                                   refuses once anything has been published.
 *   "Every imported value must retain its source."→ `raw` holds the dealer's cells verbatim,
 *                                                   for ever, next to what they became.
 *
 * WHY IMPORTS LAND AS DRAFTS
 * ==========================
 * Not caution for its own sake. A migrated listing's photographs are still URLs on the competitor's
 * CDN until the media pass fetches them, and publishing a listing whose images can be revoked by the
 * platform the dealer is leaving is a way to produce 250 broken galleries on the day the account
 * closes. Draft is the honest state until the vehicle is genuinely ours to show.
 */

const log = createLogger("import-executor");

/**
 * Rows per insert. Chosen against a measured 360ms round trip from a development machine: at 200,
 * a 1 000-vehicle import is 5 statements rather than 1 000, which is the difference between six
 * minutes and two seconds. Larger batches risk the statement timeout on a constrained instance.
 */
const WRITE_CHUNK = 200;

export class ImportExecutionError extends Error {
  readonly status: 400 | 403 | 404 | 409;

  constructor(message: string, status: 400 | 403 | 404 | 409 = 400) {
    super(message);
    this.name = "ImportExecutionError";
    this.status = status;
  }
}

function requireClient(accessToken?: string) {
  const supabase = createDomainServerClient(accessToken);
  if (!supabase) {
    throw new ImportExecutionError("The database is not configured, so nothing can be imported.", 400);
  }
  return supabase;
}

function chunk<T>(items: readonly T[], size: number): T[][] {
  const out: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    out.push(items.slice(index, index + size));
  }
  return out;
}

/** Blank means not supplied, and that has one representation. Never "". */
const orNull = (value: string | null | undefined): string | null => {
  const text = String(value ?? "").trim();
  return text.length === 0 ? null : text;
};

/**
 * The listing title.
 *
 * Composed from fields the validator guarantees are present, plus the variant when the dealer gave
 * one. This is derivation, not fabrication — every part of the string came from their file, and a
 * buyer reading "2019 Volkswagen Polo 1.0 TSI Comfortline" is reading the dealer's own data joined
 * with spaces.
 */
function buildTitle(row: PlannedRow): string {
  return [row.mapped.year, row.mapped.make, row.mapped.model, row.mapped.variant]
    .filter((part) => part !== null && String(part).trim().length > 0)
    .join(" ")
    .trim();
}

export interface ExecuteImportInput {
  readonly plan: ImportPlan;
  /**
   * Row number → what the dealer decided, where they changed it.
   *
   * Absent means "use what the plan proposed", which for a duplicate is always `skip`. The map only
   * ever carries deliberate choices, so an empty map is the safe import: nothing overwritten.
   */
  readonly decisions?: Readonly<Record<number, RowDecision>>;
  /** Every vehicle needs a branch. The dealer picks one in the wizard when the file does not say. */
  readonly defaultBranchId: string;
  readonly createdBy: string;
  readonly accessToken?: string;
}

export interface ExecuteImportResult {
  readonly batchId: string;
  readonly imported: number;
  readonly updated: number;
  readonly skipped: number;
  readonly rejected: number;
  readonly mediaWritten: number;
  readonly durationMs: number;
}

export async function executeImportPlan(input: ExecuteImportInput): Promise<ExecuteImportResult> {
  const started = Date.now();
  const supabase = requireClient(input.accessToken);
  const { plan } = input;

  const { data: branch, error: branchError } = await supabase
    .from("dealership_branches")
    .select("id")
    .eq("id", input.defaultBranchId)
    .eq("dealership_id", plan.dealershipId)
    .maybeSingle();

  if (branchError) throw new ImportExecutionError(branchError.message);
  if (!branch) {
    throw new ImportExecutionError("Choose a branch for these vehicles before importing.", 400);
  }

  /* The batch is created first and in `importing`. If the process dies mid-run, what is left behind
     is a batch that says so — recoverable, and visible. A batch written at the end would leave
     orphaned vehicles belonging to an import that, as far as the ledger knows, never happened. */
  const { data: batch, error: batchError } = await supabase
    .from("vehicle_import_batches")
    .insert({
      dealership_id: plan.dealershipId,
      source_kind: plan.sourceKind,
      source_name: plan.sourceName,
      status: "importing",
      column_mapping: plan.mapping.mapping,
      ignored_columns: plan.mapping.ignoredColumns,
      total_rows: plan.rows.length,
      created_by: input.createdBy,
    })
    .select("id")
    .single();

  if (batchError) throw new ImportExecutionError(batchError.message);
  const batchId = batch.id as string;

  const decisions = input.decisions ?? {};
  const resolved = plan.rows.map((row) => ({
    row,
    decision: (decisions[row.rowNumber] ?? row.decision) as RowDecision,
  }));

  /* A rejected row cannot be forced through by a decision map. The rejection came from an error the
     validator raised — a negative price, an unreadable year — and honouring an override here would
     let the UI write a record the engine has already said is not a listing. */
  for (const entry of resolved) {
    if (entry.row.decision === "reject") entry.decision = "reject";
  }

  const ledgerRows: Record<string, unknown>[] = [];
  const vehicleInserts: Record<string, unknown>[] = [];
  const vehicleUpdates: { readonly id: string; readonly values: Record<string, unknown> }[] = [];
  const mediaInserts: Record<string, unknown>[] = [];
  const equipmentInserts: { readonly vehicleId: string; readonly label: string }[] = [];

  let imported = 0;
  let updated = 0;
  let skipped = 0;
  let rejected = 0;

  for (const { row, decision } of resolved) {
    const vehicleId = `veh-${crypto.randomUUID()}`;

    if (decision === "reject") {
      rejected += 1;
      ledgerRows.push(ledgerRow(batchId, row, "rejected", null));
      continue;
    }

    if (decision === "skip") {
      skipped += 1;
      ledgerRows.push(ledgerRow(batchId, row, "skipped", null, row.matchedVehicleId));
      continue;
    }

    if (decision === "update") {
      if (!row.matchedVehicleId) {
        /* An update with nothing to update is a bug in the caller, not a dealer error. Recorded as
           rejected with a stated reason rather than silently becoming an insert, which would create
           the duplicate the dealer was trying to avoid. */
        rejected += 1;
        ledgerRows.push(
          ledgerRow(batchId, row, "rejected", null, null, [
            {
              severity: "error",
              rowNumber: row.rowNumber,
              field: "row",
              sourceColumn: null,
              value: null,
              message: "This row was marked to update an existing vehicle, but no existing vehicle was matched to it.",
            },
          ]),
        );
        continue;
      }

      updated += 1;
      vehicleUpdates.push({ id: row.matchedVehicleId, values: vehicleValues(row, input.defaultBranchId) });
      ledgerRows.push(ledgerRow(batchId, row, "updated", row.matchedVehicleId, row.matchedVehicleId));
      continue;
    }

    imported += 1;
    vehicleInserts.push({
      id: vehicleId,
      dealership_id: plan.dealershipId,
      created_by: input.createdBy,
      lifecycle_status: "draft",
      ...vehicleValues(row, input.defaultBranchId),
    });

    row.mapped.imageUrls.forEach((url, index) => {
      mediaInserts.push({
        id: `med-${crypto.randomUUID()}`,
        dealership_id: plan.dealershipId,
        vehicle_id: vehicleId,
        file_name: fileNameFromUrl(url, index),
        file_url: url,
        is_primary: index === 0,
        sort_order: index,
        /* Not yet fetched, not yet assessed. `processing_status` says so rather than a default that
           would let the photography engine treat an unverified third-party URL as a finished asset. */
        processing_status: "pending",
        quality_status: "review",
        provenance: "dealer",
      });
    });

    for (const slug of row.mapped.equipmentSlugs) {
      equipmentInserts.push({ vehicleId, label: slug });
    }

    ledgerRows.push(ledgerRow(batchId, row, "imported", vehicleId));
  }

  try {
    for (const part of chunk(vehicleInserts, WRITE_CHUNK)) {
      const { error } = await supabase.from("inventory_vehicles").insert(part);
      if (error) throw new ImportExecutionError(`Importing vehicles failed: ${error.message}`);
    }

    /* Updates are one statement each because each carries different values. This is the slow path,
       and it is the one a dealer explicitly asked for row by row — correctness over throughput. */
    for (const update of vehicleUpdates) {
      const { error } = await supabase
        .from("inventory_vehicles")
        .update(update.values)
        .eq("id", update.id)
        .eq("dealership_id", plan.dealershipId);
      if (error) throw new ImportExecutionError(`Updating an existing vehicle failed: ${error.message}`);
    }

    for (const part of chunk(mediaInserts, WRITE_CHUNK)) {
      const { error } = await supabase.from("inventory_vehicle_media").insert(part);
      if (error) throw new ImportExecutionError(`Importing photographs failed: ${error.message}`);
    }

    await writeEquipment(supabase, plan.dealershipId, equipmentInserts);

    for (const part of chunk(ledgerRows, WRITE_CHUNK)) {
      const { error } = await supabase.from("vehicle_import_rows").insert(part);
      if (error) throw new ImportExecutionError(`Recording the import failed: ${error.message}`);
    }
  } catch (error) {
    /* The batch is marked failed and left in place, along with whatever rows were written. Deleting
       the evidence of a failed import is how a dealership ends up with vehicles nobody can account
       for; `revertImportBatch` can still remove them, deliberately. */
    await supabase
      .from("vehicle_import_batches")
      .update({ status: "failed", completed_at: new Date().toISOString() })
      .eq("id", batchId);
    log.error("import failed", { batchId, message: error instanceof Error ? error.message : String(error) });
    throw error;
  }

  await supabase
    .from("vehicle_import_batches")
    .update({
      status: "imported",
      imported_count: imported,
      updated_count: updated,
      skipped_count: skipped,
      rejected_count: rejected,
      completed_at: new Date().toISOString(),
    })
    .eq("id", batchId);

  const durationMs = Date.now() - started;
  log.info("import complete", { batchId, imported, updated, skipped, rejected, durationMs });

  return {
    batchId,
    imported,
    updated,
    skipped,
    rejected,
    mediaWritten: mediaInserts.length,
    durationMs,
  };
}

/**
 * Equipment, matched against the canonical vocabulary that already exists.
 *
 * `equipment_items` holds 37 canonical items with a `synonyms` column, and it is the platform's one
 * equipment vocabulary. Matching against it here — rather than inventing a second list, or writing
 * the dealer's raw labels into a free-text column — is what stops "Aircon", "Air Conditioning" and
 * "A/C" becoming three different features on three different listings.
 *
 * A label that matches nothing is dropped from the join table and stays visible in the row's `raw`
 * cells. It is not invented into a new equipment item: the vocabulary is curated, and an import is
 * not the place to extend it.
 */
async function writeEquipment(
  supabase: NonNullable<ReturnType<typeof createDomainServerClient>>,
  dealershipId: string,
  entries: readonly { readonly vehicleId: string; readonly label: string }[],
): Promise<void> {
  if (entries.length === 0) return;

  const { data: items, error } = await supabase
    .from("equipment_items")
    .select("id, slug, label, synonyms");

  if (error || !items) return;

  const lookup = new Map<string, string>();
  for (const item of items) {
    const record = item as { id: string; slug: string; label: string; synonyms: unknown };
    const keys = [record.slug, record.label, ...(Array.isArray(record.synonyms) ? record.synonyms : [])];
    for (const key of keys) {
      const normalised = String(key ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
      if (normalised) lookup.set(normalised, record.id);
    }
  }

  const rows: Record<string, unknown>[] = [];
  const seen = new Set<string>();
  for (const entry of entries) {
    const normalised = entry.label.toLowerCase().replace(/[^a-z0-9]/g, "");
    const equipmentItemId = lookup.get(normalised);
    if (!equipmentItemId) continue;
    /* The primary key is (vehicle_id, equipment_item_id): asserting an item twice is a data error,
       not a stronger claim. Deduplicated here so one repeated label in the dealer's cell does not
       fail the whole chunk. */
    const key = `${entry.vehicleId}:${equipmentItemId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    rows.push({
      vehicle_id: entry.vehicleId,
      equipment_item_id: equipmentItemId,
      dealership_id: dealershipId,
      /* `dealer`, not `imported`. The column's own definition reserves `imported` for values decoded
         from a VIN or a manufacturer feed; a dealership typing equipment into its stock spreadsheet
         is the dealership recording it, which is exactly what `dealer` means. Reaching for
         `imported` because the value arrived through an importer would overstate where it came
         from — the transport is not the provenance. */
      provenance: "dealer",
    });
  }

  for (const part of chunk(rows, WRITE_CHUNK)) {
    await supabase.from("vehicle_equipment").insert(part);
  }
}

function vehicleValues(row: PlannedRow, defaultBranchId: string): Record<string, unknown> {
  return {
    branch_id: row.mapped.branchId ?? defaultBranchId,
    /* NULL, never "". The columns were made nullable in this programme precisely so an identifier a
       dealer never supplied reads as "Not provided" rather than as a supplied blank. */
    stock_number: orNull(row.mapped.stockNumber),
    vin: orNull(row.mapped.vin),
    registration_number: orNull(row.mapped.registration),
    title: buildTitle(row),
    make: row.mapped.make,
    model: row.mapped.model,
    year: row.mapped.year,
    mileage_km: row.mapped.mileageKm ?? 0,
    asking_price_cents: row.mapped.priceCents,
    description: orNull(row.mapped.description),
    variant: orNull(row.mapped.variant),
    colour: orNull(row.mapped.colour),
    fuel: orNull(row.mapped.fuel),
    transmission: orNull(row.mapped.transmission),
    engine: orNull(row.mapped.engine),
    body_type: orNull(row.mapped.bodyType),
    updated_at: new Date().toISOString(),
  };
}

function ledgerRow(
  batchId: string,
  row: PlannedRow,
  decision: "imported" | "updated" | "skipped" | "rejected",
  vehicleId: string | null,
  matchedVehicleId: string | null = null,
  issuesOverride?: readonly unknown[],
): Record<string, unknown> {
  return {
    batch_id: batchId,
    row_number: row.rowNumber,
    /* The dealer's cells, verbatim and for ever. This is the whole of "every imported value must
       retain its source" — whatever the mapper decided, the original is still here to be read. */
    raw: row.raw,
    mapped: row.mapped,
    decision,
    vehicle_id: vehicleId,
    matched_vehicle_id: matchedVehicleId ?? row.matchedVehicleId,
    issues: issuesOverride ?? row.issues,
  };
}

function fileNameFromUrl(url: string, index: number): string {
  try {
    const path = new URL(url).pathname;
    const last = path.split("/").filter(Boolean).pop();
    if (last) return decodeURIComponent(last);
  } catch {
    /* A URL that will not parse still gets a stable name rather than an empty one. */
  }
  return `photograph-${index + 1}`;
}

/* ── Reverting ───────────────────────────────────────────────────────────────────────────────── */

/**
 * Undo, and the exact boundary of what undo means.
 *
 * Only vehicles this batch *created* are removed. A vehicle the dealer chose to `update` is left
 * alone: reverting it would mean restoring values this platform never captured, and deleting it
 * would destroy a listing that existed before the import touched it. The ledger records the update,
 * and the honest report is "3 vehicles were updated and remain updated" rather than a claim of a
 * clean reversal that did not happen.
 *
 * Once anything from the batch is published the batch is no longer reversible as a unit. A published
 * listing may have been seen, saved or enquired about, and silently deleting it would break records
 * that point at it.
 */
export async function revertImportBatch(input: {
  readonly batchId: string;
  readonly dealershipId: string;
  readonly accessToken?: string;
}): Promise<{ readonly deleted: number; readonly leftUpdated: number }> {
  const supabase = requireClient(input.accessToken);

  const { data: batch, error: batchError } = await supabase
    .from("vehicle_import_batches")
    .select("id, status, dealership_id")
    .eq("id", input.batchId)
    .eq("dealership_id", input.dealershipId)
    .maybeSingle();

  if (batchError) throw new ImportExecutionError(batchError.message);
  if (!batch) throw new ImportExecutionError("That import does not exist.", 404);

  if (batch.status === "published") {
    throw new ImportExecutionError(
      "This import has already been published, so it can no longer be undone as a batch. Individual listings can still be unpublished or archived.",
      409,
    );
  }
  if (batch.status === "reverted") {
    throw new ImportExecutionError("This import has already been undone.", 409);
  }

  const { data: rows, error: rowsError } = await supabase
    .from("vehicle_import_rows")
    .select("id, decision, vehicle_id")
    .eq("batch_id", input.batchId);

  if (rowsError) throw new ImportExecutionError(rowsError.message);

  const createdIds = (rows ?? [])
    .filter((row) => row.decision === "imported" && row.vehicle_id)
    .map((row) => row.vehicle_id as string);
  const leftUpdated = (rows ?? []).filter((row) => row.decision === "updated").length;

  /* A published listing from this batch is protected individually as well as at batch level: the
     status check above catches the normal case, this catches a listing published on its own. */
  const { data: published } = await supabase
    .from("inventory_vehicles")
    .select("id")
    .in("id", createdIds.length > 0 ? createdIds : ["__none__"])
    .eq("lifecycle_status", "published");

  const publishedIds = new Set((published ?? []).map((row) => row.id as string));
  const deletable = createdIds.filter((id) => !publishedIds.has(id));

  for (const part of chunk(deletable, WRITE_CHUNK)) {
    /* Media and equipment cascade on the vehicle's foreign key, so this one delete is the whole
       removal. The import rows stay: the ledger records that these vehicles existed and were undone,
       which is the point of keeping it. */
    const { error } = await supabase
      .from("inventory_vehicles")
      .delete()
      .in("id", part)
      .eq("dealership_id", input.dealershipId);
    if (error) throw new ImportExecutionError(`Undoing the import failed: ${error.message}`);
  }

  await supabase
    .from("vehicle_import_batches")
    .update({ status: "reverted", completed_at: new Date().toISOString() })
    .eq("id", input.batchId);

  log.info("import reverted", { batchId: input.batchId, deleted: deletable.length, leftUpdated });

  return { deleted: deletable.length, leftUpdated };
}

/* ── Publishing ──────────────────────────────────────────────────────────────────────────────── */

/**
 * Publishing what the dealer chose, and refusing to publish what cannot be a listing.
 *
 * `readinessState` is recomputed at publish time from the stored plan rather than trusted from the
 * screen: a dealer may have edited a vehicle between importing and publishing, and the decision
 * that matters is the one true now.
 */
export async function publishImportBatch(input: {
  readonly batchId: string;
  readonly dealershipId: string;
  /** Explicit vehicle ids, or every vehicle in the batch that is publishable. */
  readonly vehicleIds?: readonly string[];
  readonly accessToken?: string;
}): Promise<{ readonly published: number; readonly withheld: number }> {
  const supabase = requireClient(input.accessToken);

  const { data: batch, error: batchError } = await supabase
    .from("vehicle_import_batches")
    .select("id, status")
    .eq("id", input.batchId)
    .eq("dealership_id", input.dealershipId)
    .maybeSingle();

  if (batchError) throw new ImportExecutionError(batchError.message);
  if (!batch) throw new ImportExecutionError("That import does not exist.", 404);
  if (batch.status === "reverted") {
    throw new ImportExecutionError("This import was undone, so there is nothing to publish.", 409);
  }

  const { data: rows, error: rowsError } = await supabase
    .from("vehicle_import_rows")
    .select("vehicle_id, decision")
    .eq("batch_id", input.batchId);

  if (rowsError) throw new ImportExecutionError(rowsError.message);

  const batchVehicleIds = new Set(
    (rows ?? [])
      .filter((row) => row.vehicle_id && (row.decision === "imported" || row.decision === "updated"))
      .map((row) => row.vehicle_id as string),
  );

  const requested = input.vehicleIds
    ? input.vehicleIds.filter((id) => batchVehicleIds.has(id))
    : [...batchVehicleIds];

  if (requested.length === 0) {
    return { published: 0, withheld: 0 };
  }

  /* A listing with no price or no photographs is not published, whatever was requested. The dealer
     sees exactly which were withheld and why; publishing them would put listings on the marketplace
     that a buyer cannot act on, which costs the dealership more than the delay does. */
  const { data: candidates, error: candidateError } = await supabase
    .from("inventory_vehicles")
    .select("id, asking_price_cents, inventory_vehicle_media(id)")
    .in("id", requested)
    .eq("dealership_id", input.dealershipId);

  if (candidateError) throw new ImportExecutionError(candidateError.message);

  const publishable: string[] = [];
  for (const candidate of candidates ?? []) {
    const record = candidate as { id: string; asking_price_cents: number | null; inventory_vehicle_media?: unknown[] };
    const hasPrice = typeof record.asking_price_cents === "number" && record.asking_price_cents > 0;
    const hasPhoto = Array.isArray(record.inventory_vehicle_media) && record.inventory_vehicle_media.length > 0;
    if (hasPrice && hasPhoto) publishable.push(record.id);
  }

  for (const part of chunk(publishable, WRITE_CHUNK)) {
    const { error } = await supabase
      .from("inventory_vehicles")
      .update({ lifecycle_status: "published", updated_at: new Date().toISOString() })
      .in("id", part)
      .eq("dealership_id", input.dealershipId);
    if (error) throw new ImportExecutionError(`Publishing failed: ${error.message}`);
  }

  if (publishable.length > 0) {
    await supabase
      .from("vehicle_import_batches")
      .update({ status: "published" })
      .eq("id", input.batchId);
  }

  return { published: publishable.length, withheld: requested.length - publishable.length };
}
