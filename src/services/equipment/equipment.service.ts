/**
 * SURF FOR CARS — equipment read path.
 *
 * The single source of truth for what a vehicle is fitted with. Vehicle Detail, search, filters,
 * comparison, the dealer portal and any future AI service read equipment through here and nowhere else.
 *
 * That constraint is the point rather than tidiness. The platform has already been taught this lesson
 * twice: presentation logic written inside a page is invisible to every other page, and the marketplace
 * ended up showing a road traffic collision while the homepage was clean. Equipment is worse, because a
 * second query that forgets to join provenance produces claims with no visible source — the one thing the
 * trust model exists to prevent.
 *
 * PERFORMANCE
 * ===========
 * Two shapes, deliberately, because there are exactly two access patterns:
 *
 *   `loadVehicleEquipment`   one vehicle. A single joined select, primary-key scan.
 *   `loadEquipmentFor`       many vehicles at once. One `in.()` query, then grouped in memory — the fix
 *                            for the N+1 a search results page would otherwise produce.
 *
 * The catalogue itself is small (37 rows), immutable in practice, and needed by every filter render, so
 * it is cached for the process lifetime rather than fetched per request.
 */
import { createSupabaseServerClient } from "@/lib/supabase";
import { createLogger } from "@/lib/observability/logger";
import type {
  EquipmentCategory,
  EquipmentItem,
  EquipmentProvenance,
  VehicleEquipmentEntry,
} from "@/domain/vehicle/types/vehicle-equipment.types";

const log = createLogger("equipment");

/** Shape returned by the joined select. */
interface EquipmentJoinRow {
  vehicle_id: string;
  provenance: string;
  source_note: string | null;
  equipment_items: {
    id: string;
    slug: string;
    label: string;
    category: string;
    display_order: number;
  } | null;
}

const SELECT_WITH_ITEM =
  "vehicle_id,provenance,source_note,equipment_items(id,slug,label,category,display_order)";

const isProvenance = (value: string): value is EquipmentProvenance =>
  value === "dealer" || value === "verified" || value === "imported";

function toEntry(row: EquipmentJoinRow): VehicleEquipmentEntry | null {
  const item = row.equipment_items;
  if (!item) return null;

  return {
    id: item.id,
    slug: item.slug,
    label: item.label,
    category: item.category as EquipmentCategory,
    displayOrder: item.display_order,
    /* An unrecognised provenance degrades to the weakest claim rather than being trusted or dropped. */
    provenance: isProvenance(row.provenance) ? row.provenance : "dealer",
    sourceNote: row.source_note,
  };
}

/**
 * Equipment recorded against one vehicle.
 *
 * Returns an empty array both when nothing is recorded and when the read fails — equipment is an
 * enhancement, and a database hiccup must never take a listing down. The two cases are distinguishable in
 * the logs, and identical to the customer, who sees the same honest empty state either way.
 */
export async function loadVehicleEquipment(
  vehicleId: string,
): Promise<readonly VehicleEquipmentEntry[]> {
  const supabase = createSupabaseServerClient();
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from("vehicle_equipment")
      .select(SELECT_WITH_ITEM)
      .eq("vehicle_id", vehicleId);

    if (error) throw new Error(error.message);

    return ((data ?? []) as unknown as EquipmentJoinRow[])
      .map(toEntry)
      .filter((entry): entry is VehicleEquipmentEntry => entry !== null);
  } catch (error) {
    log.error("vehicle equipment read failed", {
      vehicleId,
      message: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
}

/**
 * Equipment for many vehicles in one round trip.
 *
 * The search results page renders up to two dozen cards; asking per card would be two dozen queries for
 * data that fits in one. Returns a map keyed by vehicle id, with absent vehicles simply missing rather
 * than mapped to empty arrays — the caller's `?? []` is cheaper than materialising rows that say nothing.
 */
export async function loadEquipmentFor(
  vehicleIds: readonly string[],
): Promise<ReadonlyMap<string, readonly VehicleEquipmentEntry[]>> {
  const grouped = new Map<string, VehicleEquipmentEntry[]>();
  if (vehicleIds.length === 0) return grouped;

  const supabase = createSupabaseServerClient();
  if (!supabase) return grouped;

  try {
    const { data, error } = await supabase
      .from("vehicle_equipment")
      .select(SELECT_WITH_ITEM)
      .in("vehicle_id", [...vehicleIds]);

    if (error) throw new Error(error.message);

    for (const row of (data ?? []) as unknown as EquipmentJoinRow[]) {
      const entry = toEntry(row);
      if (!entry) continue;
      const bucket = grouped.get(row.vehicle_id);
      if (bucket) bucket.push(entry);
      else grouped.set(row.vehicle_id, [entry]);
    }

    return grouped;
  } catch (error) {
    log.error("bulk equipment read failed", {
      count: vehicleIds.length,
      message: error instanceof Error ? error.message : String(error),
    });
    return grouped;
  }
}

/**
 * The equipment catalogue, cached for the process lifetime.
 *
 * 37 rows that change when somebody ships a migration, read by every filter render. Fetching it per
 * request would be a query to learn something that cannot have changed since the last one. The cache is a
 * module-level promise so concurrent first requests share one fetch rather than racing.
 */
let cataloguePromise: Promise<readonly EquipmentItem[]> | null = null;

export function loadEquipmentCatalogue(): Promise<readonly EquipmentItem[]> {
  cataloguePromise ??= (async () => {
    const supabase = createSupabaseServerClient();
    if (!supabase) return [];

    try {
      const { data, error } = await supabase
        .from("equipment_items")
        .select("id,slug,label,category,display_order")
        .order("category")
        .order("display_order");

      if (error) throw new Error(error.message);

      return (data ?? []).map((row) => ({
        id: row.id as string,
        slug: row.slug as string,
        label: row.label as string,
        category: row.category as EquipmentCategory,
        displayOrder: row.display_order as number,
      }));
    } catch (error) {
      log.error("equipment catalogue read failed", {
        message: error instanceof Error ? error.message : String(error),
      });
      /* Do not memoise a failure — the next caller should retry rather than inherit an empty catalogue. */
      cataloguePromise = null;
      return [];
    }
  })();

  return cataloguePromise;
}

/**
 * Vehicle ids fitted with every one of the given equipment slugs.
 *
 * The filter primitive behind "show me cars with adaptive cruise *and* a panoramic roof". Intersection
 * rather than union: a buyer ticking two boxes means both, and returning either would quietly widen their
 * search and make the filter untrustworthy.
 *
 * Returns null — not an empty set — when no filter was requested, so a caller can distinguish "no
 * equipment filter applied" from "filter applied and nothing matched".
 */
export async function findVehicleIdsWithEquipment(
  slugs: readonly string[],
): Promise<ReadonlySet<string> | null> {
  if (slugs.length === 0) return null;

  const supabase = createSupabaseServerClient();
  if (!supabase) return null;

  try {
    const catalogue = await loadEquipmentCatalogue();
    const ids = catalogue.filter((item) => slugs.includes(item.slug)).map((item) => item.id);

    /* A slug that is not in the catalogue can never match, so the honest result is nothing. */
    if (ids.length !== slugs.length) return new Set();

    const { data, error } = await supabase
      .from("vehicle_equipment")
      .select("vehicle_id,equipment_item_id")
      .in("equipment_item_id", ids);

    if (error) throw new Error(error.message);

    const counts = new Map<string, Set<string>>();
    for (const row of data ?? []) {
      const vehicleId = row.vehicle_id as string;
      const set = counts.get(vehicleId) ?? new Set<string>();
      set.add(row.equipment_item_id as string);
      counts.set(vehicleId, set);
    }

    return new Set(
      [...counts.entries()]
        .filter(([, matched]) => matched.size === ids.length)
        .map(([vehicleId]) => vehicleId),
    );
  } catch (error) {
    log.error("equipment filter failed", {
      slugs,
      message: error instanceof Error ? error.message : String(error),
    });
    /* Null rather than empty: a failed filter must not silently claim nothing matched. */
    return null;
  }
}
