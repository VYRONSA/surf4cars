/**
 * Verification queues — pure derivation.
 *
 * Queues are computed from claim state and policy, never stored. A `queue` column would be a second source
 * of truth that drifts the moment a claim is verified without it being updated, and this codebase has twice
 * paid for that shape. The same reasoning that keeps the listing pipeline stage derived applies here.
 *
 * PRIORITY IS CUSTOMER IMPACT, NOT AGE
 * ====================================
 * The obvious ordering is oldest-first, and it is wrong. A three-month-old logo claim outranks a
 * two-day-old contact claim under FIFO, while the contact claim is the one turning every listing at that
 * dealership into a dead end. Age is a tiebreaker, not the sort key.
 *
 * Visibility multiplies impact rather than adding to it: a wrong claim nobody sees costs nothing, and the
 * same claim on a public page costs trust on every view.
 */
import { policyFor, type ClaimPolicy } from "./claim-policy.ts";

export type ClaimState =
  | "draft"
  | "submitted"
  | "evidence_received"
  | "under_review"
  | "verified"
  | "rejected"
  | "expired";

export type QueueId =
  | "needs-review"
  | "awaiting-dealer-evidence"
  | "awaiting-staff-review"
  | "rejected"
  | "recently-verified"
  | "expired"
  | "unroutable";

export interface ClaimRecord {
  readonly id: string;
  readonly subjectKind: string;
  readonly subjectId: string;
  readonly subjectName: string;
  readonly claimType: string;
  readonly state: ClaimState;
  readonly submittedAt: string | null;
  readonly reviewedAt: string | null;
  readonly expiresAt: string | null;
  readonly evidenceCount: number;
}

export interface QueuedClaim {
  readonly claim: ClaimRecord;
  readonly queue: QueueId;
  readonly policy: ClaimPolicy | null;
  readonly label: string;
  /** Higher is more urgent. Derived, never stored. */
  readonly priority: number;
  /** Why it sits here, in the terms the operator needs. */
  readonly reason: string;
}

const IMPACT_WEIGHT: Readonly<Record<ClaimPolicy["customerImpact"], number>> = {
  critical: 100,
  high: 40,
  medium: 10,
};

const QUEUE_LABELS: Readonly<Record<QueueId, string>> = {
  "needs-review": "Needs review",
  "awaiting-dealer-evidence": "Awaiting dealer evidence",
  "awaiting-staff-review": "Awaiting staff review",
  rejected: "Rejected",
  "recently-verified": "Recently verified",
  expired: "Expired verification",
  unroutable: "No policy registered",
};

export const QUEUE_ORDER: readonly QueueId[] = [
  "expired",
  "needs-review",
  "awaiting-staff-review",
  "awaiting-dealer-evidence",
  "unroutable",
  "rejected",
  "recently-verified",
];

export function queueLabel(queue: QueueId): string {
  return QUEUE_LABELS[queue];
}

const daysBetween = (from: string | null, now: Date): number =>
  from ? Math.max(0, Math.floor((now.getTime() - new Date(from).getTime()) / 86_400_000)) : 0;

/**
 * Which queue a claim belongs in.
 *
 * `draft` claims are absent from every queue on purpose. A draft is the *absence* of an assertion — the 512
 * migrated seed rows are all drafts — and listing them as verification work would fill the workspace with
 * 512 items nobody submitted. They are onboarding work, and the Onboarding Centre already reports them.
 */
export function classify(claim: ClaimRecord, now: Date = new Date()): QueuedClaim | null {
  if (claim.state === "draft") return null;

  const policy = policyFor(claim.subjectKind, claim.claimType);
  const label = policy?.label ?? claim.claimType;

  /* An unregistered claim type is a claim nobody has decided how to verify. Surfaced as unroutable rather
     than defaulted into manual review, which would invent a policy and hide the omission. */
  if (!policy) {
    return {
      claim,
      policy: null,
      queue: "unroutable",
      label,
      priority: 1,
      reason: `No verification policy registered for ${claim.subjectKind}:${claim.claimType}.`,
    };
  }

  const impact = IMPACT_WEIGHT[policy.customerImpact];
  const visibility = policy.marketplaceVisible ? 2 : 1;

  const expired =
    claim.state === "expired" ||
    (claim.state === "verified" && claim.expiresAt !== null && new Date(claim.expiresAt) <= now);

  if (expired) {
    return {
      claim,
      policy,
      queue: "expired",
      label,
      /* Expired outranks never-verified at equal impact: the platform is currently *asserting* something it
         can no longer stand behind, which is worse than asserting nothing. */
      priority: impact * visibility * 1.5 + daysBetween(claim.expiresAt, now),
      reason: `Verified on ${claim.reviewedAt?.slice(0, 10) ?? "unknown"}, expired ${claim.expiresAt?.slice(0, 10) ?? ""}.`,
    };
  }

  switch (claim.state) {
    case "submitted":
      /* Whether we are waiting on them or on ourselves depends on whether evidence has arrived, and the
         distinction decides who gets chased. */
      return claim.evidenceCount === 0 && policy.acceptableEvidence.length > 0
        ? {
            claim,
            policy,
            queue: "awaiting-dealer-evidence",
            label,
            priority: impact * visibility + daysBetween(claim.submittedAt, now),
            reason: `Submitted with no evidence. Accepts: ${policy.acceptableEvidence.join(", ")}.`,
          }
        : {
            claim,
            policy,
            queue: "needs-review",
            label,
            priority: impact * visibility + daysBetween(claim.submittedAt, now),
            reason: "Submitted and ready to review.",
          };

    case "evidence_received":
      return {
        claim,
        policy,
        queue: "needs-review",
        label,
        priority: impact * visibility + daysBetween(claim.submittedAt, now),
        reason: `${claim.evidenceCount} item(s) of evidence received.`,
      };

    case "under_review":
      return {
        claim,
        policy,
        queue: "awaiting-staff-review",
        label,
        priority: impact * visibility + daysBetween(claim.submittedAt, now),
        reason: "Picked up for review.",
      };

    case "rejected":
      return {
        claim,
        policy,
        queue: "rejected",
        label,
        priority: impact,
        reason: "Rejected. Awaiting resubmission.",
      };

    case "verified":
      return {
        claim,
        policy,
        queue: "recently-verified",
        label,
        priority: 0,
        reason: policy.expiresAfterDays
          ? `Verified. Expires ${claim.expiresAt?.slice(0, 10) ?? "—"}.`
          : "Verified. Does not expire.",
      };

    default:
      return null;
  }
}

export interface QueueSummary {
  readonly queue: QueueId;
  readonly label: string;
  readonly count: number;
  /** The most urgent item, so a summary is actionable without opening the queue. */
  readonly top: QueuedClaim | null;
}

/** Every claim, bucketed and ordered. The workspace renders this; nothing else recomputes it. */
export function buildQueues(
  claims: readonly ClaimRecord[],
  now: Date = new Date(),
): {
  readonly queued: readonly QueuedClaim[];
  readonly summaries: readonly QueueSummary[];
} {
  const queued = claims
    .map((claim) => classify(claim, now))
    .filter((item): item is QueuedClaim => item !== null)
    .sort((a, b) => b.priority - a.priority);

  const summaries = QUEUE_ORDER.map((queue) => {
    const items = queued.filter((item) => item.queue === queue);
    return { queue, label: QUEUE_LABELS[queue], count: items.length, top: items[0] ?? null };
  }).filter((summary) => summary.count > 0);

  return { queued, summaries };
}
