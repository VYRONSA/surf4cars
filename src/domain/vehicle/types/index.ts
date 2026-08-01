export type {
  VehicleCondition,
  DriveType,
  VehicleSpecificationEntry,
  VehicleSpecGroup,
  VehicleFeatureEntry,
  VehicleCore,
} from "./vehicle-core.types";

export type { VehicleDealerData } from "./vehicle-dealer.types";
export {
  DEALER_VERIFICATION_STATUSES,
  describeVerificationForCustomer,
  describeVerificationForOperations,
  isDealerVerificationStatus,
  isVerifiedDealer,
  toDealerVerificationStatus,
} from "./dealer-verification.types";
export type { DealerVerificationStatus } from "./dealer-verification.types";

export type {
  VehiclePriceHistoryEntry,
  VehiclePricingData,
} from "./vehicle-pricing.types";

export type {
  MarketingChannel,
  VehicleMarketingChannelState,
  VehicleMarketingData,
} from "./vehicle-marketing.types";

export { MARKETING_CHANNELS } from "./vehicle-marketing.types";

export type {
  VehicleHealthLevel,
  VehicleAiRating,
  VehicleAiScores,
  VehicleAiInsightEntry,
  VehicleAiData,
} from "./vehicle-ai.types";

export type {
  VehicleMediaKind,
  VehiclePhotoCategory,
  VehicleMediaAsset,
  VehicleMediaBundle,
} from "./vehicle-media.types";

export type {
  VehicleActivityEntry,
  VehicleEngagementMetrics,
  VehicleTrustIndicator,
  VehicleHistoryData,
} from "./vehicle-history.types";

export type {
  UnifiedVehicleRecord,
  UnifiedVehicleSummary,
} from "./unified-vehicle.types";

export type {
  VehicleSearchFilters,
  VehicleSearchSortField,
  VehicleSearchQuery,
  VehicleSearchDocument,
  VehicleSearchResult,
} from "./vehicle-search.types";
