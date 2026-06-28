import type {
  UnifiedVehicleRecord,
  UnifiedVehicleSummary,
  VehicleSearchQuery,
  VehicleSearchResult,
} from "@/domain/vehicle";
import type { VehicleEngineRepository } from "@/services/vehicle-engine/vehicle-engine.repository";
import { toVehicleSummary } from "@/services/vehicle-engine/vehicle-engine.repository";
import {
  buildSlugIndex,
  isMarketplaceVisible,
  toInventoryVehicle,
  toShowcaseVehicleListing,
  toVehicleDetail,
} from "@/services/vehicle-engine/vehicle-projection.service";
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
    if (!record) return undefined;
    const all = await this.repository.findAll();
    const slugById = buildSlugIndex(all);
    return toVehicleDetail(record, slugById);
  }

  async getAllVehicleDetails(): Promise<readonly VehicleDetail[]> {
    const all = await this.repository.findAll();
    const slugById = buildSlugIndex(all);
    return all
      .filter(isMarketplaceVisible)
      .map((r) => toVehicleDetail(r, slugById));
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

export function getVehicleEngine(): VehicleEngineService {
  if (!defaultEngine) {
    defaultEngine = new VehicleEngineService();
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
  return toVehicleDetail(record, buildSlugIndex(records));
}

export function getAllVehicleDetailsSync(): readonly VehicleDetail[] {
  const records = getShowcaseSeedRecords();
  const slugById = buildSlugIndex(records);
  return records
    .filter(isMarketplaceVisible)
    .map((r) => toVehicleDetail(r, slugById));
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
