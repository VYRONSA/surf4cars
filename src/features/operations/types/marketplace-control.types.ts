import type { MarketplaceControlSectionId } from "@/features/operations/config/marketplace-control-sections";

export type MarketplaceApprovalStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "needs-review"
  | "returned-to-dealer"
  | "archived";

export type MarketplaceQueuePriority = "low" | "medium" | "high" | "urgent";

export interface MarketplaceControlSummaryCard {
  readonly id: string;
  readonly label: string;
  readonly value: string;
  readonly detail: string;
  readonly availability: "live" | "coming-soon";
}

export interface MarketplaceApprovalQueueItem {
  readonly id: string;
  readonly vehicleId: string;
  readonly dealershipId: string;
  readonly dealershipName: string;
  readonly title: string;
  readonly make: string;
  readonly model: string;
  readonly year: number;
  readonly vin: string;
  readonly registrationNumber: string;
  readonly lifecycleStatus: string;
  readonly approvalStatus: MarketplaceApprovalStatus;
  readonly priority: MarketplaceQueuePriority;
  readonly qualityScore: number;
  readonly photoCount: number;
  readonly hasPrimaryPhoto: boolean;
  readonly hasDescription: boolean;
  readonly hasSeo: boolean;
  readonly requiresAttention: boolean;
  readonly assignedToUserId: string | null;
  readonly assignedToName: string | null;
  readonly updatedAt: string;
  readonly createdAt: string;
}

export interface ListingQualityItem {
  readonly vehicleId: string;
  readonly dealershipId: string;
  readonly title: string;
  readonly qualityScore: number;
  readonly missingPhotos: boolean;
  readonly missingInformation: boolean;
  readonly lowQualityDescription: boolean;
  readonly pricingWarning: boolean;
  readonly aiRecommendations: readonly string[];
}

export interface DuplicateListingGroup {
  readonly id: string;
  readonly type: "vin" | "registration" | "dealer-fingerprint" | "vehicle-fingerprint";
  readonly key: string;
  readonly vehicleIds: readonly string[];
  readonly dealershipIds: readonly string[];
  readonly availability: "live" | "coming-soon";
}

export interface FraudReviewItem {
  readonly id: string;
  readonly category: "flagged-dealer" | "flagged-listing" | "suspicious-activity" | "manual-review";
  readonly status: string;
  readonly detail: string;
  readonly createdAt: string;
}

export interface AiModerationItem {
  readonly vehicleId: string;
  readonly title: string;
  readonly contentReview: "ready" | "needs-review" | "coming-soon";
  readonly descriptionReview: "ready" | "needs-review" | "coming-soon";
  readonly pricingReview: "ready" | "coming-soon";
  readonly listingQualityScore: number;
  readonly moderationStatus: "ready" | "needs-review" | "coming-soon";
}

export interface ImageReviewItem {
  readonly vehicleId: string;
  readonly title: string;
  readonly imageCount: number;
  readonly hasPrimaryImage: boolean;
  readonly quality: "good" | "review" | "poor" | "coming-soon";
  readonly duplicateImages: "none" | "possible" | "coming-soon";
  readonly missingImages: boolean;
  readonly moderationAvailability: "coming-soon";
}

export interface DealerQualityItem {
  readonly dealershipId: string;
  readonly dealershipName: string;
  readonly dealerQualityScore: number | null;
  readonly listingCompliance: string;
  readonly outstandingIssues: readonly string[];
  readonly warnings: readonly string[];
  readonly recommendations: readonly string[];
}

export interface MarketplaceHealthSnapshot {
  readonly published: number;
  readonly drafts: number;
  readonly reserved: number;
  readonly sold: number;
  readonly archived: number;
  readonly averageListingQuality: number | null;
  readonly listingsRequiringAttention: number;
  readonly dealerHealth: string;
  readonly marketplaceAlerts: number;
}

export interface MarketplaceControlTimelineItem {
  readonly id: string;
  readonly eventName: string;
  readonly source: string;
  readonly actorType: string;
  readonly actorId: string | null;
  readonly detail: string;
  readonly createdAt: string;
}

export interface MarketplaceControlAuditItem {
  readonly id: string;
  readonly action: string;
  readonly source: string;
  readonly actorType: string;
  readonly createdAt: string;
}

export interface MarketplaceAlertItem {
  readonly id: string;
  readonly severity: "info" | "warning" | "critical";
  readonly title: string;
  readonly detail: string;
  readonly availability: "live" | "coming-soon";
}

export interface MarketplaceControlWorkspaceData {
  readonly generatedAt: string;
  readonly sectionId: MarketplaceControlSectionId;
  readonly summaryCards: readonly MarketplaceControlSummaryCard[];
  readonly approvalQueue: readonly MarketplaceApprovalQueueItem[];
  readonly health: MarketplaceHealthSnapshot;
  readonly listingQuality: readonly ListingQualityItem[];
  readonly duplicateGroups: readonly DuplicateListingGroup[];
  readonly fraudReview: readonly FraudReviewItem[];
  readonly aiModeration: readonly AiModerationItem[];
  readonly imageReview: readonly ImageReviewItem[];
  readonly dealerQuality: readonly DealerQualityItem[];
  readonly alerts: readonly MarketplaceAlertItem[];
  readonly timeline: readonly MarketplaceControlTimelineItem[];
  readonly audit: readonly MarketplaceControlAuditItem[];
  readonly sourceReadiness: readonly {
    readonly id: string;
    readonly label: string;
    readonly mode: "live" | "manual" | "coming-soon";
    readonly detail: string;
  }[];
}

export type MarketplaceControlActionType =
  | "assign"
  | "approve"
  | "reject"
  | "needs-review"
  | "return-to-dealer"
  | "archive"
  | "export";

export interface MarketplaceControlActionInput {
  readonly vehicleId: string;
  readonly action: MarketplaceControlActionType;
  readonly assignedToUserId?: string;
  readonly assignedToName?: string;
  readonly note?: string;
  readonly priority?: MarketplaceQueuePriority;
  readonly actorId?: string;
  readonly actorName?: string;
}
