/**
 * Verification Workspace — record loading.
 *
 * IO only. Every routing and priority decision lives in `verification-queue.ts`, which stays pure so the
 * workspace and `scripts/prp004-verification-verify.mjs` cannot disagree.
 */
import { createSupabaseServerClient } from "@/lib/supabase";
import { createLogger } from "@/lib/observability/logger";

import { buildQueues, type ClaimRecord, type QueueSummary, type QueuedClaim } from "./verification-queue";

const log = createLogger("verification");

export interface VerificationOverview {
  readonly generatedAt: string;
  readonly queued: readonly QueuedClaim[];
  readonly summaries: readonly QueueSummary[];
  readonly totalClaims: number;
  /** Claims nobody has asserted. Onboarding work, not verification work — counted, never queued. */
  readonly draftClaims: number;
  readonly incomplete: string | null;
}

export async function loadVerificationOverview(): Promise<VerificationOverview> {
  const generatedAt = new Date().toISOString();
  const supabase = createSupabaseServerClient();

  const empty: VerificationOverview = {
    generatedAt, queued: [], summaries: [], totalClaims: 0, draftClaims: 0, incomplete: null,
  };

  if (!supabase) {
    /* An unreadable source must never render as a fully verified marketplace. */
    return { ...empty, incomplete: "Supabase is not configured, so no claims could be read." };
  }

  try {
    const [claimsRes, dealersRes, evidenceRes] = await Promise.all([
      supabase
        .from("verification_claims")
        .select("id,subject_kind,subject_id,claim_type,state,submitted_at,reviewed_at,expires_at")
        .limit(5000),
      supabase.from("dealerships").select("id,business_name,trading_name").limit(1000),
      supabase.from("verification_evidence").select("event_id").limit(5000),
    ]);

    if (claimsRes.error) {
      log.error("verification claims unreadable", { error: claimsRes.error.message });
      return { ...empty, incomplete: "Verification claims could not be read." };
    }

    const names = new Map(
      (dealersRes.data ?? []).map((d) => [d.id, (d.trading_name ?? d.business_name ?? d.id).trim()]),
    );

    const records: ClaimRecord[] = (claimsRes.data ?? []).map((c) => ({
      id: c.id,
      subjectKind: c.subject_kind,
      subjectId: c.subject_id,
      subjectName: names.get(c.subject_id) ?? c.subject_id,
      claimType: c.claim_type,
      state: c.state,
      submittedAt: c.submitted_at,
      reviewedAt: c.reviewed_at,
      expiresAt: c.expires_at,
      /* Evidence counts are per-event; until submissions exist this is zero for every claim and the join
         would be wasted work. Wired when the dealer portal starts attaching documents. */
      evidenceCount: 0,
    }));

    const { queued, summaries } = buildQueues(records);

    return {
      generatedAt,
      queued,
      summaries,
      totalClaims: records.length,
      draftClaims: records.filter((r) => r.state === "draft").length,
      incomplete: evidenceRes.error ? "Evidence counts unavailable; queues may under-report readiness." : null,
    };
  } catch (error) {
    log.error("verification overview failed", { error: String(error) });
    return { ...empty, incomplete: "The verification overview could not be generated." };
  }
}
