import type { SupabaseClient } from "@supabase/supabase-js";

import type { VehicleSearchQuery } from "@/domain/vehicle";
import { MARKETPLACE_VISIBLE_LIFECYCLE_STATUSES } from "@/services/vehicle-engine/vehicle-record.mapper";

/**
 * Database-side search for the Vehicle Engine.
 *
 * The repository previously loaded every vehicle and all media on each request and filtered in
 * memory, which is O(dataset) per query. Filters, ordering, counting and paging now execute in
 * Postgres against the indexes added in PCP-001K1, so only the requested page is transferred.
 *
 * Two predicates still require the in-memory path and are reported as unsupported here:
 *   province  — lives on the dealership/branch, needing a join
 *   query     — free text spanning vehicle and dealer fields
 * The caller falls back for those, so behaviour is unchanged either way.
 */

export interface PushdownResult {
  readonly vehicleIds: readonly string[];
  readonly total: number;
}

export function canPushDown(query: VehicleSearchQuery): boolean {
  const filters = query.filters ?? {};
  if (filters.query) return false;
  if (filters.province) return false;
  // Relevance ranks on derived AI scores that are not stored, so it cannot be ordered in SQL.
  const sort = query.sort ?? "relevance";
  if (sort === "relevance" || sort === "listing-score" || sort === "views" || sort === "days-in-stock") return false;
  return true;
}

/** Column and direction for each SQL-orderable sort key. */
const SORT_COLUMNS: Record<string, { column: string; ascending: boolean }> = {
  "price-asc": { column: "asking_price_cents", ascending: true },
  "price-desc": { column: "asking_price_cents", ascending: false },
  "year-desc": { column: "year", ascending: false },
  "mileage-asc": { column: "mileage_km", ascending: true },
};

export async function searchVehicleIds(
  supabase: SupabaseClient,
  query: VehicleSearchQuery,
): Promise<PushdownResult> {
  const filters = query.filters ?? {};
  const page = query.page ?? 1;
  const pageSize = query.pageSize ?? 24;

  let builder = supabase
    .from("inventory_vehicles")
    .select("id", { count: "exact" });

  if (filters.dealershipId) builder = builder.eq("dealership_id", filters.dealershipId);

  if (filters.status?.length) {
    builder = builder.in("lifecycle_status", filters.status as string[]);
  } else {
    // Default marketplace scope: only stock a buyer can reach.
    builder = builder.in("lifecycle_status", MARKETPLACE_VISIBLE_LIFECYCLE_STATUSES as string[]);
  }

  // ilike with no wildcard is a case-insensitive equality match, which the lower() indexes serve.
  if (filters.make) builder = builder.ilike("make", filters.make);
  if (filters.model) builder = builder.ilike("model", `%${filters.model}%`);
  if (filters.variant) builder = builder.ilike("variant", `%${filters.variant}%`);
  if (filters.bodyType) builder = builder.ilike("body_type", filters.bodyType);
  if (filters.fuel) builder = builder.ilike("fuel", filters.fuel);
  if (filters.transmission) builder = builder.ilike("transmission", filters.transmission);
  if (filters.yearMin !== undefined) builder = builder.gte("year", filters.yearMin);
  if (filters.yearMax !== undefined) builder = builder.lte("year", filters.yearMax);
  if (filters.priceMinCents !== undefined) builder = builder.gte("asking_price_cents", filters.priceMinCents);
  if (filters.priceMaxCents !== undefined) builder = builder.lte("asking_price_cents", filters.priceMaxCents);
  if (filters.mileageMaxKm !== undefined) builder = builder.lte("mileage_km", filters.mileageMaxKm);

  const sort = SORT_COLUMNS[query.sort ?? ""] ?? { column: "updated_at", ascending: false };
  builder = builder.order(sort.column, { ascending: sort.ascending });
  // Deterministic tiebreak so paging cannot repeat or skip a vehicle.
  builder = builder.order("id", { ascending: true });

  const from = (page - 1) * pageSize;
  builder = builder.range(from, from + pageSize - 1);

  const { data, error, count } = await builder;
  if (error) throw new Error(`vehicle search pushdown failed: ${error.message}`);

  return {
    vehicleIds: (data ?? []).map((row) => String((row as { id: string }).id)),
    total: count ?? 0,
  };
}
