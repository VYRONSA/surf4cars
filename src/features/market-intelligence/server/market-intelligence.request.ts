import type {
  DealerBenchmarkingInput,
  DemandAnalysisInput,
  InventoryAgeingIntelligenceInput,
  MarketAnalyticsEventInput,
  MarketPulseInput,
  PricePositionAnalysisInput,
  SellingVelocityInput,
  SupplyAnalysisInput,
} from "@/features/market-intelligence/types/market-intelligence.types";

export function parseDealershipIdFromUrl(request: Request): string {
  const url = new URL(request.url);
  const dealershipId = (url.searchParams.get("dealershipId") ?? "").trim();
  if (!dealershipId) {
    throw new Error("dealershipId is required.");
  }
  return dealershipId;
}

async function parseJsonBody<T>(request: Request): Promise<T> {
  const body = (await request.json().catch(() => null)) as T | null;
  if (!body || typeof body !== "object") {
    throw new Error("Request body must be valid JSON.");
  }
  return body;
}

export async function parsePricePositionInput(request: Request): Promise<PricePositionAnalysisInput> {
  const body = await parseJsonBody<PricePositionAnalysisInput>(request);
  if (!body.dealershipId?.trim()) {
    throw new Error("dealershipId is required.");
  }
  return body;
}

export async function parseDemandAnalysisInput(request: Request): Promise<DemandAnalysisInput> {
  const body = await parseJsonBody<DemandAnalysisInput>(request);
  if (!body.dealershipId?.trim()) {
    throw new Error("dealershipId is required.");
  }
  return body;
}

export async function parseSupplyAnalysisInput(request: Request): Promise<SupplyAnalysisInput> {
  const body = await parseJsonBody<SupplyAnalysisInput>(request);
  if (!body.dealershipId?.trim()) {
    throw new Error("dealershipId is required.");
  }
  return body;
}

export async function parseSellingVelocityInput(request: Request): Promise<SellingVelocityInput> {
  const body = await parseJsonBody<SellingVelocityInput>(request);
  if (!body.dealershipId?.trim()) {
    throw new Error("dealershipId is required.");
  }
  return body;
}

export async function parseInventoryAgeingInput(request: Request): Promise<InventoryAgeingIntelligenceInput> {
  const body = await parseJsonBody<InventoryAgeingIntelligenceInput>(request);
  if (!body.dealershipId?.trim()) {
    throw new Error("dealershipId is required.");
  }
  return body;
}

export async function parseDealerBenchmarkingInput(request: Request): Promise<DealerBenchmarkingInput> {
  const body = await parseJsonBody<DealerBenchmarkingInput>(request);
  if (!body.dealershipId?.trim()) {
    throw new Error("dealershipId is required.");
  }
  return body;
}

export async function parseMarketPulseInput(request: Request): Promise<MarketPulseInput> {
  const body = await parseJsonBody<MarketPulseInput>(request);
  if (!body.dealershipId?.trim()) {
    throw new Error("dealershipId is required.");
  }
  return body;
}

export async function parseAnalyticsEventInput(request: Request): Promise<MarketAnalyticsEventInput> {
  const body = await parseJsonBody<MarketAnalyticsEventInput>(request);

  if (!body.dealershipId?.trim()) {
    throw new Error("dealershipId is required.");
  }

  if (!body.eventType) {
    throw new Error("eventType is required.");
  }

  if (!body.eventName?.trim()) {
    throw new Error("eventName is required.");
  }

  if (!body.eventTimestamp?.trim() || Number.isNaN(Date.parse(body.eventTimestamp))) {
    throw new Error("eventTimestamp must be a valid ISO datetime string.");
  }

  return body;
}
