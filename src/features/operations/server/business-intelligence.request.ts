import type {
  BusinessIntelligenceActionInput,
  BusinessIntelligenceActionType,
} from "@/features/operations/types/business-intelligence.types";

const ACTIONS: readonly BusinessIntelligenceActionType[] = [
  "export-report",
  "refresh-snapshot",
  "acknowledge-risk",
] as const;

export async function parseBusinessIntelligenceActionRequest(request: Request): Promise<BusinessIntelligenceActionInput> {
  const body = (await request.json().catch(() => null)) as BusinessIntelligenceActionInput | null;

  if (!body || typeof body !== "object") {
    throw new Error("Request body must be valid JSON.");
  }

  if (!ACTIONS.includes(body.action)) {
    throw new Error("action is invalid.");
  }

  return {
    action: body.action,
    referenceId: body.referenceId?.trim(),
    note: body.note?.trim(),
    actorId: body.actorId?.trim(),
    actorName: body.actorName?.trim(),
  };
}