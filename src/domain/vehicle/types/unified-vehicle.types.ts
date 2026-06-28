import type { VehicleStatusData } from "@/domain/vehicle/constants/vehicle-status.constants";
import type { VehicleAiData } from "@/domain/vehicle/types/vehicle-ai.types";
import type { VehicleCore } from "@/domain/vehicle/types/vehicle-core.types";
import type { VehicleDealerData } from "@/domain/vehicle/types/vehicle-dealer.types";
import type { VehicleHistoryData } from "@/domain/vehicle/types/vehicle-history.types";
import type { VehicleMarketingData } from "@/domain/vehicle/types/vehicle-marketing.types";
import type { VehicleMediaBundle } from "@/domain/vehicle/types/vehicle-media.types";
import type { VehiclePricingData } from "@/domain/vehicle/types/vehicle-pricing.types";

/**
 * Unified Vehicle Record — single source of truth for all SURF4CARS modules.
 * Every consumer reads through the Vehicle Engine; never duplicate this shape.
 */
export interface UnifiedVehicleRecord {
  readonly id: string;
  readonly slug: string;
  readonly tenantId: string;
  readonly core: VehicleCore;
  readonly dealer: VehicleDealerData;
  readonly pricing: VehiclePricingData;
  readonly marketing: VehicleMarketingData;
  readonly ai: VehicleAiData;
  readonly media: VehicleMediaBundle;
  readonly history: VehicleHistoryData;
  readonly status: VehicleStatusData;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface UnifiedVehicleSummary {
  readonly id: string;
  readonly slug: string;
  readonly tenantId: string;
  readonly title: string;
  readonly stockNumber: string;
  readonly status: VehicleStatusData["current"];
  readonly sellingPriceDisplay: string;
  readonly listingScore: number;
  readonly health: VehicleAiData["scores"]["health"];
}
