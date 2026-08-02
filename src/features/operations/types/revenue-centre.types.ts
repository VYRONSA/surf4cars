import type { RevenueCentreSectionId } from "@/features/operations/config/revenue-centre-sections";

export interface RevenueSummaryCard {
  readonly id: string;
  readonly label: string;
  readonly value: string;
  readonly detail: string;
  readonly availability: "live" | "unavailable";
}

export interface SubscriptionRow {
  readonly packageId: string;
  readonly packageLabel: string;
  readonly dealerCount: number;
  readonly renewals: string;
  readonly expiries: string;
  readonly upgrades: string;
  readonly downgrades: string;
  readonly cancelled: string;
  readonly trials: number;
  readonly revenueByPackage: string;
  readonly availability: "live" | "unavailable";
}

export interface RevenueStreamRow {
  readonly id: string;
  readonly stream: string;
  readonly status: "live" | "unavailable";
  readonly value: string;
  readonly detail: string;
}

export interface DealerRevenueRow {
  readonly dealershipId: string;
  readonly dealershipName: string;
  readonly packageLabel: string;
  readonly spend: string;
  readonly invoices: string;
  readonly outstanding: string;
  readonly revenueTrend: string;
  readonly growth: string;
  readonly health: string;
}

export interface RevenueTimelineItem {
  readonly id: string;
  readonly eventName: string;
  readonly source: string;
  readonly actorType: string;
  readonly detail: string;
  readonly createdAt: string;
}

export interface RevenueAuditItem {
  readonly id: string;
  readonly action: string;
  readonly source: string;
  readonly actorType: string;
  readonly createdAt: string;
}

export interface RevenueCentreWorkspaceData {
  readonly generatedAt: string;
  readonly sectionId: RevenueCentreSectionId;
  readonly summaryCards: readonly RevenueSummaryCard[];
  readonly subscriptions: readonly SubscriptionRow[];
  readonly revenueStreams: readonly RevenueStreamRow[];
  readonly dealerRevenue: readonly DealerRevenueRow[];
  readonly outstandingRevenue: {
    readonly outstandingInvoices: string;
    readonly overdueSubscriptions: string;
    readonly pendingPayments: string;
    readonly collections: string;
    readonly paymentStatus: string;
    readonly availability: "unavailable";
  };
  readonly forecasting: readonly {
    readonly id: string;
    readonly label: string;
    readonly value: string;
    readonly detail: string;
    readonly availability: "live" | "unavailable";
  }[];
  readonly trends: readonly {
    readonly id: string;
    readonly label: string;
    readonly value: string;
    readonly detail: string;
    readonly availability: "live" | "unavailable";
  }[];
  readonly reports: readonly {
    readonly id: string;
    readonly name: string;
    readonly status: "ready" | "unavailable";
    readonly detail: string;
  }[];
  readonly timeline: readonly RevenueTimelineItem[];
  readonly audit: readonly RevenueAuditItem[];
  readonly sourceReadiness: readonly {
    readonly id: string;
    readonly label: string;
    readonly mode: "live" | "manual" | "unavailable";
    readonly detail: string;
  }[];
}

export type RevenueCentreActionType = "export" | "approve" | "refund" | "adjust";

export interface RevenueCentreActionInput {
  readonly action: RevenueCentreActionType;
  readonly referenceId?: string;
  readonly note?: string;
  readonly actorId?: string;
  readonly actorName?: string;
}
