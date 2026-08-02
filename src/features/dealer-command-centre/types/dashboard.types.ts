export interface DashboardDealerProfile {
  readonly name: string;
  /** Null when no package is recorded — the field is omitted rather than filled with a placeholder. */
  readonly subscription: string | null;
  readonly profileCompletion: number;
  /** Null always, today: nothing records a sign-in timestamp. */
  readonly lastLogin: string | null;
}

export type DashboardAvailability = "live" | "unavailable";

export interface DashboardKpi {
  readonly id: string;
  readonly label: string;
  readonly value: string;
  readonly explanation: string;
  readonly icon: string;
  readonly availability?: DashboardAvailability;
  readonly trend: {
    readonly direction: "up" | "down" | "neutral";
    readonly label: string;
  };
}

export interface DashboardAiInsight {
  readonly id: string;
  readonly message: string;
  readonly priority: "high" | "medium" | "low";
}

export interface DashboardLead {
  readonly id: string;
  readonly buyer: string;
  readonly vehicle: string;
  readonly date: string;
  readonly status: "new" | "contacted" | "qualified" | "follow-up";
  readonly nextAction: string;
}

export interface DashboardInventoryItem {
  readonly id: string;
  readonly title: string;
  readonly meta: string;
  readonly category: "recent" | "photos" | "low-views" | "above-market" | "below-market" | "expiring";
}

export interface DashboardInventoryCategory {
  readonly id: DashboardInventoryItem["category"];
  readonly label: string;
  readonly availability: DashboardAvailability;
  readonly message?: string;
  readonly items: readonly DashboardInventoryItem[];
}

export interface DashboardTask {
  readonly id: string;
  readonly label: string;
  readonly completed: boolean;
  readonly priority: "high" | "medium" | "low";
}

export interface DashboardQuickAction {
  readonly id: string;
  readonly label: string;
  readonly icon: string;
  readonly href: string;
}

export interface DashboardHealthMetric {
  readonly id: string;
  readonly label: string;
  readonly value: string;
  readonly status: "good" | "warning" | "neutral";
  readonly availability?: DashboardAvailability;
}

export interface DashboardActivity {
  readonly id: string;
  readonly message: string;
  readonly timestamp: string;
  readonly type: "view" | "lead" | "save" | "price" | "promotion" | "expiry" | "publish" | "status" | "team";
}

export interface DashboardChartSeries {
  readonly id: string;
  readonly label: string;
  readonly values: readonly number[];
  readonly availability?: DashboardAvailability;
  readonly message?: string;
}

export interface DashboardLeadSourceMetric {
  readonly label: string;
  readonly value: number;
  readonly availability?: DashboardAvailability;
  readonly message?: string;
}

export interface DealerDashboardData {
  readonly dealer: DashboardDealerProfile;
  readonly kpis: readonly DashboardKpi[];
  readonly aiInsights: readonly DashboardAiInsight[];
  readonly leads: readonly DashboardLead[];
  readonly inventory: readonly DashboardInventoryCategory[];
  readonly tasks: readonly DashboardTask[];
  readonly quickActions: readonly DashboardQuickAction[];
  readonly health: readonly DashboardHealthMetric[];
  readonly recommendations: readonly string[];
  readonly activities: readonly DashboardActivity[];
  readonly charts: {
    readonly views: DashboardChartSeries;
    readonly enquiries: DashboardChartSeries;
    readonly conversions: DashboardChartSeries;
    readonly inventoryGrowth: DashboardChartSeries;
    readonly leadSources: readonly DashboardLeadSourceMetric[];
    readonly dailyTraffic: DashboardChartSeries;
    readonly monthlySales: DashboardChartSeries;
  };
}
