import type {
  OperationsApplicationActionInput,
  OperationsApplicationActionType,
  OperationsApplicationPriority,
} from "@/features/operations/types/applications-centre.types";

const ACTIONS: readonly OperationsApplicationActionType[] = [
  "assign",
  "reassign",
  "approve",
  "reject",
  "request-information",
  "mark-complete",
  "cancel",
  "archive",
  "export",
  "set-priority",
  "add-note",
  "add-attachment-metadata",
] as const;

const PRIORITIES: readonly OperationsApplicationPriority[] = ["low", "medium", "high", "urgent"] as const;

export async function parseOperationsApplicationActionRequest(
  request: Request,
): Promise<OperationsApplicationActionInput> {
  const body = (await request.json().catch(() => null)) as OperationsApplicationActionInput | null;

  if (!body || typeof body !== "object") {
    throw new Error("Request body must be valid JSON.");
  }

  const applicationId = (body.applicationId ?? "").trim();
  if (!applicationId) {
    throw new Error("applicationId is required.");
  }

  const action = body.action;
  if (!ACTIONS.includes(action)) {
    throw new Error("action is invalid.");
  }

  if ((action === "assign" || action === "reassign") && (!body.assignedToUserId?.trim() || !body.assignedToName?.trim())) {
    throw new Error("assignedToUserId and assignedToName are required for assignment actions.");
  }

  if (action === "set-priority" && (!body.priority || !PRIORITIES.includes(body.priority))) {
    throw new Error("priority is required and must be valid for set-priority.");
  }

  if (action === "add-note" && !body.note?.trim()) {
    throw new Error("note is required for add-note.");
  }

  if (action === "add-attachment-metadata") {
    const attachment = body.attachment;
    if (!attachment || !attachment.label?.trim() || !attachment.fileName?.trim() || !attachment.fileUrl?.trim()) {
      throw new Error("attachment metadata is required.");
    }
  }

  return {
    applicationId,
    action,
    assignedToUserId: body.assignedToUserId?.trim(),
    assignedToName: body.assignedToName?.trim(),
    note: body.note?.trim(),
    priority: body.priority,
    attachment: body.attachment
      ? {
          label: body.attachment.label.trim(),
          fileName: body.attachment.fileName.trim(),
          fileUrl: body.attachment.fileUrl.trim(),
          fileSizeBytes: body.attachment.fileSizeBytes ?? null,
          mimeType: body.attachment.mimeType?.trim() || null,
        }
      : undefined,
    actorId: body.actorId?.trim(),
    actorName: body.actorName?.trim(),
  };
}
