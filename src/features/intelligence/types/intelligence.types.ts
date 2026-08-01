export type IntelligenceProvider = "none" | "openai" | "anthropic" | "internal";

export type IntelligenceReadiness =
  | "ready"
  | "awaiting-live-market-data"
  | "awaiting-ai-analysis";

export interface IntelligenceProviderState {
  readonly provider: IntelligenceProvider;
  readonly readiness: IntelligenceReadiness;
  readonly message: string;
  readonly model: string | null;
}

export interface ListingQualityInput {
  readonly listingId?: string;
  readonly title?: string;
  readonly description?: string;
  readonly seoTitle?: string;
  readonly seoDescription?: string;
  readonly askingPriceCents?: number | null;
  readonly currency?: string;
  readonly vin?: string;
  readonly registrationNumber?: string;
  readonly mileageKm?: number | null;
  readonly photoCount?: number;
  readonly hasPrimaryPhoto?: boolean;
  readonly serviceHistoryAvailable?: boolean;
}

export interface ListingQualityResult {
  readonly status: "ready";
  readonly qualityScore: number;
  readonly missingInformation: readonly string[];
  readonly suggestedImprovements: readonly string[];
  readonly providerState: IntelligenceProviderState;
}

export interface PricingIntelligenceInput {
  readonly listingId?: string;
  readonly make?: string;
  readonly model?: string;
  readonly year?: number;
  readonly mileageKm?: number | null;
  readonly askingPriceCents?: number | null;
  readonly currency?: string;
  readonly daysInStock?: number;
}

export interface PricingRecommendation {
  readonly status: "awaiting-live-market-data";
  readonly recommendedPriceCents: number | null;
  readonly pricePositioning: string;
  readonly confidence: "pending-live-market-data";
  readonly rationale: string;
}

export interface PricingIntelligenceResult {
  readonly status: "awaiting-live-market-data";
  readonly recommendation: PricingRecommendation;
  readonly providerState: IntelligenceProviderState;
}

export interface ImageAssetInput {
  readonly imageId: string;
  readonly width: number | null;
  readonly height: number | null;
  readonly angleTag?: "front" | "rear" | "left" | "right" | "interior" | "dashboard" | "engine" | "boot" | "wheel" | "other";
  readonly fingerprint?: string;
}

export interface ImageIntelligenceInput {
  readonly listingId?: string;
  readonly images: readonly ImageAssetInput[];
}

export interface ImageResolutionCheck {
  readonly imageId: string;
  readonly width: number | null;
  readonly height: number | null;
  readonly status: "pass" | "fail" | "unknown";
  readonly message: string;
}

export interface ImageIntelligenceResult {
  readonly status: "ready";
  readonly photoCount: number;
  readonly resolutionChecks: readonly ImageResolutionCheck[];
  readonly missingAngles: readonly string[];
  readonly duplicateDetection: {
    readonly readiness: "ready-for-fingerprint-comparison" | "awaiting-image-fingerprints";
    readonly message: string;
  };
  readonly enhancement: {
    readonly readiness: "awaiting-ai-analysis";
    readonly message: string;
  };
  readonly providerState: IntelligenceProviderState;
}

export interface MarketIntelligenceInput {
  readonly listingId?: string;
  readonly make?: string;
  readonly model?: string;
  readonly year?: number;
  readonly askingPriceCents?: number | null;
  readonly province?: string;
}

export interface MarketIntelligenceResult {
  readonly status: "awaiting-live-market-data";
  readonly marketDemand: string;
  readonly supplyTrend: string;
  readonly pricePositioning: string;
  readonly daysToSellEstimate: string;
  readonly providerState: IntelligenceProviderState;
}

export type DealerRecommendationCategory =
  | "listing-quality"
  | "images"
  | "pricing"
  | "documents"
  | "publishing"
  | "market";

export interface DealerRecommendation {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly category: DealerRecommendationCategory;
  readonly priority: "high" | "medium" | "low";
  readonly state: "actionable" | "awaiting-data";
}

export interface DealerInsightsInput {
  readonly listingQuality: ListingQualityResult;
  readonly imageIntelligence: ImageIntelligenceResult;
  readonly pricingIntelligence: PricingIntelligenceResult;
  readonly marketIntelligence: MarketIntelligenceResult;
  readonly lifecycleStatus?: string;
  readonly leadCount30d?: number;
  readonly daysInStock?: number;
  readonly serviceHistoryAvailable?: boolean;
}

export interface DealerInsightsResult {
  readonly status: "ready";
  readonly recommendations: readonly DealerRecommendation[];
  readonly providerState: IntelligenceProviderState;
}

export interface IntelligenceAnalysisBundle {
  readonly listingQuality: ListingQualityResult;
  readonly pricingIntelligence: PricingIntelligenceResult;
  readonly imageIntelligence: ImageIntelligenceResult;
  readonly marketIntelligence: MarketIntelligenceResult;
  readonly dealerInsights: DealerInsightsResult;
  readonly generatedAt: string;
}

export interface LicenceDiscOcrInput {
  readonly imageUrl?: string;
  readonly imageName?: string;
}

export interface LicenceDiscOcrResult {
  readonly status: "awaiting-ai-analysis";
  readonly message: "Awaiting OCR analysis";
  readonly registrationNumber: string | null;
  readonly vin: string | null;
  readonly expiryDate: string | null;
  readonly providerState: IntelligenceProviderState;
}

export interface VehicleIdentificationInput {
  readonly photoUrls: readonly string[];
  readonly licenceDiscRegistration?: string;
  readonly vin?: string;
}

export interface VehicleIdentificationResult {
  readonly status: "awaiting-ai-analysis";
  readonly message: "Awaiting AI analysis";
  readonly make: string | null;
  readonly model: string | null;
  readonly variant: string | null;
  readonly year: number | null;
  readonly colour: string | null;
  readonly fuelType: string | null;
  readonly transmission: string | null;
  readonly vin: string | null;
  readonly engineSize: string | null;
  readonly providerState: IntelligenceProviderState;
}

export interface DescriptionBuilderInput {
  readonly make?: string;
  readonly model?: string;
  readonly variant?: string;
  readonly year?: number;
  readonly mileageKm?: number;
  readonly fuelType?: string;
  readonly transmission?: string;
  readonly highlights?: readonly string[];
}

export interface DescriptionBuilderResult {
  readonly status: "awaiting-ai-analysis";
  readonly message: "Awaiting AI analysis";
  readonly title: string | null;
  readonly description: string | null;
  readonly highlights: readonly string[];
  readonly seoTitle: string | null;
  readonly seoDescription: string | null;
  readonly providerState: IntelligenceProviderState;
}

export interface BuyerPreferenceInput {
  readonly budgetMinCents?: number | null;
  readonly budgetMaxCents?: number | null;
  readonly vehicleTypes?: readonly string[];
  readonly lifestyle?: string | null;
  readonly familySize?: number | null;
  readonly fuelPreference?: string | null;
  readonly transmissionPreference?: string | null;
  readonly towingNeeds?: string | null;
}

export interface BuyerQueryInterpretationInput {
  readonly query: string;
  readonly buyerProfile?: BuyerPreferenceInput;
}

export interface BuyerQueryInterpretationResult {
  readonly status: "ready";
  readonly intent: {
    readonly budgetMinCents: number | null;
    readonly budgetMaxCents: number | null;
    readonly bodyType: string | null;
    readonly useCase: string | null;
    readonly keywords: readonly string[];
  };
  readonly message: string;
  readonly providerState: IntelligenceProviderState;
}
