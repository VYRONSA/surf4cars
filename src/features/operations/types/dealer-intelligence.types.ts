import type { DealerIntelligenceSectionId } from "@/features/operations/config/dealer-intelligence-sections";

export type DealerIntelligenceQueueStatus =
  | "new"
  | "under-review"
  | "verified"
  | "rejected"
  | "duplicate"
  | "archived";

export type DealerIntelligenceVerificationStatus =
  | "verified"
  | "needs-review"
  | "pending"
  | "rejected"
  | "duplicate";

export type DealerIntelligenceSourceMode = "live" | "manual" | "unavailable";

export interface DealerIntelligenceSourceReadiness {
  readonly id: string;
  readonly label: string;
  readonly mode: DealerIntelligenceSourceMode;
  readonly detail: string;
}

export interface DealerIntelligenceProfileTimelineItem {
  readonly id: string;
  readonly timestamp: string;
  readonly title: string;
  readonly source: string;
}

export interface DealerIntelligenceKnownBranch {
  readonly id: string;
  readonly name: string;
  readonly city: string;
  readonly province: string;
  readonly sourceMode: DealerIntelligenceSourceMode;
}

export interface DealerIntelligenceKnownContact {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly telephone: string | null;
  readonly role: string;
  readonly sourceMode: DealerIntelligenceSourceMode;
}

export interface DealerIntelligenceProfile {
  readonly dealershipId: string;
  readonly dealershipName: string;
  readonly businessDetails: {
    readonly registrationNumber: string | null;
    readonly vatNumber: string | null;
    readonly city: string;
    readonly province: string;
    readonly address: string;
  };
  readonly knownBrands: readonly string[];
  readonly knownBranches: readonly DealerIntelligenceKnownBranch[];
  readonly knownContacts: readonly DealerIntelligenceKnownContact[];
  readonly knownWebsite: string | null;
  readonly queueStatus: DealerIntelligenceQueueStatus;
  readonly verificationStatus: DealerIntelligenceVerificationStatus;
  readonly dataQualityScore: number;
  readonly missingFields: readonly string[];
  readonly lastReviewed: string;
  readonly internalNotes: string | null;
  readonly operationsOwner: string;
  readonly timeline: readonly DealerIntelligenceProfileTimelineItem[];
}

export interface DealerIntelligenceQueueItem {
  readonly dealershipId: string;
  readonly dealershipName: string;
  readonly city: string;
  readonly province: string;
  readonly status: DealerIntelligenceQueueStatus;
  readonly verificationStatus: DealerIntelligenceVerificationStatus;
  readonly dataQualityScore: number;
  readonly lastReviewed: string;
  readonly operationsOwner: string;
}

export interface DealerIntelligenceBranchDiscoveryItem {
  readonly branchId: string;
  readonly dealershipId: string;
  readonly dealershipName: string;
  readonly branchName: string;
  readonly city: string;
  readonly province: string;
  readonly sourceMode: DealerIntelligenceSourceMode;
}

export interface DealerIntelligenceBrandDetectionItem {
  readonly dealershipId: string;
  readonly dealershipName: string;
  readonly brands: readonly string[];
  readonly sourceMode: DealerIntelligenceSourceMode;
  readonly detail: string;
}

export interface DealerIntelligenceContactDiscoveryItem {
  readonly dealershipId: string;
  readonly dealershipName: string;
  readonly contactCount: number;
  readonly hasPhone: boolean;
  readonly hasEmail: boolean;
  readonly sourceMode: DealerIntelligenceSourceMode;
}

export interface DealerIntelligenceWebsiteAnalysisItem {
  readonly dealershipId: string;
  readonly dealershipName: string;
  readonly website: string | null;
  readonly status: "known" | "missing";
  readonly sourceMode: DealerIntelligenceSourceMode;
  readonly detail: string;
}

export interface DealerIntelligenceAiClassificationItem {
  readonly dealershipId: string;
  readonly dealershipName: string;
  readonly classification: "ready" | "needs-enrichment" | "duplicate-risk";
  readonly confidenceLabel: string;
  readonly provider: string;
  readonly providerMode: DealerIntelligenceSourceMode;
  readonly detail: string;
}

export interface DealerIntelligenceDuplicateGroup {
  readonly key: string;
  readonly reason: "registration-number";
  readonly dealershipIds: readonly string[];
  readonly dealershipNames: readonly string[];
  readonly status: "pending" | "confirmed";
}

export interface DealerIntelligenceChangeItem {
  readonly id: string;
  readonly dealershipId: string;
  readonly dealershipName: string;
  readonly changedAt: string;
  readonly source: string;
  readonly changeType: string;
  readonly summary: string;
}

export interface DealerIntelligenceActivityItem {
  readonly id: string;
  readonly dealershipId: string;
  readonly dealershipName: string;
  readonly eventName: string;
  readonly eventAt: string;
  readonly source: string;
  readonly actorType: string;
}

export interface DealerIntelligenceOverviewCard {
  readonly id: string;
  readonly label: string;
  readonly value: string;
  readonly detail: string;
  readonly availability: "live" | "manual" | "unavailable";
}

export interface DealerIntelligenceWorkspaceData {
  readonly generatedAt: string;
  readonly overviewCards: readonly DealerIntelligenceOverviewCard[];
  readonly sourceReadiness: readonly DealerIntelligenceSourceReadiness[];
  readonly profiles: readonly DealerIntelligenceProfile[];
  readonly queue: readonly DealerIntelligenceQueueItem[];
  readonly branches: readonly DealerIntelligenceBranchDiscoveryItem[];
  readonly brandDetections: readonly DealerIntelligenceBrandDetectionItem[];
  readonly contactDiscoveries: readonly DealerIntelligenceContactDiscoveryItem[];
  readonly websiteAnalysis: readonly DealerIntelligenceWebsiteAnalysisItem[];
  readonly aiClassifications: readonly DealerIntelligenceAiClassificationItem[];
  readonly duplicateGroups: readonly DealerIntelligenceDuplicateGroup[];
  readonly changeMonitoring: readonly DealerIntelligenceChangeItem[];
  readonly activity: readonly DealerIntelligenceActivityItem[];
}

export interface DealerIntelligencePageProps {
  readonly sectionId: DealerIntelligenceSectionId;
}

export interface DealerIntelligenceReviewUpdateInput {
  readonly dealershipId: string;
  readonly queueStatus?: DealerIntelligenceQueueStatus;
  readonly verificationStatus?: DealerIntelligenceVerificationStatus;
  readonly internalNotes?: string | null;
  readonly operationsOwner?: string;
}
