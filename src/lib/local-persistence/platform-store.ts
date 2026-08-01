import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

interface LocalDealershipRecord {
  readonly id: string;
  readonly ownerUserId: string;
  readonly businessName: string;
  readonly tradingName: string;
  /* Nullable to match the `dealerships` columns — see DealershipProfileRecord. */
  readonly registrationNumber: string | null;
  readonly vatNumber: string | null;
  readonly dealerLicenceNumber: string | null;
  readonly businessType: string;
  readonly physicalAddress: string;
  readonly province: string;
  readonly city: string;
  readonly postalCode: string;
  readonly gpsLatitude: string;
  readonly gpsLongitude: string;
  readonly telephone: string | null;
  readonly whatsapp: string | null;
  readonly email: string | null;
  readonly website: string | null;
  readonly logoDataUrl: string | null;
  readonly coverDataUrl: string | null;
  readonly primaryColor: string;
  readonly secondaryColor: string;
  readonly onboardingStatus: string;
  readonly subscriptionPackage: string | null;
  readonly completedAt: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

interface LocalBranchRecord {
  readonly id: string;
  readonly dealershipId: string;
  readonly name: string;
  readonly address: string;
  readonly province: string;
  readonly city: string;
  readonly postalCode: string;
  readonly telephone: string | null;
  readonly whatsapp: string | null;
  readonly email: string | null;
  readonly businessHours: string;
  readonly branchManager: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

interface LocalStaffMembershipRecord {
  readonly id: string;
  readonly dealershipId: string;
  readonly branchId: string;
  readonly userId: string | null;
  readonly fullName: string;
  readonly email: string;
  readonly roleId: string;
  readonly permissions: readonly string[];
  readonly status: string;
  readonly invitedAt: string;
  readonly acceptedAt: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

interface LocalDraftRecord {
  readonly ownerEmail: string;
  readonly currentStepIndex: number;
  readonly payload: unknown;
  readonly revision?: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

interface LocalInventoryVehicleRecord {
  readonly id: string;
  readonly dealershipId: string;
  readonly branchId: string;
  readonly stockNumber: string;
  readonly vin: string;
  readonly registrationNumber: string;
  readonly title: string;
  readonly make: string;
  readonly model: string;
  readonly variant: string | null;
  readonly year: number;
  readonly mileageKm: number;
  readonly askingPriceCents: number;
  readonly currency: string;
  readonly lifecycleStatus: string;
  readonly description: string | null;
  readonly seoTitle: string | null;
  readonly seoDescription: string | null;
  readonly estimatedDaysToSell: number | null;
  readonly leadCount30d: number;
  readonly colour: string | null;
  readonly fuel: string | null;
  readonly transmission: string | null;
  readonly engine: string | null;
  readonly bodyType: string | null;
  readonly createdBy: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

interface LocalInventoryMediaRecord {
  readonly id: string;
  readonly dealershipId: string;
  readonly vehicleId: string;
  readonly fileName: string;
  readonly fileUrl: string;
  readonly isPrimary: boolean;
  readonly sortOrder: number;
  readonly qualityStatus: "good" | "review" | "poor";
  readonly processingStatus: "uploaded" | "processing" | "ready";
  readonly aiEnhancementStatus: string;
  readonly createdAt: string;
}

interface LocalInventoryDocumentRecord {
  readonly id: string;
  readonly dealershipId: string;
  readonly vehicleId: string;
  readonly documentType: string;
  readonly fileName: string;
  readonly fileUrl: string;
  readonly uploadedBy: string;
  readonly uploadedAt: string;
}

interface LocalInventoryPriceHistoryRecord {
  readonly id: string;
  readonly dealershipId: string;
  readonly vehicleId: string;
  readonly priceCents: number;
  readonly reason: string;
  readonly changedBy: string;
  readonly changedAt: string;
}

interface LocalInventoryHistoryRecord {
  readonly id: string;
  readonly dealershipId: string;
  readonly vehicleId: string;
  readonly eventType: string;
  readonly message: string;
  readonly createdAt: string;
}

interface LocalInventoryAuditRecord {
  readonly id: string;
  readonly dealershipId: string;
  readonly vehicleId: string;
  readonly actorId: string;
  readonly actorType: string;
  readonly action: string;
  readonly payload: string;
  readonly createdAt: string;
}

interface LocalMarketAnalyticsEventRecord {
  readonly id: string;
  readonly dealershipId: string;
  readonly vehicleId: string | null;
  readonly eventType: string;
  readonly eventName: string;
  readonly eventTimestamp: string;
  readonly actorId: string | null;
  readonly actorType: string;
  readonly sessionId: string | null;
  readonly source: string;
  readonly payload: Record<string, unknown>;
  readonly createdAt: string;
}

interface LocalDealerIntelligenceReviewRecord {
  readonly id: string;
  readonly dealershipId: string;
  readonly queueStatus: "new" | "under-review" | "verified" | "rejected" | "duplicate" | "archived";
  readonly verificationStatus: "verified" | "needs-review" | "pending" | "rejected" | "duplicate";
  readonly internalNotes: string | null;
  readonly operationsOwner: string;
  readonly lastReviewedAt: string;
  readonly updatedAt: string;
}

interface LocalDealerIntelligenceActivityRecord {
  readonly id: string;
  readonly dealershipId: string;
  readonly action: string;
  readonly source: string;
  readonly actorType: string;
  readonly actorId: string | null;
  readonly payload: Record<string, unknown>;
  readonly createdAt: string;
}

interface LocalOperationsApplicationReviewRecord {
  readonly id: string;
  readonly applicationId: string;
  readonly applicationType: string;
  readonly sourceEntityId: string;
  readonly dealershipId: string | null;
  readonly status: "new" | "assigned" | "in-review" | "waiting-customer" | "approved" | "rejected" | "completed" | "cancelled" | "archived";
  readonly priority: "low" | "medium" | "high" | "urgent";
  readonly assignedToUserId: string | null;
  readonly assignedToName: string | null;
  readonly ownerUserId: string | null;
  readonly ownerName: string | null;
  readonly updatedAt: string;
}

interface LocalOperationsApplicationEventRecord {
  readonly id: string;
  readonly applicationId: string;
  readonly action: string;
  readonly statusAfter: string;
  readonly actorType: string;
  readonly actorId: string | null;
  readonly actorName: string | null;
  readonly detail: string;
  readonly createdAt: string;
}

interface LocalOperationsApplicationNoteRecord {
  readonly id: string;
  readonly applicationId: string;
  readonly note: string;
  readonly actorType: string;
  readonly actorId: string | null;
  readonly actorName: string | null;
  readonly createdAt: string;
}

interface LocalOperationsApplicationAttachmentRecord {
  readonly id: string;
  readonly applicationId: string;
  readonly label: string;
  readonly fileName: string;
  readonly fileUrl: string;
  readonly fileSizeBytes: number | null;
  readonly mimeType: string | null;
  readonly uploadedBy: string | null;
  readonly uploadedAt: string;
}

interface LocalLeadRecord {
  readonly id: string;
  readonly dealershipId: string;
  readonly vehicleId: string;
  readonly buyerId: string | null;
  readonly buyerName: string;
  readonly buyerEmail: string;
  readonly buyerPhone: string;
  readonly message: string;
  readonly fingerprint: string;
  readonly enquiryType: "contact" | "test-drive" | "finance";
  readonly status: string;
  readonly assignedToUserId: string | null;
  readonly assignedToName: string | null;
  readonly assignedAt: string | null;
  readonly respondedAt: string | null;
  readonly respondedBy: string | null;
  readonly followUpAt: string | null;
  readonly closedAt: string | null;
  readonly resolution: "won" | "lost" | null;
  readonly lastUpdatedAt: string;
  readonly timeline: readonly LocalLeadTimelineRecord[];
  readonly createdAt: string;
}

interface LocalLeadTimelineRecord {
  readonly id: string;
  readonly type: string;
  readonly message: string;
  readonly actorId: string | null;
  readonly actorName: string | null;
  readonly createdAt: string;
  readonly metadata?: Record<string, unknown>;
}

interface LocalBuyerProfileRecord {
  readonly buyerId: string;
  readonly budgetMinCents: number | null;
  readonly budgetMaxCents: number | null;
  readonly vehicleTypes: readonly string[];
  readonly lifestyle: string | null;
  readonly dailyCommuteKm: number | null;
  readonly familySize: number | null;
  readonly fuelPreference: string | null;
  readonly transmissionPreference: string | null;
  readonly towingNeeds: string | null;
  readonly updatedAt: string;
}

interface LocalBuyerSavedSearchRecord {
  readonly id: string;
  readonly buyerId: string;
  readonly name: string;
  readonly query: string;
  readonly interpretation: unknown;
  readonly alertsEnabled: boolean;
  readonly createdAt: string;
}

interface LocalBuyerSavedVehicleRecord {
  readonly id: string;
  readonly buyerId: string;
  readonly vehicleId: string;
  readonly createdAt: string;
}

interface LocalBuyerAlertRecord {
  readonly id: string;
  readonly buyerId: string;
  readonly alertType: string;
  readonly status: string;
  readonly channel: string;
  readonly referenceId: string | null;
  readonly createdAt: string;
}

interface LocalPlatformData {
  readonly dealerships: readonly LocalDealershipRecord[];
  readonly branches: readonly LocalBranchRecord[];
  readonly staffMemberships: readonly LocalStaffMembershipRecord[];
  readonly onboardingDrafts: readonly LocalDraftRecord[];
  readonly inventoryVehicles: readonly LocalInventoryVehicleRecord[];
  readonly inventoryMedia: readonly LocalInventoryMediaRecord[];
  readonly inventoryDocuments: readonly LocalInventoryDocumentRecord[];
  readonly inventoryPriceHistory: readonly LocalInventoryPriceHistoryRecord[];
  readonly inventoryHistory: readonly LocalInventoryHistoryRecord[];
  readonly inventoryAudit: readonly LocalInventoryAuditRecord[];
  readonly marketAnalyticsEvents: readonly LocalMarketAnalyticsEventRecord[];
  readonly dealerIntelligenceReviews: readonly LocalDealerIntelligenceReviewRecord[];
  readonly dealerIntelligenceActivity: readonly LocalDealerIntelligenceActivityRecord[];
  readonly operationsApplicationReviews: readonly LocalOperationsApplicationReviewRecord[];
  readonly operationsApplicationEvents: readonly LocalOperationsApplicationEventRecord[];
  readonly operationsApplicationNotes: readonly LocalOperationsApplicationNoteRecord[];
  readonly operationsApplicationAttachments: readonly LocalOperationsApplicationAttachmentRecord[];
  readonly leads: readonly LocalLeadRecord[];
  readonly buyerProfiles: readonly LocalBuyerProfileRecord[];
  readonly buyerSavedSearches: readonly LocalBuyerSavedSearchRecord[];
  readonly buyerSavedVehicles: readonly LocalBuyerSavedVehicleRecord[];
  readonly buyerAlertSubscriptions: readonly LocalBuyerAlertRecord[];
}

const STORE_PATH = path.join(process.cwd(), "db", "local", "platform-store.json");

declare global {
  var __surf4carsPlatformStore: LocalPlatformData | undefined;
}

const EMPTY_STORE: LocalPlatformData = {
  dealerships: [],
  branches: [],
  staffMemberships: [],
  onboardingDrafts: [],
  inventoryVehicles: [],
  inventoryMedia: [],
  inventoryDocuments: [],
  inventoryPriceHistory: [],
  inventoryHistory: [],
  inventoryAudit: [],
  marketAnalyticsEvents: [],
  dealerIntelligenceReviews: [],
  dealerIntelligenceActivity: [],
  operationsApplicationReviews: [],
  operationsApplicationEvents: [],
  operationsApplicationNotes: [],
  operationsApplicationAttachments: [],
  leads: [],
  buyerProfiles: [],
  buyerSavedSearches: [],
  buyerSavedVehicles: [],
  buyerAlertSubscriptions: [],
};

let writeQueue = Promise.resolve();

async function ensureStoreFile(): Promise<void> {
  await mkdir(path.dirname(STORE_PATH), { recursive: true });
  try {
    await readFile(STORE_PATH, "utf8");
  } catch {
    try {
      await writeFile(STORE_PATH, JSON.stringify(EMPTY_STORE, null, 2), "utf8");
    } catch {
      // Best effort only. In-memory state remains authoritative when disk access fails.
    }
  }
}

export async function readPlatformStore(): Promise<LocalPlatformData> {
  if (process.env.NODE_ENV === "production") {
    return globalThis.__surf4carsPlatformStore ?? EMPTY_STORE;
  }

  if (globalThis.__surf4carsPlatformStore) {
    return globalThis.__surf4carsPlatformStore;
  }

  await ensureStoreFile();
  try {
    const raw = await readFile(STORE_PATH, "utf8");
    const parsed = { ...EMPTY_STORE, ...(JSON.parse(raw) as Partial<LocalPlatformData>) };
    globalThis.__surf4carsPlatformStore = parsed;
    return parsed;
  } catch {
    globalThis.__surf4carsPlatformStore = EMPTY_STORE;
    return EMPTY_STORE;
  }
}

export async function writePlatformStore(next: LocalPlatformData): Promise<void> {
  globalThis.__surf4carsPlatformStore = next;
  await ensureStoreFile();
  writeQueue = writeQueue.then(async () => {
    try {
      await writeFile(STORE_PATH, JSON.stringify(next), "utf8");
    } catch {
      // Best effort only. Requests can continue using the in-memory store.
    }
  });

  // In local/dev fallback mode, return immediately after in-memory update.
  // This avoids blocking API responses on large JSON file flushes.
  if (process.env.NODE_ENV !== "production") {
    return;
  }

  await writeQueue;
}

export async function updatePlatformStore(
  updater: (current: LocalPlatformData) => LocalPlatformData,
): Promise<LocalPlatformData> {
  const current = await readPlatformStore();
  const next = updater(current);
  await writePlatformStore(next);
  return next;
}

export type {
  LocalBranchRecord,
  LocalDealerIntelligenceActivityRecord,
  LocalDealerIntelligenceReviewRecord,
  LocalOperationsApplicationAttachmentRecord,
  LocalOperationsApplicationEventRecord,
  LocalOperationsApplicationNoteRecord,
  LocalOperationsApplicationReviewRecord,
  LocalBuyerAlertRecord,
  LocalBuyerProfileRecord,
  LocalBuyerSavedSearchRecord,
  LocalBuyerSavedVehicleRecord,
  LocalDealershipRecord,
  LocalDraftRecord,
  LocalInventoryAuditRecord,
  LocalInventoryDocumentRecord,
  LocalInventoryHistoryRecord,
  LocalInventoryMediaRecord,
  LocalInventoryPriceHistoryRecord,
  LocalInventoryVehicleRecord,
  LocalLeadRecord,
  LocalLeadTimelineRecord,
  LocalMarketAnalyticsEventRecord,
  LocalPlatformData,
  LocalStaffMembershipRecord,
};
