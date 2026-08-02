import type { UnifiedVehicleRecord } from "@/domain/vehicle";
import { createDomainServerClient } from "@/lib/supabase/service-client";

/**
 * The three things planning needs from the database, and nothing else.
 *
 * WHY THIS IS NOT `listVehicles()`
 * ================================
 * The planner needs, per existing vehicle, four fields — id, VIN, stock number, registration — and
 * per marketplace vehicle, two: make and model. Loading full `UnifiedVehicleRecord`s to get them
 * would pull descriptions, media arrays and pricing history for 330 vehicles on every keystroke of
 * a re-analysed mapping, and re-analysing is the thing the wizard is designed to make free.
 *
 * So this selects columns rather than records, and shapes the result to the small part of
 * `UnifiedVehicleRecord` the planner reads. The cast is deliberate and narrow: everything the
 * planner touches is populated, and nothing it does not touch is invented to look populated.
 */

export interface PlanContext {
  readonly existing: readonly UnifiedVehicleRecord[];
  readonly corpus: readonly UnifiedVehicleRecord[];
  readonly branchNames: readonly string[];
  readonly branches: readonly { readonly id: string; readonly name: string; readonly city: string | null }[];
}

/** Only the fields `findExisting` and the unknown-make warning actually read. */
function toDuplicateProbe(row: {
  id: string;
  vin: string | null;
  stock_number: string | null;
  registration_number: string | null;
  title: string | null;
  make?: string | null;
  model?: string | null;
}): UnifiedVehicleRecord {
  return {
    id: row.id,
    core: {
      vin: row.vin ?? "",
      registration: row.registration_number ?? undefined,
      title: row.title ?? "",
      make: row.make ?? "",
      model: row.model ?? "",
    },
    dealer: { stockNumber: row.stock_number ?? "" },
  } as unknown as UnifiedVehicleRecord;
}

export async function loadPlanContext(
  dealershipId: string,
  accessToken?: string,
): Promise<PlanContext> {
  const supabase = createDomainServerClient(accessToken);
  if (!supabase) {
    return { existing: [], corpus: [], branchNames: [], branches: [] };
  }

  const [existingResult, corpusResult, branchResult] = await Promise.all([
    /* Duplicate detection is scoped to this dealership on purpose. A VIN that appears on another
       dealership's forecourt is not a duplicate of anything — the same car genuinely can be listed
       by two dealers in succession, and cross-dealer matching would leak the existence of a
       competitor's stock through a warning message. */
    supabase
      .from("inventory_vehicles")
      .select("id, vin, stock_number, registration_number, title")
      .eq("dealership_id", dealershipId)
      .not("lifecycle_status", "in", '("deleted","archived")'),

    /* The vocabulary for "we have not seen this make before" comes from what is actually published,
       because that is the claim the warning makes. */
    supabase
      .from("inventory_vehicles")
      .select("id, make, model")
      .eq("lifecycle_status", "published"),

    supabase
      .from("dealership_branches")
      .select("id, name, city")
      .eq("dealership_id", dealershipId)
      .order("created_at", { ascending: true }),
  ]);

  const branches = (branchResult.data ?? []).map((row) => ({
    id: row.id as string,
    name: row.name as string,
    city: (row.city as string | null) ?? null,
  }));

  return {
    existing: (existingResult.data ?? []).map((row) =>
      toDuplicateProbe(row as Parameters<typeof toDuplicateProbe>[0]),
    ),
    corpus: (corpusResult.data ?? []).map((row) =>
      toDuplicateProbe({
        id: row.id as string,
        vin: null,
        stock_number: null,
        registration_number: null,
        title: null,
        make: row.make as string | null,
        model: row.model as string | null,
      }),
    ),
    branchNames: branches.map((branch) => branch.name),
    branches,
  };
}
