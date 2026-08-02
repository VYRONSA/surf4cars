import { getDealerIntelligenceWorkspaceData } from "@/features/operations/server/dealer-intelligence.service";
import { getDealerManagementData } from "@/features/operations/server/dealer-management.service";
import { logOperationsAuditEvent } from "@/features/operations/server/operations-audit.service";
import type { MarketplaceControlSectionId } from "@/features/operations/config/marketplace-control-sections";
import type {
  MarketplaceApprovalQueueItem,
  MarketplaceApprovalStatus,
  MarketplaceControlActionInput,
  MarketplaceControlTimelineItem,
  MarketplaceControlWorkspaceData,
  MarketplaceQueuePriority,
  ImageReviewItem,
} from "@/features/operations/types/marketplace-control.types";
import {
  listInventoryVehicles,
  updateVehicleLifecycleStatus,
} from "@/features/inventory/server/inventory-intelligence.service";
import { readPlatformStore } from "@/lib/local-persistence/platform-store";

interface DerivedReviewState {
  readonly status: MarketplaceApprovalStatus | null;
  readonly assignedToUserId: string | null;
  readonly assignedToName: string | null;
  readonly priority: MarketplaceQueuePriority | null;
  readonly updatedAt: string | null;
}

function mapLifecycleToApprovalStatus(lifecycleStatus: string): MarketplaceApprovalStatus {
  if (lifecycleStatus === "published" || lifecycleStatus === "reserved" || lifecycleStatus === "performance-monitoring" || lifecycleStatus === "sold") {
    return "approved";
  }

  if (lifecycleStatus === "ai-review") return "needs-review";
  if (lifecycleStatus === "archived" || lifecycleStatus === "deleted") return "archived";
  return "pending";
}

function normalizeKey(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

function derivePriority(item: {
  readonly qualityScore: number;
  readonly requiresAttention: boolean;
  readonly approvalStatus: MarketplaceApprovalStatus;
}): MarketplaceQueuePriority {
  if (item.approvalStatus === "pending" && item.requiresAttention && item.qualityScore < 65) {
    return "urgent";
  }

  if (item.approvalStatus === "pending" || item.approvalStatus === "needs-review") {
    return "high";
  }

  if (item.requiresAttention) return "medium";
  return "low";
}

function statusFromAction(action: MarketplaceControlActionInput["action"]): MarketplaceApprovalStatus | null {
  if (action === "approve") return "approved";
  if (action === "reject") return "rejected";
  if (action === "needs-review") return "needs-review";
  if (action === "return-to-dealer") return "returned-to-dealer";
  if (action === "archive") return "archived";
  return null;
}

function toRelative(isoTimestamp: string): string {
  const value = Date.parse(isoTimestamp);
  if (!Number.isFinite(value)) return "Unknown";

  const diffMinutes = Math.max(0, Math.floor((Date.now() - value) / 60000));
  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes} min ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hr ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
}

function deriveReviewState(events: readonly {
  readonly eventName: string;
  readonly eventTimestamp: string;
  readonly payload: Record<string, unknown>;
}[]): Map<string, DerivedReviewState> {
  const byVehicle = new Map<string, DerivedReviewState>();

  for (const event of events
    .filter((item) => item.eventName.startsWith("operations.marketplace."))
    .sort((a, b) => Date.parse(a.eventTimestamp) - Date.parse(b.eventTimestamp))) {
    const vehicleId = typeof event.payload.vehicleId === "string" ? event.payload.vehicleId : null;
    if (!vehicleId) continue;

    const current = byVehicle.get(vehicleId) ?? {
      status: null,
      assignedToUserId: null,
      assignedToName: null,
      priority: null,
      updatedAt: null,
    };

    const status = typeof event.payload.statusAfter === "string"
      ? event.payload.statusAfter as MarketplaceApprovalStatus
      : current.status;

    const assignedToUserId = typeof event.payload.assignedToUserId === "string"
      ? event.payload.assignedToUserId
      : current.assignedToUserId;

    const assignedToName = typeof event.payload.assignedToName === "string"
      ? event.payload.assignedToName
      : current.assignedToName;

    const priority = typeof event.payload.priority === "string"
      ? event.payload.priority as MarketplaceQueuePriority
      : current.priority;

    byVehicle.set(vehicleId, {
      status,
      assignedToUserId,
      assignedToName,
      priority,
      updatedAt: event.eventTimestamp,
    });
  }

  return byVehicle;
}

async function listMarketplaceInventory(): Promise<readonly MarketplaceApprovalQueueItem[]> {
  const store = await readPlatformStore();
  const dealerships = store.dealerships;
  const reviewState = deriveReviewState(store.marketAnalyticsEvents);

  const allRows = await Promise.all(
    dealerships.map(async (dealership) => {
      const rows = await listInventoryVehicles({
        dealershipId: dealership.id,
        pageSize: 1000,
      }).catch(() => ({ items: [] as const }));

      return rows.items.map((item) => {
        const review = reviewState.get(item.id);
        const derivedStatus = mapLifecycleToApprovalStatus(item.lifecycleStatus);
        const approvalStatus = review?.status ?? derivedStatus;

        return {
          id: `listing:${item.id}`,
          vehicleId: item.id,
          dealershipId: item.dealershipId,
          dealershipName: dealerships.find((entry) => entry.id === item.dealershipId)?.tradingName ?? item.dealershipId,
          title: item.title,
          make: item.make,
          model: item.model,
          year: item.year,
          vin: item.vin,
          registrationNumber: item.registrationNumber,
          lifecycleStatus: item.lifecycleStatus,
          approvalStatus,
          priority: review?.priority ?? derivePriority({
            qualityScore: item.listingQualityScore,
            requiresAttention: item.requiresAttention,
            approvalStatus,
          }),
          qualityScore: item.listingQualityScore,
          photoCount: item.photoCount,
          hasPrimaryPhoto: item.hasPrimaryPhoto,
          hasDescription: item.hasDescription,
          hasSeo: item.hasSeo,
          requiresAttention: item.requiresAttention,
          assignedToUserId: review?.assignedToUserId ?? null,
          assignedToName: review?.assignedToName ?? null,
          updatedAt: review?.updatedAt ?? item.updatedAt,
          createdAt: item.createdAt,
        } satisfies MarketplaceApprovalQueueItem;
      });
    }),
  );

  return allRows.flat().sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
}

export async function getMarketplaceControlWorkspaceData(sectionId: MarketplaceControlSectionId): Promise<MarketplaceControlWorkspaceData> {
  const generatedAt = new Date().toISOString();
  const store = await readPlatformStore();
  const [queue, dealerManagement, dealerIntelligence] = await Promise.all([
    listMarketplaceInventory(),
    getDealerManagementData().catch(() => null),
    getDealerIntelligenceWorkspaceData().catch(() => null),
  ]);

  const publishedCount = queue.filter((item) => item.lifecycleStatus === "published" || item.lifecycleStatus === "reserved" || item.lifecycleStatus === "performance-monitoring").length;
  const draftCount = queue.filter((item) => item.lifecycleStatus === "draft").length;
  const reservedCount = queue.filter((item) => item.lifecycleStatus === "reserved").length;
  const soldCount = queue.filter((item) => item.lifecycleStatus === "sold").length;
  const archivedCount = queue.filter((item) => item.lifecycleStatus === "archived" || item.lifecycleStatus === "deleted").length;
  const pendingApprovals = queue.filter((item) => item.approvalStatus === "pending").length;
  const flaggedListings = queue.filter((item) => item.requiresAttention).length;
  const aiReviewQueue = queue.filter((item) => item.lifecycleStatus === "ai-review" || item.approvalStatus === "needs-review").length;

  const averageListingQuality = queue.length > 0
    ? Math.round(queue.reduce((sum, item) => sum + item.qualityScore, 0) / queue.length)
    : null;

  const duplicateGroupsByVin = new Map<string, string[]>();
  const duplicateGroupsByRegistration = new Map<string, string[]>();
  const duplicateGroupsByDealerFingerprint = new Map<string, string[]>();

  for (const item of queue) {
    const normalizedVin = normalizeKey(item.vin);
    const normalizedRegistration = normalizeKey(item.registrationNumber);
    const dealerFingerprint = normalizeKey(`${item.dealershipId}:${item.make}:${item.model}:${item.year}`);

    if (normalizedVin) {
      const current = duplicateGroupsByVin.get(normalizedVin) ?? [];
      duplicateGroupsByVin.set(normalizedVin, [...current, item.vehicleId]);
    }

    if (normalizedRegistration) {
      const current = duplicateGroupsByRegistration.get(normalizedRegistration) ?? [];
      duplicateGroupsByRegistration.set(normalizedRegistration, [...current, item.vehicleId]);
    }

    const dealerCurrent = duplicateGroupsByDealerFingerprint.get(dealerFingerprint) ?? [];
    duplicateGroupsByDealerFingerprint.set(dealerFingerprint, [...dealerCurrent, item.vehicleId]);
  }

  const duplicateGroups = [
    ...[...duplicateGroupsByVin.entries()]
      .filter(([, vehicleIds]) => vehicleIds.length > 1)
      .map(([key, vehicleIds]) => ({
        id: `dup-vin-${key}`,
        type: "vin" as const,
        key,
        vehicleIds,
      })),
    ...[...duplicateGroupsByRegistration.entries()]
      .filter(([, vehicleIds]) => vehicleIds.length > 1)
      .map(([key, vehicleIds]) => ({
        id: `dup-reg-${key}`,
        type: "registration" as const,
        key,
        vehicleIds,
      })),
    ...[...duplicateGroupsByDealerFingerprint.entries()]
      .filter(([, vehicleIds]) => vehicleIds.length > 1)
      .map(([key, vehicleIds]) => ({
        id: `dup-dealer-${key}`,
        type: "dealer-fingerprint" as const,
        key,
        vehicleIds,
      })),
    {
      id: "dup-ai-future",
      type: "vehicle-fingerprint" as const,
      key: "No data yet",
      vehicleIds: [] as string[],
    },
  ].map((group) => ({
    ...group,
    dealershipIds: [...new Set(group.vehicleIds
      .map((vehicleId) => queue.find((item) => item.vehicleId === vehicleId)?.dealershipId)
      .filter((value): value is string => Boolean(value)))],
    availability: group.id === "dup-ai-future" ? "unavailable" as const : "live" as const,
  }));

  const duplicateVehicleCount = new Set(
    duplicateGroups
      .filter((item) => item.availability === "live")
      .flatMap((item) => item.vehicleIds),
  ).size;

  const dealerQuality = dealerManagement
    ? dealerManagement.health.map((item) => ({
        dealershipId: item.dealershipId,
        dealershipName: item.dealershipName,
        dealerQualityScore: item.healthScore,
        listingCompliance: item.risk === "high" ? "Needs intervention" : item.risk === "medium" ? "Monitor" : "Compliant",
        outstandingIssues: item.outstandingTasks,
        warnings: item.missingInformation,
        recommendations: item.risk === "high"
          ? ["Escalate dealership quality plan", "Prioritize listing compliance cleanup"]
          : item.risk === "medium"
            ? ["Address open quality items", "Review listing consistency weekly"]
            : ["Maintain current quality controls"],
      }))
    : [];

  const dealerQualityIssues = dealerQuality.filter((item) => item.outstandingIssues.length > 0 || item.warnings.length > 0).length;

  const marketplaceHealthScore = queue.length === 0
    ? null
    : Math.round((
      ((publishedCount / queue.length) * 0.45)
      + (((averageListingQuality ?? 0) / 100) * 0.40)
      + ((1 - (flaggedListings / queue.length)) * 0.15)
    ) * 100);

  const listingQuality = queue.map((item) => ({
    vehicleId: item.vehicleId,
    dealershipId: item.dealershipId,
    title: item.title,
    qualityScore: item.qualityScore,
    missingPhotos: item.photoCount < 6 || !item.hasPrimaryPhoto,
    missingInformation: !item.hasDescription || !item.hasSeo,
    lowQualityDescription: !item.hasDescription || item.qualityScore < 70,
    pricingWarning: item.lifecycleStatus !== "sold" && item.lifecycleStatus !== "archived" && item.lifecycleStatus !== "deleted" && item.requiresAttention,
    aiRecommendations: [
      ...(item.photoCount < 6 ? ["Add more listing photos to reach quality threshold."] : []),
      ...(!item.hasPrimaryPhoto ? ["Set a clear primary image for marketplace ranking quality."] : []),
      ...(!item.hasDescription ? ["Complete listing description content."] : []),
      ...(!item.hasSeo ? ["Complete SEO title and description fields."] : []),
      ...(item.qualityScore < 80 ? ["Improve listing quality score before final approval."] : []),
    ],
  }));

  const mediaByVehicle = new Map<string, readonly {
    readonly qualityStatus: "good" | "review" | "poor";
    readonly isPrimary: boolean;
  }[]>();

  for (const media of store.inventoryMedia) {
    const current = mediaByVehicle.get(media.vehicleId) ?? [];
    mediaByVehicle.set(media.vehicleId, [...current, {
      qualityStatus: media.qualityStatus,
      isPrimary: media.isPrimary,
    }]);
  }

  const imageReview: ImageReviewItem[] = queue.map((item) => {
    const media = mediaByVehicle.get(item.vehicleId) ?? [];
    const qualityFromMedia: ImageReviewItem["quality"] = media.length === 0
      ? "unavailable"
      : media.some((entry) => entry.qualityStatus === "poor")
        ? "poor"
        : media.some((entry) => entry.qualityStatus === "review")
          ? "review"
          : "good";

    return {
      vehicleId: item.vehicleId,
      title: item.title,
      imageCount: item.photoCount,
      hasPrimaryImage: item.hasPrimaryPhoto,
      quality: qualityFromMedia,
      duplicateImages: "unavailable" as const,
      missingImages: item.photoCount < 6,
      moderationAvailability: "unavailable" as const,
    };
  });

  const aiModeration = queue.map((item) => ({
    vehicleId: item.vehicleId,
    title: item.title,
    contentReview: item.hasDescription ? "ready" as const : "needs-review" as const,
    descriptionReview: item.qualityScore >= 70 ? "ready" as const : "needs-review" as const,
    pricingReview: "unavailable" as const,
    listingQualityScore: item.qualityScore,
    moderationStatus: item.approvalStatus === "needs-review" || item.approvalStatus === "pending"
      ? "needs-review" as const
      : "ready" as const,
  }));

  const alerts = [
    ...(flaggedListings > 0 ? [{
      id: "alert-listing-attention",
      severity: "warning" as const,
      title: "Listings Requiring Attention",
      detail: `${flaggedListings.toLocaleString("en-ZA")} listings require quality intervention.`,
      availability: "live" as const,
    }] : []),
    ...(duplicateVehicleCount > 0 ? [{
      id: "alert-duplicates",
      severity: "warning" as const,
      title: "Potential Duplicate Listings",
      detail: `${duplicateVehicleCount.toLocaleString("en-ZA")} listings are part of duplicate groups.`,
      availability: "live" as const,
    }] : []),
    ...(aiReviewQueue > 0 ? [{
      id: "alert-ai-review",
      severity: "info" as const,
      title: "AI Review Queue",
      detail: `${aiReviewQueue.toLocaleString("en-ZA")} listings are waiting in review-oriented stages.`,
      availability: "live" as const,
    }] : []),
    {
      id: "alert-fraud-framework",
      severity: "critical" as const,
      title: "Fraud Detection Signals",
      detail: "No data yet. Fraud signal integrations are not connected yet.",
      availability: "unavailable" as const,
    },
  ];

  const timeline: MarketplaceControlTimelineItem[] = [
    ...store.inventoryHistory.map((entry) => ({
      id: entry.id,
      eventName: entry.eventType,
      source: "inventory-history",
      actorType: "system",
      actorId: null,
      detail: entry.message,
      createdAt: entry.createdAt,
    })),
    ...store.marketAnalyticsEvents
      .filter((entry) => entry.source === "operations-marketplace-control" || entry.eventName.startsWith("operations.marketplace."))
      .map((entry) => ({
        id: entry.id,
        eventName: entry.eventName,
        source: entry.source,
        actorType: entry.actorType,
        actorId: entry.actorId,
        detail: typeof entry.payload.note === "string" ? entry.payload.note : entry.eventName,
        createdAt: entry.eventTimestamp,
      })),
  ]
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .slice(0, 120);

  const audit = store.marketAnalyticsEvents
    .filter((entry) => entry.source === "operations-marketplace-control" || entry.source === "inventory-intelligence")
    .map((entry) => ({
      id: entry.id,
      action: entry.eventName,
      source: entry.source,
      actorType: entry.actorType,
      createdAt: entry.eventTimestamp,
    }))
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .slice(0, 160);

  const recentActivityCount = timeline.filter((entry) => Date.parse(entry.createdAt) >= (Date.now() - 24 * 60 * 60 * 1000)).length;

  return {
    generatedAt,
    sectionId,
    summaryCards: [
      {
        id: "pending-approvals",
        label: "Pending Approvals",
        value: pendingApprovals.toLocaleString("en-ZA"),
        detail: "Live from inventory listing lifecycle and moderation overrides.",
        availability: "live",
      },
      {
        id: "published-vehicles",
        label: "Published Vehicles",
        value: publishedCount.toLocaleString("en-ZA"),
        detail: "Live marketplace-visible inventory from the unified vehicle engine.",
        availability: "live",
      },
      {
        id: "flagged-listings",
        label: "Flagged Listings",
        value: flaggedListings.toLocaleString("en-ZA"),
        detail: "Live quality attention flags from inventory intelligence scoring.",
        availability: "live",
      },
      {
        id: "duplicate-listings",
        label: "Duplicate Listings",
        value: duplicateVehicleCount.toLocaleString("en-ZA"),
        detail: "Live VIN/registration/dealer-fingerprint duplicate groups.",
        availability: "live",
      },
      {
        id: "fraud-alerts",
        label: "Fraud Alerts",
        value: "No data yet",
        detail: "Fraud signal integrations are framework-ready but not connected.",
        availability: "unavailable",
      },
      {
        id: "ai-review-queue",
        label: "AI Review Queue",
        value: aiReviewQueue.toLocaleString("en-ZA"),
        detail: "Live queue from ai-review lifecycle and needs-review moderation states.",
        availability: "live",
      },
      {
        id: "dealer-quality-issues",
        label: "Dealer Quality Issues",
        value: dealerQualityIssues.toLocaleString("en-ZA"),
        detail: "Live from dealer management health/compliance indicators.",
        availability: dealerQuality.length > 0 ? "live" : "unavailable",
      },
      {
        id: "marketplace-health-score",
        label: "Marketplace Health Score",
        value: marketplaceHealthScore === null ? "No data yet" : `${marketplaceHealthScore}%`,
        detail: "Composite score from publish readiness, quality, and attention ratio.",
        availability: marketplaceHealthScore === null ? "unavailable" : "live",
      },
      {
        id: "recent-marketplace-activity",
        label: "Recent Marketplace Activity",
        value: recentActivityCount.toLocaleString("en-ZA"),
        detail: "Events recorded in the last 24 hours across moderation and lifecycle streams.",
        availability: "live",
      },
      {
        id: "system-alerts",
        label: "System Alerts",
        value: "No data yet",
        detail: "Dedicated marketplace control alert orchestration is not connected yet.",
        availability: "unavailable",
      },
    ],
    approvalQueue: queue,
    health: {
      published: publishedCount,
      drafts: draftCount,
      reserved: reservedCount,
      sold: soldCount,
      archived: archivedCount,
      averageListingQuality,
      listingsRequiringAttention: flaggedListings,
      dealerHealth: dealerQuality.length > 0
        ? `${dealerQuality.filter((item) => item.dealerQualityScore !== null && item.dealerQualityScore >= 70).length}/${dealerQuality.length} dealers at acceptable quality`
        : "No data yet",
      marketplaceAlerts: alerts.filter((alert) => alert.availability === "live").length,
    },
    listingQuality,
    duplicateGroups,
    fraudReview: [],
    aiModeration,
    imageReview,
    dealerQuality,
    alerts,
    timeline,
    audit,
    sourceReadiness: [
      {
        id: "inventory-lifecycle",
        label: "Inventory Lifecycle and Vehicle Engine",
        mode: "live",
        detail: "Published, draft, sold, and lifecycle intelligence from existing inventory + vehicle engine services.",
      },
      {
        id: "listing-quality",
        label: "Listing Builder Quality Rules",
        mode: "live",
        detail: "Listing quality and publish-readiness rules are reused from existing intelligence/listing-builder modules.",
      },
      {
        id: "media-review",
        label: "Vehicle Media Metadata",
        mode: "live",
        detail: "Image count, primary image, and quality status from existing media storage records.",
      },
      {
        id: "dealer-quality",
        label: "Dealer Management and Dealer Intelligence",
        mode: dealerManagement && dealerIntelligence ? "live" : "manual",
        detail: "Dealer quality rows reuse existing dealer operations modules with no duplicate data stores.",
      },
      {
        id: "fraud-ai-dedicated",
        label: "Fraud Detection and Dedicated AI Moderation Engines",
        mode: "unavailable",
        detail: "Framework-ready extension points. No standalone fraud/image AI moderation engines are implemented.",
      },
    ],
  };
}

function inventoryStatusForAction(action: MarketplaceControlActionInput["action"]): "published" | "archived" | "ai-review" | "draft" | null {
  if (action === "approve") return "published";
  if (action === "archive" || action === "reject") return "archived";
  if (action === "needs-review") return "ai-review";
  if (action === "return-to-dealer") return "draft";
  return null;
}

function permissionForAction(action: MarketplaceControlActionInput["action"]): "operations:view" | "operations:edit" | "operations:approve" | "operations:reject" | "operations:delete" | "operations:export" | "operations:manage" {
  if (action === "approve") return "operations:approve";
  if (action === "reject") return "operations:reject";
  if (action === "archive") return "operations:delete";
  if (action === "export") return "operations:export";
  if (action === "assign") return "operations:edit";
  return "operations:edit";
}

export async function applyMarketplaceControlAction(input: MarketplaceControlActionInput): Promise<void> {
  const queue = await listMarketplaceInventory();
  const listing = queue.find((item) => item.vehicleId === input.vehicleId);

  if (!listing) {
    throw new Error("Listing not found.");
  }

  const nextStatus = statusFromAction(input.action) ?? listing.approvalStatus;
  const lifecycleTarget = inventoryStatusForAction(input.action);

  if (lifecycleTarget) {
    await updateVehicleLifecycleStatus(listing.dealershipId, listing.vehicleId, lifecycleTarget).catch(() => undefined);
  }

  await logOperationsAuditEvent({
    dealershipId: listing.dealershipId,
    eventName: `operations.marketplace.${input.action}`,
    source: "operations-marketplace-control",
    payload: {
      vehicleId: listing.vehicleId,
      listingId: listing.id,
      title: listing.title,
      permission: permissionForAction(input.action),
      statusBefore: listing.approvalStatus,
      statusAfter: nextStatus,
      lifecycleBefore: listing.lifecycleStatus,
      lifecycleAfter: lifecycleTarget ?? listing.lifecycleStatus,
      assignedToUserId: input.assignedToUserId,
      assignedToName: input.assignedToName,
      priority: input.priority ?? listing.priority,
      note: input.note ?? null,
      actorId: input.actorId ?? null,
      actorName: input.actorName ?? null,
    },
  }).catch(() => undefined);
}

export function summarizeSectionTimestamp(data: MarketplaceControlWorkspaceData): string {
  return toRelative(data.generatedAt);
}
