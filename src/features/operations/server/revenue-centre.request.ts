import type { RevenueCentreActionInput, RevenueCentreActionType } from "@/features/operations/types/revenue-centre.types";

const ACTIONS: readonly RevenueCentreActionType[] = ["export", "approve", "refund", "adjust"] as const;

export async function parseRevenueCentreActionRequest(request: Request): Promise<RevenueCentreActionInput> {
  const body = (await request.json().catch(() => null)) as RevenueCentreActionInput | null;

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
