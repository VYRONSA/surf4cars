import type {
  UnifiedVehicleRecord,
  UnifiedVehicleSummary,
  VehicleSearchQuery,
  VehicleSearchResult,
} from "@/domain/vehicle";
import type { VehicleEngineRepository } from "@/services/vehicle-engine/vehicle-engine.repository";
import { toVehicleSummary } from "@/services/vehicle-engine/vehicle-engine.repository";
import {
  isMarketplaceVisible,
  toInventoryVehicle,
  toShowcaseVehicleListing,
  toVehicleDetail,
} from "@/services/vehicle-engine/vehicle-projection.service";
import { getSupabaseVehicleRepository } from "@/services/vehicle-engine/vehicle-supabase.repository";
import { getShowcaseSeedRecords } from "@/services/vehicle-engine/vehicle-showcase.seed";
import { getVehicleShowcaseRepository } from "@/services/vehicle-engine/vehicle-showcase.repository";
import type { InventoryVehicle } from "@/features/inventory/types/inventory.types";
import type { ShowcaseVehicleListing } from "@/features/search/config/search-showcase-listings";
import type { VehicleDetail } from "@/features/vehicle/types/vehicle.types";

/**
 * Unified Vehicle Intelligence Engine — single entry point for all vehicle data access.
 * Modules must not query persistence directly; use this service.
 */
export class VehicleEngineService {
  constructor(private readonly repository: VehicleEngineRepository = getVehicleShowcaseRepository()) {}

  async getById(id: string): Promise<UnifiedVehicleRecord | null> {
    return this.repository.findById(id);
  }

  async getBySlug(slug: string): Promise<UnifiedVehicleRecord | null> {
    return this.repository.findBySlug(slug);
  }

  async getByStockNumber(stockNumber: string): Promise<UnifiedVehicleRecord | null> {
    const all = await this.repository.findAll();
    return all.find((r) => r.dealer.stockNumber === stockNumber) ?? null;
  }

  async listAll(): Promise<readonly UnifiedVehicleRecord[]> {
    return this.repository.findAll();
  }

  async listForTenant(tenantId: string): Promise<readonly UnifiedVehicleRecord[]> {
    return this.repository.findByTenant(tenantId);
  }

  async listPublishable(): Promise<readonly UnifiedVehicleRecord[]> {
    const all = await this.repository.findAll();
    return all.filter(isMarketplaceVisible);
  }

  async listSummaries(): Promise<readonly UnifiedVehicleSummary[]> {
    const all = await this.repository.findAll();
    return all.map(toVehicleSummary);
  }

  async search(query: VehicleSearchQuery): Promise<VehicleSearchResult> {
    return this.repository.search(query);
  }

  async save(record: UnifiedVehicleRecord): Promise<UnifiedVehicleRecord> {
    return this.repository.save(record);
  }

  async delete(id: string): Promise<void> {
    return this.repository.delete(id);
  }

  /** Projections — UI-facing views derived from the unified record. */
  async getVehicleDetailBySlug(slug: string): Promise<VehicleDetail | undefined> {
    const record = await this.repository.findBySlug(slug);
    // Resolving by slug alone would expose drafts, archived stock and soft-deleted listings on
    // the public marketplace, because unpublishing only flips status — the slug stays resolvable.
    if (!record || !isMarketplaceVisible(record)) return undefined;
    const all = await this.repository.findAll();
    return toVehicleDetail(record, all);
  }

  /** Dealer-facing lookup: resolves regardless of marketplace visibility. */
  async getVehicleDetailBySlugForOwner(slug: string): Promise<VehicleDetail | undefined> {
    const record = await this.repository.findBySlug(slug);
    if (!record) return undefined;
    const all = await this.repository.findAll();
    return toVehicleDetail(record, all);
  }

  async getAllVehicleDetails(): Promise<readonly VehicleDetail[]> {
    const all = await this.repository.findAll();
    return all
      .filter(isMarketplaceVisible)
      .map((r) => toVehicleDetail(r, all));
  }

  async getShowcaseListings(): Promise<readonly ShowcaseVehicleListing[]> {
    const publishable = await this.listPublishable();
    return publishable.map(toShowcaseVehicleListing);
  }

  async getInventoryVehicles(tenantId?: string): Promise<readonly InventoryVehicle[]> {
    const records = tenantId ? await this.listForTenant(tenantId) : await this.listAll();
    return records.map(toInventoryVehicle);
  }
}

let defaultEngine: VehicleEngineService | null = null;

/**
 * The Vehicle Engine is backed by Supabase. The local platform repository is retained only as the
 * source for the one-time data migration (scripts/pcp001j2a-vehicle-data-migration.mjs) and is no
 * longer reachable from any production path.
 */
export function getVehicleEngine(): VehicleEngineService {
  if (!defaultEngine) {
    defaultEngine = new VehicleEngineService(getSupabaseVehicleRepository());
  }
  return defaultEngine;
}

/** Synchronous accessors for static generation and client-side showcase (seed-backed). */
export function getShowcaseListingsSync(): readonly ShowcaseVehicleListing[] {
  return getShowcaseSeedRecords().filter(isMarketplaceVisible).map(toShowcaseVehicleListing);
}

export function getVehicleDetailBySlugSync(slug: string): VehicleDetail | undefined {
  const records = getShowcaseSeedRecords();
  const record = records.find((r) => r.slug === slug);
  if (!record) return undefined;
  return toVehicleDetail(record, records);
}

export function getAllVehicleDetailsSync(): readonly VehicleDetail[] {
  const records = getShowcaseSeedRecords();
  return records
    .filter(isMarketplaceVisible)
    .map((r) => toVehicleDetail(r, records));
}

export function getAllVehicleSlugsSync(): readonly string[] {
  return getShowcaseSeedRecords().filter(isMarketplaceVisible).map((r) => r.slug);
}

export function getInventoryVehiclesSync(tenantId?: string): readonly InventoryVehicle[] {
  const records = tenantId
    ? getShowcaseSeedRecords().filter((r) => r.tenantId === tenantId)
    : getShowcaseSeedRecords();
  return records.map(toInventoryVehicle);
}

export function getVehicleEngineSync(): VehicleEngineService {
  return getVehicleEngine();
}
