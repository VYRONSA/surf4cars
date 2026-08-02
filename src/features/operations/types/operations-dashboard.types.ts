export type OperationsWidgetAvailability = "live" | "unavailable";

export interface OperationsWidget {
  readonly id:
    | "dealer-applications"
    | "pending-dealer-approvals"
    | "active-dealers"
    | "published-vehicles"
    | "marketplace-health"
    | "todays-revenue"
    | "finance-applications"
    | "insurance-applications"
    | "warranty-applications"
    | "support-tickets"
    | "platform-alerts"
    | "ai-insights"
    | "worker-status"
    | "system-health";
  readonly label: string;
  readonly value: string;
  readonly availability: OperationsWidgetAvailability;
  readonly detail: string;
}

export interface OperationsRecentActivityItem {
  readonly id: string;
  readonly title: string;
  readonly timestamp: string;
  readonly source: string;
}

export interface OperationsDashboardData {
  readonly generatedAt: string;
  readonly widgets: readonly OperationsWidget[];
  readonly recentActivity: readonly OperationsRecentActivityItem[];
  readonly alerts: readonly string[];
}
