import { getSurfIntelligenceOrchestrator } from "@/features/intelligence/server/intelligence.orchestrator";
import type {
  BuyerQueryInterpretationInput,
  BuyerQueryInterpretationResult,
  DescriptionBuilderInput,
  DescriptionBuilderResult,
  DealerInsightsInput,
  DealerInsightsResult,
  ImageIntelligenceInput,
  ImageIntelligenceResult,
  IntelligenceAnalysisBundle,
  LicenceDiscOcrInput,
  LicenceDiscOcrResult,
  ListingQualityInput,
  ListingQualityResult,
  MarketIntelligenceInput,
  MarketIntelligenceResult,
  PricingIntelligenceInput,
  PricingIntelligenceResult,
  VehicleIdentificationInput,
  VehicleIdentificationResult,
} from "@/features/intelligence/types/intelligence.types";
import { evaluateListingQualityRules } from "@/features/intelligence/utils/listing-quality-rules";

const MIN_IMAGE_WIDTH = 1600;
const MIN_IMAGE_HEIGHT = 900;
const REQUIRED_ANGLES = ["front", "rear", "left", "right", "interior"] as const;

export async function analyzeListingQuality(input: ListingQualityInput): Promise<ListingQualityResult> {
  const evaluated = evaluateListingQualityRules(input);

  return {
    status: "ready",
    qualityScore: evaluated.qualityScore,
    missingInformation: evaluated.missingInformation,
    suggestedImprovements: evaluated.suggestedImprovements,
    providerState: {
      provider: "internal",
      readiness: "ready",
      message: "Rule-based quality analysis active.",
      model: "surf-quality-rules-v1",
    },
  };
}

export async function analyzePricingIntelligence(
  input: PricingIntelligenceInput,
): Promise<PricingIntelligenceResult> {
  const orchestrator = getSurfIntelligenceOrchestrator();
  return orchestrator.runPricing(input);
}

export async function analyzeLicenceDiscOcr(
  input: LicenceDiscOcrInput,
): Promise<LicenceDiscOcrResult> {
  const orchestrator = getSurfIntelligenceOrchestrator();
  return orchestrator.runLicenceDiscOcr(input);
}

export async function analyzeVehicleIdentification(
  input: VehicleIdentificationInput,
): Promise<VehicleIdentificationResult> {
  const orchestrator = getSurfIntelligenceOrchestrator();
  return orchestrator.runVehicleIdentification(input);
}

export async function analyzeDescriptionBuilder(
  input: DescriptionBuilderInput,
): Promise<DescriptionBuilderResult> {
  const orchestrator = getSurfIntelligenceOrchestrator();
  return orchestrator.runDescriptionBuilder(input);
}

export async function analyzeBuyerQueryInterpretation(
  input: BuyerQueryInterpretationInput,
): Promise<BuyerQueryInterpretationResult> {
  const orchestrator = getSurfIntelligenceOrchestrator();
  return orchestrator.runBuyerQueryInterpretation(input);
}

export async function analyzeImageIntelligence(
  input: ImageIntelligenceInput,
): Promise<ImageIntelligenceResult> {
  const checks = input.images.map((image) => {
    if (image.width === null || image.height === null) {
      return {
        imageId: image.imageId,
        width: image.width,
        height: image.height,
        status: "unknown" as const,
        message: "Resolution metadata missing.",
      };
    }

    const passed = image.width >= MIN_IMAGE_WIDTH && image.height >= MIN_IMAGE_HEIGHT;
    return {
      imageId: image.imageId,
      width: image.width,
      height: image.height,
      status: passed ? ("pass" as const) : ("fail" as const),
      message: passed
        ? "Resolution meets listing standard."
        : `Resolution below standard (${MIN_IMAGE_WIDTH}x${MIN_IMAGE_HEIGHT}).`,
    };
  });

  const seenAngles = new Set(input.images.map((image) => image.angleTag).filter(Boolean));
  const missingAngles = REQUIRED_ANGLES.filter((angle) => !seenAngles.has(angle));

  const hasFingerprints = input.images.length > 0 && input.images.every((image) => Boolean(image.fingerprint));

  return {
    status: "ready",
    photoCount: input.images.length,
    resolutionChecks: checks,
    missingAngles,
    duplicateDetection: {
      readiness: hasFingerprints ? "ready-for-fingerprint-comparison" : "awaiting-image-fingerprints",
      message: hasFingerprints
        ? "Duplicate detection can run when comparison service is connected."
        : "Awaiting image fingerprints for duplicate detection.",
    },
    enhancement: {
      readiness: "awaiting-ai-analysis",
      message: "Awaiting AI analysis",
    },
    providerState: {
      provider: "internal",
      readiness: "ready",
      message: "Image quality framework ready.",
      model: "surf-image-rules-v1",
    },
  };
}

export async function analyzeMarketIntelligence(
  input: MarketIntelligenceInput,
): Promise<MarketIntelligenceResult> {
  const orchestrator = getSurfIntelligenceOrchestrator();
  return orchestrator.runMarket(input);
}

function toRecommendationId(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export async function generateDealerInsights(
  input: DealerInsightsInput,
): Promise<DealerInsightsResult> {
  const recommendations: DealerInsightsResult["recommendations"][number][] = [];

  for (const field of input.listingQuality.missingInformation) {
    recommendations.push({
      id: toRecommendationId(`complete-${field}`),
      title: `Complete ${field}`,
      description: `Populate ${field.toLowerCase()} to improve listing quality and trust.`,
      category: field.toLowerCase().includes("service") ? "documents" : "listing-quality",
      priority: "high",
      state: "actionable",
    });
  }

  if (input.imageIntelligence.photoCount > 0 && input.imageIntelligence.missingAngles.length > 0) {
    recommendations.push({
      id: "improve-first-image-and-angles",
      title: "Improve first image and missing angles",
      description: `Capture and upload missing angles: ${input.imageIntelligence.missingAngles.join(", ")}.`,
      category: "images",
      priority: "high",
      state: "actionable",
    });
  }

  if (!input.serviceHistoryAvailable) {
    recommendations.push({
      id: "add-service-history",
      title: "Add service history",
      description: "Upload service history documents to increase buyer trust.",
      category: "documents",
      priority: "medium",
      state: "actionable",
    });
  }

  if (input.pricingIntelligence.status === "awaiting-live-market-data") {
    recommendations.push({
      id: "pricing-live-data-pending",
      title: "Pricing recommendation pending live data",
      description: "Awaiting live market data before price optimization can be suggested.",
      category: "pricing",
      priority: "medium",
      state: "awaiting-data",
    });
  }

  if (input.marketIntelligence.status === "awaiting-live-market-data") {
    recommendations.push({
      id: "market-live-data-pending",
      title: "Market intelligence pending live data",
      description: "Awaiting live market data for demand and days-to-sell intelligence.",
      category: "market",
      priority: "medium",
      state: "awaiting-data",
    });
  }

  if (input.lifecycleStatus === "ready-to-publish" && input.listingQuality.qualityScore >= 80) {
    recommendations.push({
      id: "publish-listing",
      title: "Publish listing",
      description: "Listing quality threshold met. Publish to marketplace.",
      category: "publishing",
      priority: "high",
      state: "actionable",
    });
  }

  if ((input.leadCount30d ?? 0) === 0 && (input.daysInStock ?? 0) > 30) {
    recommendations.push({
      id: "refresh-media-and-copy",
      title: "Refresh media and copy",
      description: "Low engagement over 30 days suggests media and messaging refresh.",
      category: "listing-quality",
      priority: "medium",
      state: "actionable",
    });
  }

  return {
    status: "ready",
    recommendations,
    providerState: {
      provider: "internal",
      readiness: "ready",
      message: "Dealer insight rules active.",
      model: "surf-dealer-insights-rules-v1",
    },
  };
}

export async function analyzeIntelligenceBundle(input: {
  readonly listing: ListingQualityInput;
  readonly pricing: PricingIntelligenceInput;
  readonly images: ImageIntelligenceInput;
  readonly market: MarketIntelligenceInput;
  readonly lifecycleStatus?: string;
  readonly leadCount30d?: number;
  readonly daysInStock?: number;
  readonly serviceHistoryAvailable?: boolean;
}): Promise<IntelligenceAnalysisBundle> {
  const [listingQuality, pricingIntelligence, imageIntelligence, marketIntelligence] = await Promise.all([
    analyzeListingQuality(input.listing),
    analyzePricingIntelligence(input.pricing),
    analyzeImageIntelligence(input.images),
    analyzeMarketIntelligence(input.market),
  ]);

  const dealerInsights = await generateDealerInsights({
    listingQuality,
    pricingIntelligence,
    imageIntelligence,
    marketIntelligence,
    lifecycleStatus: input.lifecycleStatus,
    leadCount30d: input.leadCount30d,
    daysInStock: input.daysInStock,
    serviceHistoryAvailable: input.serviceHistoryAvailable,
  });

  return {
    listingQuality,
    pricingIntelligence,
    imageIntelligence,
    marketIntelligence,
    dealerInsights,
    generatedAt: new Date().toISOString(),
  };
}
