import type {
  PartnerCentreActionInput,
  PartnerCentreActionType,
  PartnerStatus,
} from "@/features/operations/types/partner-centre.types";

const ACTIONS: readonly PartnerCentreActionType[] = [
  "create",
  "edit",
  "approve",
  "suspend",
  "restore",
  "export",
  "manage",
  "add-note",
  "change-status",
] as const;

const PARTNER_STATUSES: readonly PartnerStatus[] = [
  "prospect",
  "contacted",
  "negotiating",
  "onboarding",
  "active",
  "paused",
  "inactive",
  "suspended",
  "archived",
] as const;

export async function parsePartnerCentreActionRequest(request: Request): Promise<PartnerCentreActionInput> {
  const body = (await request.json().catch(() => null)) as PartnerCentreActionInput | null;

  if (!body || typeof body !== "object") {
    throw new Error("Request body must be valid JSON.");
  }

  if (!ACTIONS.includes(body.action)) {
    throw new Error("action is invalid.");
  }

  const partnerId = body.partnerId?.trim();
  if (body.action !== "export" && !partnerId) {
    throw new Error("partnerId is required for this action.");
  }

  if (body.action === "change-status") {
    if (!body.status || !PARTNER_STATUSES.includes(body.status)) {
      throw new Error("status is invalid for change-status action.");
    }
  }

  return {
    action: body.action,
    partnerId,
    status: body.status,
    note: body.note?.trim(),
    actorId: body.actorId?.trim(),
    actorName: body.actorName?.trim(),
  };
}
