import type {
  BuyerQueryInterpretationInput,
  DescriptionBuilderInput,
  DealerInsightsInput,
  ImageIntelligenceInput,
  LicenceDiscOcrInput,
  ListingQualityInput,
  MarketIntelligenceInput,
  PricingIntelligenceInput,
  VehicleIdentificationInput,
} from "@/features/intelligence/types/intelligence.types";

async function parseJsonBody<T>(request: Request): Promise<T> {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    throw new Error("Request body must be valid JSON.");
  }
  return body as T;
}

export async function parseListingQualityInput(request: Request): Promise<ListingQualityInput> {
  return parseJsonBody<ListingQualityInput>(request);
}

export async function parsePricingIntelligenceInput(request: Request): Promise<PricingIntelligenceInput> {
  return parseJsonBody<PricingIntelligenceInput>(request);
}

export async function parseImageIntelligenceInput(request: Request): Promise<ImageIntelligenceInput> {
  const payload = await parseJsonBody<ImageIntelligenceInput>(request);
  if (!Array.isArray(payload.images)) {
    throw new Error("images must be an array.");
  }
  return payload;
}

export async function parseMarketIntelligenceInput(request: Request): Promise<MarketIntelligenceInput> {
  return parseJsonBody<MarketIntelligenceInput>(request);
}

export async function parseDealerInsightsInput(request: Request): Promise<DealerInsightsInput> {
  return parseJsonBody<DealerInsightsInput>(request);
}

export async function parseLicenceDiscOcrInput(request: Request): Promise<LicenceDiscOcrInput> {
  return parseJsonBody<LicenceDiscOcrInput>(request);
}

export async function parseVehicleIdentificationInput(request: Request): Promise<VehicleIdentificationInput> {
  const payload = await parseJsonBody<VehicleIdentificationInput>(request);
  if (!Array.isArray(payload.photoUrls)) {
    throw new Error("photoUrls must be an array.");
  }
  return payload;
}

export async function parseDescriptionBuilderInput(request: Request): Promise<DescriptionBuilderInput> {
  return parseJsonBody<DescriptionBuilderInput>(request);
}

export async function parseBuyerQueryInterpretationInput(request: Request): Promise<BuyerQueryInterpretationInput> {
  const payload = await parseJsonBody<BuyerQueryInterpretationInput>(request);
  if (!payload.query?.trim()) {
    throw new Error("query is required.");
  }
  return payload;
}
