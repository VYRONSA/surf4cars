export type InventoryLifecycleStatus =
  | "draft"
  | "ai-review"
  | "ready-to-publish"
  | "published"
  | "reserved"
  | "performance-monitoring"
  | "sold"
  | "archived"
  | "deleted";

export type InventorySortKey =
  | "updated-at"
  | "listing-quality"
  | "price"
  | "days-to-sell"
  | "days-in-stock"
  | "created-at";

export interface InventoryVehicleListItem {
  readonly id: string;
  readonly dealershipId: string;
  readonly branchId: string;
  readonly stockNumber: string;
  readonly vin: string;
  readonly registrationNumber: string;
  readonly title: string;
  readonly make: string;
  readonly model: string;
  readonly year: number;
  readonly mileageKm: number;
  readonly askingPriceCents: number;
  readonly currency: string;
  readonly lifecycleStatus: InventoryLifecycleStatus;
  readonly listingQualityScore: number;
  readonly photoCount: number;
  readonly hasPrimaryPhoto: boolean;
  readonly hasDescription: boolean;
  readonly hasSeo: boolean;
  readonly requiresAttention: boolean;
  readonly daysInStock: number;
  readonly estimatedDaysToSell: number | null;
  readonly leadCount30d: number;
  readonly updatedAt: string;
  readonly createdAt: string;
}

export interface InventoryDashboardStats {
  readonly totalInventory: number;
  readonly draftListings: number;
  readonly publishedListings: number;
  readonly soldVehicles: number;
  readonly archivedVehicles: number;
  readonly requiringAttention: number;
}

export interface InventoryDashboardInsight {
  readonly id: string;
  readonly title: string;
  readonly count: number;
  readonly description: string;
  readonly action: string;
}

export interface InventoryRecentActivityItem {
  readonly id: string;
  readonly vehicleId: string;
  readonly actor: string;
  readonly eventType: string;
  readonly message: string;
  readonly createdAt: string;
}

export interface InventoryDashboardPayload {
  readonly stats: InventoryDashboardStats;
  readonly insights: readonly InventoryDashboardInsight[];
  readonly recentActivity: readonly InventoryRecentActivityItem[];
}

export interface InventoryListPayload {
  readonly items: readonly InventoryVehicleListItem[];
  readonly total: number;
  readonly page: number;
  readonly pageSize: number;
}

export interface InventoryListQuery {
  readonly dealershipId: string;
  readonly search?: string;
  readonly status?: InventoryLifecycleStatus;
  readonly sort?: InventorySortKey;
  readonly page?: number;
  readonly pageSize?: number;
}

export interface InventoryRecommendation {
  readonly id: string;
  readonly label: string;
  readonly impact: "quality" | "pricing" | "conversion" | "turnover";
}

export interface VehicleMarketIntelligence {
  readonly marketPosition: string;
  readonly estimatedDemand: string;
  readonly priceConfidence: string;
  readonly daysToSellEstimate: string;
  readonly marketTrend: string;
  readonly competitorComparison: string;
  readonly liveConnected: boolean;
  readonly label: string;
}

export interface VehicleWorkspacePhoto {
  readonly id: string;
  readonly url: string;
  readonly isPrimary: boolean;
  readonly sortOrder: number;
  readonly qualityStatus: "good" | "review" | "poor";
  readonly processingStatus: "uploaded" | "processing" | "ready";
}

export interface VehicleWorkspaceDocument {
  readonly id: string;
  readonly type:
    | "registration-papers"
    | "service-history"
    | "roadworthy-certificate"
    | "finance-settlement"
    | "warranty"
    | "inspection-report";
  readonly fileName: string;
  readonly fileUrl: string;
  readonly uploadedAt: string;
  readonly uploadedBy: string;
}

export interface VehicleWorkspacePricePoint {
  readonly id: string;
  readonly priceCents: number;
  readonly reason: string;
  readonly changedAt: string;
  readonly changedBy: string;
}

export interface VehicleWorkspaceHistoryEntry {
  readonly id: string;
  readonly eventType: string;
  readonly message: string;
  readonly createdAt: string;
}

export interface VehicleWorkspaceAuditEntry {
  readonly id: string;
  readonly actorId: string;
  readonly actorType: "user" | "system";
  readonly action: string;
  readonly payload: string;
  readonly createdAt: string;
}

export interface VehicleWorkspacePayload {
  readonly vehicle: InventoryVehicleListItem;
  readonly recommendations: readonly InventoryRecommendation[];
  readonly marketIntelligence: VehicleMarketIntelligence;
  readonly photos: readonly VehicleWorkspacePhoto[];
  readonly documents: readonly VehicleWorkspaceDocument[];
  readonly pricingHistory: readonly VehicleWorkspacePricePoint[];
  readonly history: readonly VehicleWorkspaceHistoryEntry[];
  readonly auditTrail: readonly VehicleWorkspaceAuditEntry[];
}

export interface BulkInventoryActionRequest {
  readonly dealershipId: string;
  readonly vehicleIds: readonly string[];
  readonly action: "archive" | "restore" | "mark-ai-review" | "mark-ready";
}
