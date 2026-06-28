import type { VehicleStatus } from "@/domain/vehicle/constants/vehicle-status.constants";

export interface VehicleSearchFilters {
  readonly query?: string;
  readonly make?: string;
  readonly model?: string;
  readonly variant?: string;
  readonly yearMin?: number;
  readonly yearMax?: number;
  readonly priceMinCents?: number;
  readonly priceMaxCents?: number;
  readonly mileageMaxKm?: number;
  readonly fuel?: string;
  readonly transmission?: string;
  readonly bodyType?: string;
  readonly province?: string;
  readonly dealershipId?: string;
  readonly branchId?: string;
  readonly status?: readonly VehicleStatus[];
  readonly featured?: boolean;
  readonly verified?: boolean;
}

export type VehicleSearchSortField =
  | "relevance"
  | "price-asc"
  | "price-desc"
  | "year-desc"
  | "mileage-asc"
  | "listing-score"
  | "days-in-stock"
  | "views";

export interface VehicleSearchQuery {
  readonly filters?: VehicleSearchFilters;
  readonly sort?: VehicleSearchSortField;
  readonly page?: number;
  readonly pageSize?: number;
}

export interface VehicleSearchDocument {
  readonly vehicleId: string;
  readonly slug: string;
  readonly tenantId: string;
  readonly title: string;
  readonly make: string;
  readonly model: string;
  readonly variant: string;
  readonly year: number;
  readonly priceCents: number;
  readonly mileageKm: number;
  readonly fuel: string;
  readonly transmission: string;
  readonly bodyType: string;
  readonly province: string;
  readonly location: string;
  readonly dealershipName: string;
  readonly status: VehicleStatus;
  readonly featured: boolean;
  readonly verified: boolean;
  readonly listingScore: number;
  readonly aiMatchScore: number;
  readonly primaryImageUrl: string;
  readonly searchText: string;
}

export interface VehicleSearchResult {
  readonly items: readonly VehicleSearchDocument[];
  readonly total: number;
  readonly page: number;
  readonly pageSize: number;
}
