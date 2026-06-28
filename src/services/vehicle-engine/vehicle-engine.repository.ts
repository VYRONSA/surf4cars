import type {
  UnifiedVehicleRecord,
  UnifiedVehicleSummary,
  VehicleSearchQuery,
  VehicleSearchResult,
} from "@/domain/vehicle";

/**
 * Repository contract — all persistence goes through this interface.
 * Production: Supabase/API adapter. Showcase: in-memory seed.
 */
export interface VehicleEngineRepository {
  findAll(): Promise<readonly UnifiedVehicleRecord[]>;
  findById(id: string): Promise<UnifiedVehicleRecord | null>;
  findBySlug(slug: string): Promise<UnifiedVehicleRecord | null>;
  findByTenant(tenantId: string): Promise<readonly UnifiedVehicleRecord[]>;
  search(query: VehicleSearchQuery): Promise<VehicleSearchResult>;
  save(record: UnifiedVehicleRecord): Promise<UnifiedVehicleRecord>;
  delete(id: string): Promise<void>;
}

export function toVehicleSummary(record: UnifiedVehicleRecord): UnifiedVehicleSummary {
  return {
    id: record.id,
    slug: record.slug,
    tenantId: record.tenantId,
    title: record.core.title,
    stockNumber: record.dealer.stockNumber,
    status: record.status.current,
    sellingPriceDisplay: record.pricing.sellingPriceDisplay,
    listingScore: record.ai.scores.listingScore,
    health: record.ai.scores.health,
  };
}
