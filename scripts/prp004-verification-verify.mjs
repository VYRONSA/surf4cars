/**
 * Verification Workspace — command-line run.
 *
 * Reads real claims and reports the queues. Same pure functions the workspace renders.
 *
 * Usage: node scripts/prp004-verification-verify.mjs [--selftest]
 */
import { readFileSync } from "node:fs";

import { buildQueues, classify } from "../src/services/verification/verification-queue.ts";
import { SURF4CARS_CLAIM_POLICIES } from "../src/services/verification/claim-policy.ts";

const selftest = process.argv.includes("--selftest");

if (selftest) {
  /* Synthetic input, never written to the database. Proves the ordering rule that matters: customer impact
     outranks age, which FIFO would get backwards. */
  const now = new Date("2026-08-01T00:00:00Z");
  const make = (claimType, state, submittedAt, extra = {}) => ({
    id: `t-${claimType}-${state}`, subjectKind: "dealer", subjectId: "d1", subjectName: "Test Dealer",
    claimType, state, submittedAt, reviewedAt: null, expiresAt: null, evidenceCount: 0, ...extra,
  });

  const cases = [
    make("logo", "submitted", "2026-05-01T00:00:00Z"),          // 92 days old, medium impact
    make("contact", "submitted", "2026-07-30T00:00:00Z"),        // 2 days old, critical impact
    make("address", "verified", null, { reviewedAt: "2024-01-01T00:00:00Z", expiresAt: "2026-01-01T00:00:00Z" }),
    make("unknown_type", "submitted", "2026-07-01T00:00:00Z"),
  ];

  const { queued, summaries } = buildQueues(cases, now);
  console.log("\nSelf-test — ordering and routing\n");
  for (const item of queued) {
    console.log(`  ${String(Math.round(item.priority)).padStart(5)}  ${item.queue.padEnd(26)} ${item.label}`);
    console.log(`         ${item.reason}`);
  }
  console.log("\nExpected: expired address first, then contact (critical, 2 days) above logo (medium, 92 days).");
  const contact = queued.findIndex((q) => q.claim.claimType === "contact");
  const logo = queued.findIndex((q) => q.claim.claimType === "logo");
  console.log(contact < logo ? "PASS — impact outranks age." : "FAIL — FIFO ordering leaked in.");
  console.log(`Queues present: ${summaries.map((s) => `${s.label} (${s.count})`).join(", ")}\n`);
  process.exit(0);
}

const env = {};
for (const file of [".env.local", ".env"]) {
  try {
    for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
      const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
      if (m && !(m[1] in env)) env[m[1]] = m[2].replace(/^["']|["']$/g, "").trim();
    }
  } catch { /* absent file is fine */ }
}
const base = String(env.SUPABASE_REST_URL || `${env.NEXT_PUBLIC_SUPABASE_URL ?? ""}/rest/v1`).replace(/\/$/, "");
const headers = { apikey: env.SUPABASE_SECRET_KEY, Authorization: `Bearer ${env.SUPABASE_SECRET_KEY}` };
const get = async (p) => {
  const r = await fetch(`${base}/${p}`, { headers });
  if (!r.ok) throw new Error(`${p} → ${r.status} ${await r.text()}`);
  return r.json();
};

const [claims, dealers, evidence] = await Promise.all([
  get("verification_claims?select=id,subject_kind,subject_id,claim_type,state,submitted_at,reviewed_at,expires_at&limit=5000"),
  get("dealerships?select=id,business_name,trading_name&limit=1000"),
  get("verification_evidence?select=event_id&limit=5000"),
]);

const names = new Map(dealers.map((d) => [d.id, (d.trading_name ?? d.business_name ?? d.id).trim()]));

const records = claims.map((c) => ({
  id: c.id,
  subjectKind: c.subject_kind,
  subjectId: c.subject_id,
  subjectName: names.get(c.subject_id) ?? c.subject_id,
  claimType: c.claim_type,
  state: c.state,
  submittedAt: c.submitted_at,
  reviewedAt: c.reviewed_at,
  expiresAt: c.expires_at,
  evidenceCount: 0,
}));

const { queued, summaries } = buildQueues(records);

console.log(`\nSURF4CARS Verification Workspace — ${claims.length} claim(s) across ${SURF4CARS_CLAIM_POLICIES.length} registered policies`);
const drafts = records.filter((r) => r.state === "draft").length;
console.log(`${drafts} claim(s) in draft — no assertion has been made, so they are onboarding work rather than verification work.\n`);

if (summaries.length === 0) {
  console.log("No claims are awaiting verification.");
  console.log("This is an empty queue, not a verified marketplace: nothing has been submitted yet.\n");
} else {
  for (const s of summaries) {
    console.log(`  ${String(s.count).padStart(4)}  ${s.label}`);
    if (s.top) console.log(`        top: ${s.top.label} — ${s.top.claim.subjectName} (${s.top.reason})`);
  }
  console.log("\nHighest priority overall:");
  for (const item of queued.slice(0, 10)) {
    console.log(`  ${String(Math.round(item.priority)).padStart(5)}  ${item.label.padEnd(24)} ${item.claim.subjectName}`);
  }
  console.log();
}

/* Coverage: a claim type with no policy cannot be routed, and a policy with no claims is dead config. */
const claimTypes = new Set(records.map((r) => `${r.subjectKind}:${r.claimType}`));
const policyKeys = new Set(SURF4CARS_CLAIM_POLICIES.map((p) => `${p.subjectKind}:${p.claimType}`));
const unpolicied = [...claimTypes].filter((k) => !policyKeys.has(k));
const unused = [...policyKeys].filter((k) => !claimTypes.has(k));
if (unpolicied.length) console.log(`Claim types with no policy: ${unpolicied.join(", ")}`);
if (unused.length) console.log(`Policies with no claims yet: ${unused.join(", ")}`);
console.log();
