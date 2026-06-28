export type InventoryHealthLevel = "excellent" | "good" | "needs-attention" | "critical";

export type InventoryListingStatus = "live" | "draft" | "featured" | "expiring" | "sold";

export interface InventoryKpi {
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

export interface InventoryAiAlert {
  readonly id: string;
  readonly message: string;
  readonly severity: "high" | "medium" | "info";
}

export interface InventoryVehicle {
  readonly id: string;
  readonly stockNumber: string;
  readonly title: string;
  readonly imageSrc: string;
  readonly imagePosition: string;
  readonly price: string;
  readonly priceNumeric: number;
  readonly financeEstimate: string;
  readonly mileage: string;
  readonly year: number;
  readonly fuel: string;
  readonly transmission: string;
  readonly daysInStock: number;
  readonly views: number;
  readonly enquiries: number;
  readonly saves: number;
  readonly listingScore: number;
  readonly aiRating: "Strong" | "Fair" | "Weak" | "Critical";
  readonly health: InventoryHealthLevel;
  readonly status: InventoryListingStatus;
  readonly specs: readonly { readonly label: string; readonly value: string }[];
  readonly performanceMetrics: readonly { readonly label: string; readonly value: string }[];
  readonly listingQuality: readonly { readonly factor: string; readonly score: number; readonly max: number }[];
  readonly recentActivity: readonly { readonly event: string; readonly time: string }[];
  readonly priceHistory: readonly { readonly date: string; readonly price: string }[];
  readonly dealerNotes: string;
  readonly suggestedImprovements: readonly string[];
}

export interface InventoryRecommendedAction {
  readonly id: string;
  readonly label: string;
  readonly vehicleId?: string;
  readonly priority: "high" | "medium" | "low";
}

export interface InventoryChartSeries {
  readonly id: string;
  readonly label: string;
  readonly values: readonly number[];
}

export interface InventoryShowcaseData {
  readonly kpis: readonly InventoryKpi[];
  readonly alerts: readonly InventoryAiAlert[];
  readonly vehicles: readonly InventoryVehicle[];
  readonly recommendedActions: readonly InventoryRecommendedAction[];
  readonly charts: {
    readonly views: InventoryChartSeries;
    readonly enquiries: InventoryChartSeries;
    readonly conversion: InventoryChartSeries;
    readonly daysInStock: InventoryChartSeries;
    readonly priceTrends: InventoryChartSeries;
    readonly topPerformers: readonly { readonly title: string; readonly views: number }[];
    readonly slowMovers: readonly { readonly title: string; readonly days: number }[];
  };
}
