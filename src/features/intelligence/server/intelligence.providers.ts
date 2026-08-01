import type {
  BuyerQueryInterpretationInput,
  BuyerQueryInterpretationResult,
  DescriptionBuilderInput,
  DescriptionBuilderResult,
  IntelligenceProviderState,
  LicenceDiscOcrInput,
  LicenceDiscOcrResult,
  MarketIntelligenceInput,
  MarketIntelligenceResult,
  PricingIntelligenceInput,
  PricingIntelligenceResult,
  VehicleIdentificationInput,
  VehicleIdentificationResult,
} from "@/features/intelligence/types/intelligence.types";

export interface IntelligenceProviderAdapter {
  readonly id: "none" | "openai" | "anthropic" | "internal";
  runLicenceDiscOcr(input: LicenceDiscOcrInput): Promise<LicenceDiscOcrResult>;
  runVehicleIdentification(input: VehicleIdentificationInput): Promise<VehicleIdentificationResult>;
  runDescriptionBuilder(input: DescriptionBuilderInput): Promise<DescriptionBuilderResult>;
  runBuyerQueryInterpretation(input: BuyerQueryInterpretationInput): Promise<BuyerQueryInterpretationResult>;
  getPricingRecommendation(input: PricingIntelligenceInput): Promise<PricingIntelligenceResult>;
  getMarketSignals(input: MarketIntelligenceInput): Promise<MarketIntelligenceResult>;
  getProviderState(): IntelligenceProviderState;
}

class NoopIntelligenceProvider implements IntelligenceProviderAdapter {
  readonly id = "none" as const;

  getProviderState(): IntelligenceProviderState {
    return {
      provider: "none",
      readiness: "awaiting-ai-analysis",
      message: "Awaiting AI analysis",
      model: null,
    };
  }

  async getPricingRecommendation(input: PricingIntelligenceInput): Promise<PricingIntelligenceResult> {
    const descriptor = [input.make, input.model, input.year].filter(Boolean).join(" ").trim() || "vehicle";

    return {
      status: "awaiting-live-market-data",
      recommendation: {
        status: "awaiting-live-market-data",
        recommendedPriceCents: null,
        pricePositioning: "Awaiting live market data",
        confidence: "pending-live-market-data",
        rationale: `Awaiting live market data for ${descriptor}.`,
      },
      providerState: {
        provider: this.id,
        readiness: "awaiting-live-market-data",
        message: "Awaiting live market data",
        model: null,
      },
    };
  }

  async getMarketSignals(): Promise<MarketIntelligenceResult> {
    return {
      status: "awaiting-live-market-data",
      marketDemand: "Awaiting live market data",
      supplyTrend: "Awaiting live market data",
      pricePositioning: "Awaiting live market data",
      daysToSellEstimate: "Awaiting live market data",
      providerState: {
        provider: this.id,
        readiness: "awaiting-live-market-data",
        message: "Awaiting live market data",
        model: null,
      },
    };
  }

  async runLicenceDiscOcr(): Promise<LicenceDiscOcrResult> {
    return {
      status: "awaiting-ai-analysis",
      message: "Awaiting OCR analysis",
      registrationNumber: null,
      vin: null,
      expiryDate: null,
      providerState: this.getProviderState(),
    };
  }

  async runVehicleIdentification(): Promise<VehicleIdentificationResult> {
    return {
      status: "awaiting-ai-analysis",
      message: "Awaiting AI analysis",
      make: null,
      model: null,
      variant: null,
      year: null,
      colour: null,
      fuelType: null,
      transmission: null,
      vin: null,
      engineSize: null,
      providerState: this.getProviderState(),
    };
  }

  async runDescriptionBuilder(): Promise<DescriptionBuilderResult> {
    return {
      status: "awaiting-ai-analysis",
      message: "Awaiting AI analysis",
      title: null,
      description: null,
      highlights: [],
      seoTitle: null,
      seoDescription: null,
      providerState: this.getProviderState(),
    };
  }

  async runBuyerQueryInterpretation(input: BuyerQueryInterpretationInput): Promise<BuyerQueryInterpretationResult> {
    const query = input.query.toLowerCase();
    const budgetMatch = query.match(/(r\s?\d[\d\s,]*)/i);
    const budgetToken = budgetMatch?.[1];
    const parsedBudget = budgetToken
      ? Number(budgetToken.replace(/[^\d]/g, "")) * 100
      : null;

    let bodyType: string | null = null;
    if (query.includes("suv")) bodyType = "SUV";
    if (query.includes("sedan")) bodyType = "Sedan";
    if (query.includes("double cab") || query.includes("bakkie")) bodyType = "Double Cab";

    let useCase: string | null = null;
    if (query.includes("family")) useCase = "family";
    if (query.includes("first car")) useCase = "first-car";
    if (query.includes("luxury")) useCase = "luxury";

    return {
      status: "ready",
      intent: {
        budgetMinCents: input.buyerProfile?.budgetMinCents ?? null,
        budgetMaxCents: parsedBudget ?? input.buyerProfile?.budgetMaxCents ?? null,
        bodyType,
        useCase,
        keywords: query.split(/\s+/).filter((term) => term.length > 2).slice(0, 8),
      },
      message: "Query interpreted using SURF Intelligence intent pipeline.",
      providerState: {
        provider: "internal",
        readiness: "ready",
        message: "Rule-based interpretation active.",
        model: "surf-buyer-intent-rules-v1",
      },
    };
  }
}

export function createIntelligenceProvider(): IntelligenceProviderAdapter {
  return new NoopIntelligenceProvider();
}
