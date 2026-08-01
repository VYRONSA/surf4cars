import type {
  UnifiedVehicleRecord,
  VehicleSearchQuery,
  VehicleSearchResult,
} from "@/domain/vehicle";
import type { VehicleEngineRepository } from "@/services/vehicle-engine/vehicle-engine.repository";
import { searchUnifiedVehicleRecords } from "@/services/vehicle-engine/vehicle-search.filter";
import { canPushDown, searchVehicleIds } from "@/services/vehicle-engine/vehicle-search.pushdown";
import { toVehicleSearchDocument } from "@/services/vehicle-engine/vehicle-projection.service";
import {
  buildUnifiedVehicleRecords,
  type BranchRow,
  type DealershipRow,
  type DocumentRow,
  type HistoryRow,
  type MediaRow,
  type PriceHistoryRow,
  type VehicleDataset,
  type VehicleRow,
} from "@/services/vehicle-engine/vehicle-record.mapper";
import { getShowcaseSeedRecords } from "@/services/vehicle-engine/vehicle-showcase.seed";
import { createDomainServerClient } from "@/lib/supabase/service-client";
import { createLogger } from "@/lib/observability/logger";

const log = createLogger("vehicle-repository");

/**
 * Supabase-backed Vehicle Engine repository.
 *
 * Runs server-side with the service key. Tenant scoping is enforced by the application layer
 * (authorizeDealerApiRequest verifies dealership ownership before any engine call) and by the
 * engine's own visibility filtering; RLS remains in force for every direct client request. A
 * service-key client is required because the engine interface carries no auth context and must
 * serve both anonymous marketplace reads and dealer reads of unpublished stock.
 */
function createRepositoryClient() {
  return createDomainServerClient();
}

/**
 * PostgREST caps every response at its server-side `max-rows` (1000 on Supabase) no matter what
 * `.limit()` asks for, and it does so *silently* — the response is a valid 200 with 1000 rows.
 *
 * That truncation is what left the marketplace showing 1000 of 2761 media rows: vehicles beyond the
 * cut-off rendered with no photographs at all. Range paging is the only way to read a table larger
 * than the cap.
 */
const PAGE_SIZE = 1000;

/** A Supabase query builder that has not yet been awaited, so `.range()` can still be applied. */
interface RangeableQuery {
  range(
    from: number,
    to: number,
  ): PromiseLike<{ data: unknown[] | null; error: { message: string } | null }>;
}

/**
 * Reads every row of a query by paging past the PostgREST row cap.
 *
 * `build()` is called once per page because a Supabase builder is single-use — awaiting it twice
 * replays the same request. Each page is ordered by a unique key so that concurrent writes cannot
 * cause a row to be skipped or repeated across page boundaries.
 */
async function fetchAllRows(
  label: string,
  build: () => RangeableQuery,
): Promise<Array<Record<string, unknown>>> {
  const rows: Array<Record<string, unknown>> = [];

  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await build().range(from, from + PAGE_SIZE - 1);
    if (error) throw new Error(`vehicle repository ${label} read failed: ${error.message}`);

    const page = (data ?? []) as Array<Record<string, unknown>>;
    rows.push(...page);

    // A short page means the end of the table. A full page means there may be more.
    if (page.length < PAGE_SIZE) break;
  }

  return rows;
}

function toVehicleRow(row: Record<string, unknown>): VehicleRow {
  return {
    id: String(row.id),
    dealershipId: String(row.dealership_id),
    branchId: String(row.branch_id),
    stockNumber: String(row.stock_number ?? ""),
    vin: String(row.vin ?? ""),
    registrationNumber: String(row.registration_number ?? ""),
    title: String(row.title ?? ""),
    make: String(row.make ?? ""),
    model: String(row.model ?? ""),
    variant: (row.variant as string | null) ?? null,
    year: Number(row.year ?? 0),
    mileageKm: Number(row.mileage_km ?? 0),
    askingPriceCents: Number(row.asking_price_cents ?? 0),
    currency: String(row.currency ?? "ZAR"),
    lifecycleStatus: String(row.lifecycle_status ?? "draft"),
    description: (row.description as string | null) ?? null,
    seoTitle: (row.seo_title as string | null) ?? null,
    seoDescription: (row.seo_description as string | null) ?? null,
    colour: (row.colour as string | null) ?? null,
    fuel: (row.fuel as string | null) ?? null,
    transmission: (row.transmission as string | null) ?? null,
    engine: (row.engine as string | null) ?? null,
    bodyType: (row.body_type as string | null) ?? null,
    createdAt: String(row.created_at ?? new Date().toISOString()),
    updatedAt: String(row.updated_at ?? new Date().toISOString()),
  };
}

export class SupabaseVehicleRepository implements VehicleEngineRepository {
  /**
   * Loads the full dataset in a fixed number of queries — seven parallel reads rather than one
   * query per vehicle — then projects in memory. This keeps the record shape identical to the
   * local repository while avoiding N+1 access.
   */
  private async loadDataset(scope?: { readonly vehicleIds: readonly string[] }): Promise<VehicleDataset> {
    const supabase = createRepositoryClient();
    if (!supabase) {
      throw new Error("Supabase is not configured; the vehicle repository cannot serve requests.");
    }

    const ids = scope?.vehicleIds;

    /**
     * Applies the vehicle-id scope when the caller has already narrowed the set (search pushdown),
     * and orders by the table's primary key so range paging is deterministic.
     */
    const scopedBy = (table: string, columns: string, idColumn: string) => () => {
      const query = supabase.from(table).select(columns);
      return (ids ? query.in(idColumn, ids as string[]) : query).order("id", { ascending: true });
    };

    const [vehicles, dealerships, branches, media, documents, priceHistory, history, leads] = await Promise.all([
      fetchAllRows("vehicles", scopedBy("inventory_vehicles", "*", "id")),
      fetchAllRows("dealerships", () =>
        supabase
          .from("dealerships")
          .select("id, trading_name, city, province, telephone, whatsapp")
          .order("id", { ascending: true })),
      fetchAllRows("branches", () =>
        supabase
          .from("dealership_branches")
          .select("id, name, city, province, telephone, whatsapp")
          .order("id", { ascending: true })),
      fetchAllRows("media", scopedBy(
        "inventory_vehicle_media",
        "id, vehicle_id, file_name, file_url, is_primary, sort_order, provenance",
        "vehicle_id",
      )),
      fetchAllRows("documents", scopedBy(
        "inventory_vehicle_documents",
        "id, vehicle_id, file_name, file_url",
        "vehicle_id",
      )),
      fetchAllRows("priceHistory", scopedBy(
        "inventory_vehicle_price_history",
        "vehicle_id, price_cents, reason, changed_at",
        "vehicle_id",
      )),
      fetchAllRows("history", scopedBy(
        "inventory_vehicle_history",
        "id, vehicle_id, event_type, message, created_at",
        "vehicle_id",
      )),
      fetchAllRows("leads", scopedBy("leads", "vehicle_id", "vehicle_id")),
    ]);

    const enquiryCounts = new Map<string, number>();
    for (const row of leads as Array<{ vehicle_id: string | null }>) {
      if (!row.vehicle_id) continue;
      enquiryCounts.set(row.vehicle_id, (enquiryCounts.get(row.vehicle_id) ?? 0) + 1);
    }

    return {
      vehicles: vehicles.map(toVehicleRow),
      dealerships: dealerships.map((r): DealershipRow => ({
        id: String(r.id), tradingName: String(r.trading_name ?? ""), city: String(r.city ?? ""),
        province: String(r.province ?? ""), telephone: String(r.telephone ?? ""), whatsapp: String(r.whatsapp ?? ""),
      })),
      branches: branches.map((r): BranchRow => ({
        id: String(r.id), name: String(r.name ?? ""), city: String(r.city ?? ""),
        province: String(r.province ?? ""), telephone: String(r.telephone ?? ""), whatsapp: String(r.whatsapp ?? ""),
      })),
      media: media.map((r): MediaRow => ({
        id: String(r.id), vehicleId: String(r.vehicle_id), fileName: String(r.file_name ?? ""),
        fileUrl: String(r.file_url ?? ""), isPrimary: Boolean(r.is_primary), sortOrder: Number(r.sort_order ?? 0),
        /* The column is `not null` in the database; the fallback covers only a stale local cache and
           chooses the labelled option, because mislabelling an image as a dealer photograph is the one
           error with a customer cost. */
        provenance: (r.provenance === "dealer" || r.provenance === "manufacturer" ? r.provenance : "library"),
      })),
      documents: documents.map((r): DocumentRow => ({
        id: String(r.id), vehicleId: String(r.vehicle_id), fileName: String(r.file_name ?? ""), fileUrl: String(r.file_url ?? ""),
      })),
      priceHistory: priceHistory.map((r): PriceHistoryRow => ({
        vehicleId: String(r.vehicle_id), priceCents: Number(r.price_cents ?? 0),
        reason: String(r.reason ?? ""), changedAt: String(r.changed_at ?? ""),
      })),
      history: history.map((r): HistoryRow => ({
        id: String(r.id), vehicleId: String(r.vehicle_id), eventType: String(r.event_type ?? ""),
        message: String(r.message ?? ""), createdAt: String(r.created_at ?? ""),
      })),
      enquiryCounts,
    };
  }

  async findAll(): Promise<readonly UnifiedVehicleRecord[]> {
    const dataset = await this.loadDataset();
    const records = buildUnifiedVehicleRecords(dataset);
    /**
     * Showcase stock is a placeholder for an empty marketplace, not a permanent resident of it.
     *
     * These records carry hardcoded artwork rather than real vehicle photography, so once live
     * stock exists they surface as cars nobody can buy, illustrated with UI graphics — and because
     * they score highly they outranked genuine listings in the homepage's featured grid. They now
     * appear only when there is nothing real to show.
     */
    if (records.length > 0) return records;

    return getShowcaseSeedRecords();
  }

  async findById(id: string): Promise<UnifiedVehicleRecord | null> {
    const all = await this.findAll();
    return all.find((record) => record.id === id) ?? null;
  }

  async findBySlug(slug: string): Promise<UnifiedVehicleRecord | null> {
    const all = await this.findAll();
    return all.find((record) => record.slug === slug) ?? null;
  }

  async findByTenant(tenantId: string): Promise<readonly UnifiedVehicleRecord[]> {
    const all = await this.findAll();
    return all.filter((record) => record.tenantId === tenantId);
  }

  /**
   * Filters, orders, counts and pages in Postgres where the query allows it, hydrating only the
   * returned page. Free-text and province searches still need the whole-set path because they span
   * joined dealer data; results are identical either way.
   */
  async search(query: VehicleSearchQuery): Promise<VehicleSearchResult> {
    if (!canPushDown(query)) {
      return searchUnifiedVehicleRecords(await this.findAll(), query);
    }

    const supabase = createRepositoryClient();
    if (!supabase) throw new Error("Supabase is not configured; cannot search vehicles.");

    const { vehicleIds, total } = await searchVehicleIds(supabase, query);
    if (vehicleIds.length === 0) {
      return { items: [], total, page: query.page ?? 1, pageSize: query.pageSize ?? 24 };
    }

    const dataset = await this.loadDataset({ vehicleIds });
    const records = buildUnifiedVehicleRecords(dataset);
    // Preserve the database ordering, which already applied the requested sort.
    const byId = new Map(records.map((record) => [record.id, record]));
    const ordered = vehicleIds.map((id) => byId.get(id)).filter((r): r is NonNullable<typeof r> => Boolean(r));

    return {
      items: ordered.map(toVehicleSearchDocument),
      total,
      page: query.page ?? 1,
      pageSize: query.pageSize ?? 24,
    };
  }

  async save(record: UnifiedVehicleRecord): Promise<UnifiedVehicleRecord> {
    const supabase = createRepositoryClient();
    if (!supabase) throw new Error("Supabase is not configured; cannot persist vehicle.");

    const { error } = await supabase.from("inventory_vehicles").upsert({
      id: record.id,
      dealership_id: record.dealer.dealershipId,
      branch_id: record.dealer.branchId,
      stock_number: record.dealer.stockNumber,
      vin: record.core.vin,
      registration_number: record.core.registration ?? "",
      title: record.core.title,
      make: record.core.make,
      model: record.core.model,
      variant: record.core.variant || null,
      colour: record.core.colour || null,
      fuel: record.core.fuel || null,
      transmission: record.core.transmission || null,
      engine: record.core.engine || null,
      body_type: record.core.bodyType || null,
      year: record.core.year,
      mileage_km: record.core.mileageKm,
      asking_price_cents: record.pricing.sellingPriceCents,
      currency: record.pricing.currency,
      lifecycle_status: record.status.current,
      description: record.core.description.flatMap((section) => section.paragraphs).join("\n\n"),
      seo_title: record.marketing.seoTitle ?? null,
      seo_description: record.marketing.seoDescription ?? null,
      estimated_days_to_sell: record.ai.scores.predictedSaleDays ?? null,
      lead_count_30d: record.history.engagement.enquiries,
      created_by: "system",
      created_at: record.createdAt,
      updated_at: record.updatedAt,
    }, { onConflict: "id" });

    if (error) throw new Error(`vehicle save failed: ${error.message}`);
    log.debug("vehicle.saved", { vehicleId: record.id, status: record.status.current });
    return record;
  }

  async delete(id: string): Promise<void> {
    const supabase = createRepositoryClient();
    if (!supabase) throw new Error("Supabase is not configured; cannot delete vehicle.");

    // Child rows cascade via foreign keys, so a single delete is transaction-safe.
    const { error } = await supabase.from("inventory_vehicles").delete().eq("id", id);
    if (error) throw new Error(`vehicle delete failed: ${error.message}`);
    log.debug("vehicle.deleted", { vehicleId: id });
  }
}

let defaultRepository: SupabaseVehicleRepository | null = null;

export function getSupabaseVehicleRepository(): SupabaseVehicleRepository {
  if (!defaultRepository) defaultRepository = new SupabaseVehicleRepository();
  return defaultRepository;
}
