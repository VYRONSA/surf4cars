import {
  readPlatformStore,
  updatePlatformStore,
  type LocalLeadRecord,
  type LocalLeadTimelineRecord,
} from "@/lib/local-persistence/platform-store";
import {
  listEnquiriesForDealership,
  type StoredEnquiry,
} from "@/features/enquiries/server/enquiry-persistence";
import { getVehicleEngine } from "@/services/vehicle-engine";
import { isMarketplaceVisible } from "@/services/vehicle-engine/vehicle-projection.service";

export type EnquiryType = "contact" | "test-drive" | "finance";
export type EnquiryStatus =
  | "new"
  | "assigned"
  | "responded"
  | "follow-up"
  | "test-drive-scheduled"
  | "finance-in-progress"
  | "closed-won"
  | "closed-lost";

export interface DealerEnquiryRecord {
  readonly id: string;
  readonly dealershipId: string;
  readonly vehicleId: string;
  readonly buyerId: string | null;
  readonly buyerName: string;
  readonly buyerEmail: string;
  readonly buyerPhone: string;
  readonly message: string;
  readonly fingerprint: string;
  readonly enquiryType: EnquiryType;
  readonly status: EnquiryStatus;
  readonly assignedToUserId: string | null;
  readonly assignedToName: string | null;
  readonly assignedAt: string | null;
  readonly respondedAt: string | null;
  readonly respondedBy: string | null;
  readonly followUpAt: string | null;
  readonly closedAt: string | null;
  readonly resolution: "won" | "lost" | null;
  readonly lastUpdatedAt: string;
  readonly createdAt: string;
  readonly timeline: readonly DealerEnquiryTimelineEntry[];
}

export interface DealerEnquiryTimelineEntry {
  readonly id: string;
  readonly type: string;
  readonly message: string;
  readonly actorId: string | null;
  readonly actorName: string | null;
  readonly createdAt: string;
  readonly metadata?: Record<string, unknown>;
}

export interface CreateDealerEnquiryInput {
  readonly dealershipId: string;
  readonly vehicleId: string;
  readonly buyerId?: string | null;
  readonly buyerName: string;
  readonly buyerEmail: string;
  readonly buyerPhone: string;
  readonly message: string;
  readonly enquiryType: EnquiryType;
}

export interface DealerEnquiryListQuery {
  readonly dealershipId: string;
  readonly status?: EnquiryStatus;
}

export type DealerEnquiryAction =
  | {
      readonly type: "assign";
      readonly assignedToUserId: string;
      readonly assignedToName: string;
      readonly actorId?: string;
      readonly actorName?: string;
    }
  | {
      readonly type: "respond";
      readonly responseMessage: string;
      readonly actorId?: string;
      readonly actorName?: string;
    }
  | {
      readonly type: "schedule-test-drive";
      readonly scheduledFor: string;
      readonly actorId?: string;
      readonly actorName?: string;
    }
  | {
      readonly type: "finance-request";
      readonly note?: string;
      readonly actorId?: string;
      readonly actorName?: string;
    }
  | {
      readonly type: "follow-up";
      readonly followUpAt: string;
      readonly note?: string;
      readonly actorId?: string;
      readonly actorName?: string;
    }
  | {
      readonly type: "set-status";
      readonly status: EnquiryStatus;
      readonly note?: string;
      readonly actorId?: string;
      readonly actorName?: string;
    }
  | {
      readonly type: "close-won";
      readonly note?: string;
      readonly actorId?: string;
      readonly actorName?: string;
    }
  | {
      readonly type: "close-lost";
      readonly note?: string;
      readonly actorId?: string;
      readonly actorName?: string;
    };

const VALID_TRANSITIONS: Readonly<Record<EnquiryStatus, readonly EnquiryStatus[]>> = {
  new: ["assigned", "responded", "follow-up", "test-drive-scheduled", "finance-in-progress", "closed-won", "closed-lost"],
  assigned: ["responded", "follow-up", "test-drive-scheduled", "finance-in-progress", "closed-won", "closed-lost"],
  responded: ["follow-up", "test-drive-scheduled", "finance-in-progress", "closed-won", "closed-lost"],
  "follow-up": ["responded", "test-drive-scheduled", "finance-in-progress", "closed-won", "closed-lost"],
  "test-drive-scheduled": ["responded", "follow-up", "finance-in-progress", "closed-won", "closed-lost"],
  "finance-in-progress": ["responded", "follow-up", "test-drive-scheduled", "closed-won", "closed-lost"],
  "closed-won": [],
  "closed-lost": [],
};

function normalize(text: string): string {
  return text.trim().toLowerCase();
}

function buildFingerprint(input: CreateDealerEnquiryInput): string {
  return [
    normalize(input.dealershipId),
    normalize(input.vehicleId),
    normalize(input.buyerEmail),
    normalize(input.buyerPhone),
    normalize(input.enquiryType),
    normalize(input.message),
  ].join("|");
}

function defaultTimelineEntry(input: {
  readonly type: string;
  readonly message: string;
  readonly actorId?: string | null;
  readonly actorName?: string | null;
  readonly metadata?: Record<string, unknown>;
}): DealerEnquiryTimelineEntry {
  return {
    id: crypto.randomUUID(),
    type: input.type,
    message: input.message,
    actorId: input.actorId ?? null,
    actorName: input.actorName ?? null,
    createdAt: new Date().toISOString(),
    metadata: input.metadata,
  };
}

function normalizeTimeline(entry: LocalLeadTimelineRecord): DealerEnquiryTimelineEntry {
  return {
    id: entry.id,
    type: entry.type,
    message: entry.message,
    actorId: entry.actorId,
    actorName: entry.actorName,
    createdAt: entry.createdAt,
    metadata: entry.metadata,
  };
}

function normalizeLead(lead: LocalLeadRecord): DealerEnquiryRecord {
  return {
    id: lead.id,
    dealershipId: lead.dealershipId,
    vehicleId: lead.vehicleId,
    buyerId: lead.buyerId ?? null,
    buyerName: lead.buyerName,
    buyerEmail: lead.buyerEmail,
    buyerPhone: lead.buyerPhone,
    message: lead.message,
    fingerprint: lead.fingerprint ?? buildFingerprint({
      dealershipId: lead.dealershipId,
      vehicleId: lead.vehicleId,
      buyerId: lead.buyerId ?? null,
      buyerName: lead.buyerName,
      buyerEmail: lead.buyerEmail,
      buyerPhone: lead.buyerPhone,
      message: lead.message,
      enquiryType: lead.enquiryType,
    }),
    enquiryType: lead.enquiryType,
    status: (lead.status as EnquiryStatus | undefined) ?? "new",
    assignedToUserId: lead.assignedToUserId ?? null,
    assignedToName: lead.assignedToName ?? null,
    assignedAt: lead.assignedAt ?? null,
    respondedAt: lead.respondedAt ?? null,
    respondedBy: lead.respondedBy ?? null,
    followUpAt: lead.followUpAt ?? null,
    closedAt: lead.closedAt ?? null,
    resolution: lead.resolution ?? null,
    lastUpdatedAt: lead.lastUpdatedAt ?? lead.createdAt,
    createdAt: lead.createdAt,
    timeline: (lead.timeline ?? [
      {
        id: crypto.randomUUID(),
        type: "created",
        message: `${lead.enquiryType} enquiry received from ${lead.buyerName}`,
        actorId: lead.buyerId ?? lead.buyerEmail,
        actorName: lead.buyerName,
        createdAt: lead.createdAt,
      },
    ]).map(normalizeTimeline),
  };
}

function canTransition(fromStatus: EnquiryStatus, toStatus: EnquiryStatus): boolean {
  if (fromStatus === toStatus) {
    return true;
  }
  return VALID_TRANSITIONS[fromStatus].includes(toStatus);
}

async function appendHistory(params: {
  readonly dealershipId: string;
  readonly vehicleId: string;
  readonly message: string;
  readonly eventType: string;
}): Promise<void> {
  const nowIso = new Date().toISOString();
  await updatePlatformStore((current) => ({
    ...current,
    inventoryHistory: [
      ...current.inventoryHistory,
      {
        id: crypto.randomUUID(),
        dealershipId: params.dealershipId,
        vehicleId: params.vehicleId,
        eventType: params.eventType,
        message: params.message,
        createdAt: nowIso,
      },
    ],
  }));
}

async function appendAudit(params: {
  readonly dealershipId: string;
  readonly vehicleId: string;
  readonly action: string;
  readonly payload: Record<string, unknown>;
  readonly actorId?: string | null;
}): Promise<void> {
  const nowIso = new Date().toISOString();
  await updatePlatformStore((current) => ({
    ...current,
    inventoryAudit: [
      ...current.inventoryAudit,
      {
        id: crypto.randomUUID(),
        dealershipId: params.dealershipId,
        vehicleId: params.vehicleId,
        actorId: params.actorId ?? "system",
        actorType: params.actorId ? "user" : "system",
        action: params.action,
        payload: JSON.stringify(params.payload),
        createdAt: nowIso,
      },
    ],
  }));
}

async function appendAnalytics(params: {
  readonly dealershipId: string;
  readonly vehicleId: string;
  readonly eventName: string;
  readonly payload: Record<string, unknown>;
  readonly actorId?: string | null;
  readonly actorType?: string;
}): Promise<void> {
  const nowIso = new Date().toISOString();
  await updatePlatformStore((current) => ({
    ...current,
    marketAnalyticsEvents: [
      ...current.marketAnalyticsEvents,
      {
        id: crypto.randomUUID(),
        dealershipId: params.dealershipId,
        vehicleId: params.vehicleId,
        eventType: "enquiry",
        eventName: params.eventName,
        eventTimestamp: nowIso,
        actorId: params.actorId ?? null,
        actorType: params.actorType ?? "system",
        sessionId: null,
        source: "dealer-enquiry-lifecycle",
        payload: params.payload,
        createdAt: nowIso,
      },
    ],
  }));
}

/**
 * The enquiry endpoint is public and unauthenticated, so the vehicle and dealership it names are
 * buyer-supplied. Without this check a lead can be raised against a listing that was deleted,
 * archived or never published, or injected into a dealership the vehicle does not belong to.
 * Resolution goes through the Unified Vehicle Intelligence Engine — the same source the
 * marketplace renders from — so enquiries can only target what a buyer can actually see.
 */
export async function assertEnquiryTargetIsContactable(input: CreateDealerEnquiryInput): Promise<void> {
  const record = await getVehicleEngine().getById(input.vehicleId);

  if (!record) {
    throw new Error("Vehicle not found.");
  }

  if (!isMarketplaceVisible(record)) {
    throw new Error("This listing is no longer available.");
  }

  if (record.dealer.dealershipId !== input.dealershipId) {
    throw new Error("Vehicle does not belong to the specified dealership.");
  }
}

export async function createDealerEnquiry(input: CreateDealerEnquiryInput): Promise<{ readonly enquiry: DealerEnquiryRecord; readonly duplicate: boolean }> {
  await assertEnquiryTargetIsContactable(input);

  const fingerprint = buildFingerprint(input);
  const nowIso = new Date().toISOString();
  const existingStore = await readPlatformStore();
  const existing = existingStore.leads.find((lead) => {
    const normalized = normalizeLead(lead);
    return normalized.dealershipId === input.dealershipId && normalized.fingerprint === fingerprint;
  });

  if (existing) {
    return { enquiry: normalizeLead(existing), duplicate: true };
  }

  const timelineEntry = defaultTimelineEntry({
    type: "created",
    message: `${input.enquiryType} enquiry received from ${input.buyerName}`,
    actorId: input.buyerId ?? input.buyerEmail,
    actorName: input.buyerName,
    metadata: { enquiryType: input.enquiryType },
  });

  const nextLead: LocalLeadRecord = {
    id: crypto.randomUUID(),
    dealershipId: input.dealershipId,
    vehicleId: input.vehicleId,
    buyerId: input.buyerId ?? null,
    buyerName: input.buyerName,
    buyerEmail: input.buyerEmail,
    buyerPhone: input.buyerPhone,
    message: input.message,
    fingerprint,
    enquiryType: input.enquiryType,
    status: "new",
    assignedToUserId: null,
    assignedToName: null,
    assignedAt: null,
    respondedAt: null,
    respondedBy: null,
    followUpAt: null,
    closedAt: null,
    resolution: null,
    lastUpdatedAt: nowIso,
    timeline: [timelineEntry],
    createdAt: nowIso,
  };

  await updatePlatformStore((current) => ({
    ...current,
    leads: [...current.leads, nextLead],
    inventoryVehicles: current.inventoryVehicles.map((vehicle) =>
      vehicle.id === input.vehicleId
        ? { ...vehicle, leadCount30d: vehicle.leadCount30d + 1, updatedAt: nowIso }
        : vehicle,
    ),
  }));

  await appendHistory({
    dealershipId: input.dealershipId,
    vehicleId: input.vehicleId,
    eventType: "lead-received",
    message: `${input.enquiryType} enquiry received from ${input.buyerName}`,
  });
  await appendAudit({
    dealershipId: input.dealershipId,
    vehicleId: input.vehicleId,
    action: "enquiry-created",
    actorId: input.buyerId ?? input.buyerEmail,
    payload: { enquiryId: nextLead.id, enquiryType: input.enquiryType, duplicate: false },
  });
  await appendAnalytics({
    dealershipId: input.dealershipId,
    vehicleId: input.vehicleId,
    eventName: `${input.enquiryType}-enquiry-submitted`,
    actorId: input.buyerId ?? input.buyerEmail,
    actorType: input.buyerId ? "buyer" : "buyer",
    payload: { enquiryId: nextLead.id, buyerName: input.buyerName, enquiryType: input.enquiryType },
  });

  return { enquiry: normalizeLead(nextLead), duplicate: false };
}

/**
 * A stored enquiry, in the shape the dealer portal already renders.
 *
 * Fields the `leads` table does not carry — assignment, follow-up, resolution — come back null
 * rather than invented. They are dealer-workflow columns that nothing writes yet, and returning a
 * plausible value for them would be the fabrication this platform keeps removing.
 */
function fromStored(stored: StoredEnquiry): DealerEnquiryRecord {
  return {
    id: stored.id,
    dealershipId: stored.dealershipId,
    vehicleId: stored.vehicleId,
    buyerId: stored.buyerId,
    buyerName: stored.buyerName,
    buyerEmail: stored.buyerEmail,
    buyerPhone: stored.buyerPhone,
    message: stored.message,
    fingerprint: "",
    enquiryType: stored.enquiryType as EnquiryType,
    status: stored.status as EnquiryStatus,
    assignedToUserId: null,
    assignedToName: null,
    assignedAt: null,
    respondedAt: null,
    respondedBy: null,
    followUpAt: null,
    closedAt: null,
    resolution: null,
    lastUpdatedAt: stored.lastUpdatedAt,
    createdAt: stored.createdAt,
    timeline: [],
  };
}

/**
 * Reads from Supabase, where enquiries are now written.
 *
 * This read the local JSON store while `persistEnquiry` wrote to the database — so for a window, a
 * dealership could not see a single new enquiry. The lead was durable and the lead centre was
 * looking in the wrong place, which is invisible from either side.
 */
export async function listDealerEnquiries(query: DealerEnquiryListQuery): Promise<readonly DealerEnquiryRecord[]> {
  const stored = await listEnquiriesForDealership(query.dealershipId, query.status);
  const leads = stored.map(fromStored);

  if (!query.status) {
    return leads;
  }

  return leads.filter((lead) => lead.status === query.status);
}

export async function listBuyerEnquiries(buyerId: string): Promise<readonly DealerEnquiryRecord[]> {
  const store = await readPlatformStore();
  return store.leads
    .filter((lead) => (lead.buyerId ?? null) === buyerId)
    .map(normalizeLead)
    .sort((a, b) => Date.parse(b.lastUpdatedAt) - Date.parse(a.lastUpdatedAt));
}

export async function listAllDealerEnquiries(): Promise<readonly DealerEnquiryRecord[]> {
  const store = await readPlatformStore();
  return store.leads
    .map(normalizeLead)
    .sort((a, b) => Date.parse(b.lastUpdatedAt) - Date.parse(a.lastUpdatedAt));
}

export async function getDealerEnquiry(dealershipId: string, enquiryId: string): Promise<DealerEnquiryRecord> {
  const stored = await listEnquiriesForDealership(dealershipId);
  const lead = stored.find((item) => item.id === enquiryId);
  if (!lead) {
    throw new Error("Enquiry not found.");
  }
  return fromStored(lead);
}

function buildActionTransition(current: DealerEnquiryRecord, action: DealerEnquiryAction): {
  readonly nextStatus: EnquiryStatus;
  readonly timelineEntry: DealerEnquiryTimelineEntry;
  readonly patch: Partial<LocalLeadRecord>;
  readonly auditAction: string;
  readonly analyticsEvent: string;
} {
  const nowIso = new Date().toISOString();
  switch (action.type) {
    case "assign":
      return {
        nextStatus: "assigned",
        timelineEntry: defaultTimelineEntry({
          type: "assigned",
          message: `Assigned to ${action.assignedToName}`,
          actorId: action.actorId,
          actorName: action.actorName,
          metadata: { assignedToUserId: action.assignedToUserId, assignedToName: action.assignedToName },
        }),
        patch: {
          assignedToUserId: action.assignedToUserId,
          assignedToName: action.assignedToName,
          assignedAt: nowIso,
        },
        auditAction: "enquiry-assigned",
        analyticsEvent: "enquiry-assigned",
      };
    case "respond":
      return {
        nextStatus: "responded",
        timelineEntry: defaultTimelineEntry({
          type: "responded",
          message: action.responseMessage,
          actorId: action.actorId,
          actorName: action.actorName,
        }),
        patch: {
          respondedAt: nowIso,
          respondedBy: action.actorName ?? action.actorId ?? "Dealer",
        },
        auditAction: "enquiry-responded",
        analyticsEvent: "enquiry-responded",
      };
    case "schedule-test-drive":
      return {
        nextStatus: "test-drive-scheduled",
        timelineEntry: defaultTimelineEntry({
          type: "test-drive-scheduled",
          message: `Test drive scheduled for ${action.scheduledFor}`,
          actorId: action.actorId,
          actorName: action.actorName,
          metadata: { scheduledFor: action.scheduledFor },
        }),
        patch: {
          followUpAt: action.scheduledFor,
        },
        auditAction: "enquiry-test-drive-scheduled",
        analyticsEvent: "enquiry-test-drive-scheduled",
      };
    case "finance-request":
      return {
        nextStatus: "finance-in-progress",
        timelineEntry: defaultTimelineEntry({
          type: "finance-in-progress",
          message: action.note?.trim() || "Finance request moved into progress.",
          actorId: action.actorId,
          actorName: action.actorName,
        }),
        patch: {},
        auditAction: "enquiry-finance-progress",
        analyticsEvent: "enquiry-finance-progress",
      };
    case "follow-up":
      return {
        nextStatus: "follow-up",
        timelineEntry: defaultTimelineEntry({
          type: "follow-up",
          message: action.note?.trim() || `Follow-up scheduled for ${action.followUpAt}`,
          actorId: action.actorId,
          actorName: action.actorName,
          metadata: { followUpAt: action.followUpAt },
        }),
        patch: {
          followUpAt: action.followUpAt,
        },
        auditAction: "enquiry-follow-up",
        analyticsEvent: "enquiry-follow-up",
      };
    case "set-status":
      return {
        nextStatus: action.status,
        timelineEntry: defaultTimelineEntry({
          type: "status-changed",
          message: action.note?.trim() || `Status moved to ${action.status}`,
          actorId: action.actorId,
          actorName: action.actorName,
          metadata: { status: action.status },
        }),
        patch: {},
        auditAction: "enquiry-status-changed",
        analyticsEvent: "enquiry-status-changed",
      };
    case "close-won":
      return {
        nextStatus: "closed-won",
        timelineEntry: defaultTimelineEntry({
          type: "closed-won",
          message: action.note?.trim() || "Enquiry closed as won.",
          actorId: action.actorId,
          actorName: action.actorName,
        }),
        patch: {
          closedAt: nowIso,
          resolution: "won",
        },
        auditAction: "enquiry-closed-won",
        analyticsEvent: "enquiry-closed-won",
      };
    case "close-lost":
      return {
        nextStatus: "closed-lost",
        timelineEntry: defaultTimelineEntry({
          type: "closed-lost",
          message: action.note?.trim() || "Enquiry closed as lost.",
          actorId: action.actorId,
          actorName: action.actorName,
        }),
        patch: {
          closedAt: nowIso,
          resolution: "lost",
        },
        auditAction: "enquiry-closed-lost",
        analyticsEvent: "enquiry-closed-lost",
      };
  }
}

export async function applyDealerEnquiryAction(
  dealershipId: string,
  enquiryId: string,
  action: DealerEnquiryAction,
): Promise<DealerEnquiryRecord> {
  const current = await getDealerEnquiry(dealershipId, enquiryId);
  const transition = buildActionTransition(current, action);

  if (!canTransition(current.status, transition.nextStatus)) {
    throw new Error(`Invalid enquiry transition: ${current.status} -> ${transition.nextStatus}.`);
  }

  const isNoop = current.status === transition.nextStatus
    && (action.type === "set-status" || action.type === "close-won" || action.type === "close-lost"
      || (action.type === "assign" && current.assignedToUserId === action.assignedToUserId));

  if (isNoop) {
    await appendAudit({
      dealershipId,
      vehicleId: current.vehicleId,
      action: "enquiry-noop",
      actorId: action.actorId,
      payload: { enquiryId, action: action.type, status: current.status },
    });
    return current;
  }

  const nowIso = new Date().toISOString();
  const nextTimeline = [...current.timeline, transition.timelineEntry];

  let updated: DealerEnquiryRecord | null = null;
  await updatePlatformStore((store) => {
    const leads = store.leads.map((lead) => {
      if (lead.id !== enquiryId || lead.dealershipId !== dealershipId) {
        return lead;
      }

      const nextLead: LocalLeadRecord = {
        ...lead,
        ...transition.patch,
        status: transition.nextStatus,
        lastUpdatedAt: nowIso,
        timeline: nextTimeline,
      };
      updated = normalizeLead(nextLead);
      return nextLead;
    });

    return {
      ...store,
      leads,
    };
  });

  if (!updated) {
    throw new Error("Enquiry not found.");
  }

  await appendHistory({
    dealershipId,
    vehicleId: current.vehicleId,
    eventType: "enquiry-updated",
    message: transition.timelineEntry.message,
  });
  await appendAudit({
    dealershipId,
    vehicleId: current.vehicleId,
    action: transition.auditAction,
    actorId: action.actorId,
    payload: { enquiryId, fromStatus: current.status, toStatus: transition.nextStatus, action: action.type },
  });
  await appendAnalytics({
    dealershipId,
    vehicleId: current.vehicleId,
    eventName: transition.analyticsEvent,
    actorId: action.actorId,
    actorType: "user",
    payload: { enquiryId, fromStatus: current.status, toStatus: transition.nextStatus, action: action.type },
  });

  return updated;
}
