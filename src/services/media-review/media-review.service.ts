import { createDomainServerClient } from "@/lib/supabase/service-client";
import { createLogger } from "@/lib/observability/logger";

import { detectIntegrityFlags, type IntegrityCandidate } from "./photograph-integrity";
import type { MediaIntegrityFlag, MediaReview, MediaReviewState } from "./media-review.types";

const log = createLogger("media-review");

/**
 * SURF4CARS — the Founder's photograph review.
 *
 * READS FAIL CLOSED, AND THAT IS THE POINT
 * ========================================
 * Every other read path in this codebase degrades to "show what we have" when the database is
 * unreachable, because a marketplace that hides its stock on a network blip is worse than one that
 * shows a stale page. This one degrades the other way: an unreadable review table yields no
 * approvals, and no approvals means the premium homepage rails render nothing.
 *
 * That is deliberate. The whole purpose of this layer is that a photograph reaches the shop window
 * only when a person has said so; a fallback that let everything through on error would restore
 * approve-by-default at exactly the moment nobody was watching. A homepage briefly short of its
 * premium rails is a smaller failure than a homepage showing a motor show stand.
 */

export interface MediaReviewIndex {
  /** Photographs a person has approved to lead the marketplace. */
  readonly approvedForHomepage: ReadonlySet<string>;
  /** Photographs that must not be shown anywhere. */
  readonly rejected: ReadonlySet<string>;
  readonly all: ReadonlyMap<string, MediaReview>;
}

const EMPTY_INDEX: MediaReviewIndex = {
  approvedForHomepage: new Set(),
  rejected: new Set(),
  all: new Map(),
};

export async function loadMediaReviews(): Promise<MediaReviewIndex> {
  const supabase = createDomainServerClient();
  if (!supabase) return EMPTY_INDEX;

  const { data, error } = await supabase
    .from("media_reviews")
    .select("photograph,state,note,reviewed_at");

  if (error) {
    /* Logged rather than swallowed. A silent empty index looks exactly like "nothing approved yet",
       and those two states must never be confused by whoever is looking at the homepage. */
    log.error("media review read failed — premium rails will render empty", { message: error.message });
    return EMPTY_INDEX;
  }

  const all = new Map<string, MediaReview>();
  const approvedForHomepage = new Set<string>();
  const rejected = new Set<string>();

  for (const row of data ?? []) {
    const state = row.state as MediaReviewState;
    all.set(row.photograph, {
      photograph: row.photograph,
      state,
      note: row.note ?? null,
      reviewedAt: row.reviewed_at ?? null,
    });
    if (state === "approved_homepage") approvedForHomepage.add(row.photograph);
    if (state === "rejected") rejected.add(row.photograph);
  }

  return { approvedForHomepage, rejected, all };
}

/** The state of one photograph. Absence is `needs_review`, never approval. */
export const reviewStateOf = (index: MediaReviewIndex, photograph: string): MediaReviewState =>
  index.all.get(photograph)?.state ?? "needs_review";

/* ── Writes ───────────────────────────────────────────────────────────────────────────────────── */

export interface SetReviewInput {
  readonly photograph: string;
  readonly state: MediaReviewState;
  readonly note?: string | null;
  readonly reviewedBy?: string | null;
}

/**
 * Record a decision.
 *
 * `needs_review` deletes the row rather than storing a value, which keeps the invariant that the
 * queue is "every photograph without a row". Returning a decision to the queue is therefore the same
 * operation as never having made it — which is what "send this back for another look" means.
 */
export async function setMediaReviewState(input: SetReviewInput): Promise<{ ok: boolean; error?: string }> {
  const supabase = createDomainServerClient();
  if (!supabase) return { ok: false, error: "database unavailable" };

  if (input.state === "needs_review") {
    const { error } = await supabase.from("media_reviews").delete().eq("photograph", input.photograph);
    return error ? { ok: false, error: error.message } : { ok: true };
  }

  const { error } = await supabase.from("media_reviews").upsert(
    {
      photograph: input.photograph,
      state: input.state,
      note: input.note?.trim() || null,
      reviewed_by: input.reviewedBy ?? null,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "photograph" },
  );

  return error ? { ok: false, error: error.message } : { ok: true };
}

/* ── Integrity flags ──────────────────────────────────────────────────────────────────────────── */

export async function loadIntegrityFlags(): Promise<readonly MediaIntegrityFlag[]> {
  const supabase = createDomainServerClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("media_integrity_flags")
    .select("id,photograph,rule,detail,dismissed")
    .eq("dismissed", false)
    .order("photograph", { ascending: true });

  if (error) {
    log.error("integrity flag read failed", { message: error.message });
    return [];
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    photograph: row.photograph,
    rule: row.rule,
    detail: row.detail,
    dismissed: row.dismissed,
  }));
}

/**
 * Re-run the detector over live listings and store what it finds.
 *
 * Insert-only, with the unique constraint absorbing repeats: a flag that has been dismissed stays
 * dismissed, because re-raising it every time the job runs is how a review queue becomes noise
 * somebody learns to clear without reading.
 */
export async function refreshIntegrityFlags(
  candidates: readonly IntegrityCandidate[],
): Promise<{ detected: number; stored: number }> {
  const detected = detectIntegrityFlags(candidates);
  const supabase = createDomainServerClient();
  if (!supabase || detected.length === 0) return { detected: detected.length, stored: 0 };

  const { error, count } = await supabase
    .from("media_integrity_flags")
    .upsert(
      detected.map((flag) => ({ photograph: flag.photograph, rule: flag.rule, detail: flag.detail })),
      { onConflict: "photograph,rule,detail", ignoreDuplicates: true, count: "exact" },
    );

  if (error) {
    log.error("integrity flag write failed", { message: error.message });
    return { detected: detected.length, stored: 0 };
  }

  return { detected: detected.length, stored: count ?? 0 };
}

export async function dismissIntegrityFlag(id: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = createDomainServerClient();
  if (!supabase) return { ok: false, error: "database unavailable" };
  const { error } = await supabase.from("media_integrity_flags").update({ dismissed: true }).eq("id", id);
  return error ? { ok: false, error: error.message } : { ok: true };
}
