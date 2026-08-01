/**
 * Canonical vehicle lifecycle states for the Unified Vehicle Intelligence Engine.
 */
export const VEHICLE_STATUS = {
  DRAFT: "draft",
  AI_REVIEW: "ai-review",
  READY_TO_PUBLISH: "ready-to-publish",
  READY: "ready",
  PUBLISHED: "published",
  PERFORMANCE_MONITORING: "performance-monitoring",
  FEATURED: "featured",
  RESERVED: "reserved",
  SOLD: "sold",
  ARCHIVED: "archived",
  DELETED: "deleted",
} as const;

export type VehicleStatus = (typeof VEHICLE_STATUS)[keyof typeof VEHICLE_STATUS];

export const PUBLISHABLE_VEHICLE_STATUSES: readonly VehicleStatus[] = [
  VEHICLE_STATUS.PUBLISHED,
  VEHICLE_STATUS.FEATURED,
  VEHICLE_STATUS.RESERVED,
] as const;

export const DEALER_VISIBLE_VEHICLE_STATUSES: readonly VehicleStatus[] = [
  VEHICLE_STATUS.DRAFT,
  VEHICLE_STATUS.AI_REVIEW,
  VEHICLE_STATUS.READY_TO_PUBLISH,
  VEHICLE_STATUS.READY,
  VEHICLE_STATUS.PUBLISHED,
  VEHICLE_STATUS.PERFORMANCE_MONITORING,
  VEHICLE_STATUS.FEATURED,
  VEHICLE_STATUS.RESERVED,
  VEHICLE_STATUS.SOLD,
  VEHICLE_STATUS.ARCHIVED,
] as const;

export interface VehicleStatusData {
  readonly current: VehicleStatus;
  readonly previous?: VehicleStatus;
  readonly publishedAt?: string;
  readonly soldAt?: string;
  readonly archivedAt?: string;
  readonly featuredUntil?: string;
  readonly availabilityLabel: string;
}
