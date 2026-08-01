export { MarketIntelligencePage } from "@/features/market-intelligence/market-intelligence-page";

export {
  analyzeDealerBenchmarking,
  analyzeDemand,
  analyzeInventoryAgeing,
  analyzeMarketPulse,
  analyzePricePosition,
  analyzeSellingVelocity,
  analyzeSupply,
  getDailyIntelligenceBrief,
  getMarketDashboard,
  ingestAnalyticsEvent,
} from "@/features/market-intelligence/server/market-intelligence.service";

export type {
  DailyIntelligenceBriefPayload,
  DealerBenchmarkingInput,
  DealerBenchmarkingResult,
  DemandAnalysisInput,
  DemandAnalysisResult,
  InventoryAgeingIntelligenceInput,
  InventoryAgeingIntelligenceResult,
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
