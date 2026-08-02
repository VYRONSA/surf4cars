import { createDomainServerClient } from "@/lib/supabase/service-client";

import type { ImportIssue } from "../domain/import.types";

/**
 * Reading the ledger back.
 *
 * "This is a ledger, not a staging area" — rows are kept after an import completes, which is what
 * lets a dealership answer "where did this come from" six months later and settle a support
 * conversation with evidence rather than recollection. This file is how that evidence is read.
 */

export interface ImportBatchSummary {
  readonly id: string;
  readonly sourceKind: string;
  readonly sourceName: string | null;
  readonly status: string;
  readonly totalRows: number;
  readonly importedCount: number;
  readonly updatedCount: number;
  readonly skippedCount: number;
  readonly rejectedCount: number;
  readonly ignoredColumns: readonly string[];
  readonly columnMapping: Readonly<Record<string, string>>;
  readonly createdAt: string;
  readonly completedAt: string | null;
}

export interface ImportBatchRow {
  readonly rowNumber: number;
  readonly raw: Readonly<Record<string, string>>;
  readonly decision: string;
  readonly vehicleId: string | null;
  readonly matchedVehicleId: string | null;
  readonly issues: readonly ImportIssue[];
}

export interface ImportBatchDetail extends ImportBatchSummary {
  readonly rows: readonly ImportBatchRow[];
}

function toSummary(row: Record<string, unknown>): ImportBatchSummary {
  return {
    id: row.id as string,
    sourceKind: row.source_kind as string,
    sourceName: (row.source_name as string | null) ?? null,
    status: row.status as string,
    totalRows: (row.total_rows as number) ?? 0,
    importedCount: (row.imported_count as number) ?? 0,
    updatedCount: (row.updated_count as number) ?? 0,
    skippedCount: (row.skipped_count as number) ?? 0,
    rejectedCount: (row.rejected_count as number) ?? 0,
    ignoredColumns: (row.ignored_columns as string[]) ?? [],
    columnMapping: (row.column_mapping as Record<string, string>) ?? {},
    createdAt: row.created_at as string,
    completedAt: (row.completed_at as string | null) ?? null,
  };
}

export async function listImportBatches(
  dealershipId: string,
  accessToken?: string,
): Promise<readonly ImportBatchSummary[]> {
  const supabase = createDomainServerClient(accessToken);
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("vehicle_import_batches")
    .select("*")
    .eq("dealership_id", dealershipId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => toSummary(row as Record<string, unknown>));
}

export async function getImportBatch(
  batchId: string,
  dealershipId: string,
  accessToken?: string,
): Promise<ImportBatchDetail | null> {
  const supabase = createDomainServerClient(accessToken);
  if (!supabase) return null;

  const { data: batch, error } = await supabase
    .from("vehicle_import_batches")
    .select("*")
    .eq("id", batchId)
    .eq("dealership_id", dealershipId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!batch) return null;

  const { data: rows, error: rowsError } = await supabase
    .from("vehicle_import_rows")
    .select("row_number, raw, decision, vehicle_id, matched_vehicle_id, issues")
    .eq("batch_id", batchId)
    .order("row_number", { ascending: true });

  if (rowsError) throw new Error(rowsError.message);

  return {
    ...toSummary(batch as Record<string, unknown>),
    rows: (rows ?? []).map((row) => ({
      rowNumber: row.row_number as number,
      raw: (row.raw as Record<string, string>) ?? {},
      decision: row.decision as string,
      vehicleId: (row.vehicle_id as string | null) ?? null,
      matchedVehicleId: (row.matched_vehicle_id as string | null) ?? null,
      issues: (row.issues as ImportIssue[]) ?? [],
    })),
  };
}

/**
 * The import report as a file.
 *
 * CSV rather than a rendered PDF, and that is a considered choice rather than the easy one. The
 * artefact a dealer principal actually uses is one they can open in Excel, sort, and hand to the
 * person who has to fix the twelve rows that failed. A PDF is a picture of that.
 *
 * Every row of the source file appears, including the ones that imported cleanly, because a report
 * that lists only problems cannot be reconciled against the file it came from.
 */
export function buildImportReportCsv(batch: ImportBatchDetail): string {
  const escape = (value: unknown): string => {
    const text = String(value ?? "");
    return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };

  const lines: string[] = [];
  lines.push(`Import report,${escape(batch.sourceName ?? batch.sourceKind)}`);
  lines.push(`Imported,${batch.importedCount}`);
  lines.push(`Updated,${batch.updatedCount}`);
  lines.push(`Skipped,${batch.skippedCount}`);
  lines.push(`Rejected,${batch.rejectedCount}`);
  lines.push(`Rows in file,${batch.totalRows}`);
  lines.push(`Started,${escape(batch.createdAt)}`);
  lines.push(`Finished,${escape(batch.completedAt ?? "not finished")}`);

  /* Ignored columns belong in the report, not only on the screen during the import. "Never silently
     discard imported data" is mostly this: a dealership whose export carries "Warranty Expiry"
     learns SURF4CARS had nowhere to put it, in a file they keep. */
  lines.push(
    `Columns not imported,${escape(batch.ignoredColumns.length > 0 ? batch.ignoredColumns.join("; ") : "none")}`,
  );
  lines.push("");

  const sourceColumns = [...new Set(batch.rows.flatMap((row) => Object.keys(row.raw)))];
  lines.push(["Row", "Outcome", "Problems", ...sourceColumns].map(escape).join(","));

  for (const row of batch.rows) {
    const problems = row.issues
      .map((issue) => `${issue.severity === "error" ? "Error" : "Warning"}: ${issue.message}`)
      .join(" | ");
    lines.push(
      [row.rowNumber, row.decision, problems, ...sourceColumns.map((column) => row.raw[column] ?? "")]
        .map(escape)
        .join(","),
    );
  }

  return lines.join("\r\n");
}
