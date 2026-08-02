import { createHash, randomBytes } from "node:crypto";

import { createLogger } from "@/lib/observability/logger";
import { createDomainServerClient } from "@/lib/supabase/service-client";

/**
 * Who controls a dealership, and who may act for it.
 *
 * THE MEASUREMENT THAT PRODUCED THIS FILE
 * =======================================
 * PCP-036 read it straight from the database: 128 of 128 dealerships had a working owner account,
 * and not one belonged to the dealership. 76 owner addresses on `example.com` — reserved by IANA,
 * incapable of receiving mail — and 50 on `surf4cars-demo.co.za`, which is ours. Password reset
 * delivered to us. `owner_user_id` was written once at onboarding and read in one place, and
 * nothing between those two points could change it.
 *
 * That is not "credentials have not been issued yet". It is a platform on which a real dealership
 * could never take possession of its own record, at any price, by any route.
 *
 * THE THREE ACTS, AND WHY THEY ARE NOT ONE
 * ========================================
 * **Claim** — "that business is mine". Nothing in the claimant's session proves it, so it is a
 * request that a human reviews. Self-service claiming would hand any caller another dealership's
 * inventory, leads and buyer contact details.
 *
 * **Transfer** — performed by the current owner, who already holds the record. No review, but the
 * recipient must already be an active staff member. A stolen session can then move ownership only
 * to somebody the dealership itself put on the team.
 *
 * **Invite** — adds a person who can act for the dealership without owning it. The link is a bearer
 * credential, so only its digest is stored (see `hashToken`).
 */

const log = createLogger("dealership-ownership");

/** Long enough that guessing is not a strategy; URL-safe so it survives an email client. */
const INVITATION_TOKEN_BYTES = 32;
const INVITATION_TTL_DAYS = 14;

export interface OwnershipActor {
  readonly userId: string;
  readonly email: string | null;
}

export interface OwnershipClaimRecord {
  readonly id: string;
  readonly dealershipId: string;
  readonly dealershipName: string | null;
  readonly claimantUserId: string;
  readonly claimantEmail: string;
  readonly claimantName: string;
  readonly claimantRole: string | null;
  readonly evidenceNote: string | null;
  readonly status: "pending" | "approved" | "rejected" | "withdrawn";
  readonly reviewedByUserId: string | null;
  readonly reviewedAt: string | null;
  readonly decisionNote: string | null;
  readonly createdAt: string;
}

export interface OwnershipEventRecord {
  readonly id: string;
  readonly dealershipId: string;
  readonly eventType: string;
  readonly actorEmail: string | null;
  readonly subjectEmail: string | null;
  readonly membershipId: string | null;
  readonly detail: Record<string, unknown>;
  readonly createdAt: string;
}

export class OwnershipError extends Error {
  readonly status: 400 | 403 | 404 | 409;

  constructor(message: string, status: 400 | 403 | 404 | 409 = 400) {
    super(message);
    this.name = "OwnershipError";
    this.status = status;
  }
}

function requireClient(accessToken?: string) {
  const supabase = createDomainServerClient(accessToken);
  if (!supabase) {
    throw new OwnershipError("The database is not configured, so ownership cannot be changed.", 400);
  }
  return supabase;
}

/**
 * Only the digest is ever stored.
 *
 * An invitation link grants staff access to whoever holds it. Storing the raw token would leave a
 * working credential in plaintext in every backup, log drain and support query that touches this
 * table. The raw token exists in the URL and nowhere else, which means a lost invitation is
 * reissued rather than recovered — the correct trade, and the one every password system makes.
 */
function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

/* ── Audit ───────────────────────────────────────────────────────────────────────────────────── */

/**
 * Append-only, and deliberately not `market_analytics_events`.
 *
 * The team service was writing membership changes into the analytics event stream. That table is
 * aggregated, non-authoritative and periodically reasoned about in bulk — nobody would defend a row
 * in it during a dispute about who authorised access to a dealership's leads. Ownership needs a
 * record whose only job is evidence.
 */
export async function recordOwnershipEvent(input: {
  readonly dealershipId: string;
  readonly eventType: string;
  readonly actor?: OwnershipActor | null;
  readonly subjectUserId?: string | null;
  readonly subjectEmail?: string | null;
  readonly membershipId?: string | null;
  readonly previousOwnerUserId?: string | null;
  readonly newOwnerUserId?: string | null;
  readonly detail?: Record<string, unknown>;
  readonly accessToken?: string;
}): Promise<void> {
  const supabase = createDomainServerClient(input.accessToken);
  if (!supabase) return;

  const { error } = await supabase.from("dealership_ownership_events").insert({
    dealership_id: input.dealershipId,
    event_type: input.eventType,
    actor_user_id: input.actor?.userId ?? null,
    actor_email: input.actor?.email ?? null,
    subject_user_id: input.subjectUserId ?? null,
    subject_email: input.subjectEmail ?? null,
    membership_id: input.membershipId ?? null,
    previous_owner_user_id: input.previousOwnerUserId ?? null,
    new_owner_user_id: input.newOwnerUserId ?? null,
    detail: input.detail ?? {},
  });

  /* An audit write that fails must not take the action down with it, but it must never pass
     silently either — a gap in this log is indistinguishable from "nothing happened". */
  if (error) {
    log.error("ownership audit write failed", {
      dealershipId: input.dealershipId,
      eventType: input.eventType,
      message: error.message,
    });
  }
}

export async function listOwnershipEvents(
  dealershipId: string,
  accessToken?: string,
  limit = 100,
): Promise<readonly OwnershipEventRecord[]> {
  const supabase = requireClient(accessToken);

  const { data, error } = await supabase
    .from("dealership_ownership_events")
    .select("*")
    .eq("dealership_id", dealershipId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new OwnershipError(error.message);

  return (data ?? []).map((row) => ({
    id: row.id as string,
    dealershipId: row.dealership_id as string,
    eventType: row.event_type as string,
    actorEmail: (row.actor_email as string | null) ?? null,
    subjectEmail: (row.subject_email as string | null) ?? null,
    membershipId: (row.membership_id as string | null) ?? null,
    detail: (row.detail as Record<string, unknown>) ?? {},
    createdAt: row.created_at as string,
  }));
}

/* ── Claims ──────────────────────────────────────────────────────────────────────────────────── */

export async function submitOwnershipClaim(input: {
  readonly dealershipId: string;
  readonly claimant: OwnershipActor;
  readonly claimantName: string;
  readonly claimantRole: string | null;
  readonly evidenceNote: string | null;
  readonly accessToken?: string;
}): Promise<OwnershipClaimRecord> {
  const supabase = requireClient(input.accessToken);

  if (!input.claimant.email) {
    throw new OwnershipError("A claim requires an email address on the signed-in account.", 400);
  }
  if (!input.claimantName.trim()) {
    throw new OwnershipError("Tell us who you are so we can check the claim.", 400);
  }

  const { data: dealership, error: dealershipError } = await supabase
    .from("dealerships")
    .select("id, business_name, owner_user_id")
    .eq("id", input.dealershipId)
    .maybeSingle();

  if (dealershipError) throw new OwnershipError(dealershipError.message);
  if (!dealership) throw new OwnershipError("That dealership does not exist.", 404);

  /* Claiming a record you already hold is not an error worth a stack trace, but it is worth
     refusing — otherwise the review queue fills with no-ops. */
  if (dealership.owner_user_id === input.claimant.userId) {
    throw new OwnershipError("You already own this dealership.", 409);
  }

  const { data: existing } = await supabase
    .from("dealership_ownership_claims")
    .select("id")
    .eq("dealership_id", input.dealershipId)
    .eq("claimant_user_id", input.claimant.userId)
    .eq("status", "pending")
    .maybeSingle();

  if (existing) {
    throw new OwnershipError("You already have a claim on this dealership awaiting review.", 409);
  }

  const { data, error } = await supabase
    .from("dealership_ownership_claims")
    .insert({
      dealership_id: input.dealershipId,
      claimant_user_id: input.claimant.userId,
      claimant_email: input.claimant.email,
      claimant_name: input.claimantName.trim(),
      claimant_role: input.claimantRole?.trim() || null,
      evidence_note: input.evidenceNote?.trim() || null,
    })
    .select("*")
    .single();

  if (error) throw new OwnershipError(error.message);

  await recordOwnershipEvent({
    dealershipId: input.dealershipId,
    eventType: "claim-submitted",
    actor: input.claimant,
    detail: { claimId: data.id, claimantName: input.claimantName },
    accessToken: input.accessToken,
  });

  return toClaimRecord(data, dealership.business_name as string);
}

export async function listOwnershipClaims(input: {
  readonly status?: OwnershipClaimRecord["status"];
  readonly dealershipId?: string;
  readonly accessToken?: string;
}): Promise<readonly OwnershipClaimRecord[]> {
  const supabase = requireClient(input.accessToken);

  let query = supabase
    .from("dealership_ownership_claims")
    .select("*, dealerships(business_name)")
    .order("created_at", { ascending: true });

  if (input.status) query = query.eq("status", input.status);
  if (input.dealershipId) query = query.eq("dealership_id", input.dealershipId);

  const { data, error } = await query;
  if (error) throw new OwnershipError(error.message);

  return (data ?? []).map((row) => {
    const joined = row as Record<string, unknown> & { dealerships?: { business_name?: string } | null };
    return toClaimRecord(row, joined.dealerships?.business_name ?? null);
  });
}

/**
 * Approving a claim is the moment ownership actually moves.
 *
 * Both halves happen or neither does: the dealership is reassigned and the claim is closed. They are
 * two statements because PostgREST has no transaction across them, so the reassignment goes first —
 * if the second write fails the claim stays `pending` and a reviewer sees it again, which is
 * recoverable. The reverse order would close the claim while ownership stayed put, and nothing would
 * ever surface that.
 */
export async function reviewOwnershipClaim(input: {
  readonly claimId: string;
  readonly decision: "approved" | "rejected";
  readonly reviewer: OwnershipActor;
  readonly decisionNote: string | null;
  readonly accessToken?: string;
}): Promise<OwnershipClaimRecord> {
  const supabase = requireClient(input.accessToken);

  if (input.decision === "rejected" && !input.decisionNote?.trim()) {
    throw new OwnershipError("A rejected claim must say why. Tell the claimant what was missing.", 400);
  }

  const { data: claim, error: claimError } = await supabase
    .from("dealership_ownership_claims")
    .select("*, dealerships(business_name, owner_user_id)")
    .eq("id", input.claimId)
    .maybeSingle();

  if (claimError) throw new OwnershipError(claimError.message);
  if (!claim) throw new OwnershipError("That claim does not exist.", 404);
  if (claim.status !== "pending") {
    throw new OwnershipError(`This claim was already ${claim.status}.`, 409);
  }

  const joined = claim as Record<string, unknown> & {
    dealerships?: { business_name?: string; owner_user_id?: string } | null;
  };
  const previousOwner = joined.dealerships?.owner_user_id ?? null;

  if (input.decision === "approved") {
    const { error: transferError } = await supabase
      .from("dealerships")
      .update({
        owner_user_id: claim.claimant_user_id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", claim.dealership_id);

    if (transferError) throw new OwnershipError(transferError.message);
  }

  const { data: updated, error: updateError } = await supabase
    .from("dealership_ownership_claims")
    .update({
      status: input.decision,
      reviewed_by_user_id: input.reviewer.userId,
      reviewed_at: new Date().toISOString(),
      decision_note: input.decisionNote?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.claimId)
    .select("*")
    .single();

  if (updateError) throw new OwnershipError(updateError.message);

  await recordOwnershipEvent({
    dealershipId: claim.dealership_id as string,
    eventType: input.decision === "approved" ? "claim-approved" : "claim-rejected",
    actor: input.reviewer,
    subjectUserId: claim.claimant_user_id as string,
    subjectEmail: claim.claimant_email as string,
    previousOwnerUserId: input.decision === "approved" ? previousOwner : null,
    newOwnerUserId: input.decision === "approved" ? (claim.claimant_user_id as string) : null,
    detail: { claimId: input.claimId, note: input.decisionNote ?? null },
    accessToken: input.accessToken,
  });

  return toClaimRecord(updated, joined.dealerships?.business_name ?? null);
}

export async function withdrawOwnershipClaim(input: {
  readonly claimId: string;
  readonly claimant: OwnershipActor;
  readonly accessToken?: string;
}): Promise<void> {
  const supabase = requireClient(input.accessToken);

  const { data: claim, error } = await supabase
    .from("dealership_ownership_claims")
    .select("id, dealership_id, claimant_user_id, status")
    .eq("id", input.claimId)
    .maybeSingle();

  if (error) throw new OwnershipError(error.message);
  if (!claim) throw new OwnershipError("That claim does not exist.", 404);
  if (claim.claimant_user_id !== input.claimant.userId) {
    throw new OwnershipError("You can only withdraw your own claim.", 403);
  }
  if (claim.status !== "pending") {
    throw new OwnershipError(`This claim was already ${claim.status}.`, 409);
  }

  const { error: updateError } = await supabase
    .from("dealership_ownership_claims")
    .update({ status: "withdrawn", updated_at: new Date().toISOString() })
    .eq("id", input.claimId);

  if (updateError) throw new OwnershipError(updateError.message);

  await recordOwnershipEvent({
    dealershipId: claim.dealership_id as string,
    eventType: "claim-withdrawn",
    actor: input.claimant,
    detail: { claimId: input.claimId },
    accessToken: input.accessToken,
  });
}

/* ── Transfer ────────────────────────────────────────────────────────────────────────────────── */

/**
 * The current owner hands the dealership to somebody already on the team.
 *
 * The membership requirement is the whole security argument. Allowing an arbitrary email would make
 * a single stolen owner session sufficient to take a dealership permanently — invite nobody, notify
 * nobody, just reassign. Requiring an existing *active* member means the dealership had to have
 * added that person deliberately, through a flow that is itself audited.
 */
export async function transferOwnership(input: {
  readonly dealershipId: string;
  readonly toUserId: string;
  readonly actor: OwnershipActor;
  readonly accessToken?: string;
}): Promise<void> {
  const supabase = requireClient(input.accessToken);

  const { data: dealership, error: dealershipError } = await supabase
    .from("dealerships")
    .select("id, owner_user_id")
    .eq("id", input.dealershipId)
    .maybeSingle();

  if (dealershipError) throw new OwnershipError(dealershipError.message);
  if (!dealership) throw new OwnershipError("That dealership does not exist.", 404);

  if (dealership.owner_user_id !== input.actor.userId) {
    throw new OwnershipError("Only the current owner can transfer this dealership.", 403);
  }
  if (input.toUserId === input.actor.userId) {
    throw new OwnershipError("This dealership is already yours.", 409);
  }

  const { data: membership, error: membershipError } = await supabase
    .from("dealership_staff_memberships")
    .select("id, email, status")
    .eq("dealership_id", input.dealershipId)
    .eq("user_id", input.toUserId)
    .eq("status", "active")
    .maybeSingle();

  if (membershipError) throw new OwnershipError(membershipError.message);
  if (!membership) {
    throw new OwnershipError(
      "Ownership can only be transferred to an active member of your team. Invite them first, and transfer once they have accepted.",
      400,
    );
  }

  const { error: updateError } = await supabase
    .from("dealerships")
    .update({ owner_user_id: input.toUserId, updated_at: new Date().toISOString() })
    .eq("id", input.dealershipId);

  if (updateError) throw new OwnershipError(updateError.message);

  await recordOwnershipEvent({
    dealershipId: input.dealershipId,
    eventType: "ownership-transferred",
    actor: input.actor,
    subjectUserId: input.toUserId,
    subjectEmail: membership.email as string,
    membershipId: membership.id as string,
    previousOwnerUserId: input.actor.userId,
    newOwnerUserId: input.toUserId,
    accessToken: input.accessToken,
  });
}

/* ── Invitations ─────────────────────────────────────────────────────────────────────────────── */

export interface IssuedInvitation {
  readonly membershipId: string;
  readonly email: string;
  /** The raw token. Returned once, to be put in a link, and never readable again. */
  readonly token: string;
  readonly expiresAt: string;
  readonly acceptUrl: string;
}

export async function issueStaffInvitation(input: {
  readonly dealershipId: string;
  readonly membershipId: string;
  readonly actor: OwnershipActor;
  readonly appUrl: string;
  readonly accessToken?: string;
}): Promise<IssuedInvitation> {
  const supabase = requireClient(input.accessToken);

  const { data: membership, error } = await supabase
    .from("dealership_staff_memberships")
    .select("id, email, dealership_id, status")
    .eq("id", input.membershipId)
    .eq("dealership_id", input.dealershipId)
    .maybeSingle();

  if (error) throw new OwnershipError(error.message);
  if (!membership) throw new OwnershipError("That team member does not exist.", 404);
  if (membership.status === "active") {
    throw new OwnershipError("This person has already accepted and is active.", 409);
  }

  const token = randomBytes(INVITATION_TOKEN_BYTES).toString("base64url");
  const expiresAt = new Date(Date.now() + INVITATION_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const { error: updateError } = await supabase
    .from("dealership_staff_memberships")
    .update({
      invitation_token_hash: hashToken(token),
      invitation_expires_at: expiresAt,
      invited_by_user_id: input.actor.userId,
      status: "invited",
      invited_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.membershipId);

  if (updateError) throw new OwnershipError(updateError.message);

  await recordOwnershipEvent({
    dealershipId: input.dealershipId,
    eventType: "staff-invited",
    actor: input.actor,
    subjectEmail: membership.email as string,
    membershipId: input.membershipId,
    detail: { expiresAt },
    accessToken: input.accessToken,
  });

  return {
    membershipId: input.membershipId,
    email: membership.email as string,
    token,
    expiresAt,
    acceptUrl: `${input.appUrl.replace(/\/$/, "")}/auth/accept-invitation?token=${token}`,
  };
}

/**
 * Turning an invitation into access.
 *
 * The token is matched by digest, and cleared on success so a link cannot be replayed — an emailed
 * credential that stays valid after use is a credential that lives in the recipient's inbox for ever.
 *
 * The email check is the other half. Without it, anybody holding the link joins the dealership under
 * whatever account they happen to be signed into, which turns a forwarded email into an access grant.
 */
export async function acceptStaffInvitation(input: {
  readonly token: string;
  readonly user: OwnershipActor;
  readonly accessToken?: string;
}): Promise<{ readonly dealershipId: string; readonly membershipId: string }> {
  const supabase = requireClient(input.accessToken);

  const { data: membership, error } = await supabase
    .from("dealership_staff_memberships")
    .select("id, dealership_id, email, status, invitation_expires_at")
    .eq("invitation_token_hash", hashToken(input.token))
    .maybeSingle();

  if (error) throw new OwnershipError(error.message);
  if (!membership) {
    throw new OwnershipError("This invitation link is not valid. Ask for a new one.", 404);
  }

  const expiresAt = membership.invitation_expires_at as string | null;
  if (expiresAt && new Date(expiresAt).getTime() < Date.now()) {
    throw new OwnershipError("This invitation has expired. Ask for a new one.", 409);
  }

  const invitedEmail = String(membership.email ?? "").trim().toLowerCase();
  const signedInEmail = String(input.user.email ?? "").trim().toLowerCase();
  if (!signedInEmail || invitedEmail !== signedInEmail) {
    throw new OwnershipError(
      `This invitation was sent to ${membership.email}. Sign in with that address to accept it.`,
      403,
    );
  }

  const { error: updateError } = await supabase
    .from("dealership_staff_memberships")
    .update({
      user_id: input.user.userId,
      status: "active",
      accepted_at: new Date().toISOString(),
      invitation_token_hash: null,
      invitation_expires_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", membership.id);

  if (updateError) throw new OwnershipError(updateError.message);

  await recordOwnershipEvent({
    dealershipId: membership.dealership_id as string,
    eventType: "staff-invitation-accepted",
    actor: input.user,
    subjectUserId: input.user.userId,
    subjectEmail: membership.email as string,
    membershipId: membership.id as string,
    accessToken: input.accessToken,
  });

  return {
    dealershipId: membership.dealership_id as string,
    membershipId: membership.id as string,
  };
}

export async function revokeStaffInvitation(input: {
  readonly dealershipId: string;
  readonly membershipId: string;
  readonly actor: OwnershipActor;
  readonly accessToken?: string;
}): Promise<void> {
  const supabase = requireClient(input.accessToken);

  const { data: membership, error } = await supabase
    .from("dealership_staff_memberships")
    .select("id, email, status")
    .eq("id", input.membershipId)
    .eq("dealership_id", input.dealershipId)
    .maybeSingle();

  if (error) throw new OwnershipError(error.message);
  if (!membership) throw new OwnershipError("That team member does not exist.", 404);

  const { error: updateError } = await supabase
    .from("dealership_staff_memberships")
    .update({
      invitation_token_hash: null,
      invitation_expires_at: null,
      status: "removed",
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.membershipId);

  if (updateError) throw new OwnershipError(updateError.message);

  await recordOwnershipEvent({
    dealershipId: input.dealershipId,
    eventType: "staff-invitation-revoked",
    actor: input.actor,
    subjectEmail: membership.email as string,
    membershipId: input.membershipId,
    accessToken: input.accessToken,
  });
}

/**
 * Removing someone's access.
 *
 * The owner is refused, and that is not a courtesy. `dealerships.owner_user_id` is a not-null
 * foreign key, so a dealership always has an owner; removing the owner's membership would leave a
 * record controlled by an account with no team row, which every permission check reads differently.
 * Ownership is moved by transfer, and only then can the former owner be removed.
 */
export async function removeStaffMember(input: {
  readonly dealershipId: string;
  readonly membershipId: string;
  readonly actor: OwnershipActor;
  readonly accessToken?: string;
}): Promise<void> {
  const supabase = requireClient(input.accessToken);

  const { data: membership, error } = await supabase
    .from("dealership_staff_memberships")
    .select("id, email, user_id")
    .eq("id", input.membershipId)
    .eq("dealership_id", input.dealershipId)
    .maybeSingle();

  if (error) throw new OwnershipError(error.message);
  if (!membership) throw new OwnershipError("That team member does not exist.", 404);

  const { data: dealership } = await supabase
    .from("dealerships")
    .select("owner_user_id")
    .eq("id", input.dealershipId)
    .maybeSingle();

  if (dealership?.owner_user_id && dealership.owner_user_id === membership.user_id) {
    throw new OwnershipError(
      "This person owns the dealership. Transfer ownership to somebody else before removing them.",
      409,
    );
  }

  const { error: updateError } = await supabase
    .from("dealership_staff_memberships")
    .update({
      status: "removed",
      permissions: [],
      invitation_token_hash: null,
      invitation_expires_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.membershipId);

  if (updateError) throw new OwnershipError(updateError.message);

  await recordOwnershipEvent({
    dealershipId: input.dealershipId,
    eventType: "staff-removed",
    actor: input.actor,
    subjectUserId: (membership.user_id as string | null) ?? null,
    subjectEmail: membership.email as string,
    membershipId: input.membershipId,
    accessToken: input.accessToken,
  });
}

function toClaimRecord(row: Record<string, unknown>, dealershipName: string | null): OwnershipClaimRecord {
  return {
    id: row.id as string,
    dealershipId: row.dealership_id as string,
    dealershipName,
    claimantUserId: row.claimant_user_id as string,
    claimantEmail: row.claimant_email as string,
    claimantName: row.claimant_name as string,
    claimantRole: (row.claimant_role as string | null) ?? null,
    evidenceNote: (row.evidence_note as string | null) ?? null,
    status: row.status as OwnershipClaimRecord["status"],
    reviewedByUserId: (row.reviewed_by_user_id as string | null) ?? null,
    reviewedAt: (row.reviewed_at as string | null) ?? null,
    decisionNote: (row.decision_note as string | null) ?? null,
    createdAt: row.created_at as string,
  };
}
