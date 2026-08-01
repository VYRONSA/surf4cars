import { analyzeListingQuality } from "@/features/intelligence/server/intelligence.service";
import { createSupabaseServerClient } from "@/lib/supabase";
import type {
  DailyIntelligenceBriefPayload,
  DealerBenchmarkingInput,
  DealerBenchmarkingResult,
  DemandAnalysisInput,
  DemandAnalysisResult,
  InventoryAgeingAttentionItem,
  InventoryAgeingIntelligenceInput,
  InventoryAgeingIntelligenceResult,
  MarketAnalyticsEventIngestResult,
  MarketAnalyticsEventInput,
  MarketDashboardPayload,
  MarketProviderState,
  MarketPulseInput,
  MarketPulseResult,
  PricePositionAnalysisInput,
  PricePositionAnalysisResult,
  SellingVelocityInput,
  SellingVelocityResult,
  SupplyAnalysisInput,
  SupplyAnalysisResult,
} from "@/features/market-intelligence/types/market-intelligence.types";

interface VehicleRow {
  readonly id: string;
  readonly dealership_id: string;
  readonly title: string;
  readonly make: string;
  readonly model: string;
  readonly year: number;
  readonly asking_price_cents: number;
  readonly currency: string;
  readonly lifecycle_status: string;
  readonly mileage_km: number;
  readonly vin: string;
  readonly registration_number: string;
  readonly description: string | null;
  readonly seo_title: string | null;
  readonly seo_description: string | null;
  readonly created_at: string;
  readonly sold_at: string | null;
}

interface MediaRow {
  readonly vehicle_id: string;
  readonly is_primary: boolean;
}

const LIVE_DATA_PENDING = "Awaiting live market data." as const;

function pendingProviderState(): MarketProviderState {
  return {
    provider: "none",
    readiness: "awaiting-live-market-data",
    message: LIVE_DATA_PENDING,
  };
}

async function fetchDealershipVehicles(dealershipId: string, accessToken?: string): Promise<readonly VehicleRow[]> {
  const supabase = createSupabaseServerClient(accessToken);
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { data, error } = await supabase
    .from("inventory_vehicles")
    .select("id, dealership_id, title, make, model, year, asking_price_cents, currency, lifecycle_status, mileage_km, vin, registration_number, description, seo_title, seo_description, created_at, sold_at")
    .eq("dealership_id", dealershipId)
    .neq("lifecycle_status", "archived");

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as VehicleRow[];
}

async function fetchDealershipMedia(dealershipId: string, accessToken?: string): Promise<readonly MediaRow[]> {
  const supabase = createSupabaseServerClient(accessToken);
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { data, error } = await supabase
    .from("inventory_vehicle_media")
    .select("vehicle_id, is_primary")
    .eq("dealership_id", dealershipId);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as MediaRow[];
}

function toCurrencyDisplay(valueCents: number): string {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    maximumFractionDigits: 0,
  }).format(valueCents / 100);
}

function averageDaysToSellFromSold(vehicles: readonly VehicleRow[]): number | null {
  const soldDurations = vehicles
    .filter((vehicle) => vehicle.sold_at)
    .map((vehicle) => {
      const start = Date.parse(vehicle.created_at);
      const end = Date.parse(vehicle.sold_at!);
      return Number.isFinite(start) && Number.isFinite(end) && end >= start
        ? Math.floor((end - start) / (1000 * 60 * 60 * 24))
        : null;
    })
    .filter((days): days is number => typeof days === "number");

  if (soldDurations.length === 0) {
    return null;
  }

  const total = soldDurations.reduce((sum, days) => sum + days, 0);
  return Math.round(total / soldDurations.length);
}

export async function getMarketDashboard(
  dealershipId: string,
  accessToken?: string,
): Promise<MarketDashboardPayload> {
  const vehicles = await fetchDealershipVehicles(dealershipId, accessToken);

  const inventoryValue = vehicles.reduce((sum, vehicle) => sum + Math.max(0, vehicle.asking_price_cents || 0), 0);
  const averageDaysToSell = averageDaysToSellFromSold(vehicles);

  return {
    dealershipId,
    generatedAt: new Date().toISOString(),
    metrics: [
      {
        id: "inventory-value",
        label: "Inventory Value",
        status: "available",
        value: inventoryValue,
        unit: "currency",
        displayValue: toCurrencyDisplay(inventoryValue),
        message: "Calculated from current inventory listings.",
      },
      {
        id: "market-position",
        label: "Market Position",
        status: "pending",
        value: null,
        unit: "text",
        displayValue: LIVE_DATA_PENDING,
        message: LIVE_DATA_PENDING,
      },
      {
        id: "supply-vs-demand",
        label: "Supply vs Demand",
        status: "pending",
        value: null,
        unit: "ratio",
        displayValue: LIVE_DATA_PENDING,
        message: LIVE_DATA_PENDING,
      },
      {
        id: "average-days-to-sell",
        label: "Average Days to Sell",
        status: averageDaysToSell === null ? "pending" : "available",
        value: averageDaysToSell,
        unit: "days",
        displayValue: averageDaysToSell === null ? LIVE_DATA_PENDING : `${averageDaysToSell} days`,
        message: averageDaysToSell === null
          ? LIVE_DATA_PENDING
          : "Derived from sold inventory records.",
      },
      {
        id: "price-confidence",
        label: "Price Confidence",
        status: "pending",
        value: null,
        unit: "score",
        displayValue: LIVE_DATA_PENDING,
        message: LIVE_DATA_PENDING,
      },
      {
        id: "vehicle-popularity",
        label: "Vehicle Popularity",
        status: "pending",
        value: null,
        unit: "score",
        displayValue: LIVE_DATA_PENDING,
        message: LIVE_DATA_PENDING,
      },
      {
        id: "buyer-demand",
        label: "Buyer Demand",
        status: "pending",
        value: null,
        unit: "score",
        displayValue: LIVE_DATA_PENDING,
        message: LIVE_DATA_PENDING,
      },
      {
        id: "market-trends",
        label: "Market Trends",
        status: "pending",
        value: null,
        unit: "text",
        displayValue: LIVE_DATA_PENDING,
        message: LIVE_DATA_PENDING,
      },
    ],
    feedReadiness: {
      internalAnalytics: "connected",
      marketplaceData: "awaiting",
      auctionFeeds: "awaiting",
      thirdPartyValuations: "awaiting",
    },
  };
}

export async function analyzePricePosition(
  input: PricePositionAnalysisInput,
): Promise<PricePositionAnalysisResult> {
  void input;
  return {
    status: "pending",
    marketPosition: LIVE_DATA_PENDING,
    confidence: LIVE_DATA_PENDING,
    providerState: pendingProviderState(),
  };
}

export async function analyzeDemand(
  input: DemandAnalysisInput,
): Promise<DemandAnalysisResult> {
  void input;
  return {
    status: "pending",
    buyerDemand: LIVE_DATA_PENDING,
    rationale: LIVE_DATA_PENDING,
    providerState: pendingProviderState(),
  };
}

export async function analyzeSupply(
  input: SupplyAnalysisInput,
): Promise<SupplyAnalysisResult> {
  void input;
  return {
    status: "pending",
    supplyTrend: LIVE_DATA_PENDING,
    rationale: LIVE_DATA_PENDING,
    providerState: pendingProviderState(),
  };
}

export async function analyzeSellingVelocity(
  input: SellingVelocityInput,
): Promise<SellingVelocityResult> {
  void input;
  return {
    status: "pending",
    averageDaysToSell: null,
    message: LIVE_DATA_PENDING,
    providerState: pendingProviderState(),
  };
}

export async function analyzeInventoryAgeing(
  input: InventoryAgeingIntelligenceInput,
  accessToken?: string,
): Promise<InventoryAgeingIntelligenceResult> {
  const vehicles = await fetchDealershipVehicles(input.dealershipId, accessToken);

  const requiringAttention: InventoryAgeingAttentionItem[] = vehicles
    .map((vehicle) => ({
      vehicleId: vehicle.id,
      title: vehicle.title,
      daysInStock: Math.max(0, Math.floor((Date.now() - Date.parse(vehicle.created_at)) / (1000 * 60 * 60 * 24))),
    }))
    .filter((vehicle) => vehicle.daysInStock > 45)
    .sort((a, b) => b.daysInStock - a.daysInStock)
    .slice(0, 10);

  return {
    status: "available",
    ageingThresholdDays: 45,
    requiringAttention,
    providerState: {
      provider: "internal",
      readiness: "ready",
      message: "Ageing intelligence active from inventory lifecycle records.",
    },
  };
}

export async function analyzeDealerBenchmarking(
  input: DealerBenchmarkingInput,
): Promise<DealerBenchmarkingResult> {
  void input;
  return {
    status: "pending",
    benchmarkSummary: LIVE_DATA_PENDING,
    providerState: pendingProviderState(),
  };
}

export async function analyzeMarketPulse(
  input: MarketPulseInput,
): Promise<MarketPulseResult> {
  void input;
  return {
    status: "pending",
    pulse: LIVE_DATA_PENDING,
    providerState: pendingProviderState(),
  };
}

export async function getDailyIntelligenceBrief(
  dealershipId: string,
  accessToken?: string,
): Promise<DailyIntelligenceBriefPayload> {
  const [vehicles, media] = await Promise.all([
    fetchDealershipVehicles(dealershipId, accessToken),
    fetchDealershipMedia(dealershipId, accessToken),
  ]);

  const mediaByVehicle = new Map<string, number>();
  for (const item of media) {
    mediaByVehicle.set(item.vehicle_id, (mediaByVehicle.get(item.vehicle_id) ?? 0) + 1);
  }

  const attentionList: string[] = [];

  for (const vehicle of vehicles.slice(0, 20)) {
    const quality = await analyzeListingQuality({
      listingId: vehicle.id,
      title: vehicle.title,
      description: vehicle.description ?? undefined,
      seoTitle: vehicle.seo_title ?? undefined,
      seoDescription: vehicle.seo_description ?? undefined,
      askingPriceCents: vehicle.asking_price_cents,
      currency: vehicle.currency,
      vin: vehicle.vin,
      registrationNumber: vehicle.registration_number,
      mileageKm: vehicle.mileage_km,
      photoCount: mediaByVehicle.get(vehicle.id) ?? 0,
      hasPrimaryPhoto: false,
      serviceHistoryAvailable: false,
    });

    if (quality.qualityScore < 70) {
      attentionList.push(`${vehicle.title} (${quality.qualityScore}/100 listing quality)`);
    }
  }

  const inventoryValue = vehicles.reduce((sum, vehicle) => sum + Math.max(0, vehicle.asking_price_cents || 0), 0);

  return {
    dealershipId,
    generatedAt: new Date().toISOString(),
    sections: [
      {
        id: "inventory-highlights",
        title: "Inventory Highlights",
        status: "available",
        message: "Calculated from active inventory data.",
        items: [
          `${vehicles.length} active vehicle listings`,
          `${toCurrencyDisplay(inventoryValue)} total inventory value`,
        ],
      },
      {
        id: "vehicles-requiring-attention",
        title: "Vehicles Requiring Attention",
        status: "available",
        message: attentionList.length > 0
          ? "Generated from listing quality thresholds."
          : "No vehicles currently below quality threshold.",
        items: attentionList,
      },
      {
        id: "market-opportunities",
        title: "Market Opportunities",
        status: "pending",
        message: LIVE_DATA_PENDING,
        items: [],
      },
      {
        id: "pricing-recommendations",
        title: "Pricing Recommendations",
        status: "pending",
        message: LIVE_DATA_PENDING,
        items: [],
      },
      {
        id: "dealer-performance",
        title: "Dealer Performance",
        status: "pending",
        message: LIVE_DATA_PENDING,
        items: [],
      },
      {
        id: "high-demand-segments",
        title: "High-Demand Segments",
        status: "pending",
        message: LIVE_DATA_PENDING,
        items: [],
      },
    ],
  };
}

export async function ingestAnalyticsEvent(
  input: MarketAnalyticsEventInput,
  accessToken?: string,
): Promise<MarketAnalyticsEventIngestResult> {
  const supabase = createSupabaseServerClient(accessToken);
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const eventId = crypto.randomUUID();

  const { error } = await supabase
    .from("market_analytics_events")
    .insert({
      id: eventId,
      dealership_id: input.dealershipId,
      vehicle_id: input.vehicleId ?? null,
      event_type: input.eventType,
      event_name: input.eventName,
      event_timestamp: input.eventTimestamp,
      actor_id: input.actorId ?? null,
      actor_type: input.actorType ?? "system",
      session_id: input.sessionId ?? null,
      source: input.source ?? "web",
      payload: input.payload ?? {},
      created_at: new Date().toISOString(),
    });

  if (error) {
    throw new Error(error.message);
  }

  return {
    ok: true,
    eventId,
  };
}
