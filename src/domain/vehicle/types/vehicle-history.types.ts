export interface VehicleActivityEntry {
  readonly id: string;
  readonly event: string;
  readonly timestamp: string;
  readonly type: "view" | "lead" | "save" | "price" | "promotion" | "expiry" | "status" | "note";
}

export interface VehicleEngagementMetrics {
  readonly views: number;
  readonly enquiries: number;
  readonly saves: number;
  readonly daysInStock: number;
  readonly conversionRate?: number;
}

export interface VehicleTrustIndicator {
  readonly id: string;
  readonly label: string;
  readonly description: string;
}

export interface VehicleHistoryData {
  readonly engagement: VehicleEngagementMetrics;
  readonly activity: readonly VehicleActivityEntry[];
  readonly trustIndicators: readonly VehicleTrustIndicator[];
  readonly similarVehicleIds: readonly string[];
}
