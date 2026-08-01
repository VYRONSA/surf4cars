import type {
  DealerIntelligenceQueueStatus,
  DealerIntelligenceReviewUpdateInput,
  DealerIntelligenceVerificationStatus,
} from "@/features/operations/types/dealer-intelligence.types";

const QUEUE_STATUSES: readonly DealerIntelligenceQueueStatus[] = [
  "new",
  "under-review",
  "verified",
  "rejected",
  "duplicate",
  "archived",
] as const;

const VERIFICATION_STATUSES: readonly DealerIntelligenceVerificationStatus[] = [
  "verified",
  "needs-review",
  "pending",
  "rejected",
  "duplicate",
] as const;

export async function parseDealerIntelligenceReviewUpdate(
  request: Request,
): Promise<DealerIntelligenceReviewUpdateInput> {
  const body = (await request.json().catch(() => null)) as DealerIntelligenceReviewUpdateInput | null;

  if (!body || typeof body !== "object") {
    throw new Error("Request body must be valid JSON.");
  }

  const dealershipId = (body.dealershipId ?? "").trim();
  if (!dealershipId) {
    throw new Error("dealershipId is required.");
  }

  if (body.queueStatus && !QUEUE_STATUSES.includes(body.queueStatus)) {
    throw new Error("queueStatus is invalid.");
  }

  if (body.verificationStatus && !VERIFICATION_STATUSES.includes(body.verificationStatus)) {
    throw new Error("verificationStatus is invalid.");
  }

  return {
    dealershipId,
    queueStatus: body.queueStatus,
    verificationStatus: body.verificationStatus,
    internalNotes: typeof body.internalNotes === "string" ? body.internalNotes.trim() : body.internalNotes,
    operationsOwner: typeof body.operationsOwner === "string" ? body.operationsOwner.trim() : body.operationsOwner,
  };
}
