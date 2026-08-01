import type {
  MarketplaceControlActionInput,
  MarketplaceControlActionType,
  MarketplaceQueuePriority,
} from "@/features/operations/types/marketplace-control.types";

const ACTIONS: readonly MarketplaceControlActionType[] = [
  "assign",
  "approve",
  "reject",
  "needs-review",
  "return-to-dealer",
  "archive",
  "export",
] as const;

const PRIORITIES: readonly MarketplaceQueuePriority[] = ["low", "medium", "high", "urgent"] as const;

export async function parseMarketplaceControlActionRequest(request: Request): Promise<MarketplaceControlActionInput> {
  const body = (await request.json().catch(() => null)) as MarketplaceControlActionInput | null;

  if (!body || typeof body !== "object") {
    throw new Error("Request body must be valid JSON.");
  }

  const vehicleId = (body.vehicleId ?? "").trim();
  if (!vehicleId) {
    throw new Error("vehicleId is required.");
  }

  const action = body.action;
  if (!ACTIONS.includes(action)) {
    throw new Error("action is invalid.");
  }

  if (action === "assign" && (!body.assignedToUserId?.trim() || !body.assignedToName?.trim())) {
    throw new Error("assignedToUserId and assignedToName are required for assign action.");
  }

  if (body.priority && !PRIORITIES.includes(body.priority)) {
    throw new Error("priority is invalid.");
  }

  return {
    vehicleId,
    action,
    assignedToUserId: body.assignedToUserId?.trim(),
    assignedToName: body.assignedToName?.trim(),
    note: body.note?.trim(),
    priority: body.priority,
    actorId: body.actorId?.trim(),
    actorName: body.actorName?.trim(),
  };
}
