import type { DealerManagementSectionId } from "@/features/operations/config/dealer-management-sections";

export interface DealerManagementSummaryCard {
  readonly id:
    | "pending-applications"
    | "approved-dealers"
    | "suspended-dealers"
    | "total-branches"
    | "total-users"
    | "monthly-revenue"
    | "health-distribution";
  readonly label: string;
  readonly value: string;
  readonly detail: string;
  readonly availability: "live" | "unavailable";
}

export interface DealerApplicationItem {
  readonly dealershipId: string;
  readonly dealershipName: string;
  readonly ownerUserId: string;
  readonly status: "pending" | "approved" | "rejected" | "under-review" | "verification-required" | "unavailable";
  readonly submittedAt: string;
  readonly branchCount: number;
  readonly note: string;
  readonly timelineHint: string;
}

export interface DealerOperationsDealershipRow {
  readonly id: string;
  readonly tradingName: string;
  readonly registrationNumber: string | null;
  readonly vatNumber: string | null;
  readonly city: string;
  readonly province: string;
  readonly status: string;
  readonly lifecycle: string;
  readonly subscription: string;
  readonly branchCount: number;
  readonly userCount: number;
  readonly healthScore: number | null;
}

export interface DealerOperationsBranchRow {
  readonly id: string;
  readonly dealershipId: string;
  readonly dealershipName: string;
  readonly name: string;
  readonly city: string;
  readonly province: string;
  readonly manager: string;
  readonly userCount: number;
  readonly inventoryCount: number;
}

export interface DealerOperationsUserRow {
  readonly id: string;
  readonly dealershipId: string;
  readonly dealershipName: string;
  readonly fullName: string;
  readonly email: string;
  readonly roleId: string;
  readonly status: string;
  readonly permissionsCount: number;
  readonly invitedAt: string;
}

export interface DealerPerformanceRow {
  readonly dealershipId: string;
  readonly dealershipName: string;
  readonly vehicles: number;
  readonly published: number;
  readonly sold: number;
  readonly reserved: number;
  readonly leads: number;
  readonly conversion: string;
  readonly responseTime: string;
  readonly inventoryQuality: string;
  readonly aiScore: string;
}

export interface DealerHealthRow {
  readonly dealershipId: string;
  readonly dealershipName: string;
  readonly healthScore: number;
  readonly risk: "low" | "medium" | "high";
  readonly missingInformation: readonly string[];
  readonly outstandingTasks: readonly string[];
}

export interface DealerTimelineEvent {
  readonly id: string;
  readonly timestamp: string;
  readonly title: string;
  readonly source: string;
  readonly dealershipId: string | null;
}

export interface DealerManagementData {
  readonly generatedAt: string;
  readonly summaryCards: readonly DealerManagementSummaryCard[];
  readonly recentDealerActivity: readonly DealerTimelineEvent[];
  readonly recentApplications: readonly DealerApplicationItem[];
  readonly aiRecommendations: readonly string[];
  readonly platformAlerts: readonly string[];
  readonly applications: readonly DealerApplicationItem[];
  readonly dealerships: readonly DealerOperationsDealershipRow[];
  readonly branches: readonly DealerOperationsBranchRow[];
  readonly users: readonly DealerOperationsUserRow[];
  readonly performance: readonly DealerPerformanceRow[];
  readonly health: readonly DealerHealthRow[];
  readonly timeline: readonly DealerTimelineEvent[];
  readonly notesAvailability: "unavailable";
  readonly documentsAvailability: "unavailable";
  readonly contractsAvailability: "unavailable";
  readonly subscriptionsAvailability: "partial";
  readonly billingAvailability: "unavailable";
}

export interface DealerManagementPageProps {
  readonly sectionId: DealerManagementSectionId;
}
