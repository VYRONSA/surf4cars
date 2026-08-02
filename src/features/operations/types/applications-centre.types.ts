export type OperationsApplicationType =
  | "dealer-application"
  | "finance-application"
  | "insurance-application"
  | "warranty-application"
  | "trade-in-request"
  | "vehicle-valuation"
  | "vehicle-enquiry"
  | "test-drive-request"
  | "support-ticket"
  | "general-platform-request"
  | "dealer-request"
  | "marketplace-request";

export type OperationsApplicationStatus =
  | "new"
  | "assigned"
  | "in-review"
  | "waiting-customer"
  | "approved"
  | "rejected"
  | "completed"
  | "cancelled"
  | "archived";

export type OperationsApplicationPriority = "low" | "medium" | "high" | "urgent";

export interface OperationsApplicationActor {
  readonly id: string | null;
  readonly name: string;
  readonly email: string | null;
}

export interface OperationsApplicationVehicle {
  readonly id: string;
  readonly title: string;
  readonly make: string;
  readonly model: string;
  readonly year: number;
}

export interface OperationsApplicationTimelineItem {
  readonly id: string;
  readonly type: string;
  readonly message: string;
  readonly actorName: string | null;
  readonly createdAt: string;
}

export interface OperationsApplicationAuditItem {
  readonly id: string;
  readonly action: string;
  readonly source: string;
  readonly actorType: string;
  readonly createdAt: string;
}

export interface OperationsApplicationNoteItem {
  readonly id: string;
  readonly note: string;
  readonly actorName: string | null;
  readonly actorType: string;
  readonly createdAt: string;
}

export interface OperationsApplicationAttachmentItem {
  readonly id: string;
  readonly label: string;
  readonly fileName: string;
  readonly fileUrl: string;
  readonly fileSizeBytes: number | null;
  readonly mimeType: string | null;
  readonly uploadedBy: string | null;
  readonly uploadedAt: string;
}

export interface OperationsApplicationQueueItem {
  readonly id: string;
  readonly type: OperationsApplicationType;
  readonly typeLabel: string;
  readonly status: OperationsApplicationStatus;
  readonly priority: OperationsApplicationPriority;
  readonly applicant: OperationsApplicationActor;
  readonly buyer: OperationsApplicationActor | null;
  readonly dealer: {
    readonly id: string | null;
    readonly name: string;
    readonly city: string | null;
    readonly province: string | null;
  } | null;
  readonly vehicle: OperationsApplicationVehicle | null;
  readonly assignedUser: OperationsApplicationActor | null;
  readonly ownerUser: OperationsApplicationActor | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly summary: string;
  readonly sourceAvailability: "live" | "manual" | "unavailable";
  readonly aiInsights: {
    readonly state: "available" | "unavailable";
    readonly entries: readonly string[];
  };
  readonly timeline: readonly OperationsApplicationTimelineItem[];
  readonly notes: readonly OperationsApplicationNoteItem[];
  readonly attachments: readonly OperationsApplicationAttachmentItem[];
  readonly auditHistory: readonly OperationsApplicationAuditItem[];
  readonly source: {
    readonly kind: "dealer-onboarding" | "enquiry";
    readonly entityId: string;
  };
}

export interface OperationsApplicationsWorkspaceData {
  readonly generatedAt: string;
  readonly queue: readonly OperationsApplicationQueueItem[];
  readonly queueStats: readonly {
    readonly id: string;
    readonly label: string;
    readonly value: string;
    readonly detail: string;
    readonly availability: "live" | "unavailable";
  }[];
  readonly sourceReadiness: readonly {
    readonly id: string;
    readonly label: string;
    readonly mode: "live" | "manual" | "unavailable";
    readonly detail: string;
  }[];
}

export type OperationsApplicationActionType =
  | "assign"
  | "reassign"
  | "approve"
  | "reject"
  | "request-information"
  | "mark-complete"
  | "cancel"
  | "archive"
  | "export"
  | "set-priority"
  | "add-note"
  | "add-attachment-metadata";

export interface OperationsApplicationActionInput {
  readonly applicationId: string;
  readonly action: OperationsApplicationActionType;
  readonly assignedToUserId?: string;
  readonly assignedToName?: string;
  readonly note?: string;
  readonly priority?: OperationsApplicationPriority;
  readonly attachment?: {
    readonly label: string;
    readonly fileName: string;
    readonly fileUrl: string;
    readonly fileSizeBytes?: number | null;
    readonly mimeType?: string | null;
  };
  readonly actorId?: string;
  readonly actorName?: string;
}
