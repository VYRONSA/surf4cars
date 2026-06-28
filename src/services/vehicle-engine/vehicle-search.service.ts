import type { VehicleSearchQuery, VehicleSearchResult } from "@/domain/vehicle";
import {
  getShowcaseListingsSync,
  getVehicleEngine,
} from "@/services/vehicle-engine/vehicle-engine.service";
import { toShowcaseVehicleListing } from "@/services/vehicle-engine/vehicle-projection.service";
import type { ShowcaseVehicleListing } from "@/features/search/config/search-showcase-listings";

/**
 * Central search service — all SURF4CARS search reads from the Vehicle Engine.
 */
export class VehicleSearchService {
  async search(query: VehicleSearchQuery): Promise<VehicleSearchResult> {
    return getVehicleEngine().search(query);
  }

  async getMarketplaceListings(): Promise<readonly ShowcaseVehicleListing[]> {
    return getVehicleEngine().getShowcaseListings();
  }

  async searchListings(query: VehicleSearchQuery): Promise<readonly ShowcaseVehicleListing[]> {
    const result = await this.search(query);
    const engine = getVehicleEngine();

    const listings = await Promise.all(
      result.items.map(async (doc) => {
        const record = await engine.getById(doc.vehicleId);
        return record ? toShowcaseVehicleListing(record) : null;
      }),
    );

    return listings.filter((l): l is ShowcaseVehicleListing => l !== null);
  }
}

let defaultSearchService: VehicleSearchService | null = null;

export function getVehicleSearchService(): VehicleSearchService {
  if (!defaultSearchService) {
    defaultSearchService = new VehicleSearchService();
  }
  return defaultSearchService;
}

/** Sync helper for client components backed by in-memory seed. */
export function searchShowcaseListingsSync(): readonly ShowcaseVehicleListing[] {
  return getShowcaseListingsSync();
}
