import type { BuyerQueryInterpretationResult } from "@/features/intelligence";

export interface BuyerPreferenceProfile {
  readonly buyerId: string;
  readonly budgetMinCents: number | null;
  readonly budgetMaxCents: number | null;
  readonly vehicleTypes: readonly string[];
  readonly lifestyle: string | null;
  readonly dailyCommuteKm: number | null;
  readonly familySize: number | null;
  readonly fuelPreference: string | null;
  readonly transmissionPreference: string | null;
  readonly towingNeeds: string | null;
  readonly updatedAt: string;
}

export interface BuyerSearchRequest {
  readonly buyerId?: string;
  readonly query: string;
}

export interface BuyerVehicleSearchItem {
  readonly vehicleId: string;
  readonly title: string;
  readonly make: string;
  readonly model: string;
  readonly year: number;
  readonly askingPriceCents: number;
  readonly currency: string;
  readonly listingQualityScore: number;
  readonly dealerTrustState: "awaiting-data";
  readonly marketState: "Awaiting live market data.";
}

export interface BuyerSearchResponse {
  readonly interpretation: BuyerQueryInterpretationResult;
  readonly matches: readonly BuyerVehicleSearchItem[];
  readonly message: string;
}

export interface BuyerRecommendation {
  readonly id: string;
  readonly title: string;
  readonly status: "pending";
  readonly message: "Awaiting live recommendation data.";
  readonly factors: {
    readonly buyerProfile: "available" | "pending";
    readonly searchBehaviour: "pending";
    readonly savedVehicles: "available" | "pending";
    readonly inventoryQuality: "available";
    readonly marketIntelligence: "pending";
    readonly dealerTrust: "pending";
  };
}

export interface BuyerRecommendationResponse {
  readonly buyerId: string;
  readonly recommendations: readonly BuyerRecommendation[];
}

export interface CompareIntelligenceRequest {
  readonly buyerId?: string;
  readonly vehicleIds: readonly string[];
}

export interface CompareIntelligenceVehicle {
  readonly vehicleId: string;
  readonly title: string;
  readonly runningCosts: "Awaiting data.";
  readonly reliability: "Awaiting data.";
  readonly fuelEconomy: "Awaiting data.";
  readonly safety: "Awaiting data.";
  readonly resaleOutlook: "Awaiting data.";
  readonly estimatedMaintenance: "Awaiting data.";
}

export interface CompareIntelligenceResponse {
  readonly items: readonly CompareIntelligenceVehicle[];
}

export interface SavedSearchRecord {
  readonly id: string;
  readonly buyerId: string;
  readonly name: string;
  readonly query: string;
  readonly interpretation: BuyerQueryInterpretationResult;
  readonly alertsEnabled: boolean;
  readonly createdAt: string;
}

export interface SavedVehicleRecord {
  readonly id: string;
  readonly buyerId: string;
  readonly vehicleId: string;
  readonly createdAt: string;
}

export interface BuyerAlertRecord {
  readonly id: string;
  readonly buyerId: string;
  readonly alertType: "saved-search-match" | "price-change";
  readonly status: "active" | "paused";
  readonly channel: "email" | "whatsapp" | "push";
  readonly referenceId: string | null;
  readonly createdAt: string;
}
