import type {
  DailyIntelligenceBriefPayload,
  DealerBenchmarkingInput,
  DealerBenchmarkingResult,
  DemandAnalysisInput,
  DemandAnalysisResult,
  InventoryAgeingIntelligenceInput,
  InventoryAgeingIntelligenceResult,
  MarketAnalyticsEventIngestResult,
  MarketAnalyticsEventInput,
  MarketDashboardPayload,
  MarketPulseInput,
  MarketPulseResult,
  PricePositionAnalysisInput,
  PricePositionAnalysisResult,
  SellingVelocityInput,
  SellingVelocityResult,
  SupplyAnalysisInput,
  SupplyAnalysisResult,
} from "@/features/market-intelligence/types/market-intelligence.types";

interface ApiError {
  readonly error?: string;
}

async function parseResponse<T>(response: Response, fallback: string): Promise<T> {
  const payload = (await response.json().catch(() => null)) as ApiError | T | null;
  if (!response.ok) {
    const message = payload && typeof payload === "object" && "error" in payload
      ? (payload as ApiError).error
      : undefined;
    throw new Error(message ?? fallback);
  }

  return payload as T;
}

export async function getMarketDashboard(dealershipId: string): Promise<MarketDashboardPayload> {
  const response = await fetch(`/api/v1/market/dashboard?dealershipId=${encodeURIComponent(dealershipId)}`, {
    cache: "no-store",
  });

  return parseResponse<MarketDashboardPayload>(response, "Failed to load market dashboard.");
}

export async function getDailyIntelligenceBrief(dealershipId: string): Promise<DailyIntelligenceBriefPayload> {
  const response = await fetch(`/api/v1/market/daily-brief?dealershipId=${encodeURIComponent(dealershipId)}`, {
    cache: "no-store",
  });

  return parseResponse<DailyIntelligenceBriefPayload>(response, "Failed to load daily intelligence brief.");
}

async function postJson<T>(path: string, payload: unknown, fallback: string): Promise<T> {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return parseResponse<T>(response, fallback);
}

export function runPricePositionAnalysis(payload: PricePositionAnalysisInput): Promise<PricePositionAnalysisResult> {
  return postJson<PricePositionAnalysisResult>("/api/v1/market/price-position", payload, "Failed price position analysis.");
}

export function runDemandAnalysis(payload: DemandAnalysisInput): Promise<DemandAnalysisResult> {
  return postJson<DemandAnalysisResult>("/api/v1/market/demand", payload, "Failed demand analysis.");
}

export function runSupplyAnalysis(payload: SupplyAnalysisInput): Promise<SupplyAnalysisResult> {
  return postJson<SupplyAnalysisResult>("/api/v1/market/supply", payload, "Failed supply analysis.");
}

export function runSellingVelocityAnalysis(payload: SellingVelocityInput): Promise<SellingVelocityResult> {
  return postJson<SellingVelocityResult>("/api/v1/market/selling-velocity", payload, "Failed selling velocity analysis.");
}

export function runInventoryAgeingIntelligence(payload: InventoryAgeingIntelligenceInput): Promise<InventoryAgeingIntelligenceResult> {
  return postJson<InventoryAgeingIntelligenceResult>("/api/v1/market/inventory-ageing", payload, "Failed inventory ageing analysis.");
}

export function runDealerBenchmarking(payload: DealerBenchmarkingInput): Promise<DealerBenchmarkingResult> {
  return postJson<DealerBenchmarkingResult>("/api/v1/market/dealer-benchmarking", payload, "Failed dealer benchmarking.");
}

export function runMarketPulse(payload: MarketPulseInput): Promise<MarketPulseResult> {
  return postJson<MarketPulseResult>("/api/v1/market/market-pulse", payload, "Failed market pulse analysis.");
}

export function ingestMarketAnalyticsEvent(payload: MarketAnalyticsEventInput): Promise<MarketAnalyticsEventIngestResult> {
  return postJson<MarketAnalyticsEventIngestResult>("/api/v1/market/events", payload, "Failed to ingest analytics event.");
}
