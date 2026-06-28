import type { UnifiedVehicleRecord, VehicleSearchQuery, VehicleSearchResult } from "@/domain/vehicle";
import type { VehicleEngineRepository } from "@/services/vehicle-engine/vehicle-engine.repository";
import { getShowcaseSeedRecords } from "@/services/vehicle-engine/vehicle-showcase.seed";
import { isMarketplaceVisible, toVehicleSearchDocument } from "@/services/vehicle-engine/vehicle-projection.service";

/**
 * In-memory repository backed by the unified showcase seed.
 * Replace with Supabase/API adapter in production.
 */
export class VehicleShowcaseRepository implements VehicleEngineRepository {
  private records: Map<string, UnifiedVehicleRecord>;
  private slugIndex: Map<string, string>;

  constructor(seed: readonly UnifiedVehicleRecord[] = getShowcaseSeedRecords()) {
    this.records = new Map(seed.map((r) => [r.id, r]));
    this.slugIndex = new Map(seed.map((r) => [r.slug, r.id]));
  }

  async findAll(): Promise<readonly UnifiedVehicleRecord[]> {
    return [...this.records.values()];
  }

  async findById(id: string): Promise<UnifiedVehicleRecord | null> {
    return this.records.get(id) ?? null;
  }

  async findBySlug(slug: string): Promise<UnifiedVehicleRecord | null> {
    const id = this.slugIndex.get(slug);
    return id ? (this.records.get(id) ?? null) : null;
  }

  async findByTenant(tenantId: string): Promise<readonly UnifiedVehicleRecord[]> {
    return [...this.records.values()].filter((r) => r.tenantId === tenantId);
  }

  async search(query: VehicleSearchQuery): Promise<VehicleSearchResult> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 24;
    const filters = query.filters ?? {};

    let items = [...this.records.values()];

    if (filters.dealershipId) {
      items = items.filter((r) => r.dealer.dealershipId === filters.dealershipId);
    }
    if (filters.branchId) {
      items = items.filter((r) => r.dealer.branchId === filters.branchId);
    }
    if (filters.status?.length) {
      items = items.filter((r) => filters.status!.includes(r.status.current));
    } else if (!filters.dealershipId) {
      items = items.filter(isMarketplaceVisible);
    }
    if (filters.featured !== undefined) {
      items = items.filter((r) => r.marketing.featured === filters.featured);
    }
    if (filters.verified !== undefined) {
      items = items.filter((r) => r.dealer.verified === filters.verified);
    }
    if (filters.make) {
      items = items.filter((r) => r.core.make.toLowerCase() === filters.make!.toLowerCase());
    }
    if (filters.model) {
      items = items.filter((r) => r.core.model.toLowerCase().includes(filters.model!.toLowerCase()));
    }
    if (filters.fuel) {
      items = items.filter((r) => r.core.fuel.toLowerCase() === filters.fuel!.toLowerCase());
    }
    if (filters.transmission) {
      items = items.filter((r) => r.core.transmission.toLowerCase() === filters.transmission!.toLowerCase());
    }
    if (filters.bodyType) {
      items = items.filter((r) => r.core.bodyType.toLowerCase() === filters.bodyType!.toLowerCase());
    }
    if (filters.province) {
      items = items.filter((r) => r.dealer.province.toLowerCase() === filters.province!.toLowerCase());
    }
    if (filters.yearMin !== undefined) {
      items = items.filter((r) => r.core.year >= filters.yearMin!);
    }
    if (filters.yearMax !== undefined) {
      items = items.filter((r) => r.core.year <= filters.yearMax!);
    }
    if (filters.priceMinCents !== undefined) {
      items = items.filter((r) => r.pricing.sellingPriceCents >= filters.priceMinCents!);
    }
    if (filters.priceMaxCents !== undefined) {
      items = items.filter((r) => r.pricing.sellingPriceCents <= filters.priceMaxCents!);
    }
    if (filters.mileageMaxKm !== undefined) {
      items = items.filter((r) => r.core.mileageKm <= filters.mileageMaxKm!);
    }
    if (filters.query) {
      const q = filters.query.toLowerCase();
      items = items.filter((r) => {
        const doc = toVehicleSearchDocument(r);
        return doc.searchText.includes(q);
      });
    }

    items = sortRecords(items, query.sort ?? "relevance");

    const total = items.length;
    const start = (page - 1) * pageSize;
    const pageItems = items.slice(start, start + pageSize).map(toVehicleSearchDocument);

    return { items: pageItems, total, page, pageSize };
  }

  async save(record: UnifiedVehicleRecord): Promise<UnifiedVehicleRecord> {
    this.records.set(record.id, record);
    this.slugIndex.set(record.slug, record.id);
    return record;
  }

  async delete(id: string): Promise<void> {
    const record = this.records.get(id);
    if (record) {
      this.slugIndex.delete(record.slug);
      this.records.delete(id);
    }
  }
}

function sortRecords(
  items: UnifiedVehicleRecord[],
  sort: NonNullable<VehicleSearchQuery["sort"]>,
): UnifiedVehicleRecord[] {
  const sorted = [...items];
  switch (sort) {
    case "price-asc":
      return sorted.sort((a, b) => a.pricing.sellingPriceCents - b.pricing.sellingPriceCents);
    case "price-desc":
      return sorted.sort((a, b) => b.pricing.sellingPriceCents - a.pricing.sellingPriceCents);
    case "year-desc":
      return sorted.sort((a, b) => b.core.year - a.core.year);
    case "mileage-asc":
      return sorted.sort((a, b) => a.core.mileageKm - b.core.mileageKm);
    case "listing-score":
      return sorted.sort((a, b) => b.ai.scores.listingScore - a.ai.scores.listingScore);
    case "days-in-stock":
      return sorted.sort((a, b) => b.history.engagement.daysInStock - a.history.engagement.daysInStock);
    case "views":
      return sorted.sort((a, b) => b.history.engagement.views - a.history.engagement.views);
    case "relevance":
    default:
      return sorted.sort((a, b) => b.ai.scores.aiMatchScore - a.ai.scores.aiMatchScore);
  }
}

let defaultRepository: VehicleShowcaseRepository | null = null;

export function getVehicleShowcaseRepository(): VehicleShowcaseRepository {
  if (!defaultRepository) {
    defaultRepository = new VehicleShowcaseRepository();
  }
  return defaultRepository;
}
