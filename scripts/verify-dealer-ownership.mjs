/**
 * Can a real dealership take possession of its own record?
 *
 * THE MEASUREMENT THIS ANSWERS
 * ============================
 * PCP-036 found that it could not, at any price, by any route: `owner_user_id` was written once at
 * onboarding and read in one place, and nothing between those two points could change it. Every
 * dealership was owned by a seed account on `example.com` or `surf4cars-demo.co.za`, so password
 * reset delivered to us.
 *
 * This walks the whole path against the real database — claim, review, transfer, invite, accept,
 * remove — and asserts the refusals as hard as the successes. A transfer that works is worth little
 * if a transfer to a stranger also works.
 *
 * WHAT IT CREATES AND CLEANS UP
 * =============================
 * Two throwaway auth accounts on `@demo.surf4cars.co.za` — the platform's own demonstration domain,
 * never a derived one — and a membership row, all deleted at the end. Ownership of the demonstration
 * dealership is restored to whoever held it at the start.
 *
 * Usage:
 *   node scripts/verify-dealer-ownership.mjs
 */
import { execSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const env = {};
for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(line);
  if (match) env[match[1]] = match[2].replace(/^["']|["']$/g, "").trim();
}
for (const [key, value] of Object.entries(env)) process.env[key] ??= value;

const BASE = env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = env.SUPABASE_SECRET_KEY;
const headers = { apikey: KEY, Authorization: `Bearer ${KEY}`, "content-type": "application/json" };

let passed = 0;
let failed = 0;
const check = (label, condition, detail = "") => {
  if (condition) {
    passed += 1;
    console.log(`  PASS  ${label}${detail ? ` — ${detail}` : ""}`);
  } else {
    failed += 1;
    console.log(`  FAIL  ${label}${detail ? ` — ${detail}` : ""}`);
  }
};

const rest = async (path, init = {}) => {
  const response = await fetch(`${BASE}/rest/v1/${path}`, { ...init, headers: { ...headers, ...init.headers } });
  if (!response.ok) throw new Error(`${path} → ${response.status} ${await response.text()}`);
  const text = await response.text();
  return text ? JSON.parse(text) : null;
};

const createUser = async (email) => {
  const response = await fetch(`${BASE}/auth/v1/admin/users`, {
    method: "POST",
    headers,
    body: JSON.stringify({ email, password: `Vf${Math.random().toString(36).slice(2)}!A9`, email_confirm: true }),
  });
  if (!response.ok) throw new Error(`create user → ${await response.text()}`);
  return response.json();
};
const deleteUser = async (id) =>
  fetch(`${BASE}/auth/v1/admin/users/${id}`, { method: "DELETE", headers });

const outDir = mkdtempSync(join(tmpdir(), "surf-own-"));
const outFile = join(outDir, "ownership.mjs");
execSync(
  `npx esbuild src/features/dealership/server/ownership.service.ts --bundle --platform=node --format=esm --outfile=${outFile} --alias:@=./src --log-level=error`,
  { stdio: "inherit" },
);
const own = await import(`file://${outFile}`);

console.log("\nDealership ownership (PCP-037)\n──────────────────────────────");

const [dealership] = await rest("dealerships?select=id,business_name,owner_user_id&is_demonstration=eq.true&limit=1");
const [branch] = await rest(`dealership_branches?select=id&dealership_id=eq.${dealership.id}&limit=1`);
const originalOwner = dealership.owner_user_id;
console.log(`  Using ${dealership.business_name}\n`);

const stamp = Date.now();
/* The platform's own demonstration domain. Never one derived from a business name — that is the
   exact pattern AGENTS.md prohibits, and PCP-036 found two live examples of it in auth.users. */
const claimant = await createUser(`claimant.${stamp}@demo.surf4cars.co.za`);
const staffer = await createUser(`staffer.${stamp}@demo.surf4cars.co.za`);
const cleanup = [claimant.id, staffer.id];
let membershipId = null;

try {
  /* ── Claim ───────────────────────────────────────────────────────────────────────────────── */

  const claim = await own.submitOwnershipClaim({
    dealershipId: dealership.id,
    claimant: { userId: claimant.id, email: claimant.email },
    claimantName: "Verification Claimant",
    claimantRole: "Dealer Principal",
    evidenceNote: "PCP-037 verification run.",
  });
  check("a signed-in user can claim a dealership they do not own", claim.status === "pending", claim.status);

  const stillOwned = await rest(`dealerships?select=owner_user_id&id=eq.${dealership.id}`);
  check(
    "submitting a claim does NOT move ownership on its own",
    stillOwned[0].owner_user_id === originalOwner,
    "owner unchanged while pending",
  );

  let duplicateRefused = false;
  try {
    await own.submitOwnershipClaim({
      dealershipId: dealership.id,
      claimant: { userId: claimant.id, email: claimant.email },
      claimantName: "Verification Claimant",
      claimantRole: null,
      evidenceNote: null,
    });
  } catch (error) {
    duplicateRefused = /awaiting review/i.test(error.message);
  }
  check("a second pending claim from the same person is refused", duplicateRefused);

  let unexplainedRejectionRefused = false;
  try {
    await own.reviewOwnershipClaim({
      claimId: claim.id,
      decision: "rejected",
      reviewer: { userId: originalOwner, email: null },
      decisionNote: "   ",
    });
  } catch (error) {
    unexplainedRejectionRefused = /must say why/i.test(error.message);
  }
  check("a claim cannot be rejected without a reason", unexplainedRejectionRefused);

  await own.reviewOwnershipClaim({
    claimId: claim.id,
    decision: "approved",
    reviewer: { userId: originalOwner, email: null },
    decisionNote: "Verified for PCP-037.",
  });

  const afterApproval = await rest(`dealerships?select=owner_user_id&id=eq.${dealership.id}`);
  check(
    "approving a claim moves ownership to the claimant",
    afterApproval[0].owner_user_id === claimant.id,
    "owner is now the claimant",
  );

  /* ── Transfer ────────────────────────────────────────────────────────────────────────────── */

  let strangerRefused = false;
  try {
    await own.transferOwnership({
      dealershipId: dealership.id,
      toUserId: staffer.id,
      actor: { userId: claimant.id, email: claimant.email },
    });
  } catch (error) {
    strangerRefused = /active member of your team/i.test(error.message);
  }
  check("ownership cannot be transferred to somebody who is not on the team", strangerRefused);

  const [membership] = await rest("dealership_staff_memberships", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({
      id: `staff-verify-${stamp}`,
      dealership_id: dealership.id,
      branch_id: branch.id,
      full_name: "Verification Staffer",
      email: staffer.email,
      role_id: "sales-executive",
      status: "invited",
    }),
  });
  membershipId = membership.id;

  const invitation = await own.issueStaffInvitation({
    dealershipId: dealership.id,
    membershipId,
    actor: { userId: claimant.id, email: claimant.email },
    appUrl: "https://surf4cars.co.za",
  });
  check("an invitation issues a token and a link", Boolean(invitation.token && invitation.acceptUrl));

  const [stored] = await rest(
    `dealership_staff_memberships?select=invitation_token_hash&id=eq.${membershipId}`,
  );
  check(
    "the raw invitation token is never stored — only its digest",
    stored.invitation_token_hash !== invitation.token && stored.invitation_token_hash.length === 64,
    `stored ${stored.invitation_token_hash.slice(0, 12)}…`,
  );

  let wrongAccountRefused = false;
  try {
    await own.acceptStaffInvitation({
      token: invitation.token,
      user: { userId: claimant.id, email: claimant.email },
    });
  } catch (error) {
    wrongAccountRefused = /Sign in with that address/i.test(error.message);
  }
  check("an invitation cannot be accepted by a different account — a forwarded link is not a grant", wrongAccountRefused);

  const accepted = await own.acceptStaffInvitation({
    token: invitation.token,
    user: { userId: staffer.id, email: staffer.email },
  });
  check("the invited person can accept with their own account", accepted.membershipId === membershipId);

  const [activeMembership] = await rest(
    `dealership_staff_memberships?select=status,user_id,invitation_token_hash&id=eq.${membershipId}`,
  );
  check("accepting makes the membership active and binds the account", activeMembership.status === "active" && activeMembership.user_id === staffer.id);
  check("the token is cleared on acceptance, so the link cannot be replayed", activeMembership.invitation_token_hash === null);

  let replayRefused = false;
  try {
    await own.acceptStaffInvitation({
      token: invitation.token,
      user: { userId: staffer.id, email: staffer.email },
    });
  } catch (error) {
    replayRefused = /not valid/i.test(error.message);
  }
  check("a used invitation link stops working", replayRefused);

  let nonOwnerRefused = false;
  try {
    await own.transferOwnership({
      dealershipId: dealership.id,
      toUserId: claimant.id,
      actor: { userId: staffer.id, email: staffer.email },
    });
  } catch (error) {
    nonOwnerRefused = /Only the current owner/i.test(error.message);
  }
  check("a staff member cannot transfer the dealership away from the owner", nonOwnerRefused);

  await own.transferOwnership({
    dealershipId: dealership.id,
    toUserId: staffer.id,
    actor: { userId: claimant.id, email: claimant.email },
  });
  const afterTransfer = await rest(`dealerships?select=owner_user_id&id=eq.${dealership.id}`);
  check("the owner can transfer to an active team member", afterTransfer[0].owner_user_id === staffer.id);

  let ownerRemovalRefused = false;
  try {
    await own.removeStaffMember({
      dealershipId: dealership.id,
      membershipId,
      actor: { userId: staffer.id, email: staffer.email },
    });
  } catch (error) {
    ownerRemovalRefused = /owns the dealership/i.test(error.message);
  }
  check("the owner cannot be removed from the team, leaving the record unreachable", ownerRemovalRefused);

  /* ── Audit ───────────────────────────────────────────────────────────────────────────────── */

  const events = await own.listOwnershipEvents(dealership.id);
  const types = events.map((event) => event.eventType);
  for (const expected of [
    "claim-submitted",
    "claim-approved",
    "ownership-transferred",
    "staff-invited",
    "staff-invitation-accepted",
  ]) {
    check(`the audit records ${expected}`, types.includes(expected));
  }
} finally {
  /* Ownership is restored first: leaving a demonstration dealership owned by a deleted account
     would reproduce the exact defect this programme exists to remove. */
  await rest(`dealerships?id=eq.${dealership.id}`, {
    method: "PATCH",
    body: JSON.stringify({ owner_user_id: originalOwner }),
  });
  if (membershipId) {
    await rest(`dealership_staff_memberships?id=eq.${membershipId}`, { method: "DELETE" });
  }
  await rest(`dealership_ownership_claims?dealership_id=eq.${dealership.id}&claimant_user_id=eq.${claimant.id}`, {
    method: "DELETE",
  });
  await rest(`dealership_ownership_events?dealership_id=eq.${dealership.id}&created_at=gte.${new Date(stamp).toISOString()}`, {
    method: "DELETE",
  });
  for (const id of cleanup) await deleteUser(id);
  rmSync(outDir, { recursive: true, force: true });

  const [restored] = await rest(`dealerships?select=owner_user_id&id=eq.${dealership.id}`);
  check("the demonstration dealership is left exactly as it was found", restored.owner_user_id === originalOwner);
}

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed === 0 ? 0 : 1);
