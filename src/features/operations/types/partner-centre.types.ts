import type { PartnerCentreSectionId } from "@/features/operations/config/partner-centre-sections";

export type PartnerCategory =
  | "finance-companies"
  | "banks"
  | "insurance-providers"
  | "warranty-providers"
  | "inspection-companies"
  | "roadside-assistance"
  | "vehicle-valuation-partners"
  | "logistics-companies"
  | "tracking-companies"
  | "oem-partners"
  | "advertising-partners"
  | "strategic-partners";

export type PartnerStatus =
  | "prospect"
  | "contacted"
  | "negotiating"
  | "onboarding"
  | "active"
  | "paused"
  | "inactive"
  | "suspended"
  | "archived";

export interface PartnerSummaryCard {
  readonly id: string;
  readonly label: string;
  readonly value: string;
  readonly detail: string;
  readonly availability: "live" | "unavailable";
}

export interface PartnerMetric {
  readonly id: string;
  readonly label: string;
  readonly value: string;
  readonly detail: string;
  readonly availability: "live" | "unavailable";
}

export interface PartnerContact {
  readonly id: string;
  readonly name: string;
  readonly role: string;
  readonly email: string;
  readonly telephone: string;
  readonly availability: "live" | "unavailable";
}

export interface PartnerLeadDistributionFramework {
  readonly leadRouting: string;
  readonly allocationRules: string;
  readonly priorityModel: string;
  readonly capacityModel: string;
  readonly availabilityModel: string;
  readonly performanceModel: string;
  readonly extensionPoints: readonly string[];
  readonly status: "framework" | "unavailable";
}

export interface PartnerIntegrationFramework {
  readonly apiStatus: string;
  readonly webhookReadiness: string;
  readonly integrationHealth: string;
  readonly lastSync: string;
  readonly version: string;
  readonly authenticationMethod: string;
  readonly status: "framework" | "unavailable";
}

export interface PartnerTimelineItem {
  readonly id: string;
  readonly partnerId: string;
  readonly partnerName: string;
  readonly eventType:
    | "created"
    | "updated"
    | "products-changed"
    | "contacts-changed"
    | "status-changed"
    | "performance-changed"
    | "integration-changed"
    | "note-added"
    | "audit";
  readonly message: string;
  readonly source: string;
  readonly actorType: string;
  readonly createdAt: string;
}

export interface PartnerAuditItem {
  readonly id: string;
  readonly partnerId: string;
  readonly action: string;
  readonly source: string;
  readonly actorType: string;
  readonly createdAt: string;
}

export interface PartnerProfile {
  readonly id: string;
  readonly name: string;
  readonly category: PartnerCategory;
  readonly categoryLabel: string;
  readonly status: PartnerStatus;
  readonly businessProfile: string;
  readonly products: readonly string[];
  readonly services: readonly string[];
  readonly coverageAreas: readonly string[];
  readonly territories: readonly string[];
  readonly contacts: readonly PartnerContact[];
  readonly relationshipOwner: string;
  readonly healthScore: string;
  readonly performance: readonly PartnerMetric[];
  readonly leadDistribution: PartnerLeadDistributionFramework;
  readonly integration: PartnerIntegrationFramework;
  readonly internalNotes: string;
  readonly timeline: readonly PartnerTimelineItem[];
  readonly sourceAvailability: "live" | "manual" | "unavailable";
}

export interface PartnerDirectoryRow {
  readonly id: string;
  readonly name: string;
  readonly category: PartnerCategory;
  readonly categoryLabel: string;
  readonly status: PartnerStatus;
  readonly relationshipOwner: string;
  readonly healthScore: string;
  readonly applicationsReceived: string;
  readonly revenueContribution: string;
  readonly integrationStatus: string;
  readonly updatedAt: string;
}

export interface PartnerCentreWorkspaceData {
  readonly generatedAt: string;
  readonly sectionId: PartnerCentreSectionId;
  readonly summaryCards: readonly PartnerSummaryCard[];
  readonly directory: readonly PartnerDirectoryRow[];
  readonly profiles: readonly PartnerProfile[];
  readonly timeline: readonly PartnerTimelineItem[];
  readonly audit: readonly PartnerAuditItem[];
  readonly sourceReadiness: readonly {
    readonly id: string;
    readonly label: string;
    readonly mode: "live" | "manual" | "unavailable";
    readonly detail: string;
  }[];
}

export type PartnerCentreActionType =
  | "create"
  | "edit"
  | "approve"
  | "suspend"
  | "restore"
  | "export"
  | "manage"
  | "add-note"
  | "change-status";

export interface PartnerCentreActionInput {
  readonly action: PartnerCentreActionType;
  readonly partnerId?: string;
  readonly status?: PartnerStatus;
  readonly note?: string;
  readonly actorId?: string;
  readonly actorName?: string;
}
