import { createIntelligenceProvider, type IntelligenceProviderAdapter } from "@/features/intelligence/server/intelligence.providers";
import type {
  BuyerQueryInterpretationInput,
  BuyerQueryInterpretationResult,
  DescriptionBuilderInput,
  DescriptionBuilderResult,
  LicenceDiscOcrInput,
  LicenceDiscOcrResult,
  MarketIntelligenceInput,
  MarketIntelligenceResult,
  PricingIntelligenceInput,
  PricingIntelligenceResult,
  VehicleIdentificationInput,
  VehicleIdentificationResult,
} from "@/features/intelligence/types/intelligence.types";

export class SurfIntelligenceOrchestrator {
  constructor(private readonly provider: IntelligenceProviderAdapter = createIntelligenceProvider()) {}

  getProviderStatus() {
    return this.provider.getProviderState();
  }

  async runPricing(input: PricingIntelligenceInput): Promise<PricingIntelligenceResult> {
    return this.provider.getPricingRecommendation(input);
  }

  async runMarket(input: MarketIntelligenceInput): Promise<MarketIntelligenceResult> {
    return this.provider.getMarketSignals(input);
  }

  async runLicenceDiscOcr(input: LicenceDiscOcrInput): Promise<LicenceDiscOcrResult> {
    return this.provider.runLicenceDiscOcr(input);
  }

  async runVehicleIdentification(input: VehicleIdentificationInput): Promise<VehicleIdentificationResult> {
    return this.provider.runVehicleIdentification(input);
  }

  async runDescriptionBuilder(input: DescriptionBuilderInput): Promise<DescriptionBuilderResult> {
    return this.provider.runDescriptionBuilder(input);
  }

  async runBuyerQueryInterpretation(input: BuyerQueryInterpretationInput): Promise<BuyerQueryInterpretationResult> {
    return this.provider.runBuyerQueryInterpretation(input);
  }
}

let defaultOrchestrator: SurfIntelligenceOrchestrator | null = null;

export function getSurfIntelligenceOrchestrator(): SurfIntelligenceOrchestrator {
  if (!defaultOrchestrator) {
    defaultOrchestrator = new SurfIntelligenceOrchestrator();
  }
  return defaultOrchestrator;
}
