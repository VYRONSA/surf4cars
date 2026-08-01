export type MarketDataStatus = "pending" | "available";

export interface MarketProviderState {
  readonly provider: "internal" | "none" | "external";
  readonly readiness: "ready" | "awaiting-live-market-data";
  readonly message: string;
}

export interface MarketMetric {
  readonly id:
    | "inventory-value"
    | "market-position"
    | "supply-vs-demand"
    | "average-days-to-sell"
    | "price-confidence"
    | "vehicle-popularity"
    | "buyer-demand"
    | "market-trends";
  readonly label: string;
  readonly status: MarketDataStatus;
  readonly value: number | null;
  readonly unit: "currency" | "days" | "score" | "count" | "ratio" | "text";
  readonly displayValue: string;
  readonly message: string;
}

export interface MarketFeedReadiness {
  readonly internalAnalytics: "connected" | "awaiting";
  readonly marketplaceData: "connected" | "awaiting";
  readonly auctionFeeds: "connected" | "awaiting";
  readonly thirdPartyValuations: "connected" | "awaiting";
}

export interface MarketDashboardPayload {
  readonly dealershipId: string;
  readonly generatedAt: string;
  readonly metrics: readonly MarketMetric[];
  readonly feedReadiness: MarketFeedReadiness;
}

export interface PricePositionAnalysisInput {
  readonly dealershipId: string;
  readonly vehicleId?: string;
  readonly make?: string;
  readonly model?: string;
  readonly year?: number;
  readonly askingPriceCents?: number;
}

export interface PricePositionAnalysisResult {
  readonly status: "pending";
  readonly marketPosition: "Awaiting live market data.";
  readonly confidence: "Awaiting live market data.";
  readonly providerState: MarketProviderState;
}

export interface DemandAnalysisInput {
  readonly dealershipId: string;
  readonly make?: string;
  readonly model?: string;
  readonly segment?: string;
}

export interface DemandAnalysisResult {
  readonly status: "pending";
  readonly buyerDemand: "Awaiting live market data.";
  readonly rationale: "Awaiting live market data.";
  readonly providerState: MarketProviderState;
}

export interface SupplyAnalysisInput {
  readonly dealershipId: string;
  readonly make?: string;
  readonly model?: string;
  readonly segment?: string;
}

export interface SupplyAnalysisResult {
  readonly status: "pending";
  readonly supplyTrend: "Awaiting live market data.";
  readonly rationale: "Awaiting live market data.";
  readonly providerState: MarketProviderState;
}

export interface SellingVelocityInput {
  readonly dealershipId: string;
  readonly vehicleId?: string;
  readonly segment?: string;
}

export interface SellingVelocityResult {
  readonly status: "pending";
  readonly averageDaysToSell: null;
  readonly message: "Awaiting live market data.";
  readonly providerState: MarketProviderState;
}

export interface InventoryAgeingIntelligenceInput {
  readonly dealershipId: string;
}

export interface InventoryAgeingAttentionItem {
  readonly vehicleId: string;
  readonly title: string;
  readonly daysInStock: number;
}

export interface InventoryAgeingIntelligenceResult {
  readonly status: "available";
  readonly ageingThresholdDays: number;
  readonly requiringAttention: readonly InventoryAgeingAttentionItem[];
  readonly providerState: MarketProviderState;
}

export interface DealerBenchmarkingInput {
  readonly dealershipId: string;
}

export interface DealerBenchmarkingResult {
  readonly status: "pending";
  readonly benchmarkSummary: "Awaiting live market data.";
  readonly providerState: MarketProviderState;
}

export interface MarketPulseInput {
  readonly dealershipId: string;
}

export interface MarketPulseResult {
  readonly status: "pending";
  readonly pulse: "Awaiting live market data.";
  readonly providerState: MarketProviderState;
}

export interface DailyBriefSection {
  readonly id:
    | "inventory-highlights"
    | "vehicles-requiring-attention"
    | "market-opportunities"
    | "pricing-recommendations"
    | "dealer-performance"
    | "high-demand-segments";
  readonly title: string;
  readonly status: MarketDataStatus;
  readonly message: string;
  readonly items: readonly string[];
}

export interface DailyIntelligenceBriefPayload {
  readonly dealershipId: string;
  readonly generatedAt: string;
  readonly sections: readonly DailyBriefSection[];
}

export type MarketAnalyticsEventType =
  | "listing-view"
  | "search-behaviour"
  | "enquiry"
  | "price-change"
  | "inventory-ageing"
  | "conversion-event";

export interface MarketAnalyticsEventInput {
  readonly dealershipId: string;
  readonly vehicleId?: string;
  readonly eventType: MarketAnalyticsEventType;
  readonly eventName: string;
  readonly eventTimestamp: string;
  readonly actorId?: string;
  readonly actorType?: "buyer" | "dealer" | "system";
  readonly sessionId?: string;
  readonly source?: string;
  readonly payload?: Record<string, unknown>;
}

export interface MarketAnalyticsEventIngestResult {
  readonly ok: true;
  readonly eventId: string;
}
