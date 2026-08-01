import {
  applyDealerEnquiryAction,
  listAllDealerEnquiries,
  type DealerEnquiryRecord,
} from "@/features/enquiries/server/dealer-enquiry.service";
import { getDealerManagementData } from "@/features/operations/server/dealer-management.service";
import { logOperationsAuditEvent } from "@/features/operations/server/operations-audit.service";
import {
  readPlatformStore,
  updatePlatformStore,
  type LocalOperationsApplicationAttachmentRecord,
  type LocalOperationsApplicationEventRecord,
  type LocalOperationsApplicationNoteRecord,
  type LocalOperationsApplicationReviewRecord,
} from "@/lib/local-persistence/platform-store";
import type {
  OperationsApplicationActionInput,
  OperationsApplicationQueueItem,
  OperationsApplicationStatus,
  OperationsApplicationsWorkspaceData,
} from "@/features/operations/types/applications-centre.types";

function mapDealerApplicationStatus(raw: string): OperationsApplicationStatus {
  if (raw === "completed") return "approved";
  if (raw === "under-review") return "in-review";
  if (raw === "rejected") return "rejected";
  if (raw === "pending") return "new";
  return "new";
}

function mapEnquiryStatus(raw: DealerEnquiryRecord["status"]): OperationsApplicationStatus {
  if (raw === "assigned") return "assigned";
  if (raw === "follow-up") return "waiting-customer";
  if (raw === "responded") return "in-review";
  if (raw === "test-drive-scheduled") return "in-review";
  if (raw === "finance-in-progress") return "in-review";
  if (raw === "closed-won") return "completed";
  if (raw === "closed-lost") return "rejected";
  return "new";
}

function deriveAiInsights(item: {
  readonly status: OperationsApplicationStatus;
  readonly summary: string;
  readonly hasVehicle: boolean;
  readonly hasDealer: boolean;
  readonly hasApplicantEmail: boolean;
}): { readonly state: "available" | "coming-soon"; readonly entries: readonly string[] } {
  const entries: string[] = [];

  if (!item.hasApplicantEmail) {
    entries.push("Applicant contact details are incomplete. Request updated contact information.");
  }

  if (item.status === "new") {
    entries.push("Unassigned item in New status should be triaged promptly.");
  }

  if (item.status === "waiting-customer") {
    entries.push("Waiting Customer status requires a follow-up cadence.");
  }

  if (item.hasVehicle && item.hasDealer) {
    entries.push("Vehicle and dealer context available for faster decisioning.");
  }

  if (entries.length === 0) {
    return {
      state: "coming-soon",
      entries: ["Coming Soon"],
    };
  }

  return {
    state: "available",
    entries,
  };
}

function getPriorityFromStatus(status: OperationsApplicationStatus): "low" | "medium" | "high" | "urgent" {
  if (status === "new") return "high";
  if (status === "waiting-customer") return "medium";
  if (status === "in-review") return "medium";
  if (status === "rejected" || status === "completed" || status === "archived" || status === "cancelled") return "low";
  return "medium";
}

export async function getApplicationsCentreWorkspaceData(): Promise<OperationsApplicationsWorkspaceData> {
  const generatedAt = new Date().toISOString();
  const store = await readPlatformStore();
  const dealerManagement = await getDealerManagementData();
  const enquiries = await listAllDealerEnquiries();

  const reviewByAppId = new Map(store.operationsApplicationReviews.map((item) => [item.applicationId, item]));
  const notesByAppId = new Map<string, LocalOperationsApplicationNoteRecord[]>();
  const attachmentsByAppId = new Map<string, LocalOperationsApplicationAttachmentRecord[]>();
  const appEventsByAppId = new Map<string, LocalOperationsApplicationEventRecord[]>();

  for (const note of store.operationsApplicationNotes) {
    const current = notesByAppId.get(note.applicationId) ?? [];
    current.push(note);
    notesByAppId.set(note.applicationId, current);
  }

  for (const attachment of store.operationsApplicationAttachments) {
    const current = attachmentsByAppId.get(attachment.applicationId) ?? [];
    current.push(attachment);
    attachmentsByAppId.set(attachment.applicationId, current);
  }

  for (const event of store.operationsApplicationEvents) {
    const current = appEventsByAppId.get(event.applicationId) ?? [];
    current.push(event);
    appEventsByAppId.set(event.applicationId, current);
  }

  const dealershipsById = new Map(store.dealerships.map((dealer) => [dealer.id, dealer]));
  const vehiclesById = new Map(store.inventoryVehicles.map((vehicle) => [vehicle.id, vehicle]));

  const dealerApplicationItems: OperationsApplicationQueueItem[] = dealerManagement.applications.map((application) => {
    const applicationId = `dealer-application:${application.dealershipId}`;
    const dealership = dealershipsById.get(application.dealershipId);
    const review = reviewByAppId.get(applicationId);
    const status = review?.status ?? mapDealerApplicationStatus(dealership?.onboardingStatus ?? "pending");

    const timeline = [
      {
        id: `${applicationId}:created`,
        type: "created",
        message: `Dealer application submitted (${application.status}).`,
        actorName: dealership?.ownerUserId ?? null,
        createdAt: application.submittedAt,
      },
      ...(appEventsByAppId.get(applicationId) ?? []).map((event) => ({
        id: event.id,
        type: event.action,
        message: event.detail,
        actorName: event.actorName,
        createdAt: event.createdAt,
      })),
    ].sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));

    const notes = (notesByAppId.get(applicationId) ?? [])
      .slice()
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));

    const attachments = (attachmentsByAppId.get(applicationId) ?? [])
      .slice()
      .sort((a, b) => Date.parse(b.uploadedAt) - Date.parse(a.uploadedAt));

    const auditHistory = store.marketAnalyticsEvents
      .filter((event) => {
        const payload = event.payload as { applicationId?: unknown };
        return payload.applicationId === applicationId;
      })
      .map((event) => ({
        id: event.id,
        action: event.eventName,
        source: event.source,
        actorType: event.actorType,
        createdAt: event.eventTimestamp,
      }))
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));

    const summary = application.note;

    return {
      id: applicationId,
      type: "dealer-application",
      typeLabel: "Dealer Applications",
      status,
      priority: review?.priority ?? getPriorityFromStatus(status),
      applicant: {
        id: application.ownerUserId,
        name: application.dealershipName,
        email: application.ownerUserId,
      },
      buyer: null,
      dealer: {
        id: application.dealershipId,
        name: application.dealershipName,
        city: dealership?.city ?? null,
        province: dealership?.province ?? null,
      },
      vehicle: null,
      assignedUser: review?.assignedToName
        ? { id: review.assignedToUserId, name: review.assignedToName, email: null }
        : null,
      ownerUser: review?.ownerName
        ? { id: review.ownerUserId, name: review.ownerName, email: null }
        : null,
      createdAt: application.submittedAt,
      updatedAt: review?.updatedAt ?? application.submittedAt,
      summary,
      sourceAvailability: "live",
      aiInsights: deriveAiInsights({
        status,
        summary,
        hasVehicle: false,
        hasDealer: true,
        hasApplicantEmail: Boolean(application.ownerUserId),
      }),
      timeline,
      notes,
      attachments,
      auditHistory,
      source: {
        kind: "dealer-onboarding",
        entityId: application.dealershipId,
      },
    };
  });

  const enquiryItems: OperationsApplicationQueueItem[] = enquiries.map((enquiry) => {
    const applicationId = `enquiry:${enquiry.id}`;
    const review = reviewByAppId.get(applicationId);
    const status = review?.status ?? mapEnquiryStatus(enquiry.status);
    const dealership = dealershipsById.get(enquiry.dealershipId);
    const vehicle = vehiclesById.get(enquiry.vehicleId);

    const type = enquiry.enquiryType === "finance"
      ? "finance-application"
      : enquiry.enquiryType === "test-drive"
        ? "test-drive-request"
        : "vehicle-enquiry";

    const typeLabel = enquiry.enquiryType === "finance"
      ? "Finance Applications"
      : enquiry.enquiryType === "test-drive"
        ? "Test Drive Requests"
        : "Vehicle Enquiries";

    const timeline = [
      ...enquiry.timeline.map((event) => ({
        id: event.id,
        type: event.type,
        message: event.message,
        actorName: event.actorName,
        createdAt: event.createdAt,
      })),
      ...(appEventsByAppId.get(applicationId) ?? []).map((event) => ({
        id: event.id,
        type: event.action,
        message: event.detail,
        actorName: event.actorName,
        createdAt: event.createdAt,
      })),
    ].sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));

    const notes = (notesByAppId.get(applicationId) ?? [])
      .slice()
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));

    const attachments = (attachmentsByAppId.get(applicationId) ?? [])
      .slice()
      .sort((a, b) => Date.parse(b.uploadedAt) - Date.parse(a.uploadedAt));

    const auditHistory = store.marketAnalyticsEvents
      .filter((event) => {
        const payload = event.payload as { applicationId?: unknown; enquiryId?: unknown };
        return payload.applicationId === applicationId || payload.enquiryId === enquiry.id;
      })
      .map((event) => ({
        id: event.id,
        action: event.eventName,
        source: event.source,
        actorType: event.actorType,
        createdAt: event.eventTimestamp,
      }))
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));

    const summary = enquiry.message;

    return {
      id: applicationId,
      type,
      typeLabel,
      status,
      priority: review?.priority ?? getPriorityFromStatus(status),
      applicant: {
        id: enquiry.buyerId,
        name: enquiry.buyerName,
        email: enquiry.buyerEmail,
      },
      buyer: {
        id: enquiry.buyerId,
        name: enquiry.buyerName,
        email: enquiry.buyerEmail,
      },
      dealer: {
        id: enquiry.dealershipId,
        name: dealership?.tradingName ?? enquiry.dealershipId,
        city: dealership?.city ?? null,
        province: dealership?.province ?? null,
      },
      vehicle: vehicle
        ? {
            id: vehicle.id,
            title: vehicle.title,
            make: vehicle.make,
            model: vehicle.model,
            year: vehicle.year,
          }
        : null,
      assignedUser: review?.assignedToName
        ? { id: review.assignedToUserId, name: review.assignedToName, email: null }
        : enquiry.assignedToName
          ? { id: enquiry.assignedToUserId, name: enquiry.assignedToName, email: null }
          : null,
      ownerUser: review?.ownerName
        ? { id: review.ownerUserId, name: review.ownerName, email: null }
        : null,
      createdAt: enquiry.createdAt,
      updatedAt: review?.updatedAt ?? enquiry.lastUpdatedAt,
      summary,
      sourceAvailability: "live",
      aiInsights: deriveAiInsights({
        status,
        summary,
        hasVehicle: Boolean(vehicle),
        hasDealer: Boolean(dealership),
        hasApplicantEmail: Boolean(enquiry.buyerEmail.trim()),
      }),
      timeline,
      notes,
      attachments,
      auditHistory,
      source: {
        kind: "enquiry",
        entityId: enquiry.id,
      },
    };
  });

  const queue = [...dealerApplicationItems, ...enquiryItems]
    .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));

  const byStatus = (status: OperationsApplicationStatus) => queue.filter((item) => item.status === status).length;

  return {
    generatedAt,
    queue,
    queueStats: [
      {
        id: "total",
        label: "Total Queue",
        value: queue.length.toLocaleString("en-ZA"),
        detail: "Unified operational application queue from existing live request pipelines.",
        availability: "live",
      },
      {
        id: "new",
        label: "New",
        value: byStatus("new").toLocaleString("en-ZA"),
        detail: "Items awaiting initial operations triage.",
        availability: "live",
      },
      {
        id: "in-review",
        label: "In Review",
        value: byStatus("in-review").toLocaleString("en-ZA"),
        detail: "Items currently in active review workflows.",
        availability: "live",
      },
      {
        id: "waiting-customer",
        label: "Waiting Customer",
        value: byStatus("waiting-customer").toLocaleString("en-ZA"),
        detail: "Items that require customer follow-up before completion.",
        availability: "live",
      },
      {
        id: "completed",
        label: "Completed",
        value: byStatus("completed").toLocaleString("en-ZA"),
        detail: "Applications completed through operational workflows.",
        availability: "live",
      },
      {
        id: "future-sources",
        label: "Future Source Types",
        value: "Coming Soon",
        detail: "Insurance, warranty, trade-in, valuation, support, and marketplace request ingestion is scaffolded for future integration.",
        availability: "coming-soon",
      },
    ],
    sourceReadiness: [
      {
        id: "dealer-onboarding",
        label: "Dealer Applications",
        mode: "live",
        detail: "Live from dealer onboarding lifecycle and dealer management aggregation service.",
      },
      {
        id: "vehicle-enquiries",
        label: "Vehicle Enquiries, Test Drives, Finance",
        mode: "live",
        detail: "Live from enquiry/lead service with existing status transitions and timeline events.",
      },
      {
        id: "operations-notes",
        label: "Operations Notes and Attachment Metadata",
        mode: "manual",
        detail: "Operations-only metadata captured in the shared operational workflow store.",
      },
      {
        id: "additional-request-types",
        label: "Insurance, Warranty, Trade-In, Valuation, Support, Marketplace",
        mode: "coming-soon",
        detail: "Framework-ready. No additional request persistence exists yet in current platform services.",
      },
    ],
  };
}

function permissionByAction(action: OperationsApplicationActionInput["action"]): "operations:view" | "operations:edit" | "operations:approve" | "operations:reject" | "operations:delete" | "operations:export" | "operations:manage" {
  if (action === "assign" || action === "reassign" || action === "request-information" || action === "mark-complete" || action === "cancel" || action === "set-priority" || action === "add-note" || action === "add-attachment-metadata") {
    return "operations:edit";
  }

  if (action === "approve") return "operations:approve";
  if (action === "reject") return "operations:reject";
  if (action === "archive") return "operations:delete";
  if (action === "export") return "operations:export";

  return "operations:view";
}

function resolveStatusFromAction(action: OperationsApplicationActionInput["action"], current: OperationsApplicationStatus): OperationsApplicationStatus {
  if (action === "assign" || action === "reassign") return "assigned";
  if (action === "approve") return "approved";
  if (action === "reject") return "rejected";
  if (action === "request-information") return "waiting-customer";
  if (action === "mark-complete") return "completed";
  if (action === "cancel") return "cancelled";
  if (action === "archive") return "archived";
  return current;
}

async function mirrorEnquiryAction(application: OperationsApplicationQueueItem, input: OperationsApplicationActionInput): Promise<void> {
  if (application.source.kind !== "enquiry") return;
  if (!application.dealer?.id) return;

  if (input.action === "assign" || input.action === "reassign") {
    await applyDealerEnquiryAction(application.dealer.id, application.source.entityId, {
      type: "assign",
      assignedToUserId: input.assignedToUserId ?? "operations-user",
      assignedToName: input.assignedToName ?? "Operations",
      actorId: input.actorId,
      actorName: input.actorName,
    }).catch(() => undefined);
    return;
  }

  if (input.action === "request-information") {
    const followUpAt = new Date(Date.now() + (2 * 24 * 60 * 60 * 1000)).toISOString();
    await applyDealerEnquiryAction(application.dealer.id, application.source.entityId, {
      type: "follow-up",
      followUpAt,
      note: input.note ?? "Operations requested additional information.",
      actorId: input.actorId,
      actorName: input.actorName,
    }).catch(() => undefined);
    return;
  }

  if (input.action === "reject" || input.action === "cancel" || input.action === "archive") {
    await applyDealerEnquiryAction(application.dealer.id, application.source.entityId, {
      type: "close-lost",
      note: input.note ?? `Application ${input.action} by operations.`,
      actorId: input.actorId,
      actorName: input.actorName,
    }).catch(() => undefined);
    return;
  }

  if (input.action === "mark-complete" || input.action === "approve") {
    await applyDealerEnquiryAction(application.dealer.id, application.source.entityId, {
      type: "close-won",
      note: input.note ?? `Application ${input.action} by operations.`,
      actorId: input.actorId,
      actorName: input.actorName,
    }).catch(() => undefined);
  }
}

export async function applyOperationsApplicationAction(input: OperationsApplicationActionInput): Promise<void> {
  const workspace = await getApplicationsCentreWorkspaceData();
  const application = workspace.queue.find((item) => item.id === input.applicationId);

  if (!application) {
    throw new Error("Application not found.");
  }

  const nowIso = new Date().toISOString();
  const permission = permissionByAction(input.action);

  await mirrorEnquiryAction(application, input);

  await updatePlatformStore((current) => {
    const existing = current.operationsApplicationReviews.find((item) => item.applicationId === input.applicationId);
    const nextStatus = resolveStatusFromAction(input.action, existing?.status ?? application.status);

    const nextReview: LocalOperationsApplicationReviewRecord = {
      id: existing?.id ?? `oar-${crypto.randomUUID()}`,
      applicationId: input.applicationId,
      applicationType: application.type,
      sourceEntityId: application.source.entityId,
      dealershipId: application.dealer?.id ?? null,
      status: nextStatus,
      priority: input.priority ?? existing?.priority ?? application.priority,
      assignedToUserId: (input.action === "assign" || input.action === "reassign")
        ? input.assignedToUserId ?? existing?.assignedToUserId ?? null
        : existing?.assignedToUserId ?? application.assignedUser?.id ?? null,
      assignedToName: (input.action === "assign" || input.action === "reassign")
        ? input.assignedToName ?? existing?.assignedToName ?? null
        : existing?.assignedToName ?? application.assignedUser?.name ?? null,
      ownerUserId: existing?.ownerUserId ?? application.ownerUser?.id ?? null,
      ownerName: existing?.ownerName ?? application.ownerUser?.name ?? null,
      updatedAt: nowIso,
    };

    const nextReviews = existing
      ? current.operationsApplicationReviews.map((item) => item.applicationId === input.applicationId ? nextReview : item)
      : [...current.operationsApplicationReviews, nextReview];

    const nextEvent: LocalOperationsApplicationEventRecord = {
      id: `oae-${crypto.randomUUID()}`,
      applicationId: input.applicationId,
      action: input.action,
      statusAfter: nextReview.status,
      actorType: "operations",
      actorId: input.actorId ?? null,
      actorName: input.actorName ?? null,
      detail: input.note ?? `Operations action: ${input.action}`,
      createdAt: nowIso,
    };

    const nextNotes = input.action === "add-note"
      ? [
          ...current.operationsApplicationNotes,
          {
            id: `oan-${crypto.randomUUID()}`,
            applicationId: input.applicationId,
            note: input.note ?? "",
            actorType: "operations",
            actorId: input.actorId ?? null,
            actorName: input.actorName ?? null,
            createdAt: nowIso,
          },
        ]
      : current.operationsApplicationNotes;

    const nextAttachments = input.action === "add-attachment-metadata" && input.attachment
      ? [
          ...current.operationsApplicationAttachments,
          {
            id: `oaa-${crypto.randomUUID()}`,
            applicationId: input.applicationId,
            label: input.attachment.label,
            fileName: input.attachment.fileName,
            fileUrl: input.attachment.fileUrl,
            fileSizeBytes: input.attachment.fileSizeBytes ?? null,
            mimeType: input.attachment.mimeType ?? null,
            uploadedBy: input.actorName ?? null,
            uploadedAt: nowIso,
          },
        ]
      : current.operationsApplicationAttachments;

    return {
      ...current,
      operationsApplicationReviews: nextReviews,
      operationsApplicationEvents: [...current.operationsApplicationEvents, nextEvent],
      operationsApplicationNotes: nextNotes,
      operationsApplicationAttachments: nextAttachments,
    };
  });

  if (application.dealer?.id) {
    await logOperationsAuditEvent({
      dealershipId: application.dealer.id,
      eventName: `operations.applications.${input.action}`,
      source: "operations-centre",
      payload: {
        applicationId: input.applicationId,
        applicationType: application.type,
        permission,
        assignedToUserId: input.assignedToUserId,
        assignedToName: input.assignedToName,
        priority: input.priority,
        hasNote: Boolean(input.note),
        hasAttachment: Boolean(input.attachment),
      },
    }).catch(() => undefined);
  }
}
