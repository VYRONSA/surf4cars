export interface DashboardDealerProfile {
  readonly name: string;
  readonly subscription: string;
  readonly profileCompletion: number;
  readonly lastLogin: string;
}

export interface DashboardKpi {
  readonly id: string;
  readonly label: string;
  readonly value: string;
  readonly explanation: string;
  readonly icon: string;
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
}

export interface DashboardActivity {
  readonly id: string;
  readonly message: string;
  readonly timestamp: string;
  readonly type: "view" | "lead" | "save" | "price" | "promotion" | "expiry";
}

export interface DashboardChartSeries {
  readonly id: string;
  readonly label: string;
  readonly values: readonly number[];
}

export interface DashboardShowcaseData {
  readonly dealer: DashboardDealerProfile;
  readonly kpis: readonly DashboardKpi[];
  readonly aiInsights: readonly DashboardAiInsight[];
  readonly leads: readonly DashboardLead[];
  readonly inventory: readonly DashboardInventoryItem[];
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
    readonly leadSources: readonly { readonly label: string; readonly value: number }[];
    readonly dailyTraffic: DashboardChartSeries;
    readonly monthlySales: DashboardChartSeries;
  };
}
